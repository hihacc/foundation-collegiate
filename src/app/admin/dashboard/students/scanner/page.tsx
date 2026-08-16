'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
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
  SwitchCamera,
  Check,
  Plus,
  Sparkles,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { parseAdmissionFormText, ParsedStudentForm } from '@/lib/utils/formOcrParser';
import { preprocessDocumentCanvas, DocumentFilter } from '@/lib/utils/documentPreprocessor';

interface ScannedDocumentItem {
  id: string;
  originalUrl: string;
  processedUrl: string;
  filter: DocumentFilter;
  contrast: number;
  rotation: number;
  status: 'pending' | 'scanning' | 'ready' | 'enrolled' | 'error';
  extractedData: ParsedStudentForm;
  rawText?: string;
  engineUsed?: string;
  error?: string;
  fileName?: string;
}

export default function HuggingFaceAdmissionScannerPage() {
  const [documents, setDocuments] = useState<ScannedDocumentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  
  // Camera Viewfinder State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Image Viewer Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewerRotation, setViewerRotation] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = documents[currentIndex];

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // 1. Camera Viewfinder Controls
  const startCameraStream = async () => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('WebRTC Camera not supported by this browser. Use "Snap with Mobile Camera".');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!stream) throw new Error('Could not access camera feed.');

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Camera error:', err.name, err.message);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission was not granted. Tap "Snap with Mobile Camera" below or allow permission in browser settings.');
      } else {
        setCameraError(err.message || 'Camera unavailable on this device.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (isCameraActive) {
      setTimeout(() => startCameraStream(), 100);
    }
  };

  // Capture Frame from Live Viewfinder
  const handleCaptureVideoFrame = async () => {
    if (!videoRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    stopCameraStream();
    await addDocumentToQueue(dataUrl, `Live-Capture-${new Date().toLocaleTimeString('en-PK', { hour12: false }).replace(/:/g, '')}.jpg`);
  };

  // 2. Add and Process Document in Queue
  const addDocumentToQueue = async (imageUrl: string, fileName: string) => {
    const newDocId = crypto.randomUUID();
    
    // Initial preprocessed URL with default magic filter
    const initialProcessedUrl = await preprocessDocumentCanvas(imageUrl, {
      filter: 'magic',
      contrast: 15,
      rotation: 0
    });

    const newDoc: ScannedDocumentItem = {
      id: newDocId,
      originalUrl: imageUrl,
      processedUrl: initialProcessedUrl,
      filter: 'magic',
      contrast: 15,
      rotation: 0,
      fileName,
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
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    setCurrentIndex(0);

    // Run Hugging Face Extraction
    await runHuggingFaceExtraction(newDoc, initialProcessedUrl);
  };

  // Handle File / Native Mobile Camera Uploads
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      await addDocumentToQueue(previewUrl, file.name);
    }
  };

  // 3. Hugging Face Document Vision & OCR Pipeline
  const runHuggingFaceExtraction = async (docItem: ScannedDocumentItem, imageToProcess: string) => {
    setIsProcessing(true);
    setScanProgress(20);
    setDocuments(prev => prev.map(d => d.id === docItem.id ? { ...d, status: 'scanning' } : d));

    try {
      setScanProgress(45);

      // Convert dataUrl to Blob for FormData transmission
      const resBlob = await fetch(imageToProcess);
      const blob = await resBlob.blob();

      const formData = new FormData();
      formData.append('image', blob, 'scanned_form.jpg');

      setScanProgress(60);

      // Call Hugging Face API route
      const hfResponse = await fetch('/api/scanner/extract', {
        method: 'POST',
        body: formData
      });

      setScanProgress(85);
      const hfData = await hfResponse.json();

      let extractedFields: ParsedStudentForm;
      let engineName = 'Hugging Face Vision AI';

      if (hfData.success && hfData.data && hfData.data.student_name) {
        extractedFields = hfData.data;
        engineName = hfData.engine || 'Hugging Face Vision AI';
      } else {
        // Fallback to client-side Tesseract if HF had a transient error
        const Tesseract = await import('tesseract.js');
        const ocrResult = await Tesseract.recognize(imageToProcess, 'eng');
        extractedFields = parseAdmissionFormText(ocrResult.data.text || '');
        engineName = 'Local OCR Engine';
      }

      setScanProgress(100);

      setDocuments(prev => prev.map(d => d.id === docItem.id ? {
        ...d,
        status: 'ready',
        engineUsed: engineName,
        extractedData: extractedFields
      } : d));

      toast.success(`Scanned with ${engineName}: "${extractedFields.student_name || 'Student'}"!`);

    } catch (err: any) {
      console.error('Scan Error:', err);
      setDocuments(prev => prev.map(d => d.id === docItem.id ? {
        ...d,
        status: 'error',
        error: err.message || 'Extraction failed'
      } : d));
      toast.error('Scan Error: ' + err.message);
    } finally {
      setIsProcessing(false);
      setScanProgress(0);
    }
  };

  // 4. Update Document Filters (Magic, B&W, Contrast, Rotation)
  const handleUpdateDocumentFilter = async (filter: DocumentFilter, contrastVal?: number, rotateBy?: number) => {
    if (!currentDoc) return;

    const newFilter = filter;
    const newContrast = contrastVal !== undefined ? contrastVal : currentDoc.contrast;
    const newRotation = rotateBy !== undefined ? (currentDoc.rotation + rotateBy) % 360 : currentDoc.rotation;

    try {
      const reprocessed = await preprocessDocumentCanvas(currentDoc.originalUrl, {
        filter: newFilter,
        contrast: newContrast,
        rotation: newRotation
      });

      setDocuments(prev => prev.map((d, i) => i === currentIndex ? {
        ...d,
        filter: newFilter,
        contrast: newContrast,
        rotation: newRotation,
        processedUrl: reprocessed
      } : d));

      toast.info('Image filter updated. Click "Re-run Hugging Face Scan" to re-extract.');
    } catch (err: any) {
      toast.error('Failed to update filter: ' + err.message);
    }
  };

  // 5. Handle Form Field Changes
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

  // 6. Save Confirmed Data to Supabase
  const handleEnrollStudent = async () => {
    if (!currentDoc) return;
    const form = currentDoc.extractedData;

    if (!form.student_name || form.student_name.trim().length < 2) {
      toast.error('Please enter the Student Name before enrolling.');
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
          dob: form.dob || '',
          religion: form.religion || 'Islam',
          nationality: form.nationality || 'Pakistani',
          cnic: form.cnic || '',
          address: form.address || '',
          parent_phone: form.parent_phone || '',
          student_phone: form.student_phone || '',
          parent_email: form.parent_email || '',
          previous_school: form.previous_school || '',
          father_occupation: form.father_occupation || '',
          class_applied: form.class_name,
          status: 'approved',
          created_at: new Date().toISOString()
        }]);
      } catch {}

      // 3. Update local cache
      const existing = getStoredData<Student[]>('students', []);
      setStoredData('students', [newStudent, ...existing]);

      // 4. Mark document as enrolled
      setDocuments(prev => prev.map((d, i) => i === currentIndex ? { ...d, status: 'enrolled' } : d));

      toast.success(`Enrolled! ${form.student_name} registered with Roll #${generatedRoll}`, { id: toastId });

      // Move to next in queue if available
      if (currentIndex < documents.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setZoomLevel(1);
        setViewerRotation(0);
      }

    } catch (err: any) {
      toast.error('Enrollment error: ' + err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
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
            <Bot size={26} className="text-blue-600 animate-pulse" />
            Hugging Face Admission Form Scanner
          </h1>
          <p className="text-xs text-slate-500">
            Powered by Hugging Face Vision AI. Point camera at physical paper admission forms for instant handwriting extraction.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (isCameraActive) {
                stopCameraStream();
              } else {
                startCameraStream();
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
            }`}
          >
            <Camera size={15} /> {isCameraActive ? 'Close Live Camera' : 'Start Live Camera'}
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Camera size={15} /> 📸 Snap with Mobile Camera
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Upload size={15} /> 📁 Upload Form Photo
          </button>

          {/* Hidden File & Direct Mobile Camera Inputs */}
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

      {/* LIVE CAMERA VIEWFINDER MODAL / VIEWPORT */}
      {isCameraActive && (
        <div className="bg-slate-950 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl text-white space-y-4">
          <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Live Camera Stream</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <SwitchCamera size={14} /> Flip Camera
              </button>
              <button
                type="button"
                onClick={stopCameraStream}
                className="px-3 py-1.5 bg-red-950 text-red-400 hover:bg-red-900 rounded-xl text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Video Feed Frame */}
          <div className="relative w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-3xl"
            />

            {/* Document Bounding Guides */}
            <div className="absolute inset-6 pointer-events-none border-2 border-dashed border-cyan-400/60 rounded-2xl flex items-center justify-center">
              <span className="bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-semibold text-cyan-300">
                Align admission form inside frame &amp; tap Capture
              </span>
            </div>
          </div>

          {/* Shutter Button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleCaptureVideoFrame}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera size={18} />
              <span>Capture &amp; Send to Hugging Face</span>
            </button>
          </div>
        </div>
      )}

      {/* No Documents Uploaded Placeholder */}
      {documents.length === 0 && !isCameraActive && (
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Scan size={40} className="text-blue-600" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Scan &amp; Digitize Admission Forms with Hugging Face AI
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Take a photo of any physical paper admission form or upload a scan. Hugging Face Vision AI accurately reads handwritten pen entries for instant side-by-side verification and enrollment.
            </p>
          </div>

          {/* Large Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Camera size={24} />
              </div>
              <div>
                <span className="font-bold text-sm block">📸 Open Camera to Scan</span>
                <span className="text-[11px] text-blue-100 block mt-0.5">Snaps form photo directly with device camera</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Upload size={24} />
              </div>
              <div>
                <span className="font-bold text-sm block">📁 Upload Form Photo / Scan</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Choose file (.JPG, .PNG, .PDF) from device</span>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-medium pt-2">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Hugging Face Vision AI</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Accurate Handwriting OCR</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> 1-Click Roll # Generator</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-cyan-300" />
            <span className="text-xs font-bold">Processing with Hugging Face Vision AI ({scanProgress}%)...</span>
          </div>
          <div className="w-32 bg-blue-800/80 rounded-full h-2 overflow-hidden">
            <div className="bg-cyan-300 h-2 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
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
                    setViewerRotation(0);
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
                onClick={() => cameraInputRef.current?.click()}
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
            
            {/* Left Column: Interactive Preprocessing & Document Viewer (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-4 flex flex-col justify-between border border-slate-800 shadow-lg min-h-[580px] space-y-3">
              
              {/* Top Controls Bar */}
              <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur-xs p-2.5 rounded-2xl border border-slate-700 text-white text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                    Form #{currentIndex + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{currentDoc.fileName || 'Scanned Form'}</span>
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
                    onClick={() => handleUpdateDocumentFilter(currentDoc.filter, undefined, 90)}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
                    title="Rotate 90°"
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

              {/* Document Filter Selector Tabs */}
              <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleUpdateDocumentFilter('magic')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    currentDoc.filter === 'magic'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Magic Color
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDocumentFilter('bw')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    currentDoc.filter === 'bw'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  B&amp;W High Contrast
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDocumentFilter('grayscale')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    currentDoc.filter === 'grayscale'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Grayscale
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDocumentFilter('original')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    currentDoc.filter === 'original'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Original
                </button>
              </div>

              {/* Document Image Canvas Viewport */}
              <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 border border-slate-800/50 flex items-center justify-center p-2 min-h-[380px] relative">
                {currentDoc.status === 'scanning' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 text-white">
                    <Loader2 size={36} className="animate-spin text-cyan-400" />
                    <p className="text-xs font-bold text-cyan-200">Extracting handwriting with Hugging Face AI...</p>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentDoc.processedUrl || currentDoc.originalUrl}
                  alt="Scanned Document Form"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${viewerRotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                  className="max-h-[440px] w-auto object-contain rounded-xl shadow-2xl origin-center"
                />
              </div>

              {/* Status & Rescan Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => runHuggingFaceExtraction(currentDoc, currentDoc.processedUrl)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} /> Re-run Hugging Face Scan
                </button>

                {currentDoc.status === 'enrolled' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Enrolled to Database
                  </span>
                ) : (
                  <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                )}
              </div>
            </div>

            {/* Right Column: Editable Form Fields (7 cols) */}
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

                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono font-bold text-xs flex items-center gap-1">
                  <Sparkles size={12} /> {currentDoc.engineUsed || 'Hugging Face AI'}
                </span>
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
                        placeholder="ENTER FULL NAME"
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
                    <span>Ready to save confirmed particulars into live database</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {currentIndex < documents.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentIndex(currentIndex + 1);
                        setZoomLevel(1);
                        setViewerRotation(0);
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
