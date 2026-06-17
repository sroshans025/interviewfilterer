from flask import Flask, request, jsonify, render_template
from ml_engine import score_resume, get_match_label, log_run
import os, pypdf, docx

app = Flask(__name__)

# ✅ Fix 1: Use /tmp — only writable folder on Vercel
UPLOAD_FOLDER = '/tmp'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/score', methods=['POST'])
def score():
    try:
        files = request.files.getlist('resumes')
        jd    = request.form.get('job_description', '')
        results = []

        for f in files:
            path = os.path.join('/tmp', f.filename)
            f.save(path)

            # Extract text
            text = ''
            if f.filename.endswith('.pdf'):
                reader = pypdf.PdfReader(path)
                text = ' '.join(p.extract_text() or '' for p in reader.pages)
            elif f.filename.endswith('.docx'):
                doc  = docx.Document(path)
                text = ' '.join(p.text for p in doc.paragraphs)

            score_val = score_resume(text, jd)
            results.append({
                'filename': f.filename,
                'score':    score_val,
                'label':    get_match_label(score_val)
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        run_log = log_run([r['score'] for r in results])

        return jsonify({'results': results, 'run_log': run_log})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ✅ Fix 2: NO app.run() — Vercel calls 'app' directly
