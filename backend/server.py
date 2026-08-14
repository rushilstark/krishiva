from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, status
from fastapi.responses import StreamingResponse, Response, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from mongomock_motor import AsyncMongoMockClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
import asyncio
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DB_NAME = os.environ.get('DB_NAME', 'krishiva')
JWT_SECRET = os.environ.get('JWT_SECRET', 'krishiva-dev-secret-key')
JWT_ALGO = os.environ.get('JWT_ALGO', 'HS256')
JWT_EXPIRE_DAYS = int(os.environ.get('JWT_EXPIRE_DAYS', 30))
OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
RAZORPAY_CONFIGURED = RAZORPAY_KEY_ID.startswith('rzp_') and bool(RAZORPAY_KEY_SECRET)
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# --- Circuit Breaker ---
class CircuitBreaker:
    def __init__(self, max_failures=3, reset_timeout=60):
        self.max_failures = max_failures
        self.reset_timeout = reset_timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "CLOSED"

    async def call(self, func, *args, **kwargs):
        now = datetime.now(timezone.utc)
        if self.state == "OPEN":
            if (now - self.last_failure_time).total_seconds() > self.reset_timeout:
                self.state = "HALF_OPEN"
            else:
                raise HTTPException(503, "Service temporarily unavailable due to upstream failures (Circuit Open)")
        
        try:
            result = await func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = datetime.now(timezone.utc)
            if self.failures >= self.max_failures:
                self.state = "OPEN"
            raise e

ai_circuit_breaker = CircuitBreaker(max_failures=3, reset_timeout=30)

MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/krishiva')
client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
db = client[DB_NAME]

app = FastAPI(title="Krishiva API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api = APIRouter(prefix="/api")

@app.on_event("startup")
async def startup_event():
    global client, db
    try:
        # Test connection
        await client.server_info()
        logger.info("Connected to Real MongoDB!")
    except Exception:
        logger.warning("Real MongoDB failed. Falling back to mongomock locally with Dummy Data...")
        client = AsyncMongoMockClient()
        db = client[DB_NAME]
        import seed
        await seed.run(db)


# ---------------------- Models ----------------------
class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = ""
    role: Literal["farmer", "buyer", "expert"] = "farmer"
    bio: Optional[str] = ""
    avatar: Optional[str] = ""  # base64 or url
    location: Optional[str] = ""
    verified: bool = False
    verification_level: Literal["none", "basic", "premium", "certified_organic"] = "none"
    followers: int = 0
    following: int = 0
    is_following: bool = False
    posts_count: int = 0
    subscribed: bool = False
    subscription_plan: Optional[str] = ""
    subscription_expires_at: Optional[str] = ""
    created_at: str


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)
    password: str = Field(min_length=6)
    role: Literal["farmer", "buyer", "expert"] = "farmer"
    location: Optional[str] = ""


class LoginIn(BaseModel):
    identifier: str  # email or mobile number
    password: str


class ForgotPasswordIn(BaseModel):
    identifier: str  # email or mobile number


class ResetPasswordIn(BaseModel):
    identifier: str
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
    reply_to_id: Optional[str] = None


class CommentOut(BaseModel):
    id: str
    post_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = ""
    text: str
    reply_to_id: Optional[str] = None
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
    images: Optional[List[str]] = None  # base64 (with or without data URL prefix)
    video_media_id: Optional[str] = None  # id from /media upload


class MediaStartIn(BaseModel):
    mime: str = "video/mp4"


class MediaChunkIn(BaseModel):
    index: int
    data: str  # base64 chunk


class PlanOrderIn(BaseModel):
    plan_id: Literal["monthly", "yearly"]


class PaymentVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


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


class CategoryOut(BaseModel):
    id: str
    name: str
    icon: str


class SellerOut(BaseModel):
    name: str
    location: str
    rating: float
    image: str


class ProductOut(BaseModel):
    id: str
    name: str
    type: str
    category: str
    price: str
    rating: float
    reviews: int
    image: str
    tag: str
    description: str
    seller: SellerOut


class OrderOut(BaseModel):
    id: str
    date: str
    status: str
    items: str
    total: str
    image: str


class NotificationOut(BaseModel):
    id: str
    user_id: str          # recipient
    actor_id: str         # who triggered it
    actor_name: str
    actor_avatar: Optional[str] = ""
    type: str             # follow | like | comment | message
    text: str
    post_id: Optional[str] = None
    read: bool = False
    created_at: str


# ---------------------- Helpers ----------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_notification(recipient_id: str, actor: dict, ntype: str, text: str, post_id: Optional[str] = None):
    """Fire-and-forget helper to insert a notification for a user."""
    if recipient_id == actor["id"]:
        return  # never notify yourself
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": recipient_id,
        "actor_id": actor["id"],
        "actor_name": actor.get("name", "Someone"),
        "actor_avatar": actor.get("avatar", ""),
        "type": ntype,
        "text": text,
        "post_id": post_id,
        "read": False,
        "created_at": now_iso(),
    })


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


def normalize_phone(phone: str) -> str:
    digits = "".join(ch for ch in phone if ch.isdigit())
    return digits[-10:] if len(digits) >= 10 else digits


def subscription_active(u: dict) -> bool:
    sub = u.get("subscription") or {}
    expires = sub.get("expires_at", "")
    if not expires:
        return False
    try:
        return datetime.fromisoformat(expires) > datetime.now(timezone.utc)
    except Exception:
        return False


def require_plus(u: dict):
    if not subscription_active(u):
        raise HTTPException(status_code=403, detail="subscription_required")


async def find_user_by_identifier(identifier: str) -> Optional[dict]:
    ident = identifier.strip()
    if "@" in ident:
        return await db.users.find_one({"email": ident.lower()}, {"_id": 0})
    phone = normalize_phone(ident)
    if not phone:
        return None
    return await db.users.find_one({"phone": phone}, {"_id": 0})


def user_to_public(u: dict, viewer_id: Optional[str] = None) -> UserPublic:
    sub = u.get("subscription") or {}
    followers_ids = u.get("followers_ids")
    return UserPublic(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        phone=u.get("phone", ""),
        role=u.get("role", "farmer"),
        bio=u.get("bio", ""),
        avatar=u.get("avatar", ""),
        location=u.get("location", ""),
        verified=u.get("verified", False),
        verification_level=u.get("verification_level", "none"),
        followers=len(followers_ids) if followers_ids is not None else u.get("followers", 0),
        following=len(u.get("following_ids", [])),
        is_following=bool(viewer_id and viewer_id in (followers_ids or [])),
        posts_count=u.get("posts_count", 0),
        subscribed=subscription_active(u),
        subscription_plan=sub.get("plan", ""),
        subscription_expires_at=sub.get("expires_at", ""),
        created_at=u.get("created_at", now_iso()),
    )


def viewer_from_auth(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = jwt.decode(authorization.split(" ", 1)[1], JWT_SECRET, algorithms=[JWT_ALGO])
            return payload["sub"]
        except Exception:
            return None
    return None


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
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterIn):
    email_lower = body.email.lower()
    phone = normalize_phone(body.phone)
    if len(phone) != 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
    existing = await db.users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_phone = await db.users.find_one({"phone": phone})
    if existing_phone:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": email_lower,
        "phone": phone,
        "password_hash": hash_password(body.password),
        "role": body.role,
        "bio": "",
        "avatar": "",
        "location": body.location or "",
        "verified": False,
        "verification_level": "none",
        "followers_ids": [],
        "following_ids": [],
        "posts_count": 0,
        "subscription": None,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    return TokenOut(access_token=make_token(user["id"]), user=user_to_public(user))


@api.post("/auth/login", response_model=TokenOut)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginIn):
    user = await find_user_by_identifier(body.identifier)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenOut(access_token=make_token(user["id"]), user=user_to_public(user))


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordIn):
    """Generate a 6-digit OTP for password reset. Accepts email OR mobile number.
    NOTE: In production this OTP would be sent via email/SMS. For this build
    we return it directly so the user can complete the flow without an
    email/SMS provider configured. Replace with real delivery when ready.
    """
    import random
    user = await find_user_by_identifier(body.identifier)
    # Do not leak whether the account exists in the generic response, but for
    # dev UX we still surface the OTP only when the account exists.
    if not user:
        return {"ok": True, "message": "If this account is registered, an OTP has been generated.", "otp": None}
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
    user = await find_user_by_identifier(body.identifier)
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
async def get_user(user_id: str, authorization: Optional[str] = Header(None)):
    u = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not u:
        raise HTTPException(404, "User not found")
    return user_to_public(u, viewer_from_auth(authorization))


@api.post("/users/{user_id}/follow", response_model=UserPublic)
async def toggle_follow(user_id: str, user: dict = Depends(get_current_user)):
    if user_id == user["id"]:
        raise HTTPException(400, "Cannot follow yourself")
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(404, "User not found")
    require_plus(user)
    if user["id"] in target.get("followers_ids", []):
        await db.users.update_one({"id": user_id}, {"$pull": {"followers_ids": user["id"]}})
        await db.users.update_one({"id": user["id"]}, {"$pull": {"following_ids": user_id}})
    else:
        await db.users.update_one({"id": user_id}, {"$addToSet": {"followers_ids": user["id"]}})
        await db.users.update_one({"id": user["id"]}, {"$addToSet": {"following_ids": user_id}})
        await create_notification(user_id, user, "follow", f"{user['name']} started following you.")
    target = await db.users.find_one({"id": user_id}, {"_id": 0})
    return user_to_public(target, user["id"])


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
    require_plus(user)
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
        await create_notification(p["user_id"], user, "like", f"{user['name']} liked your post.", post_id=post_id)
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
        "reply_to_id": body.reply_to_id,
        "created_at": now_iso(),
    }
    await db.comments.insert_one(c)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    snippet = body.text[:60] + ("…" if len(body.text) > 60 else "")
    await create_notification(p["user_id"], user, "comment", f"{user['name']} commented: {snippet}", post_id=post_id)
    return CommentOut(
        id=c["id"], post_id=post_id, user_id=user["id"],
        reply_to_id=c.get("reply_to_id"),
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
    require_plus(user)
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
    await create_notification(body.to_user_id, user, "message", f"{user['name']} sent you a message.")
    return MessageOut(**msg)


# ---------------------- Notifications ----------------------
@api.get("/notifications", response_model=List[NotificationOut])
async def list_notifications(user: dict = Depends(get_current_user)):
    notifs = await db.notifications.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return notifs


@api.get("/notifications/unread_count")
async def unread_count(user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["id"], "read": False})
    return {"count": count}


@api.post("/notifications/read_all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "read": False}, {"$set": {"read": True}})
    return {"ok": True}


@api.post("/notifications/{notif_id}/read")
async def mark_one_read(notif_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


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


@api.get("/categories", response_model=List[CategoryOut])
async def list_categories():
    cursor = db.categories.find({}, {"_id": 0})
    items = await cursor.to_list(length=100)
    return [CategoryOut(**x) for x in items]


@api.get("/products", response_model=List[ProductOut])
async def list_products():
    cursor = db.products.find({}, {"_id": 0})
    items = await cursor.to_list(length=100)
    return [ProductOut(**x) for x in items]


@api.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    return ProductOut(**p)


@api.get("/orders", response_model=List[OrderOut])
async def list_orders(user: dict = Depends(get_current_user)):
    cursor = db.orders.find({}, {"_id": 0})
    items = await cursor.to_list(length=100)
    return [OrderOut(**x) for x in items]


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
    from litellm import acompletion

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

    async def event_generator():
        buffer = ""
        try:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            history = await db.ai_messages.find({"session_id": session_id}).sort("created_at", 1).to_list(10)
            for m in history:
                if m.get("text"):
                    messages.append({"role": m["role"], "content": m["text"]})
            
            response = await acompletion(
                model="ollama/llama3",
                messages=messages,
                api_base=OLLAMA_URL,
                stream=True
            )
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    buffer += content
                    yield f"data: {content}\n\n".replace("\n\n", "\n\n")  # SSE frame
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
    """Non-streaming chat. Falls back to Ollama/Llama3."""
    from litellm import acompletion

    session_id = body.session_id or f"{user['id']}-{uuid.uuid4()}"

    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "role": "user",
        "text": body.message,
        "has_image": bool(body.images),
        "has_video": bool(body.video_media_id),
        "created_at": now_iso(),
    })

    try:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        history = await db.ai_messages.find({"session_id": session_id}).sort("created_at", 1).to_list(10)
        for m in history:
            if m.get("text"):
                messages.append({"role": m["role"], "content": m["text"]})

        if GROQ_API_KEY:
            # Free cloud AI via Groq — works in any deployed APK/server
            reply = await ai_circuit_breaker.call(
                acompletion,
                model="groq/llama3-8b-8192",
                messages=messages,
                api_key=GROQ_API_KEY,
            )
        else:
            # Local Ollama fallback (dev only)
            reply = await ai_circuit_breaker.call(
                acompletion,
                model="ollama/llama3",
                messages=messages,
                api_base=OLLAMA_URL
            )
        reply_text = reply.choices[0].message.content
    except Exception as e:
        logger.exception("AI sync error (Circuit breaker tripped?)")
        raise HTTPException(503, f"AI service unavailable: {str(e)}")

    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": user["id"],
        "role": "assistant",
        "text": reply_text,
        "created_at": now_iso(),
    })
    return {"reply": reply_text, "session_id": session_id}


# ---------------------- Subscription & Payments (Razorpay) ----------------------
PLANS = {
    "monthly": {"amount": 9900, "days": 31, "label": "Krishiva Plus Monthly", "price_display": "₹99"},
    "yearly": {"amount": 99900, "days": 365, "label": "Krishiva Plus Yearly", "price_display": "₹999"},
}


def rzp_client():
    import razorpay
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


async def activate_subscription(user_id: str, plan_id: str, payment_id: str, order_id: str = "") -> dict:
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(404, "User not found")
    sub = user.get("subscription") or {}
    if sub.get("payment_id") == payment_id:  # idempotent
        return sub
    now = datetime.now(timezone.utc)
    start = now
    cur = sub.get("expires_at", "")
    if cur:
        try:
            cur_dt = datetime.fromisoformat(cur)
            if cur_dt > now:
                start = cur_dt  # extend an active subscription
        except Exception:
            pass
    new_sub = {
        "plan": plan_id,
        "payment_id": payment_id,
        "order_id": order_id,
        "started_at": now.isoformat(),
        "expires_at": (start + timedelta(days=PLANS[plan_id]["days"])).isoformat(),
    }
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "subscription": new_sub,
            "verified": True,
            "verification_level": "basic",
        }}
    )
    return new_sub


@api.get("/subscriptions/plans")
async def subscription_plans():
    return {
        "razorpay_configured": RAZORPAY_CONFIGURED,
        "razorpay_key_id": RAZORPAY_KEY_ID if RAZORPAY_CONFIGURED else "",
        "plans": [{"id": pid, **p} for pid, p in PLANS.items()],
    }


@api.get("/subscriptions/me")
async def my_subscription(user: dict = Depends(get_current_user)):
    sub = user.get("subscription") or {}
    return {
        "subscribed": subscription_active(user),
        "plan": sub.get("plan", ""),
        "expires_at": sub.get("expires_at", ""),
    }


@api.post("/payments/order")
async def create_payment_order(body: PlanOrderIn, user: dict = Depends(get_current_user)):
    """Web checkout: create a Razorpay Order."""
    if not RAZORPAY_CONFIGURED:
        raise HTTPException(503, "Payments not configured yet")
    plan = PLANS[body.plan_id]
    order = rzp_client().order.create({
        "amount": plan["amount"], "currency": "INR",
        "receipt": f"{user['id'][:12]}-{int(datetime.now().timestamp())}",
        "notes": {"user_id": user["id"], "plan_id": body.plan_id},
    })
    await db.payments.insert_one({
        "order_id": order["id"], "user_id": user["id"], "plan_id": body.plan_id,
        "amount": plan["amount"], "status": "created", "created_at": now_iso(),
    })
    return {"key_id": RAZORPAY_KEY_ID, "order_id": order["id"], "amount": plan["amount"],
            "currency": "INR", "name": plan["label"]}


@api.post("/payments/payment-link")
async def create_payment_link(body: PlanOrderIn, request: Request, user: dict = Depends(get_current_user)):
    """Native (Expo Go) checkout: hosted Razorpay Payment Link."""
    if not RAZORPAY_CONFIGURED:
        raise HTTPException(503, "Payments not configured yet")
    plan = PLANS[body.plan_id]
    reference = f"{user['id'][:12]}-{int(datetime.now().timestamp())}"
    base_url = str(request.base_url).rstrip("/")
    link = rzp_client().payment_link.create({
        "amount": plan["amount"], "currency": "INR", "accept_partial": False,
        "reference_id": reference, "description": plan["label"],
        "customer": {"email": user["email"], "contact": user.get("phone", "")},
        "callback_url": f"{base_url}/api/payments/link-callback",
        "callback_method": "get",
    })
    await db.payments.insert_one({
        "payment_link_id": link["id"], "reference_id": reference, "user_id": user["id"],
        "plan_id": body.plan_id, "amount": plan["amount"], "status": "created", "created_at": now_iso(),
    })
    return {"url": link["short_url"], "reference_id": reference}


@api.post("/payments/verify")
async def verify_payment(body: PaymentVerifyIn, user: dict = Depends(get_current_user)):
    payment = await db.payments.find_one({"order_id": body.razorpay_order_id, "user_id": user["id"]}, {"_id": 0})
    if not payment:
        raise HTTPException(404, "Unknown order")
    client_r = rzp_client()
    try:
        client_r.utility.verify_payment_signature({
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "razorpay_signature": body.razorpay_signature,
        })
    except Exception:
        raise HTTPException(400, "Invalid payment signature")
    remote = client_r.payment.fetch(body.razorpay_payment_id)
    if remote["order_id"] != body.razorpay_order_id or remote["status"] != "captured":
        raise HTTPException(400, "Payment is not captured")
    await db.payments.update_one(
        {"order_id": body.razorpay_order_id},
        {"$set": {"payment_id": body.razorpay_payment_id, "status": "captured"}},
    )
    sub = await activate_subscription(user["id"], payment["plan_id"], body.razorpay_payment_id, body.razorpay_order_id)
    return {"ok": True, "subscription": sub}


@api.get("/payments/link-callback")
async def payment_link_callback(request: Request):
    q = dict(request.query_params)
    required = ["razorpay_payment_id", "razorpay_payment_link_id",
                "razorpay_payment_link_reference_id", "razorpay_payment_link_status", "razorpay_signature"]
    if any(k not in q for k in required):
        raise HTTPException(400, "Incomplete callback")
    client_r = rzp_client()
    try:
        client_r.utility.verify_payment_link_signature({
            "payment_link_id": q["razorpay_payment_link_id"],
            "payment_link_reference_id": q["razorpay_payment_link_reference_id"],
            "payment_link_status": q["razorpay_payment_link_status"],
            "razorpay_payment_id": q["razorpay_payment_id"],
            "razorpay_signature": q["razorpay_signature"],
        })
    except Exception:
        raise HTTPException(400, "Invalid link signature")
    record = await db.payments.find_one({"payment_link_id": q["razorpay_payment_link_id"]}, {"_id": 0})
    if not record or q["razorpay_payment_link_status"] != "paid":
        raise HTTPException(400, "Payment not paid")
    await db.payments.update_one(
        {"payment_link_id": q["razorpay_payment_link_id"]},
        {"$set": {"status": "captured", "payment_id": q["razorpay_payment_id"]}},
    )
    await activate_subscription(record["user_id"], record["plan_id"], q["razorpay_payment_id"])
    return HTMLResponse(
        "<html><body style='font-family:sans-serif;text-align:center;padding-top:80px;background:#F9F9F7'>"
        "<h2 style='color:#2A7036'>✅ Payment successful!</h2>"
        "<p>Your Krishiva Plus is active. Return to the app and tap “I've completed payment”.</p>"
        "</body></html>"
    )


@api.post("/payments/dev-activate")
async def dev_activate(body: PlanOrderIn, user: dict = Depends(get_current_user)):
    """TEST-MODE activation used only while Razorpay keys are not configured.
    Disabled automatically once real keys are added to backend/.env."""
    if RAZORPAY_CONFIGURED:
        raise HTTPException(400, "Razorpay is configured — use real checkout")
    payment_id = f"dev-{uuid.uuid4()}"
    await db.payments.insert_one({
        "payment_id": payment_id, "user_id": user["id"], "plan_id": body.plan_id,
        "amount": PLANS[body.plan_id]["amount"], "status": "dev_activated", "created_at": now_iso(),
    })
    sub = await activate_subscription(user["id"], body.plan_id, payment_id)
    return {"ok": True, "dev_mode": True, "subscription": sub}


# ---------------------- Media (chunked upload + range streaming) ----------------------
MAX_MEDIA_BYTES = 60 * 1024 * 1024  # 60 MB


@api.post("/media/start")
async def media_start(body: MediaStartIn, user: dict = Depends(get_current_user)):
    mid = str(uuid.uuid4())
    (UPLOAD_DIR / f"{mid}.part").write_bytes(b"")
    await db.media.insert_one({
        "id": mid, "user_id": user["id"], "mime": body.mime,
        "status": "uploading", "created_at": now_iso(),
    })
    return {"id": mid}


@api.post("/media/{media_id}/chunk")
async def media_chunk(media_id: str, body: MediaChunkIn, user: dict = Depends(get_current_user)):
    import base64 as b64mod
    m = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not m or m["user_id"] != user["id"] or m["status"] != "uploading":
        raise HTTPException(404, "Upload not found")
    part = UPLOAD_DIR / f"{media_id}.part"
    if not part.exists():
        raise HTTPException(404, "Upload not found")
    try:
        raw = b64mod.b64decode(body.data)
    except Exception:
        raise HTTPException(400, "Invalid chunk data")
    if part.stat().st_size + len(raw) > MAX_MEDIA_BYTES:
        part.unlink(missing_ok=True)
        await db.media.update_one({"id": media_id}, {"$set": {"status": "failed"}})
        raise HTTPException(413, "File too large (max 60MB). Record a shorter video.")
    with open(part, "ab") as f:
        f.write(raw)
    return {"ok": True, "size": part.stat().st_size}


@api.post("/media/{media_id}/finish")
async def media_finish(media_id: str, user: dict = Depends(get_current_user)):
    m = await db.media.find_one({"id": media_id}, {"_id": 0})
    if not m or m["user_id"] != user["id"]:
        raise HTTPException(404, "Upload not found")
    part = UPLOAD_DIR / f"{media_id}.part"
    if not part.exists():
        raise HTTPException(404, "Upload not found")
    final = UPLOAD_DIR / f"{media_id}.bin"
    part.rename(final)
    size = final.stat().st_size
    await db.media.update_one({"id": media_id}, {"$set": {"status": "ready", "size": size}})
    return {"id": media_id, "url": f"/api/media/{media_id}", "size": size}


@api.get("/media/{media_id}")
async def media_get(media_id: str, request: Request):
    m = await db.media.find_one({"id": media_id, "status": "ready"}, {"_id": 0})
    if not m:
        raise HTTPException(404, "Media not found")
    path = UPLOAD_DIR / f"{media_id}.bin"
    if not path.exists():
        raise HTTPException(404, "Media file missing")
    size = path.stat().st_size
    mime = m.get("mime", "video/mp4")
    range_header = request.headers.get("range")
    if range_header:
        try:
            unit, rng = range_header.split("=", 1)
            start_s, _, end_s = rng.partition("-")
            start = int(start_s)
            end = int(end_s) if end_s else size - 1
            end = min(end, size - 1)
        except Exception:
            raise HTTPException(416, "Invalid range")
        with open(path, "rb") as f:
            f.seek(start)
            data = f.read(end - start + 1)
        return Response(
            content=data, status_code=206, media_type=mime,
            headers={
                "Content-Range": f"bytes {start}-{end}/{size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(len(data)),
            },
        )
    return Response(content=path.read_bytes(), media_type=mime, headers={"Accept-Ranges": "bytes"})


# ---------------------- Health ----------------------
@api.get("/")
async def root():
    return {"app": "Krishiva", "status": "ok"}


app.include_router(api)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("krishiva")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone")
    await db.posts.create_index([("created_at", -1)])
    await db.messages.create_index("conversation_id")
    await db.conversations.create_index("participants")


@app.on_event("shutdown")
async def shutdown():
    client.close()
