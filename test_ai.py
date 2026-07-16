import requests

url = "http://127.0.0.1:8000/analyze_jd"
payload = {
    "jd": "We are looking for a Software Engineer with 3+ years of experience in React, Node.js, and SQL. You will design, build, and maintain scalable web applications."
}

try:
    response = requests.post(url, json=payload)
    print("AI API Status Code:", response.status_code)
    print("AI API Response:", response.json())
except Exception as e:
    print("Failed to reach AI API:", e)
