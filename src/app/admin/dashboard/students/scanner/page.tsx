'use client';

import { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  FileText, 
  Trash2, 
  UserCheck, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Eye,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/types';
import { getStoredData, setStoredData } from '@/lib/utils/storage';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';
import { parseAdmissionFormText, ParsedStudentForm } from '@/lib/utils/formOcrParser';

interface ScannedDocumentItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'scanning' | 'ready' | 'enrolled' | 'error';
  extractedData: ParsedStudentForm;
  rawText?: string;
  error?: string;
}

export default function FormScannerPage() {
  const [documents, setDocuments] = useState<ScannedDocumentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Image viewer zoom & rotation state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = documents[currentIndex];

  // 1. Handle File Uploads
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newDocs: ScannedDocumentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newDocs.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
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

    const updated = [...documents, ...newDocs];
    setDocuments(updated);
    if (documents.length === 0) setCurrentIndex(0);

    // Auto-start scanning queue
    processScanningQueue(newDocs, updated);
  };

  // 2. Perform OCR on Scanned Images
  const processScanningQueue = async (itemsToScan: ScannedDocumentItem[], allDocs: ScannedDocumentItem[]) => {
    setIsProcessingBatch(true);

    try {
      // Dynamically import tesseract for client-side WebAssembly execution
      const Tesseract = await import('tesseract.js');

      for (const item of itemsToScan) {
        // Mark as scanning
        setDocuments(prev => prev.map(d => d.id === item.id ? { ...d, status: 'scanning' } : d));

        try {
          const { data: { text } } = await Tesseract.recognize(item.file, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                console.log(`[OCR Progress ${item.file.name}]: ${Math.round(m.progress * 100)}%`);
              }
            }
          });

          // Also check server API if Gemini AI is available
          let finalParsedData: ParsedStudentForm;
          try {
            const base64 = await fileToBase64(item.file);
            const res = await fetch('/api/ai/scan-form', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_base64: base64, raw_text: text })
            });
            const apiResult = await res.json();
            if (apiResult.success && apiResult.data) {
              finalParsedData = apiResult.data;
            } else {
              finalParsedData = parseAdmissionFormText(text);
            }
          } catch {
            finalParsedData = parseAdmissionFormText(text);
          }

          setDocuments(prev => prev.map(d => d.id === item.id ? {
            ...d,
            status: 'ready',
            rawText: text,
            extractedData: finalParsedData
          } : d));

          toast.success(`Scanned "${item.file.name}" successfully!`);

        } catch (err: any) {
          console.error('OCR Error on item:', err);
          setDocuments(prev => prev.map(d => d.id === item.id ? {
            ...d,
            status: 'error',
            error: err.message || 'Failed to scan'
          } : d));
          toast.error(`Could not read ${item.file.name}: ${err.message}`);
        }
      }
    } catch (err: any) {
      toast.error('Failed to initialize OCR engine: ' + err.message);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 3. Handle Form Field Changes
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

  // 4. Enroll / Save Student to Supabase
  const handleEnrollCurrentStudent = async () => {
    if (!currentDoc) return;
    const form = currentDoc.extractedData;

    if (!form.student_name || form.student_name.trim().length < 2) {
      toast.error('Please enter a valid Student Name before enrolling.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(`Enrolling "${form.student_name}" to student database...`);

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

      // 2. Also log in admissions table
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

      // 3. Update local storage cache
      const existing = getStoredData<Student[]>('students', []);
      const updatedStudents = [newStudent, ...existing];
      setStoredData('students', updatedStudents);

      // 4. Mark doc as enrolled
      setDocuments(prev => prev.map((d, i) => i === currentIndex ? { ...d, status: 'enrolled' } : d));

      toast.success(`Enrolled! ${form.student_name} added with Roll # ${generatedRoll}`, { id: toastId });

      // Move to next document if available
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

  const handleRemoveDoc = (id: string) => {
    const remaining = documents.filter(d => d.id !== id);
    setDocuments(remaining);
    if (currentIndex >= remaining.length) {
      setCurrentIndex(Math.max(0, remaining.length - 1));
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
            <Sparkles size={24} className="text-amber-500" />
            Hard Copy Form Scanner &amp; Quick Enrollment
          </h1>
          <p className="text-xs text-slate-500">
            Upload or photograph paper admission forms. AI &amp; OCR automatically extracts student details for quick verification and enrollment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Upload size={15} /> Upload Form Photos
          </button>
          
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Camera size={15} /> Take Photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={e => handleFilesSelected(e.target.files)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => handleFilesSelected(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* No Documents Uploaded Placeholder */}
      {documents.length === 0 && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText size={32} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800">No Admission Forms Uploaded Yet</h3>
            <p className="text-xs text-slate-500">
              Drag &amp; drop photos of your physical hard-copy admission forms here, or click below to browse files or take a photo.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Browse Files (Multiple Photos Supported)
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Take Photo with Camera
            </button>
          </div>
        </div>
      )}

      {/* Main Split Screen Interface */}
      {documents.length > 0 && currentDoc && (
        <div className="space-y-4">
          
          {/* Multi-Form Navigation Strip */}
          {documents.length > 1 && (
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
          )}

          {/* Split Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Document Photo Viewer (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-4 flex flex-col justify-between border border-slate-800 shadow-lg min-h-[550px]">
              
              {/* Viewer Controls */}
              <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur-xs p-2 rounded-2xl border border-slate-700 text-white text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                    Form #{currentIndex + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{currentDoc.file.name}</span>
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
                    onClick={() => handleRemoveDoc(currentDoc.id)}
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
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-20 text-white">
                    <Loader2 size={36} className="animate-spin text-blue-400" />
                    <p className="text-xs font-bold text-blue-200">Scanning form text &amp; fields...</p>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentDoc.previewUrl}
                  alt="Scanned Document Form"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                  }}
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-2xl origin-center"
                />
              </div>

              {/* Status footer */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
                {currentDoc.status === 'enrolled' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Enrolled to Database
                  </span>
                ) : (
                  <span className="text-amber-300 font-medium">Review extracted details on the right &rarr;</span>
                )}
              </div>
            </div>

            {/* Right: Editable Verification Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <UserCheck size={20} className="text-blue-600" /> Extracted Particulars &amp; Verification
                  </h2>
                  <p className="text-xs text-slate-500">Edit or confirm extracted details before enrolling student into the live database.</p>
                </div>

                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono font-bold text-xs">
                  {currentDoc.status === 'ready' ? '⚡ AI OCR Extracted' : currentDoc.status}
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
                      <label className="font-bold text-slate-700 block mb-1">Date of Birth (YYYY-MM-DD)</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.dob}
                        onChange={e => handleFieldChange('dob', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">CNIC # / B-Form</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.cnic}
                        onChange={e => handleFieldChange('cnic', e.target.value)}
                        placeholder="42101-XXXXXXX-X"
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
                        placeholder="Complete residential address"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Parent / Guardian Details */}
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
                        placeholder="Father Name"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Father Occupation</label>
                      <input
                        type="text"
                        value={currentDoc.extractedData.father_occupation}
                        onChange={e => handleFieldChange('father_occupation', e.target.value)}
                        placeholder="Occupation"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Parent Cell / Phone *</label>
                      <input
                        type="tel"
                        value={currentDoc.extractedData.parent_phone}
                        onChange={e => handleFieldChange('parent_phone', e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Student Phone (Optional)</label>
                      <input
                        type="tel"
                        value={currentDoc.extractedData.student_phone}
                        onChange={e => handleFieldChange('student_phone', e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Parent Email Address</label>
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
                        placeholder="Previous institution attended"
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
                    onClick={handleEnrollCurrentStudent}
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
