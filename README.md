# 🚀 OfferTrail

OfferTrail is an intelligent, AI-powered placement and job application workspace designed to help students and job seekers track their applications and tailor their resumes to specific job descriptions. 

By leveraging **Llama 3.3 via Groq**, OfferTrail analyzes Job Descriptions (JDs), extracts core requirements, and intelligently scores your uploaded resume, providing actionable feedback to help you land the interview.

---

## ✨ Key Features

- **📊 Application Tracking:** Track companies, roles, packages, deadlines, and application statuses (Wishlist, Applied, Prepping, Offered, Rejected) in a clean, Notion-style interface.
- **🤖 AI Job Description Analysis:** Paste a JD and let the AI automatically extract the target skills, technologies, and core responsibilities.
- **📄 Smart Resume Parsing:** Upload your tailored resume (PDF) directly into the workspace.
- **🎯 AI Match Scoring:** The AI compares your parsed resume against the JD requirements and generates a real-time Match Score (0-100).
- **💡 Actionable Insights:** Instantly see a list of missing skills and get 3 actionable suggestions to improve your resume before you apply.
- **✅ Progress & Checklists:** Keep track of interview prep milestones, technical study checklists, and interview reflections directly inside each company's workspace.

---

## 🛠️ Tech Stack

OfferTrail is built using a modern microservice architecture:

### Frontend (Client)
* **Framework:** React + Vite
* **Styling:** Tailwind CSS (Custom Dark Olive aesthetic)
* **Routing:** React Router DOM
* **State & Data Fetching:** React Query & Context API
* **Deployment:** Vercel

### Backend (Core API)
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB Atlas (Mongoose ORM)
* **Authentication:** JWT & bcryptjs
* **Deployment:** Render

### AI Service (Microservice)
* **Framework:** Python + FastAPI
* **LLM Engine:** Groq API (Llama 3.3 70B)
* **PDF Parsing:** pypdf
* **Deployment:** Render

---

## 🚀 Getting Started (Local Development)

If you want to run OfferTrail locally on your own machine, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/snehaalanka/OfferTrail.git
cd OfferTrail
```

### 2. Setup the Node.js Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<your-db-url>
JWT_SECRET=your_secret_key
FASTAPI_URL=http://127.0.0.1:8000
```
Start the backend server:
```bash
npm run dev
```

### 3. Setup the Python AI Service
Open a new terminal window:
```bash
cd fastapi_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `fastapi_service` folder (or use the backend one):
```env
GROQ_API_KEY=your_groq_api_key_here
```
Start the AI microservice:
```bash
uvicorn main:app --port 8000 --reload
```

### 4. Setup the React Frontend
Open a third terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FASTAPI_URL=http://localhost:8000
```
Start the frontend development server:
```bash
npm run dev
```

Your app will now be running at `http://localhost:5173`!

---

## ☁️ Deployment Environment Variables

When deploying to production, make sure the following environment variables are set in your respective cloud providers:

**Vercel (Frontend):**
* `VITE_API_URL` (Your Render Node API URL + `/api`)
* `VITE_FASTAPI_URL` (Your Render FastAPI URL)

**Render (Node Backend):**
* `MONGODB_URI`
* `JWT_SECRET`
* `FASTAPI_URL` (Your Render FastAPI URL)

**Render (FastAPI Service):**
* `GROQ_API_KEY`
* `PYTHON_VERSION` (Set to `3.11.9` for compatibility)

---
*Built with ❤️ for placement season.*
