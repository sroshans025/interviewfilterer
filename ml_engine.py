import re, json, os
from datetime import datetime

RUNS_FILE = '/tmp/mlops_runs.json' 

def extract_skills(text):
    skills = [
        "python","flask","django","fastapi","sql","postgresql","mysql",
        "mongodb","docker","kubernetes","aws","gcp","azure","git",
        "javascript","react","node","machine learning","deep learning",
        "nlp","pandas","numpy","scikit-learn","mlflow","airflow","spark"
    ]
    text_lower = text.lower()
    return [s for s in skills if s in text_lower]

def score_resume(resume_text, job_description):
    resume_skills = set(extract_skills(resume_text))
    jd_skills     = set(extract_skills(job_description))
    if not jd_skills:
        return 50
    matched = resume_skills & jd_skills
    score   = int((len(matched) / len(jd_skills)) * 100)
    return min(score, 100)

def get_match_label(score):
    if score >= 75: return "Strong Match"
    if score >= 50: return "Moderate Match"
    return "Weak Match"

def log_run(scores):
    run = {
        "timestamp": datetime.utcnow().isoformat(),
        "model": "keyword-v1",
        "avg_score": round(sum(scores)/len(scores), 2) if scores else 0,
        "count": len(scores)
    }
    try:
        runs = []
        if os.path.exists(RUNS_FILE):
            with open(RUNS_FILE) as f:
                runs = json.load(f)
        runs.append(run)
        with open(RUNS_FILE, 'w') as f:
            json.dump(runs[-50:], f) 
    except:
        pass
    return run
