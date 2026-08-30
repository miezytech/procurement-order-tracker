import React, { useState, useEffect } from 'react';
import { X, Database, Copy, Download, RefreshCw, Check } from 'lucide-react';
import { ProcurementDatabase } from '../types';

interface DatabaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseViewerModal: React.FC<DatabaseViewerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [dbData, setDbData] = useState<ProcurementDatabase | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error("Failed to load database content", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDatabase();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const jsonString = dbData ? JSON.stringify(dbData, null, 2) : '';

  const handleCopy = () => {
    if (!jsonString) return;
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonString) return;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procurement_db_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        id="database-viewer-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>SQLite/JSON Database Inspector</span>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-medium">
                  data/procurement_db.json
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live inspection of persistent JSON storage engine on server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDatabase}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh database view"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              title="Export database as JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Database Meta Summary */}
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            <strong>Active Records:</strong> <span className="font-mono">{dbData?.purchase_orders.length || 0}</span> Purchase Orders •{' '}
            <span className="font-mono">{dbData?.purchase_orders.reduce((sum, p) => sum + p.items.length, 0) || 0}</span> Total Item Records (Barang Beli)
          </div>
          <div className="text-[11px] text-slate-400">
            Engine: <strong className="text-slate-700">SQLite Compatible JSON Engine</strong> • Format: <strong className="text-slate-700">UTF-8 File Storage</strong>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-indigo-300">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Reading database from disk...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap selection:bg-indigo-900 selection:text-white leading-relaxed">
              {jsonString}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All PO creations automatically persist atomically to this database file.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
