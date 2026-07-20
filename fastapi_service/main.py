import re
import traceback
import os
import json
import io
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from google.generativeai.types import GenerationConfig

from dotenv import load_dotenv

# Load backend/.env to read GEMINI_API_KEY
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_env = os.path.join(current_dir, "..", "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

try:
    import google.generativeai as genai
    from google.generativeai.types import GenerationConfig
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

app = FastAPI(title="Atlas AI Analysis Service")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input/Output Models
class JDInput(BaseModel):
    jd: str

class JDAnalysisOutput(BaseModel):
    skills: List[str]
    technologies: List[str]
    responsibilities: List[str]

class CompareInput(BaseModel):
    resume: str
    jd: str

class CompareOutput(BaseModel):
    score: int
    missing_skills: List[str]
    suggested_improvements: List[str]

@app.get("/")
def read_root():
    return {"message": "Atlas AI Analysis Service is running"}

@app.post("/parse_pdf")
async def parse_pdf(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
        return {"text": text.strip()}
    except Exception as e:
        return {"error": str(e), "text": ""}

@app.post("/analyze_jd", response_model=JDAnalysisOutput)
def analyze_jd(payload: JDInput):
    jd_text = payload.jd
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not HAS_GEMINI or not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured or SDK is missing.")
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = (
            "Analyze the following Job Description (JD). Extract the required key skills, target technologies, and core responsibilities.\n"
            "BE EXHAUSTIVE. Extract every single named technology, framework, architecture, programming language, or hardware concept mentioned (e.g. CUDA, OpenCL, OpenACC, C++, HPC, Parallel Computing, compilers, Data Structures).\n"
            "Return ONLY a valid JSON object matching this schema.\n\n"
            "{\n"
            "  \"skills\": [\"skill1\", \"skill2\"],\n"
            "  \"technologies\": [\"tech1\", \"tech2\"],\n"
            "  \"responsibilities\": [\"responsibility1\", \"responsibility2\"]\n"
            "}\n\n"
            f"Job Description:\n{jd_text}"
        )
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "skills": {"type": "array", "items": {"type": "string"}},
                        "technologies": {"type": "array", "items": {"type": "string"}},
                        "responsibilities": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["skills", "technologies", "responsibilities"]
                }
            )
        )
        print("RAW GEMINI /analyze_jd OUTPUT:", response.text)  # temp debug
        data = json.loads(response.text)
        return {
            "skills": data.get("skills", []),
            "technologies": data.get("technologies", []),
            "responsibilities": data.get("responsibilities", [])
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(e)}")

@app.post("/compare", response_model=CompareOutput)
def compare_resume_jd(payload: CompareInput):
    resume_text = payload.resume
    jd_text = payload.jd
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not HAS_GEMINI or not api_key:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured or SDK is missing.")
        
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = (
            "You are an expert ATS (Applicant Tracking System) recruiter. Compare the following Resume text against the Job Description (JD).\n"
            "1. Calculate a match score between 0 and 100 representing how well the resume matches the JD's requirements.\n"
            "2. List the missing key skills/technologies that are required by the JD but missing from the resume. BE EXHAUSTIVE, including low-level APIs like CUDA, OpenCL, etc., if mentioned in the JD.\n"
            "3. List 3 specific actionable improvement suggestions for the candidate's resume.\n"
            "Return ONLY a valid JSON object matching this schema.\n\n"
            "{\n"
            "  \"score\": 85,\n"
            "  \"missing_skills\": [\"Docker\", \"Kubernetes\"],\n"
            "  \"suggested_improvements\": [\"Add a project showing Docker containers\", \"Quantify React experience\"]\n"
            "}\n\n"
            f"Resume:\n{resume_text}\n\n"
            f"Job Description:\n{jd_text}"
        )
        response = model.generate_content(
            prompt,
            generation_config=GenerationConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "score": {"type": "integer"},
                        "missing_skills": {"type": "array", "items": {"type": "string"}},
                        "suggested_improvements": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["score", "missing_skills", "suggested_improvements"]
                }
            )
        )
        print("RAW GEMINI /compare OUTPUT:", response.text)  # temp debug
        data = json.loads(response.text)
        return {
            "score": int(data.get("score", 50)),
            "missing_skills": data.get("missing_skills", []),
            "suggested_improvements": data.get("suggested_improvements", [])
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(e)}")
