# PatchPulse 🌍⚡

**An AI-Powered Civic Infrastructure Triage Platform**

PatchPulse is a next-generation civic management application designed to bridge the gap between citizens and municipal authorities. It provides an intuitive, gamified experience for users to report civic issues (like potholes, broken streetlights, or water leaks) while leveraging advanced AI to automate moderation, deduplication, and triage for city administrators.

---

## 🚀 The Problem
City infrastructure often goes unrepaired due to inefficient reporting systems. Citizens submit duplicate reports, vague descriptions, and sometimes spam. This creates massive backlogs for municipal workers who must manually verify and triage every single incident before dispatching a crew, leading to slow response times and wasted resources.

## 💡 The Solution
PatchPulse acts as an intelligent intermediary. It empowers citizens to report issues effortlessly using voice and photo uploads, while the backend AI acts as a smart filter. The AI automatically blocks spam, detects duplicate reports of the same issue (converting them into "upvotes"), and assigns a priority level, so city workers can focus on what matters most.

---

## ✨ Key Features

### For Citizens
* **Voice-to-Text Reporting:** Describe hazards hands-free in your native language using built-in speech recognition.
* **Smart Auto-Location:** Automatically drops a pin at your exact GPS coordinates when you snap a photo.
* **Modern UI/UX:** A premium, tactile interface featuring a dynamic glassmorphism design, floating overlays, micro-animations, and full Semantic Light/Dark mode support.
* **Offline Support:** Reports are queued locally if you lose internet connection and automatically submitted once you are back online.

### For Administrators (The AI Engine)
* **AI Content Moderation (Gatekeeper):** Uses Google's Gemini Vision AI to analyze uploaded photos in real-time. Spam, selfies, or irrelevant photos are instantly rejected, keeping the database clean.
* **Geospatial AI Deduplication:** When a new report is submitted, the backend scans a 50-meter GPS radius using MongoDB `$nearSphere` queries. If an existing report is found, the AI compares the photos. If they match, the new report is merged as an "Upvote", preventing duplicate tickets.
* **Automated Severity Triage:** The AI generates a professional description of the damage and assigns a priority level (`Critical`, `Medium`, `Low`) based on the visual hazard, allowing city workers to address dangerous issues first.
* **Live Incident Feed:** A real-time command dashboard for admins to view, filter, and resolve active issues.
* **Analytics & Metrics:** View real-time performance metrics, average resolution times, and volume trends on the analytics dashboard.

---

## 🛠️ Technology Stack

**Frontend:**
* React (Vite)
* Tailwind CSS (Custom Design System with Semantic Variables)
* React Google Maps API (with custom clustering and styling)
* Recharts (for Analytics)
* Lucide React (Icons)
* IndexedDB (for offline caching)

**Backend:**
* Node.js & Express
* MongoDB & Mongoose (with Geospatial Indexing)
* Google Gemini 1.5 Flash API (Vision & Language processing)
* Multer (Image uploads)

---

## ⚙️ How It Works (The AI Pipeline)

1. **Submission:** A user uploads a photo, records a voice description, and submits the report.
2. **Stage 1 - Moderation:** The backend sends the image to Gemini AI. If the image is not a valid civic infrastructure issue, the report is aborted, and the user receives an error.
3. **Stage 2 - Geospatial Scan:** The backend queries MongoDB for any unresolved issues within a 50-meter radius of the user's GPS coordinates.
4. **Stage 3 - Deduplication:** If nearby issues are found, Gemini AI compares the new photo to the existing photos. If it detects a match, the new report is discarded, and the existing report's `upvote` count is incremented.
5. **Stage 4 - Triage:** If no duplicates are found, Gemini AI analyzes the photo and user description to generate a professional summary and assign a severity level.
6. **Storage:** The finalized, AI-enhanced report is saved to the database and appears instantly on the live map and admin dashboard.

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas cluster (or local instance)
* Google Cloud Console account (for Maps API)
* Google AI Studio account (for Gemini API)

### 1. Clone the repository
```bash
git clone https://github.com/jaskaransingh781/PATCHPULSE.git
cd PATCHPULSE
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_URL=http://localhost:5000/api
```
Start the frontend development server:
```bash
npm run dev
```

---

## 🤝 Built By
Built with ❤️ by [Jaskaran Singh](https://github.com/jaskaransingh781) for civic betterment.
