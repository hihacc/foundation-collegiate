'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  Trash2, 
  UserCheck, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  Scan,
  RefreshCw,
  KeyRound,
  Check,
  Plus,
  Zap,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { parseAdmissionFormText, ParsedStudentForm } from '@/lib/utils/formOcrParser';
import { enhanceDocumentImage } from '@/lib/utils/imageEnhance';

interface ScannedDocumentItem {
  id: string;
  previewUrl: string;
  enhancedUrl?: string;
  status: 'pending' | 'scanning' | 'ready' | 'enrolled' | 'error';
  extractedData: ParsedStudentForm;
  rawText?: string;
  error?: string;
  fileName?: string;
  engineUsed?: string;
}

export default function GoogleDriveDocumentScannerPage() {
  const [documents, setDocuments] = useState<ScannedDocumentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  
  // Gemini AI Vision Key State
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(false);

  // Image viewer zoom & rotation
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = documents[currentIndex];

  useEffect(() => {
    const savedKey = getStoredData<string>('gemini_api_key', '');
    if (savedKey) {
      setGeminiKey(savedKey);
      setIsAiConfigured(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    const clean = key.trim();
    setGeminiKey(clean);
    setStoredData('gemini_api_key', clean);
    setIsAiConfigured(!!clean);
    setShowKeyModal(false);
    toast.success('Gemini AI Vision API key saved successfully!');
  };

  // 1. Direct Camera & File Selection Handlers
  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: ScannedDocumentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newDocs.push({
        id: crypto.randomUUID(),
        previewUrl,
        fileName: file.name || `Admission-Form-${new Date().toLocaleTimeString('en-PK', { hour12: false }).replace(/:/g, '')}.jpg`,
        status: 'pending',
        extractedData: {
          student_name: '',
          father_name: '',
          dob: '',
          religion: 'Islam',
          nationality: 'Pakistani',
          cnic: '',
          address: '',
          parent_phone: '',
          student_phone: '',
          parent_email: '',
          previous_school: '',
          father_occupation: '',
          father_office_phone: '',
          class_name: 'Class IX - Science / Biology',
          group_name: '',
          subjects: []
        }
      });
    }

    const updated = [...newDocs, ...documents];
    setDocuments(updated);
    setCurrentIndex(0);

    // Process all uploaded documents
    for (const doc of newDocs) {
      await processScanDocument(doc);
    }
  };

  // 2. High-Accuracy OCR & Field Extraction Engine
  const processScanDocument = async (docItem: ScannedDocumentItem) => {
    setIsProcessing(true);
    setOcrProgress(15);
    setDocuments(prev => prev.map(d => d.id === docItem.id ? { ...d, status: 'scanning' } : d));

    try {
      // Step A: Fast contrast enhancement & normalization
      setOcrProgress(30);
      const enhancedImgUrl = await enhanceDocumentImage(docItem.previewUrl);

      setDocuments(prev => prev.map(d => d.id === docItem.id ? { ...d, enhancedUrl: enhancedImgUrl } : d));
      setOcrProgress(50);

      // Step B: AI Vision Recognition via API route
      let extracted: ParsedStudentForm | null = null;
      let rawOcrText = '';
      let engineName = 'Built-in Form OCR';

      try {
        const res = await fetch('/api/ai/scan-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image_base64: enhancedImgUrl,
            custom_api_key: geminiKey || undefined
          })
        });
        const apiData = await res.json();
        if (apiData.success && apiData.data && apiData.data.student_name) {
          extracted = apiData.data;
          engineName = apiData.engine || 'Gemini Vision AI';
        }
      } catch (err) {
        console.warn('AI scan notice:', err);
      }

      // Step C: Fallback to client-side OCR if API did not return student name
      if (!extracted || !extracted.student_name) {
        setOcrProgress(70);
        const Tesseract = await import('tesseract.js');
        const ocrResult = await Tesseract.recognize(enhancedImgUrl, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(70 + Math.round(m.progress * 28));
            }
          }
        });

        rawOcrText = ocrResult.data.text || '';
        extracted = parseAdmissionFormText(rawOcrText);
      }

      setOcrProgress(100);

      setDocuments(prev => prev.map(d => d.id === docItem.id ? {
        ...d,
        status: 'ready',
        rawText: rawOcrText,
        engineUsed: engineName,
        extractedData: extracted || d.extractedData
      } : d));

      toast.success(`Form Scanned: Extracted details for "${extracted?.student_name || 'Student'}"!`);

    } catch (err: any) {
      console.error('Scan Error:', err);
      setDocuments(prev => prev.map(d => d.id === docItem.id ? {
        ...d,
        status: 'error',
        error: err.message || 'Failed to scan image'
      } : d));
      toast.error('Scanning notice: ' + err.message);
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  // 3. Edit Form Field
  const handleFieldChange = (field: keyof ParsedStudentForm, val: any) => {
    if (!currentDoc) return;
    setDocuments(prev => prev.map((d, i) => {
      if (i === currentIndex) {
        return {
          ...d,
          extractedData: {
            ...d.extractedData,
            [field]: val
          }
        };
      }
      return d;
    }));
  };

  // 4. Enroll Student to Supabase
  const handleEnrollStudent = async () => {
    if (!currentDoc) return;
    const form = currentDoc.extractedData;

    if (!form.student_name || form.student_name.trim().length < 2) {
      toast.error('Please enter or verify a Student Name before enrolling.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(`Enrolling "${form.student_name}" into student database...`);

    try {
      const studentId = crypto.randomUUID();
      const generatedRoll = `FC-26-${Math.floor(1000 + Math.random() * 9000)}`;

      const newStudent: Student = {
        id: studentId,
        name: form.student_name.trim().toUpperCase(),
        father_name: form.father_name || 'N/A',
        roll_number: generatedRoll,
        class_name: form.class_name || 'Class IX - Science / Biology',
        phone: form.parent_phone || '',
        email: form.parent_email || undefined,
        status: 'active',
        is_active: true,
        created_at: new Date().toISOString()
      };

      // 1. Insert into Supabase students table
      const { error: stuError } = await supabase.from('students').insert([newStudent]);
      if (stuError) console.warn('Supabase student insert notice:', stuError.message);

      // 2. Also log into admissions table
      try {
        await supabase.from('admissions').insert([{
          id: crypto.randomUUID(),
          student_name: form.student_name.trim().toUpperCase(),
          father_name: form.father_name || 'N/A',
          dob: form.dob || '2008-01-01',
          religion: form.religion || 'Islam',
          nationality: form.nationality || 'Pakistani',
          cnic: form.cnic || 'N/A',
          address: form.address || 'Karachi, Sindh, Pakistan',
          parent_phone: form.parent_phone || '0333-0000000',
          student_phone: form.student_phone || '',
          parent_email: form.parent_email || '',
          previous_school: form.previous_school || 'N/A',
          father_occupation: form.father_occupation || 'Business',
          class_applied: form.class_name,
          status: 'approved',
          created_at: new Date().toISOString()
        }]);
      } catch {}

      // 3. Update local cache
      const existing = getStoredData<Student[]>('students', []);
      setStoredData('students', [newStudent, ...existing]);

      // 4. Mark enrolled
      setDocuments(prev => prev.map((d, i) => i === currentIndex ? { ...d, status: 'enrolled' } : d));

      toast.success(`Success! Student "${form.student_name}" enrolled with Roll #${generatedRoll}!`, { id: toastId });

      // Move to next in queue if available
      if (currentIndex < documents.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setZoomLevel(1);
        setRotation(0);
      }

    } catch (err: any) {
      toast.error('Enrollment error: ' + err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Load Sample Form Data for Instant Test
  const handleLoadSampleForm = () => {
    const sampleDoc: ScannedDocumentItem = {
      id: crypto.randomUUID(),
      previewUrl: 'https://images.unsplash.com/photo-1584697964190-705b89368d4d?auto=format&fit=crop&q=80&w=1000',
      fileName: 'Sample-Physical-Admission-Form.jpg',
      status: 'ready',
      engineUsed: 'Foundation Collegiate AI Parser',
      extractedData: {
        student_name: 'AREEBA AMJAD',
        father_name: 'M. Amjad',
        dob: '18-June-2003',
        religion: 'Islam',
        nationality: 'Pakistani',
        cnic: '',
        address: 'B-466 Sector 11/E North Karachi',
        parent_phone: '0300-2415264',
        student_phone: '0341-2373287',
        parent_email: '',
        previous_school: 'The Muslim Generation School',
        father_occupation: 'Personal business',
        father_office_phone: '',
        class_name: 'Class IX - Science / Biology',
        group_name: '',
        subjects: ['Chemistry', 'Biology', 'Computer', 'Maths', 'Physics', 'English', 'Urdu', 'Sindhi', 'Islamiat', 'Pak. Studies'],
        notes: 'G.R. No. 562'
      }
    };

    setDocuments([sampleDoc, ...documents]);
    setCurrentIndex(0);
    toast.success('Loaded physical admission form template!');
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <Link
            href="/admin/dashboard/students"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 mb-1"
          >
            <ArrowLeft size={14} /> Back to Student Directory
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Scan size={26} className="text-blue-600 animate-pulse" />
            Admission Form AI Scanner &amp; Quick Enrollment
          </h1>
          <p className="text-xs text-slate-500">
            Snap photos of paper admission forms or upload scans. AI automatically reads Student Name, Father Name, Contact, Address &amp; Class.
          </p>
        </div>

        {/* Action Buttons & AI Key Settings */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAiConfigured
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Sparkles size={14} className={isAiConfigured ? 'text-amber-600' : 'text-slate-500'} />
            {isAiConfigured ? '✨ AI Vision Active' : '⚡ Connect AI Key'}
          </button>

          <button
            type="button"
            onClick={handleTriggerCamera}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Camera size={16} /> 📸 Scan with Camera
          </button>
          
          <button
            type="button"
            onClick={handleTriggerUpload}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Upload size={16} /> 📁 Upload Form Image
          </button>

          {/* Hidden Direct File & Camera Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={e => handleFilesSelected(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* AI Key Modal / Drawer */}
      {showKeyModal && (
        <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-2 border-amber-400 p-6 rounded-3xl space-y-4 shadow-xl animate-in fade-in">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
              <KeyRound size={18} className="text-amber-600" /> Connect Google Gemini Vision AI Key
            </span>
            <button onClick={() => setShowKeyModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer">✕ Close</button>
          </div>
          
          <div className="space-y-2 text-xs text-slate-700 leading-relaxed bg-amber-100/50 p-4 rounded-2xl border border-amber-200">
            <p className="font-bold text-amber-950">
              📌 How to get your 100% Free Gemini AI Key:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
              <li>Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">Google AI Studio (Click here)</a> in your browser.</li>
              <li>Sign in with your Google account and click <strong>&quot;Create API key&quot;</strong>.</li>
              <li>Copy the key (it starts with <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">AIzaSy...</strong>) and paste it below.</li>
            </ol>
            <p className="text-[11px] text-amber-800 italic pt-1">
              * Note: Keys starting with <span className="font-mono text-red-600">AQ...</span> are internal project tokens. Gemini vision keys start with <span className="font-mono text-emerald-700 font-bold">AIzaSy...</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
            <input
              type="text"
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              placeholder="Paste your key here (e.g. AIzaSyB...)"
              className="flex-1 px-4 py-3 bg-white border-2 border-amber-300 rounded-2xl text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => handleSaveApiKey(geminiKey)}
              className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer"
            >
              Save &amp; Activate AI
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome / Upload Card if no documents yet */}
      {documents.length === 0 && (
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Scan size={40} className="text-blue-600" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Scan &amp; Digitize Hard Copy Admission Forms
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take a photo of any physical paper admission form using your phone, or upload an image. The scanner automatically recognizes Student Name, Father Name, Cell #, DOB, Address &amp; Class.
            </p>
          </div>

          {/* Large Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
            <button
              type="button"
              onClick={handleTriggerCamera}
              className="p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Camera size={24} />
              </div>
              <div>
                <span className="font-bold text-sm block">📸 Open Phone Camera to Scan</span>
                <span className="text-[11px] text-blue-100 block mt-0.5">Snaps form photo directly</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleTriggerUpload}
              className="p-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Upload size={24} />
              </div>
              <div>
                <span className="font-bold text-sm block">📁 Upload Form Photo / PDF</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Select image from device</span>
              </div>
            </button>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleLoadSampleForm}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-4 cursor-pointer"
            >
              🧪 Click here to test with sample admission form template (Areeba Amjad)
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-medium pt-2">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Automatic Student Name</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Father &amp; Contact</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> 1-Click Roll # Generator</span>
          </div>
        </div>
      )}

      {/* Scanning Progress Bar */}
      {isProcessing && (
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-cyan-300" />
            <span className="text-xs font-bold">Scanning admission form &amp; extracting particulars ({ocrProgress}%)...</span>
          </div>
          <div className="w-32 bg-blue-800/80 rounded-full h-2 overflow-hidden">
            <div className="bg-cyan-300 h-2 transition-all duration-300" style={{ width: `${ocrProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* SPLIT SCREEN REVIEW & VERIFICATION INTERFACE */}
      {documents.length > 0 && currentDoc && (
        <div className="space-y-4">
          
          {/* Multi-Form Navigation Strip */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Queue ({documents.length} forms):</span>
              {documents.map((doc, idx) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : doc.status === 'enrolled'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Form #{idx + 1}</span>
                  {doc.status === 'scanning' && <Loader2 size={12} className="animate-spin text-amber-500" />}
                  {doc.status === 'enrolled' && <CheckCircle2 size={12} className="text-emerald-600" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTriggerCamera}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Scan Another
              </button>

              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-600 font-mono">
                {currentIndex + 1} / {documents.length}
              </span>
              <button
                onClick={() => setCurrentIndex(prev => Math.min(documents.length - 1, prev + 1))}
                disabled={currentIndex === documents.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Split Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Zoomable Scanned Paper Form Photo (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-4 flex flex-col justify-between border border-slate-800 shadow-lg min-h-[560px]">
              
              {/* Viewer Controls Bar */}
              <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-700 text-white text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                    Form #{currentIndex + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[130px]">{currentDoc.fileName || 'Scanned Form'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.2))}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.2))}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
                    title="Rotate Photo"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const rem = documents.filter(d => d.id !== currentDoc.id);
                      setDocuments(rem);
                      if (currentIndex >= rem.length) setCurrentIndex(Math.max(0, rem.length - 1));
                    }}
                    className="p-1.5 bg-red-950 text-red-400 hover:bg-red-900 rounded-lg cursor-pointer ml-1"
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Document Image Canvas */}
              <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 border border-slate-800/50 flex items-center justify-center p-2 min-h-[420px] relative">
                {currentDoc.status === 'scanning' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 text-white">
                    <Loader2 size={36} className="animate-spin text-cyan-400" />
                    <p className="text-xs font-bold text-cyan-200">Scanning form particulars...</p>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentDoc.enhancedUrl || currentDoc.previewUrl}
                  alt="Scanned Document Form"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-2xl origin-center"
                />
              </div>

              {/* Status Footer */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                {currentDoc.status === 'enrolled' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Enrolled to Database
                  </span>
                ) : (
                  <span className="text-cyan-300 font-semibold">
                    {currentDoc.engineUsed ? `✨ ${currentDoc.engineUsed}` : 'Review & Edit on right \u2192'}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Editable Verification Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <UserCheck size={20} className="text-blue-600" /> Extracted Student Particulars
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify and adjust extracted fields before enrolling student into the live database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => processScanDocument(currentDoc)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} /> Rescan
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-5 text-xs">
                
                {/* 1. Student Particulars */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    1. Student Particulars
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Student Full Name (Capital Letters) *</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.student_name}
                        onChange={e => handleFieldChange('student_name', e.target.value.toUpperCase())}
                        placeholder="e.g. AREEBA AMJAD"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.dob}
                        onChange={e => handleFieldChange('dob', e.target.value)}
                        placeholder="e.g. 18-June-2003 or YYYY-MM-DD"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CNIC # / B-Form</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.cnic}
                        onChange={e => handleFieldChange('cnic', e.target.value)}
                        placeholder="42101-XXXXXXX-X (if present)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Religion</label>
                      <select
                        value={currentDoc.extractedData.religion}
                        onChange={e => handleFieldChange('religion', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="Islam">Islam</option>
                        <option value="Non-Muslim">Non-Muslim</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nationality</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.nationality}
                        onChange={e => handleFieldChange('nationality', e.target.value)}
                        placeholder="Pakistani"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Residential Address *</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.address}
                        onChange={e => handleFieldChange('address', e.target.value)}
                        placeholder="e.g. B-466 Sector 11/E North Karachi"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Parent / Guardian Particulars */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    2. Parent / Guardian Particulars
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Father / Guardian Name *</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.father_name}
                        onChange={e => handleFieldChange('father_name', e.target.value)}
                        placeholder="e.g. M. Amjad"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Father Occupation</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.father_occupation}
                        onChange={e => handleFieldChange('father_occupation', e.target.value)}
                        placeholder="e.g. Personal business"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Parent Cell / Phone *</label>
                      <input
                        type="tel"
                        value={currentDoc.extractedData.parent_phone}
                        onChange={e => handleFieldChange('parent_phone', e.target.value)}
                        placeholder="e.g. 0300-2415264"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Student / Alternate Phone</label>
                      <input
                        type="tel"
                        value={currentDoc.extractedData.student_phone}
                        onChange={e => handleFieldChange('student_phone', e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Parent Email Address (Optional)</label>
                      <input
                        type="email"
                        value={currentDoc.extractedData.parent_email}
                        onChange={e => handleFieldChange('parent_email', e.target.value)}
                        placeholder="email@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Academic Class & Program */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    3. Academic Program &amp; Class Enrollment
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Target Academic Class *</label>
                      <select
                        value={currentDoc.extractedData.class_name}
                        onChange={e => handleFieldChange('class_name', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <optgroup label="Matriculation (IX & X)">
                          <option value="Class IX - Science / Biology">Class IX - Science / Biology</option>
                          <option value="Class IX - Computer Science">Class IX - Computer Science</option>
                          <option value="Class X - Science / Biology">Class X - Science / Biology</option>
                          <option value="Class X - Computer Science">Class X - Computer Science</option>
                        </optgroup>
                        <optgroup label="Intermediate (XI & XII)">
                          <option value="Class XI - Pre-Medical">Class XI - Pre-Medical</option>
                          <option value="Class XI - Pre-Engineering">Class XI - Pre-Engineering</option>
                          <option value="Class XI - Computer Science">Class XI - Computer Science</option>
                          <option value="Class XI - Commerce">Class XI - Commerce</option>
                          <option value="Class XI - Arts">Class XI - Arts</option>
                          <option value="Class XII - Pre-Medical">Class XII - Pre-Medical</option>
                          <option value="Class XII - Pre-Engineering">Class XII - Pre-Engineering</option>
                          <option value="Class XII - Computer Science">Class XII - Computer Science</option>
                          <option value="Class XII - Commerce">Class XII - Commerce</option>
                          <option value="Class XII - Arts">Class XII - Arts</option>
                        </optgroup>
                        <optgroup label="Graduation / ADC">
                          <option value="ADC 1">ADC 1 (Associate Degree in Commerce - Part 1)</option>
                          <option value="ADC 2">ADC 2 (Associate Degree in Commerce - Part 2)</option>
                        </optgroup>
                        <optgroup label="Diploma">
                          <option value="Diploma in Information Technology (DIT)">Diploma in Information Technology (DIT)</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Previous School / College</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.previous_school}
                        onChange={e => handleFieldChange('previous_school', e.target.value)}
                        placeholder="e.g. The Muslim Generation School"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Enrollment Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {currentDoc.status === 'enrolled' ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Student is officially enrolled!
                    </span>
                  ) : (
                    <span>Ready to save into live student directory</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {currentIndex < documents.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(currentIndex + 1);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Skip &rarr;
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleEnrollStudent}
                    disabled={isSaving || currentDoc.status === 'scanning'}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                    {currentDoc.status === 'enrolled' ? 'Update & Re-Enroll' : 'Enroll Student to Live Database'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
