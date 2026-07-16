import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-pro-latest")
    response = model.generate_content("Say hello")
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
