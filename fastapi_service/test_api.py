import urllib.request
import urllib.parse
import json
import time
import sys

def test_endpoints():
    url_base = 'http://127.0.0.1:8000'
    
    # 1. Test Root
    try:
        req = urllib.request.Request(f"{url_base}/")
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print("Root response:", data)
    except Exception as e:
        print("Root test failed:", e)
        sys.exit(1)
        
    # 2. Test Analyze JD
    jd_payload = {
        "jd": "We are looking for a Software Engineer with strong DSA skills, experience building React frontends and Node.js REST APIs. Experience with Docker and SQL databases is required."
    }
    try:
        req = urllib.request.Request(
            f"{url_base}/analyze_jd",
            data=json.dumps(jd_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print("\nAnalyze JD response:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print("Analyze JD test failed:", e)
        sys.exit(1)
        
    # 3. Test Compare Resume & JD
    compare_payload = {
        "resume": "Sneha Sharma. Full Stack Developer. Experience with React, Node.js, and SQL. Completed projects in database optimizations.",
        "jd": "We are looking for a Software Engineer with strong DSA skills, experience building React frontends and Node.js REST APIs. Experience with Docker and SQL databases is required."
    }
    try:
        req = urllib.request.Request(
            f"{url_base}/compare",
            data=json.dumps(compare_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print("\nCompare Resume & JD response:")
            print(json.dumps(data, indent=2))
    except Exception as e:
        print("Compare test failed:", e)
        sys.exit(1)

if __name__ == '__main__':
    print("Starting tests against FastAPI service...")
    test_endpoints()
