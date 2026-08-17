'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, UserPlus, Search, Filter, Plus, Camera, Download, Printer, 
  MessageCircle, Phone, CheckCircle2, Clock, AlertCircle, Trash2, 
  Edit3, RefreshCw, X, ArrowRight, Check, Sparkles, Loader2, 
  ChevronDown, ExternalLink, Calendar, BookOpen, School, Tag,
  ArrowUpDown, MoreVertical, Copy, TrendingUp, HelpCircle, FileSpreadsheet, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { StudentInquiry, InquiryStatus, InquiryStats } from '@/types/inquiry';
import { InquiryService } from '@/lib/inquiries/inquiryService';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';
import { supabase } from '@/lib/supabase/client';

export default function InquiriesRegisterPage() {
  const [inquiries, setInquiries] = useState<StudentInquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [refFilter, setRefFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [scannerModalOpen, setScannerModalOpen] = useState<boolean>(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState<boolean>(false);
  const [activeInquiry, setActiveInquiry] = useState<StudentInquiry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sr_no: '',
    date: new Date().toLocaleDateString('en-GB'),
    name: '',
    class_name: '',
    contact: '',
    institute: '',
    ref: 'Walk-in',
    status: 'PENDING' as InquiryStatus,
    remarks: ''
  });

  // Scanner State
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedRows, setScannedRows] = useState<any[]>([]);
  const [scanEngine, setScanEngine] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp Message State
  const [customWaMessage, setCustomWaMessage] = useState<string>('');

  // 1. Fetch Inquiries on Load
  const loadInquiries = async () => {
    try {
      setRefreshing(true);
      const data = await InquiryService.getAllInquiries();
      setInquiries(data);
    } catch (e: any) {
      toast.error('Failed to load inquiries: ' + e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  // 2. Compute Live Statistics
  const stats: InquiryStats = useMemo(() => {
    return InquiryService.computeStats(inquiries);
  }, [inquiries]);

  // 3. Extract Unique Classes & References for Dynamic Filter Dropdowns
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach(i => { if (i.class_name) set.add(i.class_name.trim()); });
    return Array.from(set).sort();
  }, [inquiries]);

  const uniqueRefs = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach(i => { if (i.ref) set.add(i.ref.trim()); });
    return Array.from(set).sort();
  }, [inquiries]);

  // 4. Filtered & Searched Inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(item => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (item.name || '').toLowerCase().includes(q) ||
        (item.contact || '').toLowerCase().includes(q) ||
        (item.class_name || '').toLowerCase().includes(q) ||
        (item.institute || '').toLowerCase().includes(q) ||
        (item.ref || '').toLowerCase().includes(q) ||
        String(item.sr_no || '').includes(q)
      );

      // Status match
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      // Class match
      const matchesClass = classFilter === 'ALL' || item.class_name === classFilter;

      // Reference match
      const matchesRef = refFilter === 'ALL' || item.ref === refFilter;

      return matchesSearch && matchesStatus && matchesClass && matchesRef;
    });
  }, [inquiries, searchQuery, statusFilter, classFilter, refFilter]);

  // 5. Handlers
  const handleOpenAddModal = () => {
    // Generate next S.No
    const maxSr = inquiries.reduce((max, cur) => {
      const num = parseInt(String(cur.sr_no).replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 600);

    setFormData({
      sr_no: String(maxSr + 1),
      date: new Date().toLocaleDateString('en-GB'),
      name: '',
      class_name: OFFICIAL_CLASSES[0]?.name || 'Class IX',
      contact: '',
      institute: '',
      ref: 'Near',
      status: 'PENDING',
      remarks: ''
    });
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter student name');
      return;
    }
    if (!formData.contact.trim()) {
      toast.error('Please enter contact number');
      return;
    }

    try {
      const added = await InquiryService.addInquiry({
        sr_no: formData.sr_no || '',
        date: formData.date,
        name: formData.name.trim(),
        class_name: formData.class_name.trim() || 'General',
        contact: formData.contact.trim(),
        institute: formData.institute.trim(),
        ref: formData.ref.trim(),
        status: formData.status,
        remarks: formData.remarks.trim()
      });

      setInquiries(prev => [added, ...prev]);
      toast.success(`Inquiry #${added.sr_no || ''} for ${added.name} recorded successfully!`);
      setAddModalOpen(false);
    } catch (e: any) {
      toast.error('Error adding inquiry: ' + e.message);
    }
  };

  const handleOpenEdit = (inquiry: StudentInquiry) => {
    setActiveInquiry(inquiry);
    setFormData({
      sr_no: String(inquiry.sr_no || ''),
      date: inquiry.date || '',
      name: inquiry.name || '',
      class_name: inquiry.class_name || '',
      contact: inquiry.contact || '',
      institute: inquiry.institute || '',
      ref: inquiry.ref || 'Walk-in',
      status: inquiry.status,
      remarks: inquiry.remarks || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInquiry) return;

    try {
      await InquiryService.updateInquiry(activeInquiry.id, {
        sr_no: formData.sr_no,
        date: formData.date,
        name: formData.name.trim(),
        class_name: formData.class_name.trim(),
        contact: formData.contact.trim(),
        institute: formData.institute.trim(),
        ref: formData.ref.trim(),
        status: formData.status,
        remarks: formData.remarks.trim()
      });

      setInquiries(prev => prev.map(item => item.id === activeInquiry.id ? {
        ...item,
        ...formData
      } : item));

      toast.success('Inquiry details updated!');
      setEditModalOpen(false);
    } catch (e: any) {
      toast.error('Error updating inquiry: ' + e.message);
    }
  };

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      await InquiryService.updateInquiry(inquiryId, { status: newStatus });
      setInquiries(prev => prev.map(i => i.id === inquiryId ? { ...i, status: newStatus } : i));
      toast.success(`Status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error('Error updating status: ' + e.message);
    }
  };

  const handleDelete = async (inquiryId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the inquiry record for "${name}"?`)) return;
    try {
      await InquiryService.deleteInquiry(inquiryId);
      setInquiries(prev => prev.filter(i => i.id !== inquiryId));
      toast.success('Inquiry deleted');
    } catch (e: any) {
      toast.error('Error deleting inquiry: ' + e.message);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected inquiry records?`)) return;

    for (const id of selectedIds) {
      await InquiryService.deleteInquiry(id);
    }
    setInquiries(prev => prev.filter(i => !selectedIds.includes(i.id)));
    setSelectedIds([]);
    toast.success('Selected records deleted');
  };

  const handleBatchStatusUpdate = async (status: InquiryStatus) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await InquiryService.updateInquiry(id, { status });
    }
    setInquiries(prev => prev.map(i => selectedIds.includes(i.id) ? { ...i, status } : i));
    setSelectedIds([]);
    toast.success(`Updated ${selectedIds.length} records to ${status}`);
  };

  // 6. Convert Inquiry to Active Student
  const handleConvertToStudent = async (inquiry: StudentInquiry) => {
    try {
      const randomRoll = 'TFC-' + Math.floor(1000 + Math.random() * 9000);
      const studentPayload = {
        name: inquiry.name,
        roll_number: randomRoll,
        current_class: inquiry.class_name || 'Class IX',
        phone: inquiry.contact,
        email: `${inquiry.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@foundationcollegiate.edu.pk`,
        status: 'Active',
        previous_school: inquiry.institute || ''
      };

      // Save to Supabase
      const { error } = await supabase.from('students').insert([studentPayload]);
      if (error) {
        console.warn('Supabase student insert warning:', error);
      }

      // Mark inquiry as ADMITTED / CONFIRMED
      await InquiryService.updateInquiry(inquiry.id, { status: 'ADMITTED' });
      setInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status: 'ADMITTED' } : i));

      toast.success(`🎉 ${inquiry.name} enrolled as active student (${randomRoll})!`);
    } catch (e: any) {
      toast.error('Error converting student: ' + e.message);
    }
  };

  // 7. WhatsApp Quick Message Handler
  const handleOpenWhatsAppModal = (inquiry: StudentInquiry) => {
    setActiveInquiry(inquiry);
    const template = `Assalam-o-Alaikum ${inquiry.name}! 👋

Thank you for visiting *The Foundation Collegiate (TFC)* regarding admission in *${inquiry.class_name}*.

Our academic session offers:
✅ Expert faculty & individual student mentorship
✅ Comprehensive test series & board exam preparation
✅ Modern multimedia classrooms & science/computer labs

📍 Campus: The Foundation Collegiate
📞 Admissions Desk: 0333-3439458 / 0345-3957551

Let us know if you have any questions or when you would like to complete your admission confirmation. Have a great day!`;
    setCustomWaMessage(template);
    setWhatsappModalOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!activeInquiry?.contact) return;
    const cleanPhone = activeInquiry.contact.replace(/[^0-9]/g, '').replace(/^0/, '92');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWaMessage)}`;
    window.open(waUrl, '_blank');
    setWhatsappModalOpen(false);
    toast.success('WhatsApp conversation launched!');
  };

  // 8. AI Vision Register Scanner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setScannedImage(reader.result as string);
      setScannedRows([]);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAiScan = async () => {
    if (!scannedImage) {
      toast.error('Please upload or capture a photo of the register page first.');
      return;
    }

    setIsScanning(true);
    try {
      const res = await fetch('/api/admin/inquiries/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: scannedImage })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setScannedRows(data.data);
        setScanEngine(data.engineUsed || 'Vision AI Engine');
        toast.success(`✨ Successfully extracted ${data.data.length} student inquiry rows!`);
      } else {
        toast.error(data.error || 'Could not extract rows from image. Please verify lighting and handwriting clarity.');
      }
    } catch (e: any) {
      toast.error('AI Scan Error: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveScannedRows = async () => {
    if (scannedRows.length === 0) return;

    try {
      const added = await InquiryService.batchAddInquiries(scannedRows);
      setInquiries(prev => [...added, ...prev]);
      toast.success(`💾 Saved ${added.length} scanned inquiry records to the database!`);
      setScannerModalOpen(false);
      setScannedImage(null);
      setScannedRows([]);
    } catch (e: any) {
      toast.error('Error saving scanned records: ' + e.message);
    }
  };

  // 9. Export to CSV
  const handleExportCsv = () => {
    if (inquiries.length === 0) {
      toast.error('No inquiry records to export');
      return;
    }

    const headers = ['S.No', 'Date', 'Student Name', 'Class / Program', 'Contact Number', 'Previous Institute', 'Reference', 'Status', 'Remarks'];
    const rows = inquiries.map(i => [
      `"${i.sr_no || ''}"`,
      `"${i.date || ''}"`,
      `"${i.name || ''}"`,
      `"${i.class_name || ''}"`,
      `"${i.contact || ''}"`,
      `"${i.institute || ''}"`,
      `"${i.ref || ''}"`,
      `"${i.status || ''}"`,
      `"${(i.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_Admission_Inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inquiries exported to CSV');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* 1. Header Bar with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Admission Inquiry Register</h1>
              <p className="text-xs text-slate-500 font-medium">Track prospective students, walk-in inquiries, follow-ups, and enrollment conversions</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadInquiries}
            disabled={refreshing}
            className="p-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Refresh Records"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-600' : ''} />
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Printer size={14} /> Print
          </button>

          <button
            onClick={() => setScannerModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-emerald-700/20 cursor-pointer"
          >
            <Camera size={15} />
            <Sparkles size={13} className="text-amber-300" />
            <span>AI Register Scanner</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>New Inquiry</span>
          </button>
        </div>
      </div>

      {/* 2. Top Analytical Stats Bar - Pure Light Theme */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inquiries</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[10px] text-slate-400 font-medium">All recorded leads</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.today}</div>
          <div className="text-[10px] text-slate-400 font-medium">Walk-ins today</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
          <div className="text-[10px] text-slate-400 font-medium">Awaiting decision</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Follow-Up</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Phone size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">{stats.followUp}</div>
          <div className="text-[10px] text-slate-400 font-medium">Active call-backs</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirmed (OK)</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700">{stats.confirmed}</div>
          <div className="text-[10px] text-slate-400 font-medium">Admissions confirmed</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conversion</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats.conversionRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}></div>
          </div>
        </div>

      </div>

      {/* 3. Search & Filter Toolbars */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, contact number, class, reference, or S.No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">🟡 Pending</option>
              <option value="FOLLOW_UP">🔵 Follow-Up</option>
              <option value="CONFIRMED">🟢 Confirmed (OK)</option>
              <option value="ADMITTED">🟣 Admitted</option>
              <option value="DROPPED">⚪ Dropped</option>
            </select>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Ref Filter */}
            <select
              value={refFilter}
              onChange={(e) => setRefFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Sources / Ref</option>
              {uniqueRefs.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {(searchQuery || statusFilter !== 'ALL' || classFilter !== 'ALL' || refFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setClassFilter('ALL');
                  setRefFilter('ALL');
                }}
                className="p-2 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-500 text-xs font-bold cursor-pointer"
                title="Reset Filters"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Multi-Selection Batch Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-bold text-emerald-950">
              {selectedIds.length} records selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBatchStatusUpdate('CONFIRMED')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Mark Confirmed (OK)
              </button>
              <button
                onClick={() => handleBatchStatusUpdate('FOLLOW_UP')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Mark Follow-Up
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Inquiries Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredInquiries.length > 0 && selectedIds.length === filteredInquiries.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredInquiries.map(i => i.id));
                      else setSelectedIds([]);
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-16">S.No</th>
                <th className="py-3.5 px-3 w-24">Date</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Class / Program</th>
                <th className="py-3.5 px-4">Contact Number</th>
                <th className="py-3.5 px-4">Institute</th>
                <th className="py-3.5 px-3">Ref</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <Loader2 size={28} className="animate-spin text-emerald-600 mx-auto mb-2" />
                    <span className="font-bold">Loading admission inquiries...</span>
                  </td>
                </tr>
              ) : filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-sm text-slate-600">No inquiry records found</div>
                    <p className="text-xs text-slate-400 mt-0.5">Try changing filters or click &quot;New Inquiry&quot; or &quot;AI Register Scanner&quot; to add records.</p>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => {
                  const isSelected = selectedIds.includes(inquiry.id);
                  return (
                    <tr 
                      key={inquiry.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(prev => [...prev, inquiry.id]);
                            else setSelectedIds(prev => prev.filter(id => id !== inquiry.id));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* S.No */}
                      <td className="py-3 px-3 font-mono font-black text-slate-800">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px]">
                          {inquiry.sr_no || '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {inquiry.date || '—'}
                      </td>

                      {/* Student Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {inquiry.name ? inquiry.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{inquiry.name}</div>
                            {inquiry.remarks && (
                              <div className="text-[10px] text-slate-400 line-clamp-1 italic">{inquiry.remarks}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200/80 inline-block whitespace-nowrap">
                          {inquiry.class_name || 'General'}
                        </span>
                      </td>

                      {/* Contact Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`tel:${inquiry.contact}`} 
                            className="hover:text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Phone size={11} className="text-slate-400" />
                            {inquiry.contact || '—'}
                          </a>
                        </div>
                      </td>

                      {/* Institute */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="text-xs truncate max-w-[140px] block" title={inquiry.institute || ''}>
                          {inquiry.institute || '—'}
                        </span>
                      </td>

                      {/* Ref */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {inquiry.ref || 'Near'}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-3">
                        <select
                          value={inquiry.status}
                          onChange={(e) => handleStatusChange(inquiry.id, e.target.value as InquiryStatus)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border cursor-pointer focus:outline-none ${
                            inquiry.status === 'CONFIRMED' || inquiry.status === 'ADMITTED'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : inquiry.status === 'FOLLOW_UP'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : inquiry.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="FOLLOW_UP">FOLLOW-UP</option>
                          <option value="CONFIRMED">OK / CONFIRMED</option>
                          <option value="ADMITTED">ADMITTED</option>
                          <option value="DROPPED">DROPPED</option>
                        </select>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* WhatsApp Chat Button */}
                          <button
                            onClick={() => handleOpenWhatsAppModal(inquiry)}
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            title="Send WhatsApp Follow-up"
                          >
                            <MessageCircle size={14} />
                          </button>

                          {/* Convert to Enrolled Student */}
                          {inquiry.status !== 'ADMITTED' && (
                            <button
                              onClick={() => handleConvertToStudent(inquiry)}
                              className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer"
                              title="Convert to Enrolled Student"
                            >
                              <UserPlus size={14} />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(inquiry)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Edit Inquiry"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(inquiry.id, inquiry.name)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <b>{filteredInquiries.length}</b> of <b>{inquiries.length}</b> inquiries
          </div>
          <div className="font-mono text-[11px]">
            The Foundation Collegiate &bull; Admissions Ledger
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: ADD NEW INQUIRY (QUICK MANUAL ENTRY)
      ========================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">New Admission Inquiry</h3>
                  <p className="text-[11px] text-slate-500">Record a new student walk-in or phone call inquiry</p>
                </div>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">S.No / Register Sr</label>
                  <input
                    type="text"
                    value={formData.sr_no}
                    onChange={(e) => setFormData({ ...formData, sr_no: e.target.value })}
                    placeholder="e.g. 645"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. 17/9/24"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Student Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Areeba / Wasim"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Class / Program *</label>
                  <input
                    type="text"
                    required
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    placeholder="e.g. Eng Lang, IX, XI-Sc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g. 0345-3957551"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Previous Institute</label>
                  <input
                    type="text"
                    value={formData.institute}
                    onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                    placeholder="e.g. Army Public School"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Reference / Source</label>
                  <input
                    type="text"
                    value={formData.ref}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                    placeholder="e.g. Near, Walk-in, Friend"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InquiryStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="FOLLOW_UP">FOLLOW-UP</option>
                    <option value="CONFIRMED">OK / CONFIRMED</option>
                    <option value="ADMITTED">ADMITTED</option>
                    <option value="DROPPED">DROPPED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Remarks / Notes</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Interested in evening shift"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Save Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: EDIT INQUIRY
      ========================================================== */}
      {editModalOpen && activeInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Inquiry Details</h3>
                  <p className="text-[11px] text-slate-500">Modify register fields for {activeInquiry.name}</p>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">S.No</label>
                  <input
                    type="text"
                    value={formData.sr_no}
                    onChange={(e) => setFormData({ ...formData, sr_no: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Student Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Class / Program</label>
                  <input
                    type="text"
                    required
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Previous Institute</label>
                  <input
                    type="text"
                    value={formData.institute}
                    onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Reference / Source</label>
                  <input
                    type="text"
                    value={formData.ref}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InquiryStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="FOLLOW_UP">FOLLOW-UP</option>
                    <option value="CONFIRMED">OK / CONFIRMED</option>
                    <option value="ADMITTED">ADMITTED</option>
                    <option value="DROPPED">DROPPED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Remarks / Notes</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: AI REGISTER / HANDWRITING SCANNER
      ========================================================== */}
      {scannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">AI Inquiry Register Vision Scanner</h3>
                  <p className="text-xs text-slate-500">Upload or capture handwritten ledger pages to extract all rows automatically into the database</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setScannerModalOpen(false);
                  setScannedImage(null);
                  setScannedRows([]);
                }} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Upload / Capture Document Photo */}
            {!scannedImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 text-emerald-700 flex items-center justify-center shadow-xs">
                  <Camera size={32} />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900">Click to Upload or Snap Register Photo</div>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Supports high-resolution photographs of handwritten ledger books (JPG, PNG, WebP)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Image Preview & AI Trigger Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img 
                      src={scannedImage} 
                      alt="Register Preview" 
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs" 
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900">Inquiry Ledger Photo Loaded</span>
                      <p className="text-[11px] text-slate-500">Ready for automated handwriting multi-row OCR extraction</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannedImage(null);
                        setScannedRows([]);
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      Change Photo
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleRunAiScan}
                      disabled={isScanning}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                    >
                      {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>{isScanning ? 'Extracting Rows...' : 'Run AI Extraction'}</span>
                    </button>
                  </div>
                </div>

                {/* Loading State Animation */}
                {isScanning && (
                  <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3 animate-in fade-in">
                    <Loader2 size={36} className="animate-spin text-emerald-600 mx-auto" />
                    <div className="font-bold text-sm text-emerald-950">AI Vision Analyzing Handwriting &amp; Ledger Grid...</div>
                    <p className="text-xs text-emerald-800/80">Parsing S.No, Date, Names, Classes, Contact Numbers, and References</p>
                  </div>
                )}

                {/* Step 2: Extracted Rows Table Preview & Inline Editor */}
                {scannedRows.length > 0 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">
                          Extracted Rows ({scannedRows.length})
                        </span>
                        {scanEngine && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {scanEngine}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">You can edit any cell directly before saving</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 sticky top-0">
                            <th className="py-2.5 px-3">S.No</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Student Name</th>
                            <th className="py-2.5 px-3">Class</th>
                            <th className="py-2.5 px-3">Contact</th>
                            <th className="py-2.5 px-3">Ref</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scannedRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.sr_no || ''}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].sr_no = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.date || ''}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].date = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.name || ''}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].name = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="w-full min-w-[120px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.class_name || ''}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].class_name = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.contact || ''}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].contact = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  type="text"
                                  value={row.ref || ''}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].ref = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={row.status || 'PENDING'}
                                  onChange={(e) => {
                                    const next = [...scannedRows];
                                    next[idx].status = e.target.value;
                                    setScannedRows(next);
                                  }}
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold"
                                >
                                  <option value="PENDING">PENDING</option>
                                  <option value="CONFIRMED">CONFIRMED</option>
                                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                                </select>
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setScannedRows(scannedRows.filter((_, i) => i !== idx))}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScannedRows([
                            ...scannedRows,
                            { sr_no: '', date: new Date().toLocaleDateString('en-GB'), name: '', class_name: 'IX', contact: '', ref: 'Near', status: 'PENDING' }
                          ]);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Add Row
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveScannedRows}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                      >
                        <Check size={16} />
                        <span>Save All ({scannedRows.length}) Inquiries to Database</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: WHATSAPP QUICK FOLLOW-UP DISPATCHER
      ========================================================== */}
      {whatsappModalOpen && activeInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Send WhatsApp Follow-up</h3>
                  <p className="text-[11px] text-slate-500">Dispatch inquiry greeting to {activeInquiry.name} ({activeInquiry.contact})</p>
                </div>
              </div>
              <button onClick={() => setWhatsappModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Recipient Phone</label>
                <input
                  type="text"
                  readOnly
                  value={activeInquiry.contact || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-mono font-bold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Message Text</label>
                <textarea
                  rows={7}
                  value={customWaMessage}
                  onChange={(e) => setCustomWaMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsappModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Launch WhatsApp Chat</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
