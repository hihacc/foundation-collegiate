'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, Plus, Printer, Download, Eye, 
  RotateCw, ZoomIn, ZoomOut, Maximize2, Save, Trash2, CheckCircle2, 
  AlertCircle, Sparkles, X, ChevronRight, User, Phone, Calendar, 
  School, FileText, Check, LayoutGrid, Table, ArrowRight, ShieldCheck,
  RefreshCw, Edit3, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { GrRecord, INITIAL_GR_RECORDS } from '@/lib/data/grRegisterData';
import { OFFICIAL_CLASSES } from '@/lib/utils/classes';
import Link from 'next/link';

export default function GrRegisterPage() {
  const [records, setRecords] = useState<GrRecord[]>(INITIAL_GR_RECORDS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'blank'>('all');
  const [classFilter, setClassFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Inspection / Editor Modal State
  const [selectedRecord, setSelectedRecord] = useState<GrRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<GrRecord>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgRotate, setImgRotate] = useState(0);

  // New Record Modal State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newFormData, setNewFormData] = useState<Partial<GrRecord>>({
    class_name: 'Class XI - Pre-Medical',
    status: 'assigned',
    admission_date: new Date().toISOString().split('T')[0]
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/gr-register');
      const data = await res.json();
      if (data.success && Array.isArray(data.records) && data.records.length > 0) {
        setRecords(data.records);
      }
    } catch {
      // Keep initial records
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = search.toLowerCase().trim();
      const matchesSearch = 
        !search ||
        r.gr_code.toLowerCase().includes(q) ||
        String(r.gr_number).includes(q) ||
        r.student_name.toLowerCase().includes(q) ||
        r.father_name.toLowerCase().includes(q) ||
        r.class_name.toLowerCase().includes(q) ||
        (r.phone && r.phone.includes(q)) ||
        (r.remarks && r.remarks.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (classFilter !== 'all' && !r.class_name.toLowerCase().includes(classFilter.toLowerCase())) return false;

      return true;
    });
  }, [records, search, statusFilter, classFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const assigned = records.filter(r => r.status === 'assigned').length;
    const blank = records.filter(r => r.status === 'blank').length;
    const classesCount = new Set(records.map(r => r.class_name).filter(Boolean)).size;
    return { total, assigned, blank, classesCount };
  }, [records]);

  const handleOpenInspect = (record: GrRecord) => {
    setSelectedRecord(record);
    setEditFormData({ ...record });
    setImgZoom(1);
    setImgRotate(0);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/gr-register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          ...editFormData
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`GR Record ${data.record.gr_code} updated successfully!`);
        setRecords(prev => prev.map(r => r.id === data.record.id ? data.record : r));
        setSelectedRecord(data.record);
      } else {
        toast.error(data.error || 'Failed to update record');
      }
    } catch (e: any) {
      toast.error('Save error: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/gr-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`New General Register record ${data.record.gr_code} created!`);
        setRecords(prev => [...prev, data.record]);
        setNewModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to create record');
      }
    } catch (e: any) {
      toast.error('Create error: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['GR No', 'GR Code', 'Student Name', 'Father Name', 'Class Program', 'Admission Date', 'DOB', 'Phone', 'CNIC/B-Form', 'Status', 'Image Filename'];
    const rows = records.map(r => [
      r.gr_number,
      `"${r.gr_code}"`,
      `"${r.student_name || 'BLANK'}"`,
      `"${r.father_name || ''}"`,
      `"${r.class_name || ''}"`,
      `"${r.admission_date || ''}"`,
      `"${r.dob || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.cnic_bform || ''}"`,
      `"${r.status.toUpperCase()}"`,
      `"${r.image_name}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_General_Register_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('GR Register CSV exported successfully!');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 font-black flex items-center justify-center">
              <BookOpen size={22} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Official G.R. General Register
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">Ledger Archive</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Official General Register (GR-001, GR-002, ...) with digital archival scans, paper ledger photos &amp; student profiling
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={14} /> Print Ledger
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} /> Assign New G.R.
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs inside Students Section */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-200">
        <Link 
          href="/admin/dashboard/students" 
          className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
        >
          All Students (Roster)
        </Link>
        <Link 
          href="/admin/dashboard/students/gr-register" 
          className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-black whitespace-nowrap flex items-center gap-1.5"
        >
          <BookOpen size={14} /> G.R. Register Ledger ({stats.total})
        </Link>
        <Link 
          href="/admin/dashboard/students/scanner" 
          className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Sparkles size={14} /> AI Paper Form Scanner
        </Link>
        <Link 
          href="/admin/dashboard/students/birthdays" 
          className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
        >
          Birthdays
        </Link>
      </div>

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total G.R. Pages</p>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[10px] text-slate-500 font-medium">Scanned paper pages indexed</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Assigned Students</p>
          <p className="text-2xl font-black text-emerald-600">{stats.assigned}</p>
          <p className="text-[10px] text-emerald-600/80 font-medium">Verified enrollment records</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Blank / Unassigned</p>
          <p className="text-2xl font-black text-amber-600">{stats.blank}</p>
          <p className="text-[10px] text-amber-600/80 font-medium">Available register slots</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Programs</p>
          <p className="text-2xl font-black text-indigo-600">{stats.classesCount}</p>
          <p className="text-[10px] text-slate-500 font-medium">Class streams ledgered</p>
        </div>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search GR No (e.g. 1, GR-005), student name, father name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'assigned', 'blank'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all' ? `All (${records.length})` : tab === 'assigned' ? `Assigned (${stats.assigned})` : `Blank (${stats.blank})`}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">All Classes</option>
            {OFFICIAL_CLASSES.map(c => (
              <option key={c.key} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'}`}
              title="Visual Register Gallery"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'}`}
              title="Ledger Data Table"
            >
              <Table size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <BookOpen size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-base">No General Register records matched</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Try clearing search filters or assign a new G.R. number.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Register Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRecords.map(rec => {
            const isBlank = rec.status === 'blank' || !rec.student_name;

            return (
              <div
                key={rec.id}
                className={`group bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col hover:shadow-md ${
                  isBlank ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                {/* Image Thumbnail Container */}
                <div 
                  onClick={() => handleOpenInspect(rec)}
                  className="relative h-48 bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  <img
                    src={rec.image_path}
                    alt={rec.gr_code}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  
                  {/* Floating GR Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-white font-mono font-black text-xs border border-white/20 flex items-center gap-1.5 shadow-md">
                    <span>{rec.gr_code}</span>
                  </div>

                  {/* Status Pill */}
                  <div className="absolute top-3 right-3">
                    {isBlank ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-bold text-[10px] shadow-sm">
                        Blank Page
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={11} /> Assigned
                      </span>
                    )}
                  </div>

                  {/* Hover Inspect Overlay */}
                  <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-2xs">
                    <Eye size={16} /> Click to Inspect &amp; Edit
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {isBlank ? (
                      <div className="space-y-1">
                        <h4 className="font-bold text-amber-800 text-sm">Unassigned Register Page</h4>
                        <p className="text-[11px] text-amber-600">This register page has not yet been linked to an enrolled student.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{rec.student_name}</h4>
                        <p className="text-xs text-slate-500 truncate">S/O {rec.father_name || 'N/A'}</p>
                        <p className="text-[11px] font-semibold text-blue-600 truncate">{rec.class_name || 'General Program'}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rec.admission_date ? `Adm: ${rec.admission_date}` : 'No date'}
                    </span>

                    <button
                      onClick={() => handleOpenInspect(rec)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} /> {isBlank ? 'Assign' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Official Data Table View */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[11px]">
                  <th className="py-3.5 px-4">G.R. No</th>
                  <th className="py-3.5 px-4">Register Scan</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Father Name</th>
                  <th className="py-3.5 px-4">Class Program</th>
                  <th className="py-3.5 px-4">Date of Adm</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => {
                  const isBlank = rec.status === 'blank' || !rec.student_name;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-blue-900 text-sm">
                        {rec.gr_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => handleOpenInspect(rec)}
                          className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 shrink-0 hover:opacity-80 transition-opacity relative group"
                        >
                          <img src={rec.image_path} alt={rec.gr_code} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                            <Eye size={12} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isBlank ? <span className="text-amber-600 italic">-- Blank Page --</span> : rec.student_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {rec.father_name || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-blue-600 font-semibold">
                        {rec.class_name || '--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {rec.admission_date || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isBlank ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            Blank
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 size={11} /> Assigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenInspect(rec)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          {isBlank ? 'Assign Student' : 'Inspect & Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Scanned Register Image Lightbox & Side-by-Side Editor Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-mono font-black text-sm">
                  {selectedRecord.gr_code}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">General Register Scanned Record</h3>
                  <p className="text-xs text-slate-400">Archival verification and official ledger registration</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedRecord.image_path}
                  download={selectedRecord.image_name}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Download Scanned Image"
                >
                  <Download size={16} />
                </a>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Panel Side-by-Side Layout */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* Left Panel: High-Resolution Scanned Photo Inspector */}
              <div className="flex-1 bg-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[360px] lg:min-h-0">
                {/* Image Toolbar */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-lg">
                  <button
                    onClick={() => setImgZoom(prev => Math.min(prev + 0.25, 3))}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => setImgZoom(prev => Math.max(prev - 0.25, 0.5))}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={() => setImgRotate(prev => (prev + 90) % 360)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
                    title="Rotate 90°"
                  >
                    <RotateCw size={16} />
                  </button>
                  <button
                    onClick={() => { setImgZoom(1); setImgRotate(0); }}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Reset
                  </button>
                </div>

                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  <img
                    src={selectedRecord.image_path}
                    alt={selectedRecord.gr_code}
                    style={{
                      transform: `scale(${imgZoom}) rotate(${imgRotate}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-h-[70vh] object-contain rounded-xl shadow-2xl"
                  />
                </div>
              </div>

              {/* Right Panel: Official Student Fields Editor */}
              <div className="w-full lg:w-[440px] bg-white p-6 flex flex-col justify-between overflow-y-auto space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Edit3 size={15} className="text-blue-600" /> Student Profile Details
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">{selectedRecord.image_name}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                      <input
                        type="text"
                        value={editFormData.student_name || ''}
                        onChange={e => setEditFormData({ ...editFormData, student_name: e.target.value })}
                        placeholder="Leave blank if unassigned page"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Father Name</label>
                      <input
                        type="text"
                        value={editFormData.father_name || ''}
                        onChange={e => setEditFormData({ ...editFormData, father_name: e.target.value })}
                        placeholder="Father's full name"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Class Program</label>
                        <select
                          value={editFormData.class_name || ''}
                          onChange={e => setEditFormData({ ...editFormData, class_name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs"
                        >
                          <option value="">-- Select Class --</option>
                          {OFFICIAL_CLASSES.map(c => (
                            <option key={c.key} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Admission Date</label>
                        <input
                          type="date"
                          value={editFormData.admission_date || ''}
                          onChange={e => setEditFormData({ ...editFormData, admission_date: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={editFormData.dob || ''}
                          onChange={e => setEditFormData({ ...editFormData, dob: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                        <input
                          type="text"
                          value={editFormData.phone || ''}
                          onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                          placeholder="03XX-XXXXXXX"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">B-Form / CNIC No</label>
                      <input
                        type="text"
                        value={editFormData.cnic_bform || ''}
                        onChange={e => setEditFormData({ ...editFormData, cnic_bform: e.target.value })}
                        placeholder="42101-XXXXXXX-X"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Previous School / College</label>
                      <input
                        type="text"
                        value={editFormData.previous_school || ''}
                        onChange={e => setEditFormData({ ...editFormData, previous_school: e.target.value })}
                        placeholder="School name attended previously"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ledger Remarks / Notes</label>
                      <textarea
                        rows={2}
                        value={editFormData.remarks || ''}
                        onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                        placeholder="Archival notes, verified document list, etc."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Record Status</label>
                      <select
                        value={editFormData.status || (editFormData.student_name ? 'assigned' : 'blank')}
                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs"
                      >
                        <option value="assigned">Assigned / Active Student</option>
                        <option value="blank">Blank / Unassigned Page</option>
                        <option value="reserved">Reserved Slot</option>
                        <option value="archived">Archived Record</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    Save G.R. Record
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Assign New G.R. Record Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Assign New G.R. Number</h3>
              </div>
              <button onClick={() => setNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  value={newFormData.student_name || ''}
                  onChange={e => setNewFormData({ ...newFormData, student_name: e.target.value })}
                  placeholder="Enter student name (or leave empty for blank page)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={newFormData.father_name || ''}
                  onChange={e => setNewFormData({ ...newFormData, father_name: e.target.value })}
                  placeholder="Father full name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Program</label>
                  <select
                    value={newFormData.class_name || 'Class XI - Pre-Medical'}
                    onChange={e => setNewFormData({ ...newFormData, class_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs"
                  >
                    {OFFICIAL_CLASSES.map(c => (
                      <option key={c.key} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={newFormData.admission_date || ''}
                    onChange={e => setNewFormData({ ...newFormData, admission_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newFormData.phone || ''}
                  onChange={e => setNewFormData({ ...newFormData, phone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={newFormData.remarks || ''}
                  onChange={e => setNewFormData({ ...newFormData, remarks: e.target.value })}
                  placeholder="Ledger verification remarks"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setNewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Create &amp; Assign GR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
