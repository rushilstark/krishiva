# Krishiva – Product Requirements

## Vision
India's largest platform connecting organic farmers, buyers, experts & learners in one trusted community. **Community-first v1**, with marketplace (buy/sell) planned for v2 once user base grows.

## v1 MVP Scope (this build)
- **Community feed**: text + photo + video (YouTube/MP4 URL) posts. Categories: Tips, How-To, Waste Mgmt, Cleanliness, Stories, Questions, General.
- **Video-first knowledge sharing** — farmers share organic procedures via YouTube links.
- **Awareness pillars**: cleanliness, waste management, organic farming.
- **Authentication**: JWT + bcrypt email/password. Role selection (Farmer / Learner / Expert). Location permission at signup.
- **Profiles**: verification levels (Basic / Premium / Certified Organic), bio, location, avatar upload, stats.
- **Direct messaging**: 1:1 chat between any users.
- **Krishi Sahayak AI**: Gemini 3 Flash chatbot for organic farming, pests, soil, composting, schemes.
- **Learn**: 6 seeded articles on composting, pest control, soil health, rotation, irrigation, certification.
- **Comments & likes** on posts.

## v2 Roadmap (deferred)
- Buy/Sell marketplace (products, orders, payments)
- Verification workflow (Aadhaar/PAN upload)
- Premium farmer subscriptions
- Expert booking (video calls)
- Push notifications
- Multi-language (Hindi)

## Tech Stack
- **Backend**: FastAPI + MongoDB + JWT + bcrypt + emergentintegrations (Gemini 3 Flash)
- **Frontend**: Expo (React Native) + expo-router + expo-image + expo-image-picker + expo-location + WebView (for embedded YouTube)
- **Auth token storage**: `@/src/utils/storage` secureSet/secureGet (works on web + native)

## Design
Earthy botanical palette (Forest greens #2A7036, Brown #855E42, Sand #F9F9F7). iOS-native rhythms, Plus Jakarta Sans, Phosphor-style icons via `@expo/vector-icons`.

## Business Enhancement (planned)
**Featured "Sponsored Story" slot** in the community feed — organic brands (seed companies, bio-fertilizer makers) can pay to have one post per session appear at top of the feed with a "Sponsored" tag. This unlocks revenue without touching the marketplace and keeps the community trusted.
