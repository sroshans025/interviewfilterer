const { useState, useEffect, useMemo, useCallback, useRef } = React;

// Native IndexedDB Implementation for Session/Recruiter State persistence
const DB_NAME = "ApexFilterDB";
const STORE_NAME = "candidate_states";

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

const getCandidateState = async (id) => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error("IndexedDB error:", err);
    return null;
  }
};

const saveCandidateState = async (id, state) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.put({ id, ...state });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.error("IndexedDB error:", err);
  }
};

// SVG Icon Component helper for premium aesthetics without icon pack dependency weight
const Icon = ({ name, className = "w-5 h-5", size = 20 }) => {
  const icons = {
    dashboard: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ),
    mlops: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    upload: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    settings: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    trash: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    user: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    alert: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    chevronRight: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    ),
    chevronDown: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    ),
    close: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
      </svg>
    ),
    search: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    export: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    lightning: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    anonymize: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
      </svg>
    ),
    eye: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    link: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  };
  return icons[name] || icons.user;
};

// Toast Notifications Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm max-w-sm pointer-events-auto transition-all duration-300 transform translate-y-0 ${
            t.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
              : t.type === "error"
              ? "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
              : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300"
          }`}
        >
          <Icon name={t.type === "success" ? "check" : t.type === "error" ? "alert" : "mlops"} className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{t.message}</div>
          <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Primary App Component
function App() {
  // Navigation & General UI states
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard / mlops / settings
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [anonymizedMode, setAnonymizedMode] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(() => localStorage.getItem("gdprAccepted") === "true");
  const [toasts, setToasts] = useState([]);

  // Job Description Input States
  const [jdText, setJdText] = useState("");
  const [mustHaveSkills, setMustHaveSkills] = useState("Python, Machine Learning, PyTorch");
  const [niceHaveSkills, setNiceHaveSkills] = useState("Docker, AWS, FastAPI, CI/CD");

  // Scoring engine preferences
  const [modelChoice, setModelChoice] = useState("model_a"); // model_a (MiniLM) vs model_b (Paraphrase)
  const [environment, setEnvironment] = useState("dev"); // dev / staging / prod
  const [anthropicApiKey, setAnthropicApiKey] = useState(() => localStorage.getItem("claude_api_key") || "");
  const [atsEndpoint, setAtsEndpoint] = useState("https://api.my-ats.com/v1/candidates");

  // Pipeline execution & data state
  const [resumesQueue, setResumesQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateNotes, setCandidateNotes] = useState("");
  const [candidateDecision, setCandidateDecision] = useState("Proceed"); // Proceed / Hold / Reject
  const [activeDrawerTab, setActiveDrawerTab] = useState("summary"); // summary / gap / preview / email

  // MLOps runs history
  const [mlopsRuns, setMlopsRuns] = useState([]);
  const [baselineScore, setBaselineScore] = useState(72.0);
  const [isRetraining, setIsRetraining] = useState(false);

  // Filters State
  const [filterSearch, setFilterSearch] = useState("");
  const [filterMinScore, setFilterMinScore] = useState(0);
  const [filterMinExp, setFilterMinExp] = useState(0);
  const [filterEducation, setFilterEducation] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");
  const [sortField, setSortField] = useState("score");
  const [sortAsc, setSortAsc] = useState(false);

  // Add toast helper
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Dark Mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Load MLOps Logs on startup
  const fetchMlopsLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setMlopsRuns(data.runs || []);
        setBaselineScore(data.baseline_score || 72.0);
      }
    } catch (err) {
      console.error("Failed to load run logs:", err);
    }
  };

  useEffect(() => {
    fetchMlopsLogs();
  }, []);

  // Sync Anthropic API key to localstorage
  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setAnthropicApiKey(key);
    localStorage.setItem("claude_api_key", key);
  };

  // File drag & drop handlers
  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFilesToQueue(files);
  };

  const addFilesToQueue = (files) => {
    const validFiles = files.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'docx', 'doc', 'txt'].includes(ext);
    });

    if (validFiles.length === 0) {
      addToast("Please upload PDF, DOCX or TXT files only.", "error");
      return;
    }

    const formattedFiles = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      status: "ready", // ready / processing / success / error
      progress: 0
    }));

    setResumesQueue(prev => {
      const combined = [...prev, ...formattedFiles];
      if (combined.length > 100) {
        addToast("Bulk queue capped at 100 files max.", "error");
        return prev;
      }
      return combined;
    });
  };

  const removeFileFromQueue = (id) => {
    setResumesQueue(prev => prev.filter(f => f.id !== id));
  };

  // Start processing files
  const runScoringPipeline = async () => {
    if (!jdText.trim()) {
      addToast("Please input a Job Description first.", "error");
      return;
    }
    if (resumesQueue.length === 0) {
      addToast("Please upload at least one resume.", "error");
      return;
    }

    setIsProcessing(true);
    addToast("Executing AI scoring and drift evaluation...", "info");

    const formData = new FormData();
    formData.append("jd", jdText);
    formData.append("must_have_skills", mustHaveSkills);
    formData.append("nice_to_have_skills", niceHaveSkills);
    formData.append("model_version", modelChoice);
    formData.append("api_key", anthropicApiKey);
    formData.append("env", environment);

    resumesQueue.forEach(item => {
      formData.append("resumes", item.file);
    });

    try {
      // Simulate progress bar movement
      setResumesQueue(prev => prev.map(f => ({ ...f, status: "processing", progress: 40 })));

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to process resumes.");
      }

      const data = await response.json();
      
      // Update IndexedDB notes for each parsed candidate
      const parsedCandidates = data.candidates || [];
      for (let cand of parsedCandidates) {
        const savedState = await getCandidateState(cand.id);
        if (savedState) {
          cand.recruiter_notes = savedState.recruiter_notes || "";
          cand.recommendation = savedState.recommendation || cand.recommendation;
        } else {
          cand.recruiter_notes = "";
          // Write defaults
          await saveCandidateState(cand.id, {
            recruiter_notes: "",
            recommendation: cand.recommendation
          });
        }
      }

      setCandidates(parsedCandidates);
      setResumesQueue([]); // clear queue on success
      setIsProcessing(false);
      addToast(`Scored ${parsedCandidates.length} resumes successfully!`, "success");
      
      // Trigger update of runs log
      fetchMlopsLogs();

      // Alert drift trigger
      if (data.drift_detected) {
        addToast("Model Drift detected! Batch score deviates > 15% from baseline.", "error");
      }

    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setResumesQueue(prev => prev.map(f => ({ ...f, status: "error", progress: 0 })));
      addToast(err.message || "Scoring pipeline error.", "error");
    }
  };

  // Drawer interactions: opening candidate profile drawer
  const openCandidateDrawer = async (candidate) => {
    setSelectedCandidate(candidate);
    const savedState = await getCandidateState(candidate.id);
    if (savedState) {
      setCandidateNotes(savedState.recruiter_notes || "");
      setCandidateDecision(savedState.recommendation || candidate.recommendation);
    } else {
      setCandidateNotes("");
      setCandidateDecision(candidate.recommendation);
    }
    setActiveDrawerTab("summary");
  };

  const saveNotesAndDecision = async () => {
    if (!selectedCandidate) return;
    
    const updatedState = {
      recruiter_notes: candidateNotes,
      recommendation: candidateDecision
    };
    
    await saveCandidateState(selectedCandidate.id, updatedState);
    
    setCandidates(prev => prev.map(c => {
      if (c.id === selectedCandidate.id) {
        return {
          ...c,
          recruiter_notes: candidateNotes,
          recommendation: candidateDecision
        };
      }
      return c;
    }));
    
    setSelectedCandidate(prev => ({
      ...prev,
      recruiter_notes: candidateNotes,
      recommendation: candidateDecision
    }));

    addToast("Candidate recommendation updated in IndexedDB.", "success");
  };

  // Simulated Webhook Dispatch
  const dispatchToATS = async () => {
    if (!selectedCandidate) return;
    
    try {
      addToast("Dispatching profile payload to ATS endpoint...", "info");
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          name: anonymizedMode ? "Anonymized Candidate" : selectedCandidate.name,
          email: anonymizedMode ? "hidden@anonymized.com" : selectedCandidate.email,
          score: selectedCandidate.score,
          recommendation: selectedCandidate.recommendation,
          notes: selectedCandidate.recruiter_notes
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        addToast(result.message || "Successfully integrated with ATS!", "success");
      } else {
        throw new Error("ATS Webhook rejected dispatch.");
      }
    } catch (err) {
      addToast(err.message || "Failed to push to ATS.", "error");
    }
  };

  // Simulating retraining execution (MLOps requirement)
  const triggerRetraining = async () => {
    setIsRetraining(true);
    addToast("Commencing GPU model retraining simulation...", "info");
    
    try {
      const res = await fetch("/api/retrain", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBaselineScore(data.new_baseline);
        addToast(data.message, "success");
        fetchMlopsLogs();
      }
    } catch (err) {
      addToast("Retraining pipeline failure.", "error");
    } finally {
      setIsRetraining(false);
    }
  };

  // Text highlight matching keywords helper
  const highlightText = (text, keywords) => {
    if (!text) return "";
    let cleanText = text;
    
    // Sort keywords by length descending to prevent substring issues
    const allKeywords = [...mustHaveSkills.split(","), ...niceHaveSkills.split(",")].map(k => k.trim()).filter(Boolean);
    const sortedKws = allKeywords.sort((a, b) => b.length - a.length);

    let html = cleanText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    sortedKws.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, "gi");
      const isMustHave = mustHaveSkills.toLowerCase().includes(kw.toLowerCase());
      const highlightClass = isMustHave 
        ? "bg-emerald-200/80 dark:bg-emerald-950/80 border-b border-emerald-500 text-emerald-950 dark:text-emerald-200"
        : "bg-purple-200/80 dark:bg-purple-950/80 border-b border-purple-500 text-purple-950 dark:text-purple-200";
        
      html = html.replace(regex, `<span class="px-1 rounded-sm ${highlightClass}">$1</span>`);
    });
    
    return <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Dynamic Email template generator
  const getEmailTemplate = () => {
    if (!selectedCandidate) return "";
    const name = anonymizedMode ? "Candidate" : selectedCandidate.name;
    const skills = selectedCandidate.skills.slice(0, 3).join(", ");
    
    if (candidateDecision === "Proceed") {
      return `Subject: Interview Invitation - ApexFilter Technical Selection Team\n\nDear ${name},\n\nThank you for applying to our position. Our AI/ML assessment platform evaluated your resume and highlighted your strong background in ${skills}.\n\nWe would love to schedule a 30-minute technical interview to discuss your experience in detail. Please let us know your availability over the next few days.\n\nBest regards,\nRecruitment Team`;
    } else if (candidateDecision === "Hold") {
      return `Subject: Application Update - Talent Pool Placement\n\nDear ${name},\n\nThank you for your application. We reviewed your credentials against the role. While we are currently moving forward with other applicants who align slightly closer with immediate must-have technologies, we are extremely impressed by your profile.\n\nWe would like to retain your resume in our talent pool and contact you if matching roles open up.\n\nBest regards,\nRecruitment Team`;
    } else {
      return `Subject: Application Status Update\n\nDear ${name},\n\nThank you for your interest in joining our team. After careful consideration of your application details, we have decided to pursue other candidates whose skill matches closer align with the qualifications requested at this time.\n\nWe wish you the absolute best in your career pursuits.\n\nBest regards,\nRecruitment Team`;
    }
  };

  // Export utilities using SheetJS and PapaParse
  const exportToCSV = () => {
    const dataToExport = filteredCandidates.map((c, idx) => ({
      Rank: idx + 1,
      Name: anonymizedMode ? `Candidate #${c.id.substring(0, 4)}` : c.name,
      Score: c.score,
      Classification: c.classification,
      Experience_Years: c.experience_years,
      Education: c.education,
      Location: c.location,
      Decision: c.recommendation,
      Skills: c.skills.join(", ")
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `apexfilter_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exported filtered candidates to CSV.", "success");
  };

  const exportToExcel = () => {
    const dataToExport = filteredCandidates.map((c, idx) => ({
      Rank: idx + 1,
      Name: anonymizedMode ? `Candidate #${c.id.substring(0, 4)}` : c.name,
      Score: c.score,
      Classification: c.classification,
      Experience_Years: c.experience_years,
      Education: c.education,
      Location: c.location,
      Decision: c.recommendation,
      Skills: c.skills.join(", ")
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");
    
    // Buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `apexfilter_export_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exported filtered candidates to Excel.", "success");
  };

  // Filters logic
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(c => {
        const searchString = `${c.name} ${c.skills.join(" ")} ${c.education} ${c.location}`.toLowerCase();
        const matchesSearch = searchString.includes(filterSearch.toLowerCase());
        const matchesScore = c.score >= filterMinScore;
        const matchesExp = c.experience_years >= filterMinExp;
        const matchesEdu = filterEducation === "All" || c.education.includes(filterEducation);
        const matchesLoc = filterLocation === "All" || c.location.toLowerCase().includes(filterLocation.toLowerCase());
        
        return matchesSearch && matchesScore && matchesExp && matchesEdu && matchesLoc;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        if (typeof valA === "string") {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [candidates, filterSearch, filterMinScore, filterMinExp, filterEducation, filterLocation, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    if (candidates.length === 0) return { total: 0, avgScore: 0, strongCount: 0, moderateCount: 0, weakCount: 0, driftState: false };
    
    const total = candidates.length;
    const avgScore = Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / total);
    const strongCount = candidates.filter(c => c.classification === "Strong Match").length;
    const moderateCount = candidates.filter(c => c.classification === "Moderate").length;
    const weakCount = candidates.filter(c => c.classification === "Weak").length;
    
    // Drift calculation: batch deviation vs MLOps baseline
    const driftDeviation = Math.abs(avgScore - baselineScore) / baselineScore;
    const driftState = driftDeviation > 0.15;

    return { total, avgScore, strongCount, moderateCount, weakCount, driftState, deviation: Math.round(driftDeviation * 100) };
  }, [candidates, baselineScore]);

  // Prepopulate standard job descriptions to facilitate quick testing
  const setSampleJD = (type) => {
    if (type === "ml_engineer") {
      setJdText(`Role: Senior Machine Learning Engineer\nExperience: 5+ years\n\nMust-have skills: Python, PyTorch, Machine Learning, Docker, SQL, Deep Learning\n\nNice-to-have: Kubernetes, AWS, FastAPI, CI/CD, Git, HuggingFace Transformers\n\nEducation: Master's or PhD in Computer Science or quantitative field.\n\nResponsibilities:\n- Design, train and evaluate deep neural networks for computer vision and NLP.\n- Build robust ML serving inference pipelines containerized using Docker.\n- Track experimental metrics using MLflow and run pipeline testing.`);
      setMustHaveSkills("Python, PyTorch, Machine Learning, Deep Learning, SQL, Docker");
      setNiceHaveSkills("Kubernetes, AWS, FastAPI, CI/CD, Git, NLP");
    } else if (type === "frontend_react") {
      setJdText(`Role: Frontend Engineer (React)\nExperience: 3+ years\n\nMust-have: JavaScript, React, Tailwind CSS, TypeScript, HTML, CSS\n\nNice-to-have: Redux, GraphQL, Node.js, Next.js, Figma, Git\n\nResponsibilities:\n- Construct pixel-perfect responsive web application layouts using React.\n- Refactor and maintain states using Redux and modular UI components.\n- Integrate backend APIs and optimize page rendering times.`);
      setMustHaveSkills("JavaScript, React, Tailwind, HTML, CSS, TypeScript");
      setNiceHaveSkills("Redux, GraphQL, Node.js, Next.js, Figma, Git");
    }
    addToast("Sample job description loaded.", "info");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Main Top Header Navbar */}
      <header className="flex-shrink-0 px-6 py-4 glass-panel border-b flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg text-white font-extrabold text-xl tracking-wider">
            I
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
              InterviewFilterer
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Resume Filtering Basic Web Page
            </p>
          </div>
        </div>

        {/* Global Toolbar Control buttons */}
        <div className="flex items-center gap-4">
          {/* Anonymized Mode toggle */}
          <button
            onClick={() => {
              setAnonymizedMode(!anonymizedMode);
              addToast(anonymizedMode ? "Anonymized mode disabled." : "Anonymized mode enabled - PII masked.", "info");
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              anonymizedMode
                ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 text-purple-700 dark:text-purple-300"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
            title="Toggles masking candidates' name, phone, and email to eliminate bias."
          >
            <Icon name={anonymizedMode ? "anonymize" : "eye"} className="w-3.5 h-3.5" />
            <span>{anonymizedMode ? "Anonymized On" : "Anonymize PII"}</span>
          </button>

          {/* Light/Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828 9.9a5 5 0 1110 0 5 5 0 01-10 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab Contents Frame */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Column: Job Description Editor & manual constraints */}
              <section className="w-full md:w-[380px] flex-shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>Job Description</span>
                    </h2>
                    
                    {/* Auto-Extract presets dropdown */}
                    <div className="relative group">
                      <button className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                        Presets <Icon name="chevronDown" className="w-3 h-3" />
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-950 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 hidden group-hover:block z-20">
                        <button onClick={() => setSampleJD("ml_engineer")} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900">
                          Senior ML Engineer
                        </button>
                        <button onClick={() => setSampleJD("frontend_react")} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900">
                          Frontend React Developer
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                    Paste the target JD below to run embeddings scoring.
                  </p>
                  
                  {/* Rich JD Text area */}
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Enter Job Description requirements here..."
                    className="w-full h-48 p-3 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans resize-none"
                  />
                </div>

                {/* Must-have vs Nice-to-have skill tagging fields */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Must-Have Skills
                    </label>
                    <input
                      type="text"
                      value={mustHaveSkills}
                      onChange={(e) => setMustHaveSkills(e.target.value)}
                      placeholder="e.g. Python, SQL (comma-separated)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Nice-to-Have Skills
                    </label>
                    <input
                      type="text"
                      value={niceHaveSkills}
                      onChange={(e) => setNiceHaveSkills(e.target.value)}
                      placeholder="e.g. Docker, Kubernetes (comma-separated)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Embedding model information */}
                  <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Model</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-mono font-bold">
                        v1.2.0
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Using <code className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">all-MiniLM-L6-v2</code> for semantic matching scoring.
                    </p>
                  </div>
                </div>
              </section>

              {/* Right Column: Dashboard Statistics, Resume Uploads, and Filterable Table */}
              <section className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
                
                {/* KPI Metrics Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Total Scored</span>
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{stats.total}</span>
                    <span className="text-[10px] text-slate-400 mt-1">resumes in active workspace</span>
                  </div>

                  <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Average Match Score</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{stats.avgScore}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">semantic matching average</span>
                  </div>

                  {/* SVG-based mini Donut Chart for Match Distribution */}
                  <div className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-2">
                    <div className="flex flex-col justify-between h-full">
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Match Distribution</span>
                      <div className="flex flex-col gap-0.5 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Strong ({stats.strongCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Moderate ({stats.moderateCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Weak ({stats.weakCount})</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Render elegant native SVG donut */}
                    <div className="w-16 h-16 flex-shrink-0 relative flex items-center justify-center">
                      <svg width="60" height="60" viewBox="0 0 36 36" className="transform -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                        
                        {/* Calculate circumferences */}
                        {(() => {
                          const total = stats.total || 1;
                          const sPct = (stats.strongCount / total) * 100;
                          const mPct = (stats.moderateCount / total) * 100;
                          const wPct = (stats.weakCount / total) * 100;
                          
                          let offset = 0;
                          return (
                            <React.Fragment>
                              {sPct > 0 && (
                                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.2" strokeDasharray={`${sPct} ${100 - sPct}`} strokeDashoffset={offset} />
                              )}
                              {(() => { offset -= sPct; return null; })()}
                              {mPct > 0 && (
                                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.2" strokeDasharray={`${mPct} ${100 - mPct}`} strokeDashoffset={offset} />
                              )}
                              {(() => { offset -= mPct; return null; })()}
                              {wPct > 0 && (
                                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="4.2" strokeDasharray={`${wPct} ${100 - wPct}`} strokeDashoffset={offset} />
                              )}
                            </React.Fragment>
                          );
                        })()}
                      </svg>
                      <span className="absolute text-[10px] font-extrabold text-slate-500">{stats.total}</span>
                    </div>
                  </div>
                </div>

                {/* Bulk Resume Drag & Drop Upload Module */}
                <div className="glass-panel p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 transition-all flex flex-col items-center justify-center min-h-[140px] text-center relative">
                  <input
                    type="file"
                    multiple
                    onChange={onFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="h-12 w-12 rounded-full bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center mb-3">
                    <Icon name="upload" className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    Bulk Upload Resumes (PDF, DOCX, TXT)
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Drag and drop up to 100 resume files or click to select files.
                  </p>
                </div>

                {/* Upload Queue Progress display */}
                {resumesQueue.length > 0 && (
                  <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Upload & Processing Queue ({resumesQueue.length} files)
                      </h4>
                      <button
                        onClick={runScoringPipeline}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isProcessing ? (
                          <React.Fragment>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Processing...</span>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <Icon name="lightning" className="w-3.5 h-3.5" />
                            <span>Run Filtering Pipeline</span>
                          </React.Fragment>
                        )}
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {resumesQueue.map((item) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <i className="fa-regular fa-file-pdf text-rose-500 text-base" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.size}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {item.status === "processing" ? (
                              <div className="w-24 bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-brand-500 h-full animate-shimmer" style={{ width: `${item.progress}%` }} />
                              </div>
                            ) : item.status === "error" ? (
                              <span className="text-rose-500 font-medium">Failed</span>
                            ) : (
                              <span className="text-slate-400 font-medium">Ready</span>
                            )}
                            
                            <button
                              onClick={() => removeFileFromQueue(item.id)}
                              disabled={isProcessing}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Icon name="trash" className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Candidate Dashboard Table and Filter Panel */}
                <div className="glass-panel rounded-2xl flex flex-col overflow-hidden">
                  
                  {/* Table Toolbar Filters */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          placeholder="Search candidates or skills..."
                          className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 w-48 focus:w-60 transition-all text-slate-700 dark:text-slate-300"
                        />
                        <div className="absolute left-3 top-2 text-slate-400">
                          <Icon name="search" className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Score Threshold slider */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-400 font-medium">Score &ge;</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={filterMinScore}
                          onChange={(e) => setFilterMinScore(Number(e.target.value))}
                          className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{filterMinScore}</span>
                      </div>

                      {/* Experience slider */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-400 font-medium">Exp &ge;</span>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          value={filterMinExp}
                          onChange={(e) => setFilterMinExp(Number(e.target.value))}
                          className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{filterMinExp} yr</span>
                      </div>
                    </div>

                    {/* Export and Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportToCSV}
                        disabled={filteredCandidates.length === 0}
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                        title="Export filtered list as CSV"
                      >
                        <Icon name="export" className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>

                      <button
                        onClick={exportToExcel}
                        disabled={filteredCandidates.length === 0}
                        className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                        title="Export filtered list to Excel (XLSX)"
                      >
                        <Icon name="export" className="w-3.5 h-3.5" />
                        <span>Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Candidates Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <th className="py-3 px-4">Rank</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-brand-500" onClick={() => handleSort("name")}>
                            Candidate Name
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-brand-500 text-center" onClick={() => handleSort("score")}>
                            Match Score
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-brand-500" onClick={() => handleSort("experience_years")}>
                            Experience
                          </th>
                          <th className="py-3 px-4">Top Match Skills</th>
                          <th className="py-3 px-4">Education</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4 text-right">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                        {filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                              No candidates parsed or match filters. Run the scoring pipeline.
                            </td>
                          </tr>
                        ) : (
                          filteredCandidates.map((c, idx) => (
                            <tr
                              key={c.id}
                              onClick={() => openCandidateDrawer(c)}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition-colors ${
                                selectedCandidate?.id === c.id ? "bg-brand-50/50 dark:bg-brand-950/20" : ""
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-400">#{idx + 1}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">
                                {anonymizedMode ? `Candidate #${c.id.substring(0, 4)}` : c.name}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded font-mono font-extrabold text-[11px] ${
                                    c.classification === "Strong Match"
                                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                                      : c.classification === "Moderate"
                                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                                  }`}>
                                    {c.score}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                                {c.experience_years} years
                              </td>
                              <td className="py-3.5 px-4 max-w-[180px] truncate" title={c.skills.join(", ")}>
                                <div className="flex gap-1 overflow-hidden">
                                  {c.skills.slice(0, 3).map((s, sIdx) => (
                                    <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500">
                                      {s}
                                    </span>
                                  ))}
                                  {c.skills.length > 3 && (
                                    <span className="text-[10px] text-slate-400">+{c.skills.length - 3}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 truncate max-w-[120px]" title={c.education}>
                                {c.education}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-medium">
                                {c.location}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                                  c.recommendation === "Proceed"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : c.recommendation === "Hold"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                                }`}>
                                  {c.recommendation}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Drawer Layout Side Panel for selected Candidate profile */}
              {selectedCandidate && (
                <div className="fixed inset-y-0 right-0 w-[500px] max-w-full glass-panel-heavy border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col fade-in">
                  
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                          {anonymizedMode ? `Candidate #${selectedCandidate.id.substring(0, 4)}` : selectedCandidate.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                          selectedCandidate.classification === "Strong Match"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : selectedCandidate.classification === "Moderate"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {selectedCandidate.score}% Score
                        </span>
                      </div>
                      
                      {/* Mask PII details if anonymized */}
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex gap-3">
                        <span>{anonymizedMode ? "Email: masked" : selectedCandidate.email}</span>
                        <span>&bull;</span>
                        <span>{anonymizedMode ? "Phone: masked" : selectedCandidate.phone}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Icon name="close" className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Navigation Tabs */}
                  <div className="px-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex text-xs">
                    {["summary", "gap", "preview", "email"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveDrawerTab(tab)}
                        className={`px-4 py-3 font-semibold border-b-2 transition-all capitalize ${
                          activeDrawerTab === tab
                            ? "border-brand-500 text-brand-600 dark:text-brand-400"
                            : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                      >
                        {tab === "gap" ? "Skill Gap" : tab === "preview" ? "Resume Preview" : tab}
                      </button>
                    ))}
                  </div>

                  {/* Drawer Content Area */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {activeDrawerTab === "summary" && (
                      <div className="flex flex-col gap-5">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">AI-Generated Summary</h4>
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                            {selectedCandidate.summary}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">EDUCATION</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedCandidate.education}</span>
                          </div>
                          
                          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">LOCATION</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{selectedCandidate.location}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">ML Inference Metrics</h4>
                          <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 font-mono text-[10px] grid grid-cols-2 gap-y-2 gap-x-4">
                            <div>
                              <span className="text-slate-400 font-semibold block">Model:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCandidate.model_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Version Tag:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCandidate.version_tag}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Inference Latency:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCandidate.latency_ms} ms</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-semibold block">Token Count:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCandidate.token_count}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 font-semibold block">Score Confidence Limit:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">{selectedCandidate.confidence * 100}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDrawerTab === "gap" && (
                      <div className="flex flex-col gap-5">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Must-Have Skills Analysis</h4>
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2">
                              {selectedCandidate.gap_analysis.must_have_matched.map((s, idx) => (
                                <span key={idx} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                  <Icon name="check" className="w-3.5 h-3.5" />
                                  <span>{s}</span>
                                </span>
                              ))}
                              {selectedCandidate.gap_analysis.must_have_missing.map((s, idx) => (
                                <span key={idx} className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                  <Icon name="close" className="w-3.5 h-3.5" />
                                  <span>{s}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Nice-To-Have Skills Analysis</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCandidate.gap_analysis.nice_to_have_matched.map((s, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <Icon name="check" className="w-3.5 h-3.5" />
                                <span>{s}</span>
                              </span>
                            ))}
                            {selectedCandidate.gap_analysis.nice_to_have_missing.map((s, idx) => (
                              <span key={idx} className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 text-slate-500 rounded-lg text-xs font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">All Parsed Candidate Skills</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCandidate.skills.map((s, idx) => (
                              <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDrawerTab === "preview" && (
                      <div className="h-full">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Resume Highlight view</h4>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-[400px]">
                          {highlightText(selectedCandidate.raw_text)}
                        </div>
                      </div>
                    )}

                    {activeDrawerTab === "email" && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recruiter Email Template</h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getEmailTemplate());
                              addToast("Copied email to clipboard.", "success");
                            }}
                            className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={getEmailTemplate()}
                          className="w-full h-64 p-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-300 focus:outline-none resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer Actions & Note taking */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Recruiter Notes (IndexedDB Auto-save)
                      </label>
                      <textarea
                        value={candidateNotes}
                        onChange={(e) => setCandidateNotes(e.target.value)}
                        placeholder="Add notes for this candidate..."
                        className="w-full h-20 p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      {/* Decision buttons */}
                      <div className="flex items-center gap-2">
                        {["Proceed", "Hold", "Reject"].map((d) => (
                          <button
                            key={d}
                            onClick={() => setCandidateDecision(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              candidateDecision === d
                                ? d === "Proceed"
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                  : d === "Hold"
                                  ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
                                  : "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20"
                                : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Save Notes button */}
                        <button
                          onClick={saveNotesAndDecision}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Save State
                        </button>
                        
                        {/* Dispatch ATS webhook */}
                        <button
                          onClick={dispatchToATS}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                          title="Trigger ATS configured webhook pipeline"
                        >
                          <Icon name="link" className="w-3.5 h-3.5" />
                          <span>Push ATS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </main>
      </div>

      {/* GDPR/PII Consent Banner */}
      {!gdprAccepted && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-900 text-white border-t border-slate-800 p-4 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 fade-in">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white">
              <Icon name="mlops" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">
                GDPR & PII Processing Consent Banner
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                We process candidate resumes solely during this browser session to compute score matches. No PII is stored long-term without explicit recruiter consent.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setAnonymizedMode(true);
                setGdprAccepted(true);
                localStorage.setItem("gdprAccepted", "true");
                addToast("Anonymized mode enabled by default to satisfy GDPR.", "success");
              }}
              className="px-3.5 py-1.5 border border-slate-700 hover:bg-slate-800 rounded-lg text-xs font-bold"
            >
              Anonymize Candidate PII
            </button>
            
            <button
              onClick={() => {
                setGdprAccepted(true);
                localStorage.setItem("gdprAccepted", "true");
                addToast("GDPR consent logged.", "success");
              }}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              Consent and Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mount the React Application
const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
