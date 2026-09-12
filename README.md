# Krishiva: India's Organic Farming Ecosystem 🌱

Krishiva is a mobile platform designed to bridge the gap between organic farmers, agricultural experts, and verified buyers across India. It serves as a comprehensive ecosystem blending social networking, AI-driven farming assistance, and a dedicated marketplace for organic produce.

## 🌟 Core Features

### 1. The Organic Community Feed
A social networking layer where farmers and experts can share photos, videos, and organic farming procedures. 
- Real-time global feed.
- Support for chunked media uploads (images and videos).
- "Double-tap to like" and dynamic comment systems.

### 2. Krishiva AI Sahayak
An intelligent, conversational AI assistant embedded directly into the app.
- Powered by **Llama-3.1-8b-instant** (via Groq API) for lightning-fast inference.
- Provides specialized advice on organic pest control, crop rotation, and seasonal farming practices.
- Maintains chat history and session states for continuous conversations.

### 3. Direct Messaging & Networking
A built-in real-time chat system allowing users to search the directory and connect.
- Farmers can DM buyers to negotiate bulk crop sales.
- Experts can provide 1-on-1 consultation to learners.

### 4. Krishiva Verified (Monetization Engine)
A "Meta Verified" style business model that keeps the core app 100% free while generating revenue through algorithmic priority.
- Users can purchase a **Verified Badge** (blue checkmark) using Razorpay integration.
- **Algorithmic Post Promotion:** The backend uses MongoDB aggregation pipelines to automatically prioritize posts from Verified users, pushing them to the top of the global feed for maximum visibility.

### 5. Marketplace
A dedicated tab for listing and discovering organic produce.
- Filterable product categories.
- Direct links from marketplace listings to seller DMs.

---

## 🛠️ Technical Architecture

### Frontend (Mobile App)
- **Framework:** React Native with **Expo** (TypeScript).
- **Navigation:** Expo Router (File-based routing).
- **UI & Animations:** `react-native-reanimated` for 60fps micro-animations (custom splash screen, double-tap gestures).
- **Media:** `expo-video` and `expo-image` for high-performance media rendering.
- **State Management:** Custom React Hooks context (`AuthProvider`).

### Backend (API Engine)
- **Framework:** **FastAPI** (Python 3.11) built for high concurrency.
- **Authentication:** Custom JWT (JSON Web Tokens) with secure password hashing (`bcrypt`).
- **Security:** `slowapi` for endpoint rate-limiting (DDoS protection) and strictly typed Pydantic models for request validation.
- **Storage:** Local ephemeral chunked uploads for media processing.

### Database & Cloud Infrastructure
- **Database:** **MongoDB Atlas** (NoSQL) utilized for flexible schema design and powerful `$lookup` aggregation pipelines.
- **Hosting:** **Render.com** (Web Service) running the Python API.
- **CI/CD & Delivery:** **Expo Application Services (EAS)** for Over-The-Air (OTA) JavaScript updates and cloud-compiled native Android (.apk) and iOS (.ipa) builds.
