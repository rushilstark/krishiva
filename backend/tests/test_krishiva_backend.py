"""Krishiva backend end-to-end tests (community-only v1)."""
import os
import uuid
import pytest
import requests

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://verified-harvest.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

PRIMARY_EMAIL = "ravi@krishiva.in"
PRIMARY_PWD = "test1234"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def primary_auth(session):
    """Login as seeded Ravi."""
    r = session.post(f"{API}/auth/login", json={"email": PRIMARY_EMAIL, "password": PRIMARY_PWD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["access_token"], "user": data["user"], "headers": {"Authorization": f"Bearer {data['access_token']}"}}


@pytest.fixture(scope="session")
def secondary_auth(session):
    """Login as Ananya (for chat/interaction tests)."""
    r = session.post(f"{API}/auth/login", json={"email": "ananya@krishiva.in", "password": PRIMARY_PWD})
    assert r.status_code == 200
    data = r.json()
    return {"token": data["access_token"], "user": data["user"], "headers": {"Authorization": f"Bearer {data['access_token']}"}}


# ---------- Health ----------
def test_root_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth: register/login/me ----------
class TestAuth:
    def test_register_new_farmer(self, session):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = session.post(f"{API}/auth/register", json={
            "name": "TEST Farmer", "email": email, "password": "test1234",
            "role": "farmer", "location": "Test City",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["token_type"] == "bearer"
        assert "access_token" in data
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "farmer"
        assert "_id" not in data["user"]

    def test_register_buyer_and_expert_roles(self, session):
        for role in ("buyer", "expert"):
            email = f"test_{role}_{uuid.uuid4().hex[:6]}@example.com"
            r = session.post(f"{API}/auth/register", json={
                "name": f"TEST {role}", "email": email, "password": "test1234", "role": role,
            })
            assert r.status_code == 200
            assert r.json()["user"]["role"] == role

    def test_register_duplicate_email_returns_400(self, session):
        r = session.post(f"{API}/auth/register", json={
            "name": "Dup", "email": PRIMARY_EMAIL, "password": "test1234", "role": "farmer"
        })
        assert r.status_code == 400
        assert "already" in r.json()["detail"].lower()

    def test_login_seeded_ravi(self, primary_auth):
        assert primary_auth["user"]["email"] == PRIMARY_EMAIL
        assert primary_auth["user"]["verified"] is True
        assert primary_auth["user"]["role"] == "farmer"
        assert "_id" not in primary_auth["user"]

    def test_login_bad_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": PRIMARY_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_get_me_with_token(self, session, primary_auth):
        r = session.get(f"{API}/auth/me", headers=primary_auth["headers"])
        assert r.status_code == 200
        assert r.json()["email"] == PRIMARY_EMAIL
        assert "_id" not in r.json()

    def test_get_me_without_token_401(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_get_me_invalid_token_401(self, session):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
        assert r.status_code == 401

    def test_patch_me_updates_bio_location(self, session, primary_auth):
        new_bio = f"Updated bio {uuid.uuid4().hex[:6]}"
        r = session.patch(f"{API}/auth/me", headers=primary_auth["headers"], json={
            "bio": new_bio, "location": "Nashik, MH", "avatar": "https://example.com/a.jpg"
        })
        assert r.status_code == 200
        assert r.json()["bio"] == new_bio
        # Verify persistence
        r2 = session.get(f"{API}/auth/me", headers=primary_auth["headers"])
        assert r2.json()["bio"] == new_bio


# ---------- Users ----------
class TestUsers:
    def test_list_users(self, session):
        r = session.get(f"{API}/users")
        assert r.status_code == 200
        users = r.json()
        assert len(users) >= 4
        for u in users:
            assert "_id" not in u
            assert "id" in u and "email" in u

    def test_search_users_by_name(self, session):
        r = session.get(f"{API}/users", params={"q": "Ravi"})
        assert r.status_code == 200
        assert any("Ravi" in u["name"] for u in r.json())

    def test_get_user_by_id(self, session, primary_auth):
        uid = primary_auth["user"]["id"]
        r = session.get(f"{API}/users/{uid}")
        assert r.status_code == 200
        assert r.json()["id"] == uid
        assert "_id" not in r.json()

    def test_get_user_404(self, session):
        r = session.get(f"{API}/users/does-not-exist-xyz")
        assert r.status_code == 404


# ---------- Posts ----------
class TestPosts:
    def test_list_posts_returns_6_seeded(self, session):
        r = session.get(f"{API}/posts")
        assert r.status_code == 200
        posts = r.json()
        assert len(posts) >= 6, f"Expected at least 6 seeded posts, got {len(posts)}"
        for p in posts:
            assert "_id" not in p
            assert set(["id", "user_id", "user_name", "caption", "likes", "liked_by_me", "comments_count", "tag"]).issubset(p.keys())

    def test_filter_by_tag_procedure(self, session):
        r = session.get(f"{API}/posts", params={"tag": "procedure"})
        assert r.status_code == 200
        posts = r.json()
        assert len(posts) >= 1
        assert all(p["tag"] == "procedure" for p in posts)

    def test_filter_by_user_id(self, session, primary_auth):
        uid = primary_auth["user"]["id"]
        r = session.get(f"{API}/posts", params={"user_id": uid})
        assert r.status_code == 200
        posts = r.json()
        assert all(p["user_id"] == uid for p in posts)

    def test_liked_by_me_flag_authenticated(self, session, primary_auth):
        r = session.get(f"{API}/posts", headers=primary_auth["headers"])
        assert r.status_code == 200
        for p in r.json():
            assert isinstance(p["liked_by_me"], bool)

    def test_liked_by_me_false_when_unauthenticated(self, session):
        r = session.get(f"{API}/posts")
        assert r.status_code == 200
        assert all(p["liked_by_me"] is False for p in r.json())

    def test_create_post_increments_user_posts_count(self, session, primary_auth):
        before = session.get(f"{API}/auth/me", headers=primary_auth["headers"]).json()["posts_count"]
        r = session.post(f"{API}/posts", headers=primary_auth["headers"], json={
            "caption": "TEST post about neem oil recipe", "tag": "tips", "image": "", "video_url": ""
        })
        assert r.status_code == 200
        post = r.json()
        assert post["caption"] == "TEST post about neem oil recipe"
        assert post["user_id"] == primary_auth["user"]["id"]
        after = session.get(f"{API}/auth/me", headers=primary_auth["headers"]).json()["posts_count"]
        assert after == before + 1
        # Save post id via class attribute for later tests
        pytest.created_post_id = post["id"]

    def test_toggle_like_updates_count_and_flag(self, session, primary_auth, secondary_auth):
        # Use post created above
        pid = pytest.created_post_id
        r1 = session.post(f"{API}/posts/{pid}/like", headers=secondary_auth["headers"])
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["liked_by_me"] is True
        assert d1["likes"] >= 1
        # Toggle off
        r2 = session.post(f"{API}/posts/{pid}/like", headers=secondary_auth["headers"])
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["liked_by_me"] is False
        assert d2["likes"] == d1["likes"] - 1

    def test_delete_post_unauthorized_403(self, session, secondary_auth):
        pid = pytest.created_post_id
        r = session.delete(f"{API}/posts/{pid}", headers=secondary_auth["headers"])
        assert r.status_code == 403

    def test_delete_post_owner_ok(self, session, primary_auth):
        pid = pytest.created_post_id
        r = session.delete(f"{API}/posts/{pid}", headers=primary_auth["headers"])
        assert r.status_code == 200
        # Verify gone
        r2 = session.get(f"{API}/posts/{pid}", headers=primary_auth["headers"])
        assert r2.status_code == 404


# ---------- Comments ----------
class TestComments:
    def test_list_comments_on_seeded_post(self, session):
        posts = session.get(f"{API}/posts").json()
        # Find a post with comments
        target = next((p for p in posts if p["comments_count"] > 0), None)
        assert target, "No seeded post with comments found"
        r = session.get(f"{API}/posts/{target['id']}/comments")
        assert r.status_code == 200
        comments = r.json()
        assert len(comments) >= 1
        for c in comments:
            assert "_id" not in c
            assert "text" in c and "user_name" in c

    def test_add_comment_increments_count(self, session, primary_auth):
        posts = session.get(f"{API}/posts").json()
        pid = posts[0]["id"]
        before = posts[0]["comments_count"]
        r = session.post(f"{API}/posts/{pid}/comments", headers=primary_auth["headers"], json={"text": "TEST comment"})
        assert r.status_code == 200
        assert r.json()["text"] == "TEST comment"
        assert r.json()["user_id"] == primary_auth["user"]["id"]
        # Verify count updated
        after_post = next(p for p in session.get(f"{API}/posts").json() if p["id"] == pid)
        assert after_post["comments_count"] == before + 1


# ---------- Messaging ----------
class TestMessaging:
    def test_send_message_and_list_conversation(self, session, primary_auth, secondary_auth):
        other_id = secondary_auth["user"]["id"]
        text = f"TEST hello {uuid.uuid4().hex[:6]}"
        r = session.post(f"{API}/messages", headers=primary_auth["headers"], json={
            "to_user_id": other_id, "text": text
        })
        assert r.status_code == 200
        msg = r.json()
        assert msg["text"] == text
        assert msg["from_user_id"] == primary_auth["user"]["id"]
        assert msg["to_user_id"] == other_id
        # Second message from other direction
        r2 = session.post(f"{API}/messages", headers=secondary_auth["headers"], json={
            "to_user_id": primary_auth["user"]["id"], "text": "TEST reply"
        })
        assert r2.status_code == 200

        # Conversation appears for both
        c_primary = session.get(f"{API}/conversations", headers=primary_auth["headers"]).json()
        c_secondary = session.get(f"{API}/conversations", headers=secondary_auth["headers"]).json()
        assert any(c["other_user_id"] == other_id for c in c_primary)
        assert any(c["other_user_id"] == primary_auth["user"]["id"] for c in c_secondary)

        # Full history in order
        hist = session.get(f"{API}/conversations/{other_id}/messages", headers=primary_auth["headers"]).json()
        assert len(hist) >= 2
        timestamps = [m["created_at"] for m in hist]
        assert timestamps == sorted(timestamps), "Messages not in chronological order"
        for m in hist:
            assert "_id" not in m

    def test_cannot_message_self(self, session, primary_auth):
        r = session.post(f"{API}/messages", headers=primary_auth["headers"], json={
            "to_user_id": primary_auth["user"]["id"], "text": "self"
        })
        assert r.status_code == 400

    def test_message_unknown_user_404(self, session, primary_auth):
        r = session.post(f"{API}/messages", headers=primary_auth["headers"], json={
            "to_user_id": "nonexistent-user-id-xyz", "text": "hi"
        })
        assert r.status_code == 404


# ---------- Articles ----------
class TestArticles:
    def test_list_articles_returns_6(self, session):
        r = session.get(f"{API}/articles")
        assert r.status_code == 200
        arts = r.json()
        assert len(arts) == 6
        for a in arts:
            assert "_id" not in a
            assert set(["id", "title", "excerpt", "body", "cover", "author", "category"]).issubset(a.keys())

    def test_get_article_by_id(self, session):
        r = session.get(f"{API}/articles/a1")
        assert r.status_code == 200
        assert r.json()["id"] == "a1"
        assert "Composting" in r.json()["title"]

    def test_article_404(self, session):
        r = session.get(f"{API}/articles/does_not_exist")
        assert r.status_code == 404


# ---------- AI (Gemini 3 Flash) ----------
class TestAI:
    def test_ai_chat_sync_returns_farming_answer(self, session, primary_auth):
        r = session.post(f"{API}/ai/chat_sync", headers=primary_auth["headers"], json={
            "message": "How do I make jeevamrutha at home in one short paragraph?"
        }, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "reply" in data and "session_id" in data
        assert len(data["reply"]) > 20
        # Verify persistence in ai_messages via history endpoint
        hist = session.get(f"{API}/ai/history", headers=primary_auth["headers"],
                           params={"session_id": data["session_id"]}).json()
        assert len(hist) >= 2  # user + assistant
        roles = {m["role"] for m in hist}
        assert "user" in roles and "assistant" in roles


# ---------- Security: no ObjectId leaks anywhere ----------
class TestNoObjectIdLeaks:
    def test_no_underscore_id_in_any_response(self, session, primary_auth):
        endpoints = [
            (f"{API}/auth/me", primary_auth["headers"]),
            (f"{API}/users", None),
            (f"{API}/posts", None),
            (f"{API}/articles", None),
            (f"{API}/conversations", primary_auth["headers"]),
        ]
        for url, h in endpoints:
            r = session.get(url, headers=h or {})
            assert r.status_code == 200, f"{url} -> {r.status_code}"
            body = r.text
            assert '"_id"' not in body, f"ObjectId leak at {url}"
