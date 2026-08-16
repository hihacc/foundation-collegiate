'use client';

import { useState, useEffect } from 'react';
import { 
  Bot, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Star, 
  Check, 
  Clock, 
  Sliders,
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AiModelSpec, AiConnectionConfig, AI_MODELS_REGISTRY } from '@/lib/ai/modelRegistry';

export default function AiScannerSettingsPage() {
  const [connections, setConnections] = useState<AiConnectionConfig[]>([]);
  const [models, setModels] = useState<AiModelSpec[]>(AI_MODELS_REGISTRY);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Add / Edit Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>('Hugging Face - Secondary');
  const [formProvider, setFormProvider] = useState<'huggingface' | 'google' | 'groq' | 'local'>('huggingface');
  const [formKey, setFormKey] = useState<string>('');
  const [formModel, setFormModel] = useState<string>('Qwen/Qwen2.5-VL-7B-Instruct');
  const [formIsDefault, setFormIsDefault] = useState<boolean>(false);
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Live Test Modal State
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai-settings');
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections || []);
        if (data.available_models) setModels(data.available_models);
      }
    } catch (err: any) {
      toast.error('Failed to load AI settings: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a connection name.');
      return;
    }
    if (formProvider !== 'local' && !formKey.trim() && !editingId) {
      toast.error('Please enter the API key or token.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          name: formName.trim(),
          provider: formProvider,
          plain_api_key: formKey.trim() || undefined,
          model_id: formModel,
          is_default: formIsDefault
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Connection updated!' : 'New AI connection added successfully!');
        setShowAddModal(false);
        setEditingId(null);
        setFormKey('');
        fetchConnections();
      } else {
        toast.error(data.error || 'Failed to save connection');
      }
    } catch (err: any) {
      toast.error('Error saving connection: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'set_default' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Active primary AI provider updated!');
        fetchConnections();
      }
    } catch (err: any) {
      toast.error('Failed to update default: ' + err.message);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to remove this AI connection?')) return;
    try {
      const res = await fetch(`/api/admin/ai-settings?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Connection deleted.');
        fetchConnections();
      }
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleRunTest = async (connectionId?: string, customModel?: string) => {
    setIsTesting(true);
    setShowTestModal(true);
    setTestResult(null);
    setTestingConnectionId(connectionId || null);

    try {
      const res = await fetch('/api/admin/ai-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          model_id: customModel || formModel
        })
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        toast.success(`Model test passed in ${data.latency_ms}ms!`);
      } else if (data.status === 'credits_depleted') {
        toast.warning('Model test notice: Monthly credits depleted.');
      } else {
        toast.error('Model test failed: ' + (data.error || 'Unknown error'));
      }
      fetchConnections();
    } catch (err: any) {
      setTestResult({ success: false, status: 'failed', error: err.message });
      toast.error('Test failed: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const activeConnection = connections.find(c => c.is_default) || connections[0];
  const selectedModelSpec = models.find(m => m.id === (activeConnection?.model_id || 'Qwen/Qwen2.5-VL-7B-Instruct')) || models[0];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <Link
            href="/admin/dashboard/students/scanner"
            className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 mb-1"
          >
            <ArrowLeft size={14} /> Back to Document Scanner
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Bot size={28} className="text-blue-600" />
            AI Scanner Settings &amp; Credentials
          </h1>
          <p className="text-xs text-slate-500">
            Configure multiple Hugging Face / Vision AI accounts, select optimal models, and manage zero-quota auto-fallbacks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormName(`Hugging Face - Account #${connections.length + 1}`);
              setFormProvider('huggingface');
              setFormKey('');
              setFormModel('Qwen/Qwen2.5-VL-7B-Instruct');
              setFormIsDefault(false);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} /> Add AI Key / Connection
          </button>
        </div>
      </div>

      {/* CURRENT ACTIVE PROVIDER BANNER */}
      {activeConnection && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                Active Primary Engine
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {activeConnection.id}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400" />
              {activeConnection.name}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 font-mono">
                <Cpu size={14} className="text-cyan-400" /> {activeConnection.model_id}
              </span>
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck size={14} className="text-emerald-400" /> {activeConnection.masked_key}
              </span>
              {activeConnection.latency_ms && (
                <span className="flex items-center gap-1 font-mono text-cyan-300">
                  <Clock size={13} /> {activeConnection.latency_ms}ms
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleRunTest(activeConnection.id, activeConnection.model_id)}
              disabled={isTesting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              <span>Test Selected Model</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: MODEL SELECTION & BENCHMARK RATINGS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers size={20} className="text-blue-600" /> Recommended Vision OCR Models
            </h2>
            <p className="text-xs text-slate-500">
              Select the model best suited for handwritten physical admission forms.
            </p>
          </div>
        </div>

        {/* Model Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => {
            const isSelected = activeConnection?.model_id === model.id;
            return (
              <div
                key={model.id}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 relative ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {model.isRecommended && (
                  <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                    ⭐ Recommended for TFC
                  </span>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{model.name}</h4>
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                        Size: {model.size} • {model.level}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase">
                      {model.provider}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {model.description}
                  </p>
                </div>

                {/* Accuracy & Speed Ratings */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Accuracy:</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < model.accuracy ? 'currentColor' : 'none'} className={i < model.accuracy ? 'text-amber-500' : 'text-slate-300'} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Speed:</span>
                    <div className="flex items-center gap-0.5 text-emerald-600">
                      {[...Array(5)].map((_, i) => (
                        <Zap key={i} size={12} fill={i < model.speed ? 'currentColor' : 'none'} className={i < model.speed ? 'text-emerald-500' : 'text-slate-300'} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunTest(undefined, model.id)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: MULTIPLE AI CONNECTIONS & CREDENTIALS TABLE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <KeyRound size={20} className="text-blue-600" /> Configured AI Credentials &amp; Accounts
            </h2>
            <p className="text-xs text-slate-500">
              Save multiple API keys (Primary, Backup account 2, Backup account 3) with AES-256 encrypted storage.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormName(`Hugging Face - Account #${connections.length + 1}`);
              setFormProvider('huggingface');
              setFormKey('');
              setFormModel('Qwen/Qwen2.5-VL-7B-Instruct');
              setFormIsDefault(false);
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Add New Key
          </button>
        </div>

        {/* Connections List */}
        <div className="space-y-3">
          {connections.map((conn) => {
            const isWorking = conn.status === 'working';
            const isDepleted = conn.status === 'credits_depleted';

            return (
              <div
                key={conn.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  conn.is_default
                    ? 'border-blue-300 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-sm text-slate-900">{conn.name}</span>
                    {conn.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                        Default
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isWorking
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isDepleted
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isWorking ? '🟢 Working' : isDepleted ? '🟡 Credits Depleted' : '⚪ Not Tested'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="text-slate-700 font-bold">{conn.masked_key}</span>
                    <span>•</span>
                    <span>Model: {conn.model_id}</span>
                    {conn.latency_ms && (
                      <>
                        <span>•</span>
                        <span className="text-cyan-700 font-bold">{conn.latency_ms}ms</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  {!conn.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(conn.id)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRunTest(conn.id, conn.model_id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Zap size={13} /> Test
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteConnection(conn.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="Delete connection"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD / EDIT CONNECTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <KeyRound size={18} className="text-blue-600" />
                {editingId ? 'Edit AI Connection' : 'Add New AI Connection'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Connection Label / Account Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Hugging Face - Backup Account 2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">AI Provider Platform</label>
                <select
                  value={formProvider}
                  onChange={e => setFormProvider(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="huggingface">Hugging Face (Inference API)</option>
                  <option value="google">Google AI Studio (Gemini Vision)</option>
                  <option value="local">Unlimited Local WebAssembly (Free / 0 API)</option>
                </select>
              </div>

              {formProvider !== 'local' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">API Key / Access Token *</label>
                    <button
                      type="button"
                      onClick={() => setShowKeyText(!showKeyText)}
                      className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {showKeyText ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showKeyText ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={formKey}
                    onChange={e => setFormKey(e.target.value)}
                    placeholder={formProvider === 'huggingface' ? 'hf_xxxxxxxxxxxxxxxxxxxx' : 'AIzaSyxxxxxxxxxxxxxxxxx'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required={!editingId}
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    🔒 Key will be encrypted with AES-256 before storing on server.
                  </span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Default OCR Vision Model</label>
                <select
                  value={formModel}
                  onChange={e => setFormModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="Qwen/Qwen2.5-VL-7B-Instruct">Qwen2.5-VL-7B-Instruct (⭐ Recommended for TFC)</option>
                  <option value="Qwen/Qwen2.5-VL-3B-Instruct">Qwen2.5-VL-3B-Instruct (Fast &amp; Light)</option>
                  <option value="Qwen/Qwen2.5-VL-72B-Instruct">Qwen2.5-VL-72B-Instruct (Maximum Precision)</option>
                  <option value="meta-llama/Llama-3.2-11B-Vision-Instruct">Llama-3.2-11B-Vision-Instruct</option>
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  <option value="local-wasm-tesseract">Unlimited Local Engine (0 API)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsDefault"
                  checked={formIsDefault}
                  onChange={e => setFormIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="formIsDefault" className="font-bold text-slate-700 cursor-pointer">
                  Set as primary active engine for document scanning
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  <span>Save Connection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE TEST DIAGNOSTICS MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                Live Model Diagnostic Test
              </h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            {isTesting && (
              <div className="text-center py-8 space-y-3">
                <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">Testing vision model authentication &amp; inference...</p>
                <p className="text-xs text-slate-400">Sending test sample to inference provider...</p>
              </div>
            )}

            {!isTesting && testResult && (
              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-2xl border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : testResult.status === 'credits_depleted'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 font-black text-sm mb-1">
                    {testResult.success ? <CheckCircle2 size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-amber-600" />}
                    <span>{testResult.success ? '🟢 READY FOR SCANNING' : testResult.status === 'credits_depleted' ? '🟡 QUOTA LIMIT REACHED' : '🔴 TEST FAILED'}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{testResult.message || testResult.error}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model:</span>
                    <span className="font-bold text-slate-900">{testResult.model || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider:</span>
                    <span className="font-bold text-slate-900">{testResult.provider || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authentication:</span>
                    <span className="font-bold text-emerald-700">{testResult.auth_valid ? '✓ Valid' : '✗ Failed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Image Input:</span>
                    <span className="font-bold text-emerald-700">{testResult.image_supported ? '✓ Supported' : '✗ Failed'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Response Latency:</span>
                    <span className="font-bold text-cyan-700">{testResult.latency_ms}ms ({((testResult.latency_ms || 0) / 1000).toFixed(1)}s)</span>
                  </div>
                </div>

                {testResult.diagnostics && (
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1">
                    <p className="font-bold">💡 Solution &amp; Recommendation:</p>
                    <p className="text-[11px] leading-relaxed">{testResult.diagnostics.recommendation}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
