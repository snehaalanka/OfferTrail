# 🚀 OfferTrail

OfferTrail is a Notion-inspired, minimalist placement and job application workspace designed to bring order to the chaos of recruiting season. 

Built with a clean, distraction-free aesthetic, OfferTrail provides dedicated workspaces for every company you apply to—allowing you to track your progress, store tailored resumes, build study checklists, and log interview reflections all in one place. It also features a built-in AI assistant to optionally analyze job descriptions and score your resumes.

---

## ✨ Key Features

- **📓 Notion-Inspired Workspaces:** A beautifully minimalist, typography-driven interface designed for deep focus and organization.
- **📊 Application Tracking:** Track companies, roles, packages, deadlines, and application statuses (Wishlist, Applied, Prepping, Offered, Rejected).
- **✅ Progress & Checklists:** Build technical study checklists and track interview prep milestones directly inside each company's workspace.
- **📝 Interview Reflections:** Log what went well, what you struggled with, and what to revise after every interview stage.
- **📄 Document Management:** Upload and manage the specific, tailored resumes you submitted for each role.
- **🤖 Smart AI Insights (Optional):** Use the built-in Llama 3.3 integration to optionally extract core requirements from a Job Description and compare it against your uploaded resume.

---

## 🛠️ Tech Stack

OfferTrail is built using a modern microservice architecture:

### Frontend (Client)
* **Framework:** React + Vite
* **Styling:** Tailwind CSS (Custom Notion-style Dark Olive aesthetic)
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
