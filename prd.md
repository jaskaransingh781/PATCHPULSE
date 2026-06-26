# PatchPulse - Product Requirements Document (PRD)

## 1. Project Overview
PatchPulse is an AI-powered, hyperlocal civic issue reporting platform. It aims to eliminate the friction in traditional municipal reporting by allowing citizens to submit multimodal reports (images/video) of infrastructure issues (e.g., potholes, water leaks). The system autonomously triages, categorizes, and maps these issues using Google's Gemini AI, creating a transparent, real-time heatmap for community accountability and municipal action.

## 2. Technical Stack Definition
The IDE must strictly adhere to the following tools, frameworks, and versions.

| Layer | Technology | Key Libraries / Packages |
| :--- | :--- | :--- |
| Frontend | React.js (Vite) | `react`, `react-dom`, `tailwindcss`, `lucide-react`, `axios` |
| Maps & Geo | Google Maps JS API | `@react-google-maps/api` |
| Backend | Node.js + Express | `express`, `cors`, `dotenv`, `multer` |
| Database | MongoDB Atlas | `mongoose` |
| AI Triage | Google Gemini API | `@google/genai` (Model: `gemini-1.5-flash`) |
| Cloud Storage | Cloudinary | `cloudinary`, `multer-storage-cloudinary` |
| Deployment | Vercel & Render | Vercel (Client), Render (API) |

## 3. Core Functional Requirements

### 3.1 Multimodal Reporting Form (Frontend)
- **Mobile-First UI**: A responsive interface featuring a camera upload component accessible via a Floating Action Button (FAB) or bottom sheet on mobile devices.
- **Intelligent Geolocation**: Upon image selection, the app must automatically call the browser's `navigator.geolocation` API to capture the exact coordinates.
- **Fallback Mechanism**: If GPS permission is denied, the user must be prompted to manually drop a pin on the Google Map to set coordinates.
- **State Management**: Clear loading states must be displayed while acquiring GPS, uploading to Cloudinary, and awaiting the Gemini AI response.

### 3.2 Agentic AI Triage System (Backend)
- **Image Processing**: Uploaded images must be streamed directly to Cloudinary using `multer-storage-cloudinary`.
- **AI Ingestion**: The Express server must fetch the image buffer from the Cloudinary URL (using Axios) and convert it to a Base64 string, or pass the URL directly to the Gemini API.
- **Prompt Engineering**: The backend must instruct `gemini-1.5-flash` to act as a municipal inspector.
- **Strict JSON Output**: The Gemini model must return a strictly formatted JSON object containing:
  - `category` (String)
  - `severity` (Enum: 'Low', 'Medium', 'Critical')
  - `aiDescription` (String: detailed analysis of the issue)

### 3.3 Interactive Geospatial Dashboard (Frontend)
- **Map Rendering**: Implement a full-screen interactive map using `@react-google-maps/api`.
- **Dynamic Data Fetching**: On mount, fetch all active issues from the database and render them as markers.
- **Marker Clustering**: Use the `MarkerClusterer` component to group nearby markers and prevent UI lag when hundreds of issues are loaded.
- **Dynamic Styling**: Color-code markers based on the AI-determined severity (Red = Critical, Orange = Medium, Green = Low).
- **Interactive InfoWindows**: Clicking a marker must display an InfoWindow showing the hosted Cloudinary image, the category, the severity, and the `aiDescription`.

## 4. Database Architecture (MongoDB / Mongoose)
The backend must implement the following `Issue` schema with an explicit GeoJSON index for spatial queries.

```javascript
// Data Model Requirements
{
  imageUrl: { type: String, required: true }, // Must be absolute Cloudinary URL
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // Strict order: [longitude, latitude]
  },
  category: { type: String, required: true }, 
  severity: { type: String, enum: ['Low', 'Medium', 'Critical'], required: true },
  aiDescription: { type: String, required: true },
  status: { type: String, enum: ['Reported', 'Verified', 'In Progress', 'Resolved'], default: 'Reported' }, 
  reporterId: { type: String, required: true, default: 'anonymous' } 
}

// Crucial Indexing Requirement
// issueSchema.index({ location: "2dsphere" }); 
```

## 5. API Endpoints

| Method | Endpoint | Payload / Format | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/api/issues/report` | `multipart/form-data` (Image file, longitude, latitude) | Uploads image to Cloudinary, sends to Gemini for analysis, saves final object to MongoDB. |
| GET | `/api/issues` | None | Fetches all issues from MongoDB to populate the Google Map frontend. |

## 6. Environment Variables Constraints
The IDE must provision the following `.env` structures. Under no circumstances should keys be hardcoded.

**Frontend (`frontend/.env`):**
- `VITE_API_URL` (e.g., http://localhost:5000/api)
- `VITE_GOOGLE_MAPS_API_KEY`

**Backend (`backend/.env`):**
- `PORT`
- `MONGO_URI` (Must end with `/patchpulse` database name)
- `GEMINI_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
