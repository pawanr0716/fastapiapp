import { useState, type FormEvent, useRef, useEffect } from "react";
import { analyseResume } from "../Services/ResumeService";
import type { ResumeResponse } from "../types/resume";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Default to CDN worker; we'll try to fetch it and load as a blob URL to avoid CORS/loader issues
const PDF_WORKER_CDN = "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.js";
GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;

// Prefetch worker and set blob URL to avoid cross-origin issues in some environments
let _workerBlobUrl: string | null = null;

function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File) => {
    // Ensure worker blob URL is set if we were able to fetch it
    if (_workerBlobUrl) {
      GlobalWorkerOptions.workerSrc = _workerBlobUrl;
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const pdf = await getDocument({ data: uint8 }).promise;
    let text = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      text += `${pageText}\n\n`;
    }

    return text.trim();
  };

  const ocrPdfClientSide = async (file: File) => {
    // Dynamically import tesseract built bundle to avoid Vite resolution issues
    const tesseractModule = await import("tesseract.js/dist/tesseract.min.js");
    const createWorker = tesseractModule.createWorker ?? tesseractModule.Tesseract?.createWorker;
    if (!createWorker) throw new Error("Tesseract createWorker not available");
    // use pdfjs to render each page to a canvas and run tesseract on it
    if (_workerBlobUrl) {
      GlobalWorkerOptions.workerSrc = _workerBlobUrl;
    }
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const pdf = await getDocument({ data: uint8 }).promise;

    const worker = createWorker({ logger: () => {} });

    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    let fullText = "";
    try {
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        const { data: { text } } = await worker.recognize(canvas);
        if (text && text.trim()) {
          fullText += text.trim() + "\n\n";
        }
      }
    } finally {
      await worker.terminate();
    }

    return fullText.trim();
  };

  useEffect(() => {
    // fetch worker and create blob URL (best-effort)
    (async () => {
      try {
        const resp = await fetch(PDF_WORKER_CDN);
        if (!resp.ok) return;
        const script = await resp.text();
        const blob = new Blob([script], { type: "application/javascript" });
        _workerBlobUrl = URL.createObjectURL(blob);
        GlobalWorkerOptions.workerSrc = _workerBlobUrl;
      } catch (e) {
        // Ignore - we'll fallback to CDN URL already configured
        console.warn("Could not prefetch PDF worker:", e);
      }
    })();
    // cleanup blob on unmount
    return () => {
      if (_workerBlobUrl) {
        try {
          URL.revokeObjectURL(_workerBlobUrl);
        } catch {}
      }
    };
  }, []);

  const handlePdfUpload = async (file: File) => {
    setError(null);
    setLoading(true);
    setFileName(file.name);
    try {
      const text = await extractTextFromPdf(file);
      if (!text || !text.trim()) {
        // No textual content found (likely scanned). Try client-side OCR first.
        try {
          const clientOcrText = await ocrPdfClientSide(file);
          if (clientOcrText && clientOcrText.trim()) {
            setResumeText(clientOcrText);
          } else {
            // fallback to server-side OCR
            const form = new FormData();
            form.append("file", file);
            const resp = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/rag/ocr`, {
              method: "POST",
              body: form,
            });
            if (!resp.ok) {
              const errBody = await resp.json().catch(() => ({}));
              throw new Error(errBody.detail || `Server OCR failed with status ${resp.status}`);
            }
            const body = await resp.json();
            const ocrText = body.text;
            if (!ocrText || !ocrText.trim()) {
              setError("OCR did not return any text. Try another file or paste text manually.");
              setFileName(null);
            } else {
              setResumeText(ocrText);
            }
          }
        } catch (ocrErr: any) {
          console.error("OCR failed:", ocrErr);
          setError(`OCR failed: ${ocrErr?.message ?? String(ocrErr)}`);
          setFileName(null);
        }
      } else {
        setResumeText(text);
      }
    } catch (err: any) {
      console.error("PDF extraction failed:", err);
      const msg = err?.message ?? String(err);
      setError(`Unable to extract text from the selected PDF: ${msg}`);
      setFileName(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        await handlePdfUpload(file);
      } else {
        setError("Please upload a PDF file only.");
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handlePdfUpload(file);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resumeText.trim()) {
      setError("Please paste your resume text or upload a PDF before analyzing.");
      return;
    }

    setError(null);
    setLoading(true);
    setAnalysis(null);

    try {
      const data = await analyseResume({ resume_text: resumeText.trim() });
      setAnalysis(data);
    } catch (err: any) {
      console.error("Resume analysis failed:", err);
      setError(err?.response?.data?.detail ?? "Unable to analyze resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearInput = () => {
    setResumeText("");
    setFileName(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const charCount = resumeText.length;
  const maxCharLimit = 10000;

  return (
    <div className="resume-analyzer-card fade-in">
      <div className="resume-analyzer-header">
        <div className="resume-analyzer-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 9H8H10V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2>Resume Analyzer</h2>
          <p className="resume-analyzer-subtitle">Get AI-powered insights on your resume</p>
        </div>
      </div>

      <form className="resume-analyzer-form" onSubmit={handleSubmit}>
        <div 
          className={`resume-file-dropzone ${dragActive ? 'active' : ''} ${fileName ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="resume-file-input"
          />
          <div className="file-drop-content">
            <svg className="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {fileName ? (
              <div className="file-selected">
                <span className="file-name">{fileName}</span>
                <span className="file-status">PDF loaded successfully</span>
              </div>
            ) : (
              <div>
                <p className="dropzone-text">Drop your PDF here or click to browse</p>
                <p className="dropzone-hint">Supports PDF format only</p>
              </div>
            )}
          </div>
        </div>

        <div className="textarea-container">
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            placeholder="Paste your resume text here, or upload a PDF file above..."
            rows={10}
            maxLength={maxCharLimit}
          />
          <div className="textarea-footer">
            <span className="char-count">{charCount.toLocaleString()} / {maxCharLimit.toLocaleString()} characters</span>
            {resumeText && (
              <button type="button" className="clear-btn" onClick={clearInput}>
                Clear
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="analyze-btn" disabled={loading || !resumeText.trim()}>
          {loading ? (
            <>
              <span className="spinner"></span>
              Analyzing...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Analyze Resume
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="resume-error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {analysis && (
        <div className="resume-analysis-result">
          <div className="result-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 11.08V12C22 16.91 19.91 20.5 12 20.5C10.18 20.5 8.55 20.25 7.14 19.82C6.45 19.65 5.88 19.34 5.42 18.94C4.62 18.14 4.25 17.12 4.25 16C4.25 14.88 4.62 13.86 5.42 13.06C5.88 12.66 6.45 12.35 7.14 12.18C8.55 11.75 10.18 11.5 12 11.5C13.82 11.5 15.45 11.75 16.86 12.18C17.55 12.35 18.12 12.66 18.58 13.06C19.38 13.86 19.75 14.88 19.75 16C19.75 17.12 19.38 18.14 18.58 18.94C18.12 19.34 17.55 19.65 16.86 19.82C15.45 20.25 13.82 20.5 12 20.5V20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Analysis Complete
            </h3>
          </div>
          <div className="analysis-content">
            <pre>{analysis.analysis}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeAnalyzer;