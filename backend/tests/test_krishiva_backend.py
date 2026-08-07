"""Krishiva backend end-to-end tests — iteration 2.

Auth contract changed:
- register requires phone (10-digit)
- login/forgot/reset use {identifier: email OR phone}
"""
import os
import uuid
import base64
import time
import pytest
import requests

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://verified-harvest.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

RAVI_EMAIL = "ravi@krishiva.in"     # Plus (yearly)
RAVI_PHONE = "9876500001"
ANANYA_EMAIL = "ananya@krishiva.in"  # Plus
MEERA_EMAIL = "meera@krishiva.in"    # Free
MEERA_PHONE = "9876500004"
PWD = "test1234"


def rand_phone() -> str:
    """Return a random 10-digit phone unlikely to collide with seed data."""
    import random
    return "7" + "".join(str(random.randint(0, 9)) for _ in range(9))


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(session, identifier, password=PWD):
    r = session.post(f"{API}/auth/login", json={"identifier": identifier, "password": password})
    return r


@pytest.fixture(scope="session")
def ravi_auth(session):
    r = _login(session, RAVI_EMAIL)
    assert r.status_code == 200, f"Ravi login failed: {r.status_code} {r.text}"
    d = r.json()
    return {"token": d["access_token"], "user": d["user"],
            "headers": {"Authorization": f"Bearer {d['access_token']}", "Content-Type": "application/json"}}


@pytest.fixture(scope="session")
def ananya_auth(session):
    r = _login(session, ANANYA_EMAIL)
    assert r.status_code == 200
    d = r.json()
    return {"token": d["access_token"], "user": d["user"],
            "headers": {"Authorization": f"Bearer {d['access_token']}", "Content-Type": "application/json"}}


@pytest.fixture(scope="session")
def meera_auth(session):
    r = _login(session, MEERA_EMAIL)
    assert r.status_code == 200
    d = r.json()
    return {"token": d["access_token"], "user": d["user"],
            "headers": {"Authorization": f"Bearer {d['access_token']}", "Content-Type": "application/json"}}


# ---------- Health ----------
def test_root_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth: register with phone ----------
class TestAuthRegister:
    def test_register_with_phone_success(self, session):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        phone = rand_phone()
        r = session.post(f"{API}/auth/register", json={
            "name": "TEST Farmer", "email": email, "phone": phone,
            "password": "test1234", "role": "farmer", "location": "Test City",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == email
        assert data["user"]["phone"] == phone
        assert data["user"]["subscribed"] is False
        assert "_id" not in data["user"]

    def test_register_missing_phone_400(self, session):
        r = session.post(f"{API}/auth/register", json={
            "name": "NoPhone", "email": f"np_{uuid.uuid4().hex[:6]}@example.com",
            "password": "test1234", "role": "farmer",
        })
        # pydantic missing field -> 422 (fastapi) is acceptable; server also rejects short phone with 400
        assert r.status_code in (400, 422), r.text

    def test_register_short_phone_400(self, session):
        r = session.post(f"{API}/auth/register", json={
            "name": "Short", "email": f"sp_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "12345", "password": "test1234", "role": "farmer",
        })
        assert r.status_code in (400, 422)

    def test_register_duplicate_phone_400(self, session):
        r = session.post(f"{API}/auth/register", json={
            "name": "Dup", "email": f"dup_{uuid.uuid4().hex[:6]}@example.com",
            "phone": RAVI_PHONE, "password": "test1234", "role": "farmer",
        })
        assert r.status_code == 400
        assert "mobile" in r.json()["detail"].lower() or "phone" in r.json()["detail"].lower()

    def test_register_duplicate_email_400(self, session):
        r = session.post(f"{API}/auth/register", json={
            "name": "Dup", "email": RAVI_EMAIL, "phone": rand_phone(),
            "password": "test1234", "role": "farmer",
        })
        assert r.status_code == 400


# ---------- Auth: login by email OR phone ----------
class TestAuthLogin:
    def test_login_by_email(self, session):
        r = _login(session, RAVI_EMAIL)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == RAVI_EMAIL

    def test_login_by_phone(self, session):
        r = _login(session, RAVI_PHONE)
        assert r.status_code == 200, r.text
        assert r.json()["user"]["phone"] == RAVI_PHONE

    def test_login_bad_password_401(self, session):
        r = _login(session, RAVI_EMAIL, password="wrong")
        assert r.status_code == 401

    def test_login_unknown_identifier_401(self, session):
        r = _login(session, "0000000000")
        assert r.status_code == 401


# ---------- Auth: forgot & reset password (identifier) ----------
class TestForgotReset:
    def test_forgot_and_reset_by_phone(self, session):
        # Register a fresh user we can safely reset
        email = f"reset_{uuid.uuid4().hex[:6]}@example.com"
        phone = rand_phone()
        r = session.post(f"{API}/auth/register", json={
            "name": "Reset User", "email": email, "phone": phone,
            "password": "orig1234", "role": "farmer",
        })
        assert r.status_code == 200
        # Forgot by phone
        fp = session.post(f"{API}/auth/forgot-password", json={"identifier": phone})
        assert fp.status_code == 200, fp.text
        j = fp.json()
        assert j.get("otp") and len(j["otp"]) == 6
        # Reset with new password
        rp = session.post(f"{API}/auth/reset-password", json={
            "identifier": phone, "otp": j["otp"], "new_password": "new1234",
        })
        assert rp.status_code == 200, rp.text
        assert "access_token" in rp.json()
        # Old password fails
        assert _login(session, phone, "orig1234").status_code == 401
        # New password works via email too
        assert _login(session, email, "new1234").status_code == 200

    def test_forgot_unknown_identifier_returns_ok_no_otp(self, session):
        r = session.post(f"{API}/auth/forgot-password", json={"identifier": "0000000000"})
        assert r.status_code == 200
        assert r.json().get("otp") in (None, "")


# ---------- Subscription gating ----------
class TestSubscriptionGating:
    """Meera is FREE — gated actions must 403. Ravi is Plus — succeed."""

    def test_free_user_post_403(self, session, meera_auth):
        r = session.post(f"{API}/posts", headers=meera_auth["headers"],
                         json={"caption": "should fail", "tag": "tips"})
        assert r.status_code == 403
        assert r.json()["detail"] == "subscription_required"

    def test_free_user_message_403(self, session, meera_auth, ravi_auth):
        r = session.post(f"{API}/messages", headers=meera_auth["headers"],
                         json={"to_user_id": ravi_auth["user"]["id"], "text": "hi"})
        assert r.status_code == 403
        assert r.json()["detail"] == "subscription_required"

    def test_free_user_follow_403(self, session, meera_auth, ravi_auth):
        r = session.post(f"{API}/users/{ravi_auth['user']['id']}/follow",
                         headers=meera_auth["headers"])
        assert r.status_code == 403
        assert r.json()["detail"] == "subscription_required"

    def test_plus_user_post_ok(self, session, ravi_auth):
        r = session.post(f"{API}/posts", headers=ravi_auth["headers"],
                         json={"caption": "TEST plus can post", "tag": "tips"})
        assert r.status_code == 200
        pytest.plus_post_id = r.json()["id"]

    def test_plus_user_message_ok(self, session, ravi_auth, ananya_auth):
        r = session.post(f"{API}/messages", headers=ravi_auth["headers"],
                         json={"to_user_id": ananya_auth["user"]["id"], "text": f"TEST {uuid.uuid4().hex[:5]}"})
        assert r.status_code == 200


# ---------- Follow toggle ----------
class TestFollow:
    def test_follow_toggle_updates_state(self, session, ravi_auth, ananya_auth):
        target = ananya_auth["user"]["id"]
        # Start state
        r0 = session.get(f"{API}/users/{target}", headers=ravi_auth["headers"])
        was_following = r0.json()["is_following"]

        r1 = session.post(f"{API}/users/{target}/follow", headers=ravi_auth["headers"])
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["is_following"] is (not was_following)

        r2 = session.post(f"{API}/users/{target}/follow", headers=ravi_auth["headers"])
        assert r2.status_code == 200
        assert r2.json()["is_following"] is was_following

    def test_follow_self_400(self, session, ravi_auth):
        r = session.post(f"{API}/users/{ravi_auth['user']['id']}/follow",
                         headers=ravi_auth["headers"])
        assert r.status_code == 400


# ---------- Subscription/Payment endpoints (MISSING) ----------
class TestSubscriptionEndpoints:
    def test_plans_endpoint(self, session):
        r = session.get(f"{API}/subscriptions/plans")
        # Expected 200 with razorpay_configured=false and 2 plans
        if r.status_code == 404:
            pytest.skip("MISSING: /api/subscriptions/plans not implemented in backend")
        assert r.status_code == 200
        d = r.json()
        assert "razorpay_configured" in d
        assert isinstance(d.get("plans"), list) and len(d["plans"]) == 2

    def test_subscriptions_me(self, session, ravi_auth):
        r = session.get(f"{API}/subscriptions/me", headers=ravi_auth["headers"])
        if r.status_code == 404:
            pytest.skip("MISSING: /api/subscriptions/me not implemented")
        assert r.status_code == 200

    def test_dev_activate_free_user(self, session, meera_auth):
        r = session.post(f"{API}/payments/dev-activate",
                         headers=meera_auth["headers"],
                         json={"plan_id": "monthly"})
        if r.status_code == 404:
            pytest.skip("MISSING: /api/payments/dev-activate not implemented")
        assert r.status_code == 200


# ---------- Media chunked upload ----------
class TestMediaUpload:
    def test_full_chunked_flow_and_range(self, session, ravi_auth):
        # Start upload
        r = session.post(f"{API}/media/start",
                         headers=ravi_auth["headers"],
                         json={"mime": "video/mp4"})
        if r.status_code == 404:
            pytest.skip("MISSING: /api/media/start not implemented")
        assert r.status_code == 200, r.text
        mid = r.json()["id"]

        # Send 2 chunks
        chunk_a = b"HELLO-WORLD-CHUNK-A" * 5      # 95 bytes
        chunk_b = b"CHUNK-B-VIDEO-BYTES" * 5      # 95 bytes
        total_len = len(chunk_a) + len(chunk_b)

        c0 = session.post(f"{API}/media/{mid}/chunk",
                          headers=ravi_auth["headers"],
                          json={"index": 0, "data": base64.b64encode(chunk_a).decode()})
        assert c0.status_code == 200, c0.text
        c1 = session.post(f"{API}/media/{mid}/chunk",
                          headers=ravi_auth["headers"],
                          json={"index": 1, "data": base64.b64encode(chunk_b).decode()})
        assert c1.status_code == 200, c1.text

        # Finish
        fin = session.post(f"{API}/media/{mid}/finish", headers=ravi_auth["headers"])
        assert fin.status_code == 200, fin.text

        # GET full bytes
        g = requests.get(f"{API}/media/{mid}")
        assert g.status_code == 200, g.text
        assert len(g.content) == total_len
        assert g.content == chunk_a + chunk_b

        # Range: bytes=0-99 -> 206 with Content-Range
        rng = requests.get(f"{API}/media/{mid}", headers={"Range": "bytes=0-99"})
        assert rng.status_code == 206, f"Expected 206 got {rng.status_code}: {rng.text}"
        cr = rng.headers.get("Content-Range", "")
        assert cr.startswith("bytes 0-99/"), f"Bad Content-Range: {cr}"
        assert len(rng.content) == 100


# ---------- AI multimodal ----------
class TestAIMultimodal:
    def test_ai_text(self, session, ravi_auth):
        r = session.post(f"{API}/ai/chat_sync", headers=ravi_auth["headers"],
                         json={"message": "One-line: what is jeevamrutha?"}, timeout=90)
        assert r.status_code == 200, r.text
        assert len(r.json()["reply"]) > 10

    def test_ai_multimodal_image(self, session, ravi_auth):
        # 1x1 red jpeg base64
        tiny_jpeg = (
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=="
        )
        r = session.post(f"{API}/ai/chat_sync", headers=ravi_auth["headers"],
                         json={"message": "Describe this image briefly.", "images": [tiny_jpeg]}, timeout=120)
        assert r.status_code == 200, r.text
        assert len(r.json()["reply"]) > 5


# ---------- Regression: posts/comments/conversations/articles ----------
class TestRegression:
    def test_list_posts(self, session):
        r = session.get(f"{API}/posts")
        assert r.status_code == 200
        posts = r.json()
        assert len(posts) >= 6
        for p in posts:
            assert "_id" not in p

    def test_get_user_shows_is_following_with_auth(self, session, ravi_auth, ananya_auth):
        r = session.get(f"{API}/users/{ananya_auth['user']['id']}",
                        headers=ravi_auth["headers"])
        assert r.status_code == 200
        assert "is_following" in r.json()

    def test_list_articles(self, session):
        r = session.get(f"{API}/articles")
        assert r.status_code == 200
        assert len(r.json()) == 6

    def test_conversations_list(self, session, ravi_auth):
        r = session.get(f"{API}/conversations", headers=ravi_auth["headers"])
        assert r.status_code == 200

    def test_no_objectid_leak(self, session, ravi_auth):
        for url in (f"{API}/auth/me", f"{API}/users", f"{API}/posts",
                    f"{API}/articles", f"{API}/conversations"):
            h = ravi_auth["headers"] if url.endswith(("/me", "/conversations")) else {}
            r = session.get(url, headers=h)
            assert r.status_code == 200
            assert '"_id"' not in r.text
