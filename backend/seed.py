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
    {"name": "Ravi Kumar", "email": "ravi@krishiva.in", "phone": "9876500001", "role": "farmer", "location": "Nashik, MH",
     "bio": "3rd-gen organic farmer growing tomatoes, brinjal & moong.", "verified": True, "verification_level": "certified_organic",
     "plus": True,
     "avatar": "https://images.unsplash.com/photo-1722925407220-b22e1ced9ee9?w=300&q=80"},
    {"name": "Ananya Patel", "email": "ananya@krishiva.in", "phone": "9876500002", "role": "expert", "location": "Anand, GJ",
     "bio": "Agronomist. Soil health & natural pest management.", "verified": True, "verification_level": "premium",
     "plus": True,
     "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80"},
    {"name": "Suresh Yadav", "email": "suresh@krishiva.in", "phone": "9876500003", "role": "farmer", "location": "Barabanki, UP",
     "bio": "Practising zero-budget natural farming since 2018.", "verified": True, "verification_level": "basic",
     "plus": True,
     "avatar": "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300&q=80"},
    {"name": "Meera Nair", "email": "meera@krishiva.in", "phone": "9876500004", "role": "buyer", "location": "Bengaluru, KA",
     "bio": "Home cook. Buys straight from farms.", "verified": False, "verification_level": "none",
     "plus": False,
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

DEMO_CATEGORIES = [
    { "id": "1", "name": "Vegetables", "icon": "🥦" },
    { "id": "2", "name": "Fruits", "icon": "🍎" },
    { "id": "3", "name": "Millets", "icon": "🌾" },
    { "id": "4", "name": "Dairy", "icon": "🥛" },
    { "id": "5", "name": "More", "icon": "⋯" }
]

DEMO_PRODUCTS = [
    { "id": "p1", "name": "Organic Tomatoes", "type": "Fresh & Pesticide Free", "category": "Vegetables", "price": "₹40 / kg", "rating": 4.8, "reviews": 120, "image": "🍅", "tag": "100% Organic", "description": "Grown naturally without any chemical fertilizers.", "seller": { "name": "Green Valley Farms", "location": "Hyderabad, India", "rating": 4.9, "image": "👨‍🌾" } },
    { "id": "p2", "name": "Organic Spinach", "type": "Fresh & Pesticide Free", "category": "Leafy Greens", "price": "₹30 / bunch", "rating": 4.8, "reviews": 85, "image": "🥬", "tag": "100% Organic", "description": "Rich in iron and vitamins.", "seller": { "name": "Green Valley Farms", "location": "Hyderabad, India", "rating": 4.9, "image": "👨‍🌾" } },
    { "id": "p3", "name": "Organic Carrots", "type": "Farm Fresh", "category": "Root", "price": "₹40 / kg", "rating": 4.7, "reviews": 92, "image": "🥕", "tag": "100% Organic", "description": "Crunchy and sweet carrots directly from the farm.", "seller": { "name": "Sunrise Farms", "location": "Pune, India", "rating": 4.6, "image": "👩‍🌾" } },
    { "id": "p4", "name": "Organic Broccoli", "type": "Chemical Free", "category": "Vegetables", "price": "₹80 / kg", "rating": 4.9, "reviews": 45, "image": "🥦", "tag": "100% Organic", "description": "Fresh broccoli heads.", "seller": { "name": "Sunrise Farms", "location": "Pune, India", "rating": 4.6, "image": "👩‍🌾" } },
    { "id": "p5", "name": "Organic Cabbage", "type": "Fresh & Healthy", "category": "Vegetables", "price": "₹25 / kg", "rating": 4.6, "reviews": 30, "image": "🥬", "tag": "100% Organic", "description": "Crisp green cabbage.", "seller": { "name": "Green Valley Farms", "location": "Hyderabad, India", "rating": 4.9, "image": "👨‍🌾" } },
    { "id": "p6", "name": "Organic Eggs", "type": "Free Range", "category": "Dairy", "price": "₹120 / dozen", "rating": 4.8, "reviews": 150, "image": "🥚", "tag": "100% Organic", "description": "Free range organic eggs.", "seller": { "name": "Happy Hens Farm", "location": "Bangalore, India", "rating": 4.8, "image": "👨‍🌾" } },
    { "id": "p7", "name": "Organic Milk", "type": "A2 Cow Milk", "category": "Dairy", "price": "₹80 / L", "rating": 4.9, "reviews": 200, "image": "🥛", "tag": "100% Organic", "description": "Fresh A2 cow milk.", "seller": { "name": "Happy Hens Farm", "location": "Bangalore, India", "rating": 4.8, "image": "👨‍🌾" } },
    { "id": "p8", "name": "Organic Potatoes", "type": "Farm Fresh", "category": "Root", "price": "₹35 / kg", "rating": 4.5, "reviews": 110, "image": "🥔", "tag": "100% Organic", "description": "Versatile and fresh potatoes.", "seller": { "name": "Sunrise Farms", "location": "Pune, India", "rating": 4.6, "image": "👩‍🌾" } }
]

DEMO_ORDERS = [
    { "id": "#CRD12345", "date": "12 May 2024", "status": "To Ship", "items": "Organic Tomatoes (2 kg)", "total": "₹80", "image": "🍅" },
    { "id": "#CRD12344", "date": "10 May 2024", "status": "Shipped", "items": "Organic Spinach (1 bunch)", "total": "₹30", "image": "🥬" },
    { "id": "#CRD12343", "date": "8 May 2024", "status": "Delivered", "items": "Organic Eggs (1 dozen)", "total": "₹120", "image": "🥚" }
]


async def run(database=None):
    global db
    if database:
        db = database
    print("Clearing existing demo data…")
    await db.users.delete_many({"email": {"$regex": "@krishiva.in$"}})
    await db.posts.delete_many({})
    await db.comments.delete_many({})
    await db.conversations.delete_many({})
    await db.messages.delete_many({})
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.orders.delete_many({})

    if DEMO_CATEGORIES:
        await db.categories.insert_many(DEMO_CATEGORIES)
    if DEMO_PRODUCTS:
        await db.products.insert_many(DEMO_PRODUCTS)
    if DEMO_ORDERS:
        await db.orders.insert_many(DEMO_ORDERS)
    print("Seeded categories, products, and orders")

    email_to_id = {}
    for u in DEMO_USERS:
        uid = str(uuid.uuid4())
        email_to_id[u["email"]] = uid
        subscription = None
        if u["plus"]:
            subscription = {
                "plan": "yearly", "payment_id": f"seed-{uid[:8]}", "order_id": "",
                "started_at": iso(60 * 24), 
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=330)).isoformat(),
            }
        doc = {
            "id": uid, "name": u["name"], "email": u["email"], "phone": u["phone"],
            "password_hash": hash_password("test1234"),
            "role": u["role"], "bio": u["bio"], "avatar": u["avatar"],
            "location": u["location"], "verified": u["verified"],
            "verification_level": u["verification_level"],
            "followers_ids": [], "following_ids": [],
            "subscription": subscription,
            "posts_count": 0, "created_at": iso(60 * 24 * 30),
        }
        await db.users.insert_one(doc)

    # Everyone follows Ravi; Ravi follows Ananya
    ids = email_to_id
    ravi, ananya, suresh, meera = ids["ravi@krishiva.in"], ids["ananya@krishiva.in"], ids["suresh@krishiva.in"], ids["meera@krishiva.in"]
    await db.users.update_one({"id": ravi}, {"$set": {"followers_ids": [ananya, suresh, meera], "following_ids": [ananya]}})
    await db.users.update_one({"id": ananya}, {"$set": {"followers_ids": [ravi, suresh], "following_ids": [ravi]}})
    await db.users.update_one({"id": suresh}, {"$set": {"following_ids": [ravi, ananya]}})
    await db.users.update_one({"id": meera}, {"$set": {"following_ids": [ravi]}})
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
