from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, status
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = os.environ['JWT_ALGO']
JWT_EXPIRE_DAYS = int(os.environ['JWT_EXPIRE_DAYS'])
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Krishiva API")
api = APIRouter(prefix="/api")


# ---------------------- Models ----------------------
class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Literal["farmer", "buyer", "expert"] = "farmer"
    bio: Optional[str] = ""
    avatar: Optional[str] = ""  # base64 or url
    location: Optional[str] = ""
    verified: bool = False
    verification_level: Literal["none", "basic", "premium", "certified_organic"] = "none"
    followers: int = 0
    posts_count: int = 0
    created_at: str


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Literal["farmer", "buyer", "expert"] = "farmer"
    location: Optional[str] = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(min_length=6)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    location: Optional[str] = None
    role: Optional[Literal["farmer", "buyer", "expert"]] = None


class PostCreate(BaseModel):
    caption: str
    image: Optional[str] = ""  # base64 data URL
    video_url: Optional[str] = ""  # YouTube URL or direct MP4
    tag: Optional[str] = "general"


class PostOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = ""
    user_role: str
    user_verified: bool
    caption: str
    image: Optional[str] = ""
    video_url: Optional[str] = ""
    tag: str
    likes: int
    liked_by_me: bool
    comments_count: int
    created_at: str


class CommentCreate(BaseModel):
    text: str


class CommentOut(BaseModel):
    id: str
    post_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = ""
    text: str
    created_at: str


class MessageCreate(BaseModel):
    to_user_id: str
    text: str


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    from_user_id: str
    to_user_id: str
    text: str
    created_at: str


class ConversationOut(BaseModel):
    id: str
    other_user_id: str
    other_user_name: str
    other_user_avatar: Optional[str] = ""
    other_user_verified: bool
    last_message: str
    last_message_at: str
    unread: int = 0


class AIChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class ArticleOut(BaseModel):
    id: str
    title: str
    excerpt: str
    body: str
    cover: str
    author: str
    read_time: str
    category: str
    created_at: str


# ---------------------- Helpers ----------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def user_to_public(u: dict) -> UserPublic:
    return UserPublic(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        role=u.get("role", "farmer"),
        bio=u.get("bio", ""),
        avatar=u.get("avatar", ""),
        location=u.get("location", ""),
        verified=u.get("verified", False),
        verification_level=u.get("verification_level", "none"),
        followers=u.get("followers", 0),
        posts_count=u.get("posts_count", 0),
        created_at=u.get("created_at", now_iso()),
    )


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def conversation_id_for(a: str, b: str) -> str:
    lo, hi = sorted([a, b])
    return f"{lo}__{hi}"


# ---------------------- Auth ----------------------
@api.post("/auth/register", response_model=TokenOut)
async def register(body: RegisterIn):
    email_lower = body.email.lower()
    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": email_lower,
        "password_hash": hash_password(body.password),
        "role": body.role,
        "bio": "",
        "avatar": "",
        "location": body.location or "",
        "verified": False,
        "verification_level": "none",
        "followers": 0,
        "posts_count": 0,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    return TokenOut(access_token=make_token(user["id"]), user=user_to_public(user))


@api.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenOut(access_token=make_token(user["id"]), user=user_to_public(user))


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordIn):
    """Generate a 6-digit OTP for password reset.
    NOTE: In production this OTP would be sent via email/SMS. For this build
    we return it directly so the user can complete the flow without an
    email/SMS provider configured. Replace with real delivery when ready.
    """
    import random
    email_lower = body.email.lower()
    user = await db.users.find_one({"email": email_lower})
    # Do not leak whether the email exists in the generic response, but for
    # dev UX we still surface the OTP only when the account exists.
    if not user:
        return {"ok": True, "message": "If this email is registered, an OTP has been generated.", "otp": None}
    otp = f"{random.randint(0, 999999):06d}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"reset_otp": otp, "reset_otp_expires": expires}},
    )
    return {
        "ok": True,
        "message": "OTP generated. In production this would be emailed/SMSed.",
        "otp": otp,  # dev-only convenience
        "expires_at": expires,
    }


@api.post("/auth/reset-password", response_model=TokenOut)
async def reset_password(body: ResetPasswordIn):
    email_lower = body.email.lower()
    user = await db.users.find_one({"email": email_lower}, {"_id": 0})
    if not user or not user.get("reset_otp"):
        raise HTTPException(400, "No reset request found. Please request a new OTP.")
    if user["reset_otp"] != body.otp.strip():
        raise HTTPException(400, "Incorrect OTP")
    try:
        exp = datetime.fromisoformat(user.get("reset_otp_expires", ""))
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(400, "OTP expired. Please request a new one.")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Invalid OTP state. Please request a new one.")

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password_hash": hash_password(body.new_password)},
            "$unset": {"reset_otp": "", "reset_otp_expires": ""},
        },
    )
    user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return TokenOut(access_token=make_token(user["id"]), user=user_to_public(user))


@api.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)


@api.patch("/auth/me", response_model=UserPublic)
async def update_me(body: UserUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
        user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return user_to_public(user)


# ---------------------- Users ----------------------
@api.get("/users/{user_id}", response_model=UserPublic)
async def get_user(user_id: str):
    u = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(404, "User not found")
    return user_to_public(u)


@api.get("/users", response_model=List[UserPublic])
async def list_users(q: Optional[str] = None, limit: int = 30):
    query = {}
    if q:
        query = {"name": {"$regex": q, "$options": "i"}}
    users = await db.users.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return [user_to_public(u) for u in users]


# ---------------------- Posts ----------------------
async def hydrate_post(p: dict, viewer_id: Optional[str]) -> PostOut:
    u = await db.users.find_one({"id": p["user_id"]}, {"_id": 0}) or {}
    liked = False
    if viewer_id:
        liked = viewer_id in p.get("liked_by", [])
    return PostOut(
        id=p["id"],
        user_id=p["user_id"],
        user_name=u.get("name", "Unknown"),
        user_avatar=u.get("avatar", ""),
        user_role=u.get("role", "farmer"),
        user_verified=u.get("verified", False),
        caption=p["caption"],
        image=p.get("image", ""),
        video_url=p.get("video_url", ""),
        tag=p.get("tag", "general"),
        likes=len(p.get("liked_by", [])),
        liked_by_me=liked,
        comments_count=p.get("comments_count", 0),
        created_at=p["created_at"],
    )


@api.post("/posts", response_model=PostOut)
async def create_post(body: PostCreate, user: dict = Depends(get_current_user)):
    post = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "caption": body.caption,
        "image": body.image or "",
        "video_url": body.video_url or "",
        "tag": body.tag or "general",
        "liked_by": [],
        "comments_count": 0,
        "created_at": now_iso(),
    }
    await db.posts.insert_one(post)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"posts_count": 1}})
    return await hydrate_post(post, user["id"])


@api.get("/posts", response_model=List[PostOut])
async def list_posts(
    limit: int = 30,
    user_id: Optional[str] = None,
    tag: Optional[str] = None,
    authorization: Optional[str] = Header(None),
):
    viewer_id = None
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = jwt.decode(authorization.split(" ", 1)[1], JWT_SECRET, algorithms=[JWT_ALGO])
            viewer_id = payload["sub"]
        except Exception:
            viewer_id = None

    query = {}
    if user_id:
        query["user_id"] = user_id
    if tag and tag != "all":
        query["tag"] = tag
    cursor = db.posts.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    posts = await cursor.to_list(limit)
    return [await hydrate_post(p, viewer_id) for p in posts]


@api.get("/posts/{post_id}", response_model=PostOut)
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    p = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    return await hydrate_post(p, user["id"])


@api.post("/posts/{post_id}/like", response_model=PostOut)
async def toggle_like(post_id: str, user: dict = Depends(get_current_user)):
    p = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    liked_by = p.get("liked_by", [])
    if user["id"] in liked_by:
        await db.posts.update_one({"id": post_id}, {"$pull": {"liked_by": user["id"]}})
    else:
        await db.posts.update_one({"id": post_id}, {"$addToSet": {"liked_by": user["id"]}})
    p = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return await hydrate_post(p, user["id"])


@api.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    p = await db.posts.find_one({"id": post_id})
    if not p:
        raise HTTPException(404, "Not found")
    if p["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")
    await db.posts.delete_one({"id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"posts_count": -1}})
    return {"ok": True}


# ---------------------- Comments ----------------------
@api.get("/posts/{post_id}/comments", response_model=List[CommentOut])
async def list_comments(post_id: str):
    items = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    out = []
    for c in items:
        u = await db.users.find_one({"id": c["user_id"]}, {"_id": 0}) or {}
        out.append(CommentOut(
            id=c["id"], post_id=c["post_id"], user_id=c["user_id"],
            user_name=u.get("name", "Unknown"), user_avatar=u.get("avatar", ""),
            text=c["text"], created_at=c["created_at"],
        ))
    return out


@api.post("/posts/{post_id}/comments", response_model=CommentOut)
async def add_comment(post_id: str, body: CommentCreate, user: dict = Depends(get_current_user)):
    p = await db.posts.find_one({"id": post_id})
    if not p:
        raise HTTPException(404, "Not found")
    c = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "user_id": user["id"],
        "text": body.text,
        "created_at": now_iso(),
    }
    await db.comments.insert_one(c)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    return CommentOut(
        id=c["id"], post_id=post_id, user_id=user["id"],
        user_name=user["name"], user_avatar=user.get("avatar", ""),
        text=c["text"], created_at=c["created_at"],
    )


# ---------------------- Chat ----------------------
@api.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(user: dict = Depends(get_current_user)):
    convs = await db.conversations.find(
        {"participants": user["id"]}, {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    out = []
    for c in convs:
        other_id = next((p for p in c["participants"] if p != user["id"]), None)
        if not other_id:
            continue
        u = await db.users.find_one({"id": other_id}, {"_id": 0}) or {}
        out.append(ConversationOut(
            id=c["id"], other_user_id=other_id,
            other_user_name=u.get("name", "Unknown"),
            other_user_avatar=u.get("avatar", ""),
            other_user_verified=u.get("verified", False),
            last_message=c.get("last_message", ""),
            last_message_at=c.get("last_message_at", ""),
            unread=0,
        ))
    return out


@api.get("/conversations/{other_user_id}/messages", response_model=List[MessageOut])
async def list_messages(other_user_id: str, user: dict = Depends(get_current_user)):
    cid = conversation_id_for(user["id"], other_user_id)
    items = await db.messages.find({"conversation_id": cid}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [MessageOut(**m) for m in items]


@api.post("/messages", response_model=MessageOut)
async def send_message(body: MessageCreate, user: dict = Depends(get_current_user)):
    if body.to_user_id == user["id"]:
        raise HTTPException(400, "Cannot message yourself")
    other = await db.users.find_one({"id": body.to_user_id})
    if not other:
        raise HTTPException(404, "User not found")
    cid = conversation_id_for(user["id"], body.to_user_id)
    ts = now_iso()
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": cid,
        "from_user_id": user["id"],
        "to_user_id": body.to_user_id,
        "text": body.text,
        "created_at": ts,
    }
    await db.messages.insert_one(msg)
    await db.conversations.update_one(
        {"id": cid},
        {"$set": {
            "id": cid,
            "participants": sorted([user["id"], body.to_user_id]),
            "last_message": body.text,
            "last_message_at": ts,
        }},
        upsert=True,
    )
    return MessageOut(**msg)


# ---------------------- Articles ----------------------
SEED_ARTICLES = [
    {
        "id": "a1",
        "title": "Beginner's Guide to Organic Composting",
        "excerpt": "Turn kitchen waste into black gold for your farm in 6 weeks.",
        "body": "Composting is the backbone of organic farming. Start with a 3:1 ratio of dry (browns) to wet (greens) materials. Layer your pile with dried leaves, kitchen scraps, and cow dung. Turn every 10-15 days for aeration. Within 6-8 weeks, you'll have rich, dark humus ready for your fields.\n\nAvoid: meat, dairy, oily food. Use: vegetable peels, coffee grounds, eggshells, garden trimmings.\n\nPro tip: Add a handful of finished compost as a starter culture to speed up decomposition.",
        "cover": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&q=80",
        "author": "Dr. Ramesh Kumar",
        "read_time": "5 min read",
        "category": "Composting",
        "created_at": now_iso(),
    },
    {
        "id": "a2",
        "title": "Natural Pest Control with Neem",
        "excerpt": "Protect your crops without synthetic chemicals — the neem way.",
        "body": "Neem (Azadirachta indica) is nature's own pesticide. Prepare a 3% neem oil spray by mixing 30ml neem oil, 5ml liquid soap, and 1 litre water. Spray in the evening, once every 7-10 days.\n\nEffective against: aphids, whiteflies, caterpillars, leaf miners.\n\nAlways patch-test first. Do not spray during flowering peak to protect pollinators.",
        "cover": "https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=800&q=80",
        "author": "Ananya Patel",
        "read_time": "4 min read",
        "category": "Pest Control",
        "created_at": now_iso(),
    },
    {
        "id": "a3",
        "title": "Understanding Soil Health: pH, NPK & Beyond",
        "excerpt": "Your soil is a living ecosystem. Learn to read its language.",
        "body": "Healthy soil pH sits between 6.0 and 7.5 for most crops. Test with a simple home kit or send samples to your local KVK.\n\nN-P-K (Nitrogen-Phosphorus-Potassium) are macronutrients. Organic sources:\n- Nitrogen: cow dung, poultry manure, green manure (dhaincha)\n- Phosphorus: bone meal, rock phosphate\n- Potassium: wood ash, banana peel compost\n\nEncourage earthworms — they aerate soil and produce vermicast, the best natural fertilizer.",
        "cover": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
        "author": "Prof. Sita Devi",
        "read_time": "7 min read",
        "category": "Soil Health",
        "created_at": now_iso(),
    },
    {
        "id": "a4",
        "title": "Crop Rotation: The 4-Year Cycle Every Farmer Should Know",
        "excerpt": "Prevent disease and rebuild fertility with strategic rotation.",
        "body": "A classic 4-year rotation:\nYear 1: Legumes (fixes nitrogen) — moong, urad, tur\nYear 2: Leafy greens — spinach, methi\nYear 3: Fruiting crops — tomato, brinjal, chili\nYear 4: Root crops — carrot, radish, onion\n\nBenefits: breaks pest cycles, restores soil nutrients, reduces need for external inputs. Never plant the same family (Solanaceae, Brassicas) back-to-back.",
        "cover": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
        "author": "Suresh Yadav",
        "read_time": "6 min read",
        "category": "Farming Basics",
        "created_at": now_iso(),
    },
    {
        "id": "a5",
        "title": "Water Wisdom: Drip Irrigation for Small Farms",
        "excerpt": "Save 60% water and grow healthier crops with drip systems.",
        "body": "Drip irrigation delivers water directly to plant roots, dramatically reducing waste and evaporation.\n\nSetup for 1 acre: main line (32mm HDPE), sub-mains (16mm), drippers spaced per crop needs (30cm for vegetables, 60cm for fruit trees).\n\nGovernment subsidies of 45-55% are available under PMKSY. Contact your district agriculture office. Payback period: 2-3 seasons.",
        "cover": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
        "author": "Meera Nair",
        "read_time": "5 min read",
        "category": "Irrigation",
        "created_at": now_iso(),
    },
    {
        "id": "a6",
        "title": "Getting Certified Organic: Step-by-Step",
        "excerpt": "Your roadmap to India Organic / NPOP certification.",
        "body": "Certification unlocks premium markets. Process:\n\n1. Choose an accredited agency (INDOCERT, LACON, etc.)\n2. Apply with farm details, crop plan, input log\n3. Transition period: 24-36 months without synthetic inputs\n4. Inspector visits farm — reviews records, takes samples\n5. Receive scope certificate\n\nMaintain a farm diary daily. Costs: ₹15,000-30,000 for small farms. PGS-India is a lower-cost peer-review alternative.",
        "cover": "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80",
        "author": "Krishiva Team",
        "read_time": "8 min read",
        "category": "Certification",
        "created_at": now_iso(),
    },
]


@api.get("/articles", response_model=List[ArticleOut])
async def list_articles():
    return [ArticleOut(**a) for a in SEED_ARTICLES]


@api.get("/articles/{article_id}", response_model=ArticleOut)
async def get_article(article_id: str):
    for a in SEED_ARTICLES:
        if a["id"] == article_id:
            return ArticleOut(**a)
    raise HTTPException(404, "Not found")


# ---------------------- AI Assistant (Gemini 3 Flash) ----------------------
SYSTEM_PROMPT = (
    "You are Krishiva Sahayak — a warm, knowledgeable AI assistant for Indian organic farmers. "
    "Answer questions about organic farming, crops, pest control, soil health, composting, "
    "irrigation, seasonal advice, and government schemes for Indian farmers. "
    "Give practical, concise, actionable advice. Prefer natural / organic methods. "
    "Use simple language. When helpful, list steps or bullet points. "
    "If asked about non-farming topics, gently redirect to farming. Keep answers under 200 words unless asked for detail."
)


@api.post("/ai/chat")
async def ai_chat(body: AIChatIn, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    session_id = body.session_id or f"{user['id']}-{uuid.uuid4()}"

    # Save user message
    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "role": "user",
        "text": body.message,
        "created_at": now_iso(),
    })

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")

    async def event_generator():
        buffer = ""
        try:
            async for ev in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    buffer += ev.content
                    yield f"data: {ev.content}\n\n".replace("\n\n", "\n\n")  # SSE frame
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.exception("AI stream error")
            yield f"data: [error] {str(e)}\n\n"
        finally:
            if buffer:
                await db.ai_messages.insert_one({
                    "id": str(uuid.uuid4()),
                    "session_id": session_id,
                    "user_id": user["id"],
                    "role": "assistant",
                    "text": buffer,
                    "created_at": now_iso(),
                })
            yield f"event: done\ndata: {session_id}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@api.get("/ai/history")
async def ai_history(session_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if session_id:
        query["session_id"] = session_id
    msgs = await db.ai_messages.find(query, {"_id": 0}).sort("created_at", 1).limit(200).to_list(200)
    return msgs


@api.post("/ai/chat_sync")
async def ai_chat_sync(body: AIChatIn, user: dict = Depends(get_current_user)):
    """Non-streaming fallback for simpler mobile handling."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    session_id = body.session_id or f"{user['id']}-{uuid.uuid4()}"
    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "role": "user",
        "text": body.message,
        "created_at": now_iso(),
    })

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")

    try:
        reply = await chat.send_message(UserMessage(text=body.message))
        reply_text = reply if isinstance(reply, str) else str(reply)
    except Exception as e:
        logger.exception("AI sync error")
        raise HTTPException(500, f"AI error: {str(e)}")

    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "role": "assistant",
        "text": reply_text,
        "created_at": now_iso(),
    })
    return {"reply": reply_text, "session_id": session_id}


# ---------------------- Health ----------------------
@api.get("/")
async def root():
    return {"app": "Krishiva", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("krishiva")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.posts.create_index([("created_at", -1)])
    await db.messages.create_index("conversation_id")
    await db.conversations.create_index("participants")


@app.on_event("shutdown")
async def shutdown():
    client.close()
