import os
import tempfile
import uuid
import time
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from ml_engine import MLEngine, ResumeParser, RunTracker

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = "resume-filter-mlops-secret-key-1337"
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Initialize our ML pipeline engines and run tracker
# These represent the core scoring and tracking layers of our MLOps system.
ml_engine = MLEngine()
resume_parser = ResumeParser()
run_tracker = RunTracker()

# Pre-populate MLOps runs log with some mock historical runs to demonstrate drift and tracking
if not run_tracker.runs:
    mock_runs = [
        {
            "run_id": "run_1718010000",
            "timestamp": "2026-06-12 10:15:30",
            "model_name": "sentence-transformers/all-MiniLM-L6-v2",
            "version_tag": "v1.2.0",
            "batch_size": 5,
            "avg_score": 73.4,
            "baseline_score": 72.0,
            "drift_deviation_pct": 1.9,
            "drift_detected": False,
            "latency_avg_ms": 140,
            "total_tokens": 12400,
            "candidates": []
        },
        {
            "run_id": "run_1718110000",
            "timestamp": "2026-06-13 14:22:10",
            "model_name": "sentence-transformers/all-MiniLM-L6-v2",
            "version_tag": "v1.2.0",
            "batch_size": 8,
            "avg_score": 74.1,
            "baseline_score": 72.0,
            "drift_deviation_pct": 2.9,
            "drift_detected": False,
            "latency_avg_ms": 135,
            "total_tokens": 19800,
            "candidates": []
        },
        {
            "run_id": "run_1718210000",
            "timestamp": "2026-06-14 09:05:45",
            "model_name": "sentence-transformers/all-MiniLM-L6-v2",
            "version_tag": "v1.2.0",
            "batch_size": 4,
            "avg_score": 70.8,
            "baseline_score": 72.0,
            "drift_deviation_pct": 1.7,
            "drift_detected": False,
            "latency_avg_ms": 145,
            "total_tokens": 9800,
            "candidates": []
        },
        {
            "run_id": "run_1718310000",
            "timestamp": "2026-06-15 16:40:22",
            "model_name": "sentence-transformers/all-MiniLM-L6-v2",
            "version_tag": "v1.2.0",
            "batch_size": 12,
            "avg_score": 72.5,
            "baseline_score": 72.0,
            "drift_deviation_pct": 0.7,
            "drift_detected": False,
            "latency_avg_ms": 128,
            "total_tokens": 28400,
            "candidates": []
        }
    ]
    run_tracker.runs.extend(mock_runs)
    run_tracker.save_logs()


@app.route("/")
def index():
    """Serve the primary Single Page Application UI."""
    return render_template("index.html")


@app.route("/api/process", methods=["POST"])
def process_resumes():
    """
    Core MLOps API Endpoint: Accepts bulk resumes (PDF/DOCX/TXT), parses them, 
    computes semantic similarity scores against the Job Description, performs
    skill gap analysis, logs inference metadata, and checks for model drift.
    """
    try:
        jd_text = request.form.get("jd", "").strip()
        must_have_raw = request.form.get("must_have_skills", "")
        nice_to_have_raw = request.form.get("nice_to_have_skills", "")
        model_version = request.form.get("model_version", "model_a")
        api_key = request.form.get("api_key", "").strip()
        env = request.form.get("env", "dev") # Dev / Staging / Prod config
        
        # MLOps Hook: Parse manual tags
        must_have_skills = [s.strip().lower() for s in must_have_raw.split(",") if s.strip()]
        nice_to_have_skills = [s.strip().lower() for s in nice_to_have_raw.split(",") if s.strip()]

        if not jd_text:
            return jsonify({"error": "Job Description is required."}), 400

        files = request.files.getlist("resumes")
        if not files or files[0].filename == "":
            return jsonify({"error": "At least one resume file must be uploaded."}), 400

        # Enforce bulk upload limits (1 to 100 files)
        if len(files) > 100:
            return jsonify({"error": "Bulk upload is restricted to maximum 100 resumes per session."}), 400

        candidates_data = []
        
        for file in files:
            orig_filename = secure_filename(file.filename)
            file_ext = os.path.splitext(orig_filename)[1]
            
            if file_ext.lower() not in [".pdf", ".docx", ".doc", ".txt"]:
                # File validation logging
                print(f"Skipping unsupported file: {orig_filename}")
                continue
            
            # Save to temporary workspace folder (acts as local S3 file storage)
            temp_id = str(uuid.uuid4())
            saved_filename = f"{temp_id}_{orig_filename}"
            saved_path = os.path.join(app.config["UPLOAD_FOLDER"], saved_filename)
            file.save(saved_path)
            
            # 1. Parse File Content
            raw_text = resume_parser.parse_file(saved_path, file_ext)
            
            if not raw_text.strip():
                # Invalid or empty resume
                print(f"Empty content parsed from: {orig_filename}")
                os.remove(saved_path)
                continue
                
            # 2. Extract Candidate Details (Name, Email, Skills, Experience)
            # MLOps Hook: Utilizes Claude API if key is provided, falls back to local regex extraction
            candidate_info = resume_parser.extract_info(raw_text, jd_text, api_key)
            
            # 3. Compute Semantic Similarity Score
            # MLOps Hook: Computes embeddings, logs latency, tokens, and switches between A/B model versions
            inference_result = ml_engine.compute_similarity(raw_text, jd_text, model_version)
            
            # 4. Perform Manual Skills Gap Analysis (Must-have vs Nice-to-have alignment)
            # This aligns parsed candidate skills against recruiter-defined constraints
            candidate_skills_lower = [s.lower() for s in candidate_info.get("skills", [])]
            
            m_matched = [s for s in must_have_skills if s in candidate_skills_lower]
            m_missing = [s for s in must_have_skills if s not in candidate_skills_lower]
            n_matched = [s for s in nice_to_have_skills if s in candidate_skills_lower]
            n_missing = [s for s in nice_to_have_skills if s not in candidate_skills_lower]
            
            # Recalculate match classification
            score = inference_result["score"]
            if score >= 80:
                classification = "Strong Match"
            elif score >= 55:
                classification = "Moderate"
            else:
                classification = "Weak"
                
            # Compile parsed details
            candidate_entry = {
                "id": temp_id,
                "name": candidate_info["name"],
                "email": candidate_info["email"],
                "phone": candidate_info["phone"],
                "skills": candidate_info["skills"],
                "experience_years": candidate_info["experience_years"],
                "education": candidate_info["education"],
                "location": candidate_info["location"],
                "summary": candidate_info["summary"],
                "sections": candidate_info.get("sections", {}),
                "score": score,
                "classification": classification,
                "gap_analysis": {
                    "must_have_matched": m_matched,
                    "must_have_missing": m_missing,
                    "nice_to_have_matched": n_matched,
                    "nice_to_have_missing": n_missing
                },
                "recommendation": "Proceed" if classification == "Strong Match" else ("Hold" if classification == "Moderate" else "Reject"),
                "file_path": saved_filename,
                "latency_ms": inference_result["latency_ms"],
                "token_count": inference_result["token_count"],
                "confidence": inference_result["confidence"],
                "model_name": inference_result["model_name"],
                "version_tag": inference_result["version_tag"],
                "raw_text": raw_text
            }
            
            candidates_data.append(candidate_entry)

        if not candidates_data:
            return jsonify({"error": "No valid text could be extracted from uploaded files."}), 400

        # 5. MLOps Logging Hook: Record batch run info and compute score drift
        run_entry = run_tracker.log_run(
            model_name=candidates_data[0]["model_name"],
            version_tag=candidates_data[0]["version_tag"],
            candidates_scores=candidates_data,
            batch_size=len(candidates_data)
        )

        return jsonify({
            "candidates": candidates_data,
            "run_summary": run_entry,
            "drift_detected": run_entry["drift_detected"] if run_entry else False
        })

    except Exception as e:
        print(f"Error processing pipeline: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal pipeline error: {str(e)}"}), 500


@app.route("/api/logs", methods=["GET"])
def get_logs():
    """MLOps Endpoint: Returns run history and drift baseline details."""
    return jsonify({
        "baseline_score": run_tracker.baseline_score,
        "runs": run_tracker.runs
    })


@app.route("/api/retrain", methods=["POST"])
def retrain_model():
    """
    MLOps Hook: Simulates a model retraining trigger. 
    Resets/Calibrates historical baseline to current average batch performance,
    resolving active drift warnings.
    """
    try:
        retrain_result = run_tracker.retrain_model()
        return jsonify(retrain_result)
    except Exception as e:
        return jsonify({"error": f"Retraining pipeline failed: {str(e)}"}), 500


@app.route("/api/webhook", methods=["POST"])
def ats_webhook():
    """Simulated ATS Webhook Endpoint for recruiters to push candidate profile payloads."""
    payload = request.json
    print(f"ATS Webhook Triggered with payload: {payload}")
    return jsonify({
        "status": "success",
        "message": f"Candidate {payload.get('name', 'N/A')} successfully dispatched to ATS database.",
        "received_at": time.strftime("%Y-%m-%d %H:%M:%S")
    })


@app.route("/api/settings", methods=["POST"])
def save_settings():
    """Recruiter/developer configurations API (A/B settings, Webhooks)."""
    data = request.json
    # Just return configurations successfully
    return jsonify({
        "status": "success",
        "settings": data
    })


if __name__ == "__main__":
    print("ApexFilter AI MLOps Server starting on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
