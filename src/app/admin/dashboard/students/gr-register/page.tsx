'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Plus, Printer, Download, Save, Trash2, 
  CheckCircle2, X, Edit3, RefreshCw, LayoutGrid, Table, Check, 
  UserCheck, AlertCircle, ArrowUpDown, Sparkles, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(100);

  // Edit / Assign Modal State
  const [editingRecord, setEditingRecord] = useState<GrRecord | null>(null);
  const [editFormData, setEditFormData] = useState<{ student_name: string; class_name: string; gr_number?: number }>({
    student_name: '',
    class_name: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // New GR Modal State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newFormData, setNewFormData] = useState({
    gr_number: '',
    student_name: '',
    class_name: 'Class XI - Pre-Medical'
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

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = search.toLowerCase().trim();
      const matchesSearch = 
        !search ||
        r.gr_code.toLowerCase().includes(q) ||
        String(r.gr_number).includes(q) ||
        r.student_name.toLowerCase().includes(q) ||
        r.class_name.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (classFilter !== 'all' && !r.class_name.toLowerCase().includes(classFilter.toLowerCase())) return false;

      return true;
    }).sort((a, b) => a.gr_number - b.gr_number);
  }, [records, search, statusFilter, classFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, classFilter, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const assigned = records.filter(r => r.status === 'assigned' && r.student_name.trim().length > 0).length;
    const blank = total - assigned;
    const classesCount = new Set(records.map(r => r.class_name).filter(Boolean)).size;
    return { total, assigned, blank, classesCount };
  }, [records]);

  const handleOpenEdit = (record: GrRecord) => {
    setEditingRecord(record);
    setEditFormData({
      student_name: record.student_name,
      class_name: record.class_name,
      gr_number: record.gr_number
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/gr-register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          student_name: editFormData.student_name.trim(),
          class_name: editFormData.class_name.trim(),
          status: editFormData.student_name.trim() ? 'assigned' : 'blank'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`GR ${data.record.gr_code} updated successfully!`);
        setRecords(prev => prev.map(r => r.id === data.record.id ? data.record : r));
        setEditingRecord(null);
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
        body: JSON.stringify({
          gr_number: newFormData.gr_number ? Number(newFormData.gr_number) : undefined,
          student_name: newFormData.student_name.trim(),
          class_name: newFormData.class_name.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`New General Register record ${data.record.gr_code} assigned!`);
        setRecords(prev => [...prev, data.record]);
        setNewModalOpen(false);
        setNewFormData({ gr_number: '', student_name: '', class_name: 'Class XI - Pre-Medical' });
      } else {
        toast.error(data.error || 'Failed to create record');
      }
    } catch (e: any) {
      toast.error('Create error: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, grCode: string) => {
    if (!confirm(`Are you sure you want to clear ${grCode}?`)) return;
    try {
      const res = await fetch(`/api/admin/gr-register?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Record ${grCode} reset to blank`);
        setRecords(prev => prev.map(r => r.id === id ? { ...r, student_name: '', class_name: '', status: 'blank' } : r));
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (e: any) {
      toast.error('Delete error: ' + e.message);
    }
  };

  const handleExportCsv = () => {
    const headers = ['GR No', 'GR Code', 'Student Name', 'Class / Program', 'Status'];
    const rows = records.map(r => [
      r.gr_number,
      `"${r.gr_code}"`,
      `"${r.student_name || 'BLANK'}"`,
      `"${r.class_name || 'Unassigned'}"`,
      `"${r.status.toUpperCase()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TFC_Official_GR_Register_1_to_${records.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported all ${records.length} GR Register records!`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 font-black flex items-center justify-center">
              <BookOpen size={22} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Official G.R. Register (GR 1 - {stats.total})
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">100% Sequential</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Official continuous General Register numbers (GR-1 to GR-1310) with exact handwritten student entries
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
            <Plus size={14} /> Assign G.R.
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
          <BookOpen size={14} /> G.R. Register ({stats.total})
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
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total G.R. Numbers</p>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[10px] text-slate-500 font-medium">Sequential slots (GR-1 to GR-1310)</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Assigned Students</p>
          <p className="text-2xl font-black text-emerald-600">{stats.assigned}</p>
          <p className="text-[10px] text-emerald-600/80 font-medium">Verified handwritten entries</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Blank / Available</p>
          <p className="text-2xl font-black text-amber-600">{stats.blank}</p>
          <p className="text-[10px] text-amber-600/80 font-medium">Available G.R. slots</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Classes</p>
          <p className="text-2xl font-black text-indigo-600">{stats.classesCount}</p>
          <p className="text-[10px] text-slate-500 font-medium">Class streams registered</p>
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
            placeholder="Search GR No (e.g. 116, 139, 301, 1229), Student Name, Class..."
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

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={250}>250 / page</option>
            <option value={500}>500 / page</option>
            <option value={1310}>Show All (1310)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'}`}
              title="Official Ledger Table"
            >
              <Table size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'}`}
              title="Ledger Cards Grid"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <BookOpen size={40} className="mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-base">No G.R. records matched</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Try clearing search filters or add a new G.R. number.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Official Data Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[11px]">
                  <th className="py-3.5 px-4 w-28">G.R. No</th>
                  <th className="py-3.5 px-4">Student Full Name</th>
                  <th className="py-3.5 px-4">Class / Academic Program</th>
                  <th className="py-3.5 px-4 text-center w-32">Status</th>
                  <th className="py-3.5 px-4 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map(rec => {
                  const isBlank = rec.status === 'blank' || !rec.student_name;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-blue-900 text-sm">
                        {rec.gr_code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {isBlank ? (
                          <span className="text-amber-600 font-medium italic">-- Blank / Available Slot --</span>
                        ) : (
                          rec.student_name
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {rec.class_name ? (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100">
                            {rec.class_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isBlank ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            Blank Slot
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 size={11} /> Assigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 size={13} /> {isBlank ? 'Assign' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id, rec.gr_code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Clear entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Grid Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedRecords.map(rec => {
            const isBlank = rec.status === 'blank' || !rec.student_name;

            return (
              <div
                key={rec.id}
                className={`p-5 bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-3 hover:shadow-md ${
                  isBlank ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs">
                    {rec.gr_code}
                  </span>

                  {isBlank ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      Blank Slot
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 size={10} /> Assigned
                    </span>
                  )}
                </div>

                <div>
                  {isBlank ? (
                    <p className="font-bold text-amber-700 text-sm">Available Slot</p>
                  ) : (
                    <h4 className="font-bold text-slate-900 text-sm truncate">{rec.student_name}</h4>
                  )}
                  <p className="text-xs text-blue-600 font-semibold truncate mt-1">
                    {rec.class_name || 'No Class Assigned'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">GR #{rec.gr_number}</span>
                  <button
                    onClick={() => handleOpenEdit(rec)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 size={12} /> {isBlank ? 'Assign' : 'Edit'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {filteredRecords.length > pageSize && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <div>
            Showing <span className="text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * pageSize, filteredRecords.length)}</span> of <span className="text-slate-900">{filteredRecords.length}</span> entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-black">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit / Assign Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-xs">
                  {editingRecord.gr_code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">Edit G.R. Entry</h3>
              </div>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={editFormData.student_name}
                  onChange={e => setEditFormData({ ...editFormData, student_name: e.target.value })}
                  placeholder="Leave empty for blank slot"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Academic Program</label>
                <select
                  value={editFormData.class_name}
                  onChange={e => setEditFormData({ ...editFormData, class_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs"
                >
                  <option value="">-- No Class / Blank --</option>
                  {OFFICIAL_CLASSES.map(c => (
                    <option key={c.key} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                Save G.R. Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New G.R. Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
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
                <label className="block font-bold text-slate-700 mb-1">G.R. Number (e.g. 1311, 1312...)</label>
                <input
                  type="number"
                  value={newFormData.gr_number}
                  onChange={e => setNewFormData({ ...newFormData, gr_number: e.target.value })}
                  placeholder="Auto-assigned if left blank"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  value={newFormData.student_name}
                  onChange={e => setNewFormData({ ...newFormData, student_name: e.target.value })}
                  placeholder="Enter student name (or leave empty for blank slot)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Academic Program</label>
                <select
                  value={newFormData.class_name}
                  onChange={e => setNewFormData({ ...newFormData, class_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs"
                >
                  <option value="">-- No Class / Blank --</option>
                  {OFFICIAL_CLASSES.map(c => (
                    <option key={c.key} value={c.name}>{c.name}</option>
                  ))}
                </select>
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
