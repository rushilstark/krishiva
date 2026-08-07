"""Seed demo users, posts and comments so the fresh app isn't empty."""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(__file__))
from server import db, hash_password  # type: ignore


def iso(delta_min=0):
    return (datetime.now(timezone.utc) - timedelta(minutes=delta_min)).isoformat()


DEMO_USERS = [
    {"name": "Ravi Kumar", "email": "ravi@krishiva.in", "role": "farmer", "location": "Nashik, MH",
     "bio": "3rd-gen organic farmer growing tomatoes, brinjal & moong.", "verified": True, "verification_level": "certified_organic",
     "avatar": "https://images.unsplash.com/photo-1722925407220-b22e1ced9ee9?w=300&q=80"},
    {"name": "Ananya Patel", "email": "ananya@krishiva.in", "role": "expert", "location": "Anand, GJ",
     "bio": "Agronomist. Soil health & natural pest management.", "verified": True, "verification_level": "premium",
     "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80"},
    {"name": "Suresh Yadav", "email": "suresh@krishiva.in", "role": "farmer", "location": "Barabanki, UP",
     "bio": "Practising zero-budget natural farming since 2018.", "verified": True, "verification_level": "basic",
     "avatar": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300&q=80"},
    {"name": "Meera Nair", "email": "meera@krishiva.in", "role": "buyer", "location": "Bengaluru, KA",
     "bio": "Home cook. Buys straight from farms.", "verified": False, "verification_level": "none",
     "avatar": ""},
]

DEMO_POSTS = [
    {"user_email": "ravi@krishiva.in", "tag": "procedure",
     "caption": "How I make Jeevamrutha at home — cow dung, urine, jaggery, gram flour + water. 48hr fermentation. Boosts soil microbes 10x. Full walkthrough 👇",
     "video_url": "https://www.youtube.com/watch?v=fSGrABX5YO0",
     "image": ""},
    {"user_email": "ananya@krishiva.in", "tag": "tips",
     "caption": "3% Neem oil spray recipe for aphids & whiteflies:\n• 30ml neem oil\n• 5ml liquid soap\n• 1L water\nSpray at dusk, every 7-10 days. Never during peak flowering — save the bees 🐝",
     "image": "https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=1000&q=80",
     "video_url": ""},
    {"user_email": "suresh@krishiva.in", "tag": "waste",
     "caption": "Village kitchen waste → 6 weeks → black gold compost. This is what stopped me from buying urea forever. Zero cost. Cleaner village. Healthier soil.",
     "image": "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1000&q=80",
     "video_url": ""},
    {"user_email": "ravi@krishiva.in", "tag": "story",
     "caption": "Season closed. 2.3 tonnes of organic tomato from half acre — sold direct to families in Mumbai at ₹60/kg. No middlemen. Bank balance : happy 🌱",
     "image": "https://images.unsplash.com/photo-1609842947419-ba4f04d5d60f?w=1000&q=80",
     "video_url": ""},
    {"user_email": "meera@krishiva.in", "tag": "cleanliness",
     "caption": "Segregating wet & dry waste at home is step one. Started my kitchen compost bin last month — smells like earth, not garbage. 🌍",
     "image": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&q=80",
     "video_url": ""},
    {"user_email": "suresh@krishiva.in", "tag": "question",
     "caption": "White fuzzy growth on my brinjal stems near soil. Rains have been heavy. Fungal? What organic remedy has worked for you?",
     "image": "",
     "video_url": ""},
]

DEMO_COMMENTS = [
    (0, "ananya@krishiva.in", "Beautiful! Add 200g of forest soil at the base once — it multiplies native microbes even faster."),
    (0, "suresh@krishiva.in", "Trying this weekend. My mango orchard will love it."),
    (1, "ravi@krishiva.in", "Been using this for 2 seasons. Whiteflies down 80%. Confirmed 👍"),
    (2, "meera@krishiva.in", "Amazing. Where do I start if I only have a balcony?"),
    (3, "ananya@krishiva.in", "Congratulations Ravi! This is what Krishiva is built for."),
    (5, "ananya@krishiva.in", "Sounds like Phytophthora. Try 1% Bordeaux mixture. Also improve drainage — mound the base."),
]


async def run():
    print("Clearing existing demo data…")
    await db.users.delete_many({"email": {"$regex": "@krishiva.in$"}})
    await db.posts.delete_many({})
    await db.comments.delete_many({})
    await db.conversations.delete_many({})
    await db.messages.delete_many({})

    email_to_id = {}
    for u in DEMO_USERS:
        uid = str(uuid.uuid4())
        email_to_id[u["email"]] = uid
        doc = {
            "id": uid, "name": u["name"], "email": u["email"],
            "password_hash": hash_password("test1234"),
            "role": u["role"], "bio": u["bio"], "avatar": u["avatar"],
            "location": u["location"], "verified": u["verified"],
            "verification_level": u["verification_level"],
            "followers": 42 if u["verified"] else 3,
            "posts_count": 0, "created_at": iso(60 * 24 * 30),
        }
        await db.users.insert_one(doc)
    print(f"Seeded {len(DEMO_USERS)} users")

    post_ids = []
    for i, p in enumerate(DEMO_POSTS):
        pid = str(uuid.uuid4())
        post_ids.append(pid)
        uid = email_to_id[p["user_email"]]
        liked_by = [email_to_id[e] for e in list(email_to_id.keys())[:2] if e != p["user_email"]]
        await db.posts.insert_one({
            "id": pid, "user_id": uid, "caption": p["caption"],
            "image": p.get("image", ""), "video_url": p.get("video_url", ""),
            "tag": p["tag"], "liked_by": liked_by, "comments_count": 0,
            "created_at": iso((len(DEMO_POSTS) - i) * 47),
        })
        await db.users.update_one({"id": uid}, {"$inc": {"posts_count": 1}})
    print(f"Seeded {len(DEMO_POSTS)} posts")

    for post_idx, email, text in DEMO_COMMENTS:
        pid = post_ids[post_idx]
        uid = email_to_id[email]
        await db.comments.insert_one({
            "id": str(uuid.uuid4()), "post_id": pid, "user_id": uid,
            "text": text, "created_at": iso(30),
        })
        await db.posts.update_one({"id": pid}, {"$inc": {"comments_count": 1}})
    print(f"Seeded {len(DEMO_COMMENTS)} comments")

    print("Demo credentials: any of the emails above with password 'test1234'")


if __name__ == "__main__":
    asyncio.run(run())
