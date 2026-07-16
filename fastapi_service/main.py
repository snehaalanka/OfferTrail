import re
import os
import json
import io
from typing import List
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader

from dotenv import load_dotenv

# Load backend/.env to read GROQ_API_KEY
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_env = os.path.join(current_dir, "..", "backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

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

# Dictionary of technical skills and technologies to scan (Fallback Scanner)
SKILLS_DICT = [
    "dsa", "data structures", "algorithms", "oop", "dbms", "operating systems",
    "system design", "agile", "scrum", "unit testing", "jest", "ci/cd", "git",
    "rest apis", "microservices", "load balancing", "caching", "object-oriented programming"
]

TECH_DICT = [
    "react", "vue", "angular", "node.js", "node", "express", "django", "flask", "fastapi",
    "spring boot", "java", "python", "javascript", "typescript", "c++", "golang", "rust",
    "mongodb", "postgresql", "mysql", "redis", "dynamodb", "aws", "azure", "gcp",
    "docker", "kubernetes", "jenkins", "terraform", "html", "css", "sql", "nosql", "linux"
]

ACTION_VERBS = [
    "build", "design", "develop", "optimize", "maintain", "collaborate", 
    "implement", "write", "manage", "create", "architect", "support"
]

def parse_keywords(text: str, dictionary: List[str]) -> List[str]:
    found = []
    text_lower = text.lower()
    for word in dictionary:
        pattern = r'\b' + re.escape(word) + r'\b'
        if "++" in word or "." in word:
            pattern = re.escape(word)
        if re.search(pattern, text_lower):
            found.append(word.title() if word not in ["dsa", "oop", "dbms", "sql", "nosql", "aws", "gcp", "api", "apis", "star"] else word.upper())
    return list(set(found))

def extract_responsibilities(jd_text: str) -> List[str]:
    responsibilities = []
    sentences = re.split(r'[\n.·•*-]', jd_text)
    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        words = sent.lower().split()
        if any(verb in words for verb in ACTION_VERBS):
            clean_sent = re.sub(r'^\s*[\-\*•·]\s*', '', sent)
            if len(clean_sent) > 20 and len(clean_sent) < 150:
                responsibilities.append(clean_sent)
                
    if not responsibilities:
        responsibilities = [
            "Design and build scalable frontend components and backend services.",
            "Write clean, documented, and fully unit-tested code.",
            "Collaborate in cross-functional agile squads to implement target designs.",
            "Optimize application database queries to maintain low-latency responses."
        ]
    return list(set(responsibilities))[:4]

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
    
    # 1. Attempt Groq AI analysis if available
    api_key = os.environ.get("GROQ_API_KEY")
    if HAS_GROQ and api_key:
        try:
            client = Groq(api_key=api_key)
            prompt = (
                "Analyze the following Job Description (JD). Extract the required key skills, target technologies, and core responsibilities.\n"
                "Return ONLY a valid JSON object matching this schema. Do not write any markdown blocks (like ```json), introduction, or conversational filler.\n\n"
                "{\n"
                "  \"skills\": [\"skill1\", \"skill2\"],\n"
                "  \"technologies\": [\"tech1\", \"tech2\"],\n"
                "  \"responsibilities\": [\"responsibility1\", \"responsibility2\"]\n"
                "}\n\n"
                f"Job Description:\n{jd_text}"
            )
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            content = completion.choices[0].message.content.strip()
            # Clean markdown code blocks if the LLM wraps them anyway
            if content.startswith("```"):
                content = re.sub(r'^```[a-zA-Z]*\n|```$', '', content, flags=re.MULTILINE).strip()
            data = json.loads(content)
            return {
                "skills": data.get("skills", []),
                "technologies": data.get("technologies", []),
                "responsibilities": data.get("responsibilities", [])
            }
        except Exception as e:
            print("Groq API analyze_jd call failed, falling back to keyword scanner:", e)

    # 2. Local Fallback
    skills = parse_keywords(jd_text, SKILLS_DICT)
    technologies = parse_keywords(jd_text, TECH_DICT)
    responsibilities = extract_responsibilities(jd_text)
    
    if not skills:
        skills = ["DSA", "OOP", "DBMS"]
    if not technologies:
        technologies = ["React", "Node.js", "SQL"]
        
    return {
        "skills": skills,
        "technologies": technologies,
        "responsibilities": responsibilities
    }

@app.post("/compare", response_model=CompareOutput)
def compare_resume_jd(payload: CompareInput):
    resume_text = payload.resume
    jd_text = payload.jd
    
    # 1. Attempt Groq AI comparison if available
    api_key = os.environ.get("GROQ_API_KEY")
    if HAS_GROQ and api_key:
        try:
            client = Groq(api_key=api_key)
            prompt = (
                "You are an expert ATS (Applicant Tracking System) recruiter. Compare the following Resume text against the Job Description (JD).\n"
                "1. Calculate a match score between 0 and 100 representing how well the resume matches the JD's requirements.\n"
                "2. List the missing key skills/technologies that are required by the JD but missing from the resume.\n"
                "3. List 3 specific actionable improvement suggestions for the candidate's resume (e.g. \"Add a project using React\", \"Include metrics on database performance\").\n"
                "Return ONLY a valid JSON object matching this schema. Do not write any markdown blocks (like ```json), introduction, or conversational filler.\n\n"
                "{\n"
                "  \"score\": 85,\n"
                "  \"missing_skills\": [\"Docker\", \"Kubernetes\"],\n"
                "  \"suggested_improvements\": [\"Add a project showing Docker containers\", \"Quantify React experience\"]\n"
                "}\n\n"
                f"Resume:\n{resume_text}\n\n"
                f"Job Description:\n{jd_text}"
            )
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            content = completion.choices[0].message.content.strip()
            if content.startswith("```"):
                content = re.sub(r'^```[a-zA-Z]*\n|```$', '', content, flags=re.MULTILINE).strip()
            data = json.loads(content)
            return {
                "score": int(data.get("score", 50)),
                "missing_skills": data.get("missing_skills", []),
                "suggested_improvements": data.get("suggested_improvements", [])
            }
        except Exception as e:
            print("Groq API comparison failed, falling back to local matching:", e)

    # 2. Local Fallback
    target_skills = parse_keywords(jd_text, SKILLS_DICT)
    target_techs = parse_keywords(jd_text, TECH_DICT)
    all_requirements = list(set(target_skills + target_techs))
    
    if not all_requirements:
        all_requirements = ["DSA", "React", "Node.js", "SQL"]
        
    matched_requirements = []
    missing_requirements = []
    resume_lower = resume_text.lower()
    
    for req in all_requirements:
        req_lower = req.lower()
        pattern = r'\b' + re.escape(req_lower) + r'\b'
        if "++" in req_lower or "." in req_lower:
            pattern = re.escape(req_lower)
            
        if re.search(pattern, resume_lower):
            matched_requirements.append(req)
        else:
            missing_requirements.append(req)
            
    total_count = len(all_requirements)
    match_count = len(matched_requirements)
    
    ratio = match_count / total_count if total_count > 0 else 1.0
    score = int(40 + (ratio * 55))
    
    suggestions = []
    for missing in missing_requirements:
        suggestions.append(f"Add a project demonstrating experience with {missing}.")
        
    if not suggestions:
        suggestions = ["Resume matches all core skills. Consider quantifying performance metrics (e.g. improved speed by 30%)."]
    else:
        suggestions.append("Quantify accomplishments with numbers to highlight business impact.")
        
    return {
        "score": score,
        "missing_skills": missing_requirements,
        "suggested_improvements": suggestions[:3]
    }
