# Krishiva – Product Requirements

## Vision
India's largest platform connecting organic farmers, buyers, experts & learners in one trusted community. **Community-first v1**, with marketplace (buy/sell) planned for v2 once user base grows.

## v1 MVP Scope (this build)
- **Community feed**: text + photo + video (YouTube/MP4 URL, camera recording, gallery upload) posts. Categories (post-time only; feed filter row removed): Organic Tips, How-To Videos, Waste Management, Cleanliness, Success Stories, Questions, General.
- **Video-first knowledge sharing** — farmers record videos in-app (camera, max 60s, chunked upload to /api/media) or share YouTube links. Playback via expo-video (direct) / WebView (YouTube).
- **Awareness pillars**: cleanliness, waste management, organic farming.
- **Authentication**: JWT + bcrypt. Register requires name, email, **10-digit mobile**, password, role (Farmer/Learner/Expert). Login & forgot-password accept **email OR mobile**. OTP reset (dev-mode returns OTP in response).
- **Profiles**: bio, location (GPS detect w/ permission contract), avatar upload, stats (Posts, Followers only — Level removed), labeled Log out button.
- **Follow system**: follow/unfollow users (Plus only).
- **Direct messaging**: 1:1 chat (sending requires Plus).
- **Krishi Sahayak AI**: Gemini 3 Flash multimodal chatbot — text + attach photos (camera/gallery) + videos (uploaded via media API) like ChatGPT.
- **Learn**: 6 seeded articles.
- **Comments & likes** on posts (free).

## Subscription — Krishiva Plus (implemented)
- Gates: **posting, following, sending chat messages** require an active subscription. Browsing/likes/comments/AI are free.
- Plans: ₹99/month, ₹999/year (one-time term payment, no auto-renew).
- Razorpay integration built (web: Standard Checkout, native: hosted Payment Links + verify). **Keys not yet provided → TEST MODE dev-activate endpoint active (MOCKED payment).** Add RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to backend/.env to go live.

## v2 Roadmap (deferred)
- Buy/Sell marketplace (products, orders, payments)
- Verification workflow (Aadhaar/PAN upload)
- Expert booking (video calls)
- Push notifications
- Multi-language (Hindi)
- Real OTP delivery via SMS/email for password reset
- Razorpay webhooks for payment recovery

## Tech Stack
- **Backend**: FastAPI + MongoDB + JWT + bcrypt + emergentintegrations (Gemini 3 Flash)
- **Frontend**: Expo (React Native) + expo-router + expo-image + expo-image-picker + expo-location + WebView (for embedded YouTube)
- **Auth token storage**: `@/src/utils/storage` secureSet/secureGet (works on web + native)

## Design
Earthy botanical palette (Forest greens #2A7036, Brown #855E42, Sand #F9F9F7). iOS-native rhythms, Plus Jakarta Sans, Phosphor-style icons via `@expo/vector-icons`.

## Business Enhancement (planned)
**Featured "Sponsored Story" slot** in the community feed — organic brands (seed companies, bio-fertilizer makers) can pay to have one post per session appear at top of the feed with a "Sponsored" tag. This unlocks revenue without touching the marketplace and keeps the community trusted.
