Citizen Redesign
AI-Powered Public Space Redesign Platform
Technical Documentation & Development Guide
1. Project Overview
Citizen Redesign is an experimental AI-powered web application that empowers citizens to visualize and propose redesigns of public spaces in their city. Users capture images of underutilized or neglected urban areas (parks, plazas, monuments) and use AI to transform them according to their vision.
Key Objectives
Enable citizens to reimagine public spaces through AI-powered image editing
Compare different interaction methods (Text, Voice, Inpainting, Drag & Drop) for UX research
Track all user prompts and editing patterns for analysis
Build a community gallery showcasing public space transformation ideas
2. Core Features
2.1 Simple Username Authentication
No password required - username only
Avatar selection from preset character options (10-12 cartoon avatars)
Instant access without email verification
2.2 Four Editing Methods (UX Research)
Each user is assigned ONE method to test different interaction paradigms:
Method
Description
Group
Text Prompt
Type natural language descriptions (e.g., 'Add benches and trees')
Group 1
Voice Input
Speak editing instructions, converted to text via Speech-to-Text API
Group 2
Inpainting
Draw/mask regions on image and describe changes for those areas
Group 3
Drag & Drop
Place pre-designed elements (benches, fountains, trees) onto image
Group 4


2.3 Image Capture & Upload
Browser camera access via MediaDevices API
Direct image upload (JPG, PNG)
Drag & drop file upload
2.4 Iterative AI Editing
Users can edit images multiple times until satisfied
Real-time preview of changes (simulated in frontend, actual in backend integration)
Before/After comparison slider for each version
All versions saved with associated prompts
2.5 Version History & Gallery
User Profile: View personal editing history
Community Feed: Browse all public redesigns with before/after views
Admin Dashboard: View all users, prompts, and complete editing sessions
3. User Flow & Activities
3.1 Onboarding Flow
Landing Page: User sees mission statement: 'Capture public space and transform it. Your vision can inspire local people and community.'
Authentication: Click 'Create New Account' or 'Login'
New users: Enter username → Select avatar → Auto-login
Returning users: Enter username → Login
Method Assignment: Backend assigns user to one of four editing groups
3.2 Editing Session Flow
Capture Image: Take photo with camera OR upload existing image
Initial View: Image displayed with assigned editing interface
Apply Edits: User interacts with their assigned method:
Text: Type prompt in text field
Voice: Record voice → Transcribed to text → Submit
Inpainting: Draw mask on image → Describe change
Drag & Drop: Select elements (bench, tree, fountain) → Place on image
Generate Redesign: AI processes request and returns edited image
Review Changes: Before/After slider appears
Iterate or Save: 
Not satisfied? Apply more edits (repeat steps 3-6)
Satisfied? Click 'Save' to store in profile
Version History: Click 'View Versions' to see all iterations with their prompts
3.3 Gallery & Community Feed
Navigate to 'Gallery' to see all public redesigns
Each entry shows: Original image → Final redesign → Username/Avatar
Click any item to view full version history
3.4 Admin Dashboard Flow
Admin login with secure credentials
View all users and their assigned methods
Access complete editing history for any user
See all prompts, timestamps, and generated images
Export data for UX research analysis
4. Technical Architecture
4.1 Technology Stack
Layer
Technology
Frontend
Vite.js + React.js + Tailwind CSS
Backend
Python + FastAPI (or Django/Flask)
Database
MongoDB (Cloud: MongoDB Atlas - 15GB free tier)
Storage
Backblaze B2 (Cloud storage for images)
AI API
Nano Banana Pro / Flux AI / OpenAI Image API


4.2 System Flow
User (Browser) → Frontend (Vite/React) → Backend API (FastAPI) → AI Service (Nano Banana Pro) → MongoDB + Backblaze Storage
4.3 Database Schema (MongoDB)
Users Collection
{  _id: ObjectId,  username: String (unique),  avatar: String (URL),  assignedMethod: String (text|voice|inpainting|dragdrop),  role: String (user|admin),  createdAt: Date}
Projects Collection
{  _id: ObjectId,  userId: ObjectId (ref Users),  username: String,  originalImageUrl: String (Backblaze),  inputMethod: String,  createdAt: Date}
EditHistory Collection (Critical for UX Research)
{  _id: ObjectId,  projectId: ObjectId (ref Projects),  userId: ObjectId,  username: String,  prompt: String (user input),  inputImageUrl: String,  outputImageUrl: String,  version: Number (1, 2, 3...),  timestamp: Date}
4.4 Key API Endpoints
Method
Endpoint
Purpose
POST
/api/auth/login
Username authentication + method assignment
POST
/api/upload
Upload original image → Backblaze
POST
/api/edit
Process prompt + image with AI → Save version
GET
/api/history/{userId}
Fetch user's complete editing history
GET
/api/gallery
Public gallery feed
GET
/api/admin/users
Admin: View all users and data


5. Development Guide (3 Milestones)
The project will be developed in three distinct phases to ensure rapid iteration and testability. All milestones use dummy data initially to enable frontend development without backend dependency.
MILESTONE 1: Frontend Development (Vite + React + Tailwind)
Objective
Build a fully functional frontend with complete user flows using dummy/mock data stored in the public folder. No backend required yet.
Key Deliverables
Authentication Pages
Login page (username input)
Create account page (username + avatar selection)
Mock authentication using localStorage
Image Capture/Upload Component
Camera access via navigator.mediaDevices.getUserMedia()
File upload with drag & drop
Image preview before editing
Four Editing Interface Components
Text Prompt Editor (textarea + submit button)
Voice Input Interface (record button + transcription display)
Inpainting Tool (canvas-based masking)
Drag & Drop Editor (element placement)
Before/After Comparison Slider
Use react-compare-image library
Display original vs edited images
Version History Component
List all editing iterations
Show prompt for each version
Timeline/feed style layout (Figma-inspired)
User Profile Page
Display username + avatar
Show all user projects
Community Gallery/Feed
Grid layout of all redesigns
Clickable items to view details
Admin Dashboard (Basic)
User list with methods
View any user's editing history
Dummy Data Structure (public/data/)
users.json
[  {    "id": 1,    "username": "john_doe",    "avatar": "/avatars/avatar1.png",    "assignedMethod": "text",    "role": "user"  },  {    "id": 2,    "username": "jane_smith",    "avatar": "/avatars/avatar2.png",    "assignedMethod": "voice",    "role": "user"  }]
projects.json
[  {    "id": 1,    "userId": 1,    "originalImage": "/images/original1.jpg",    "createdAt": "2025-03-01T10:00:00Z"  }]
editHistory.json
[  {    "id": 1,    "projectId": 1,    "userId": 1,    "prompt": "Add benches and trees",    "inputImage": "/images/original1.jpg",    "outputImage": "/images/edited1_v1.jpg",    "version": 1,    "timestamp": "2025-03-01T10:05:00Z"  },  {    "id": 2,    "projectId": 1,    "userId": 1,    "prompt": "Add fountain in center",    "inputImage": "/images/edited1_v1.jpg",    "outputImage": "/images/edited1_v2.jpg",    "version": 2,    "timestamp": "2025-03-01T10:10:00Z"  }]
Frontend Tech Stack
Build Tool: Vite.js (fast, modern bundler)
Framework: React.js
Styling: Tailwind CSS
Routing: React Router
State Management: React Context API
Image Comparison: react-compare-image
Canvas Drawing: React Konva (for inpainting)
Folder Structure
citizen-redesign-frontend/├── public/│   ├── data/│   │   ├── users.json│   │   ├── projects.json│   │   └── editHistory.json│   ├── images/│   │   ├── original1.jpg│   │   ├── edited1_v1.jpg│   │   └── edited1_v2.jpg│   └── avatars/│       ├── avatar1.png│       └── avatar2.png├── src/│   ├── components/│   │   ├── Auth/│   │   │   ├── Login.jsx│   │   │   └── CreateAccount.jsx│   │   ├── Editor/│   │   │   ├── TextEditor.jsx│   │   │   ├── VoiceEditor.jsx│   │   │   ├── InpaintingEditor.jsx│   │   │   └── DragDropEditor.jsx│   │   ├── ImageCapture.jsx│   │   ├── ComparisonSlider.jsx│   │   ├── VersionHistory.jsx│   │   ├── Gallery.jsx│   │   ├── Profile.jsx│   │   └── AdminDashboard.jsx│   ├── context/│   │   └── AuthContext.jsx│   ├── hooks/│   │   └── useAuth.js│   ├── pages/│   │   ├── HomePage.jsx│   │   ├── EditorPage.jsx│   │   ├── ProfilePage.jsx│   │   ├── GalleryPage.jsx│   │   └── AdminPage.jsx│   ├── utils/│   │   └── dummyData.js│   ├── App.jsx│   └── main.jsx├── package.json├── vite.config.js└── tailwind.config.js
Success Criteria
All user flows work with dummy data
All four editing methods are visually complete
Before/After slider works smoothly
Version history displays correctly
Gallery and profile pages render properly
Responsive design (mobile + desktop)
MILESTONE 2: Backend Development (Python + FastAPI + MongoDB)
Objective
Build a production-ready backend with real database, authentication, image storage, and AI integration. No frontend changes yet - test with Postman/Insomnia.
Key Deliverables
Authentication System
POST /api/auth/register (username + avatar)
POST /api/auth/login (username only)
JWT token generation
Assign editing method on first login
Image Upload & Storage
POST /api/upload (multipart/form-data)
Upload to Backblaze B2 bucket
Return public URL
AI Image Editing Integration
POST /api/edit (receives image + prompt)
Send to Nano Banana Pro / Flux AI API
Return edited image URL
Save edit history to MongoDB
Database Operations
Create MongoDB collections (Users, Projects, EditHistory)
Implement CRUD operations
Store prompts with every edit version
Gallery & History Endpoints
GET /api/history/{userId} - User's editing history
GET /api/gallery - Public feed
GET /api/project/{projectId} - Single project details
Admin Endpoints
GET /api/admin/users - All users with methods
GET /api/admin/prompts - All prompts across users
Backend Tech Stack
Language: Python 3.11+
Framework: FastAPI (recommended for speed)
Database: MongoDB Atlas (cloud)
ODM: Motor (async MongoDB driver)
Storage: Backblaze B2 (boto3 SDK)
Authentication: JWT (python-jose)
AI API: httpx (async HTTP client)
Folder Structure
citizen-redesign-backend/├── app/│   ├── routes/│   │   ├── auth.py│   │   ├── upload.py│   │   ├── edit.py│   │   ├── gallery.py│   │   └── admin.py│   ├── models/│   │   ├── user.py│   │   ├── project.py│   │   └── edit_history.py│   ├── services/│   │   ├── ai_service.py│   │   ├── storage_service.py│   │   └── auth_service.py│   ├── database.py│   ├── config.py│   └── main.py├── requirements.txt└── .env
Environment Variables (.env)
MONGODB_URL=mongodb+srv://...BACKBLAZE_KEY_ID=...BACKBLAZE_APP_KEY=...BACKBLAZE_BUCKET_NAME=...AI_API_KEY=...JWT_SECRET=...
Success Criteria
All API endpoints work (test with Postman)
Images upload to Backblaze successfully
AI API integration returns edited images
MongoDB stores all data correctly
Prompt tracking works for every edit
MILESTONE 3: Full Integration & Testing
Objective
Connect frontend to backend, replace all dummy data with real API calls, and perform end-to-end testing.
Key Tasks
Replace Mock Data with API Calls
Replace public/data/*.json with fetch() calls to backend
Update AuthContext to use /api/auth/login
Implement axios/fetch for all components
Image Upload Integration
ImageCapture component → POST /api/upload
Display Backblaze URL in UI
AI Editing Integration
Send prompts to POST /api/edit
Display loading states during AI processing
Update ComparisonSlider with real before/after images
History & Gallery Integration
VersionHistory → GET /api/history/{userId}
Gallery → GET /api/gallery
Admin Dashboard Integration
Fetch users from GET /api/admin/users
Display prompts from GET /api/admin/prompts
CORS Configuration
Backend must enable CORS for frontend origin:
from fastapi.middleware.cors import CORSMiddlewareapp.add_middleware(    CORSMiddleware,    allow_origins=["http://localhost:5173"],    allow_credentials=True,    allow_methods=["*"],    allow_headers=["*"])
Testing Checklist
User registration and login work end-to-end
Camera capture uploads to Backblaze
All four editing methods generate AI images
Version history displays correct prompts
Gallery shows all public redesigns
Admin can view all users and data
Prompt tracking verified in MongoDB
Success Criteria
Complete user journey works (signup → edit → save → view gallery)
No dummy data remains in frontend
All API endpoints are consumed correctly
Performance is acceptable (images load fast)
Ready for demo/presentation
6. Critical Requirements
6.1 Prompt Tracking (Non-Negotiable)
Every single edit must store:
Username
Input method (text/voice/inpainting/dragdrop)
Exact prompt text
Input image URL
Output image URL
Timestamp
Version number
This data is the core research output - treat it as sacred.
6.2 Performance Optimization
Use Vite for fast builds and hot module replacement
Lazy load images in gallery
Implement loading states for AI processing
Store API keys in backend only (never expose in frontend)
6.3 Security Notes
No password authentication (username only is intentional)
Admin routes must be protected with separate credentials
Use environment variables for all secrets
Never commit .env files to version control
End of Document
For Figma Design Reference: https://www.figma.com/make/cT5dCMDbY7DMWo0qwYA5zQ/
