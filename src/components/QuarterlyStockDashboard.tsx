import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  Layers, 
  PackageCheck, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  ShieldCheck, 
  Check, 
  FileSpreadsheet, 
  ChevronRight, 
  Info, 
  TrendingUp, 
  Box, 
  Sparkles,
  ExternalLink,
  Package,
  AlertCircle,
  HelpCircle,
  Tag
} from 'lucide-react';
import { 
  QuarterlyStockReport, 
  AvailableQuarter, 
  QuarterlyStockItem, 
  QuarterlyCategoryBreakdown,
  ItemWithParentPO,
  POStatus,
  PurchaseOrder
} from '../types';
import { Currency, formatCurrency, formatDate } from '../utils/formatters';

interface QuarterlyStockDashboardProps {
  currency: Currency;
  onSelectItem: (item: ItemWithParentPO) => void;
  onViewPO: (poNumber: string) => void;
  onLogGoodsReceipt: (poId?: string) => void;
  onCreatePO: () => void;
  onRefreshParent: () => void;
  lastUpdatedTimestamp?: number;
}

export function QuarterlyStockDashboard({
  currency,
  onSelectItem,
  onViewPO,
  onLogGoodsReceipt,
  onCreatePO,
  onRefreshParent,
  lastUpdatedTimestamp
}: QuarterlyStockDashboardProps) {
  const [selectedQuarterKey, setSelectedQuarterKey] = useState<string>('2026-Q3');
  const [report, setReport] = useState<QuarterlyStockReport | null>(null);
  const [availableQuarters, setAvailableQuarters] = useState<AvailableQuarter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [auditUpdatingId, setAuditUpdatingId] = useState<string | null>(null);

  // Filters within the quarterly stock ledger
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedAuditFilter, setSelectedAuditFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');

  // Load quarterly data from API
  const fetchQuarterlyReport = useCallback(async (quarterKey: string, showRefreshingSpinner = false) => {
    try {
      if (showRefreshingSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetch(`/api/stock/quarterly?quarter=${encodeURIComponent(quarterKey)}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setReport(json.data.report);
        if (json.data.available_quarters && json.data.available_quarters.length > 0) {
          setAvailableQuarters(json.data.available_quarters);
        }
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error('Error fetching quarterly stock report:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch when selected quarter changes
  useEffect(() => {
    fetchQuarterlyReport(selectedQuarterKey);
  }, [selectedQuarterKey, fetchQuarterlyReport]);

  // Real-time synchronization when external events happen (e.g. goods receipt logged or PO created)
  useEffect(() => {
    if (lastUpdatedTimestamp) {
      fetchQuarterlyReport(selectedQuarterKey, true);
    }
  }, [lastUpdatedTimestamp, selectedQuarterKey, fetchQuarterlyReport]);

  // Toggle Physical Audit Verification
  const handleToggleAudit = async (item: QuarterlyStockItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setAuditUpdatingId(item.id);
      const nextVerified = !item.is_audit_verified;
      const defaultNotes = nextVerified 
        ? (item.last_audit_notes || `Physical stock count reconciled by Inventory Manager on ${new Date().toLocaleDateString('en-GB')}.`)
        : '';

      const res = await fetch('/api/stock/audit-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          isVerified: nextVerified,
          auditNotes: defaultNotes
        })
      });

      if (res.ok) {
        // Optimistically update report items
        setReport(prev => {
          if (!prev) return null;
          const updatedItems = prev.items.map(it => {
            if (it.id === item.id) {
              return {
                ...it,
                is_audit_verified: nextVerified,
                audit_verified_at: nextVerified ? new Date().toISOString() : undefined,
                last_audit_notes: defaultNotes
              };
            }
            return it;
          });
          const newAuditedCount = updatedItems.filter(i => i.is_audit_verified).length;
          return {
            ...prev,
            items: updatedItems,
            audited_items_count: newAuditedCount
          };
        });
      }
    } catch (err) {
      console.error('Failed to update audit status:', err);
    } finally {
      setAuditUpdatingId(null);
    }
  };

  // Convert QuarterlyStockItem to ItemWithParentPO for specification view modal
  const handleViewSpecs = (item: QuarterlyStockItem) => {
    const poStatus: POStatus = item.pending_stock === 0 
      ? 'Completed' 
      : item.stock_received > 0 
      ? 'Partially Fulfilled' 
      : 'Pending';
    const parentPOObj: PurchaseOrder = {
      id: item.po_id,
      po_number: item.po_number,
      supplier: item.supplier,
      purchase_date: item.purchase_date,
      date_formatted: formatDate(item.purchase_date),
      status: poStatus,
      notes: item.last_audit_notes,
      total_amount: item.total_spend,
      items_count: 1,
      total_ordered_units: item.stock_purchased,
      total_received_units: item.stock_received,
      total_pending_units: item.pending_stock,
      items: [],
      receipt_logs: [],
      created_at: item.purchase_date,
      updated_at: item.delivery_date || item.purchase_date
    };

    const itemWithPO: ItemWithParentPO = {
      id: item.id,
      po_id: item.po_id,
      po_number: item.po_number,
      item_name: item.item_name,
      supplier: item.supplier,
      quantity: item.stock_purchased,
      quantity_received: item.stock_received,
      pending_balance: item.pending_stock,
      unit_price: item.unit_price,
      total_price: item.total_spend,
      category: item.category,
      purchase_date: item.purchase_date,
      delivery_date: item.delivery_date || undefined,
      po_status: poStatus,
      status: poStatus,
      is_audit_verified: item.is_audit_verified,
      audit_verified_at: item.audit_verified_at,
      last_audit_notes: item.last_audit_notes,
      parent_po: parentPOObj
    };

    onSelectItem(itemWithPO);
  };

  // Export audit summary as CSV
  const handleExportAuditSheet = () => {
    if (!report || !report.items || report.items.length === 0) return;

    const headers = [
      'Item Name',
      'Category',
      'Supplier',
      'PO Number',
      'Purchase Date',
      'Stock Purchased (Ordered Units)',
      'Stock Received (Units)',
      'Current On-Hand Inventory',
      'Pending In-Transit Balance',
      'Unit Price (RM)',
      'Total Spend (RM)',
      'On-Hand Valuation (RM)',
      'Status',
      'Audit Verified',
      'Audit Notes'
    ];

    const rows = report.items.map(it => [
      `"${it.item_name.replace(/"/g, '""')}"`,
      `"${it.category}"`,
      `"${it.supplier}"`,
      `"${it.po_number}"`,
      `"${it.purchase_date ? it.purchase_date.split('T')[0] : ''}"`,
      it.stock_purchased,
      it.stock_received,
      it.on_hand_inventory,
      it.pending_stock,
      it.unit_price,
      it.total_spend,
      it.on_hand_valuation,
      `"${it.status}"`,
      it.is_audit_verified ? 'YES' : 'NO',
      `"${(it.last_audit_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Quarterly_Stock_Audit_${report.quarter_key}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered items list
  const filteredItems = useMemo(() => {
    if (!report || !report.items) return [];

    return report.items.filter(item => {
      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = item.item_name.toLowerCase().includes(q);
        const matchSupplier = item.supplier.toLowerCase().includes(q);
        const matchPo = item.po_number.toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        const matchNotes = (item.last_audit_notes || '').toLowerCase().includes(q);
        if (!matchName && !matchSupplier && !matchPo && !matchCat && !matchNotes) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'IN_STOCK' && item.status !== 'In Stock') return false;
        if (selectedStatus === 'PARTIALLY_RECEIVED' && item.status !== 'Partially Received') return false;
        if (selectedStatus === 'AWAITING_DELIVERY' && item.status !== 'Awaiting Delivery') return false;
      }

      // Audit Filter
      if (selectedAuditFilter === 'VERIFIED' && !item.is_audit_verified) return false;
      if (selectedAuditFilter === 'UNVERIFIED' && item.is_audit_verified) return false;

      return true;
    });
  }, [report, searchQuery, selectedCategory, selectedStatus, selectedAuditFilter]);

  // Categories present in this quarter for filter dropdown
  const quarterCategories = useMemo(() => {
    if (!report || !report.categories) return [];
    return report.categories.map(c => c.category);
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Inventory Manager Role & Real-Time Sync Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-900">
                  Quarterly Stock Dashboard & Audit Report
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Inventory Manager View
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-Time Stock Sync Active
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  Active Currency: {currency} (RM)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Real-time quarterly stock levels breakdown across <strong>Q1, Q2, Q3, Q4</strong> for periodic physical inventory audits and forward budget procurement planning. Stock metrics reflect actual goods receipts dynamically.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                fetchQuarterlyReport(selectedQuarterKey, true);
                onRefreshParent();
              }}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="Refresh inventory counts from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Stock'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportAuditSheet}
              disabled={!report || report.items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
              title="Download audit reconciliation sheet as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Audit CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onLogGoodsReceipt()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Log incoming goods arrival to update on-hand stock"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Log Goods Arrival</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quarter Selection Navigation Bar (User Story 4: Acceptance Criteria 1 & 2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Select Audit Quarter
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Switch quarters to audit past stock levels or view active inventory:
            </p>
          </div>

          {/* Quick Quarter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {availableQuarters.map((q) => {
              const isSelected = selectedQuarterKey === q.key;
              return (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => setSelectedQuarterKey(q.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/20 ring-2 ring-indigo-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span>{q.label}</span>
                  <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-indigo-700/80 text-indigo-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {q.months_label}
                  </span>
                  {q.is_current && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Current Active Quarter" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Quarter Overview Ribbon */}
        {report && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{report.label}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{report.date_range_label}</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-700">{report.pos_count} Purchase Orders</span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold text-slate-700">{report.items_count} Line Items</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                Last synchronized: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Audit Progress: {report.audited_items_count}/{report.items_count} Verified
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
          <p className="text-sm font-bold text-slate-800">Calculating Quarterly Stock Levels...</p>
          <p className="text-xs text-slate-500 mt-1">Aggregating PO purchases, received shipments, and current stores stock.</p>
        </div>
      ) : report ? (
        <>
          {/* Top Metric Cards: Acceptance Criteria 2 - Total Stock Purchased, Total Stock Received, Current On-Hand Inventory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Stock Purchased */}
            <div 
              id="metric-stock-purchased"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Stock Purchased
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-mono">
                  {report.total_stock_purchased.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">units ordered</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Procurement Spend</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatCurrency(report.total_quarter_spend, currency)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Across {report.pos_count} POs and {report.items_count} catalog items
              </div>
            </div>

            {/* 2. Total Stock Received */}
            <div 
              id="metric-stock-received"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Stock Received
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono">
                  {report.total_stock_received.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">units delivered</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Fulfillment Rate</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {report.fulfillment_rate_percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, report.fulfillment_rate_percentage)}%` }}
                />
              </div>
            </div>

            {/* 3. Current On-Hand Inventory (Criteria 2) */}
            <div 
              id="metric-on-hand-inventory"
              className="bg-white border-2 border-indigo-500/20 bg-indigo-50/20 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Current On-Hand Inventory
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold text-indigo-700 font-mono">
                  {report.current_on_hand_inventory.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-indigo-900">units in stores</span>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-100/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">On-Hand Valuation</span>
                <span className="font-extrabold text-slate-900 font-mono">
                  {formatCurrency(report.on_hand_inventory_valuation, currency)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Physically logged in warehouse stores</span>
              </div>
            </div>

            {/* 4. Pending In-Transit Stock */}
            <div 
              id="metric-pending-stock"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pending In-Transit Balance
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl lg:text-3xl font-extrabold font-mono ${report.pending_in_transit_stock > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {report.pending_in_transit_stock.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">units awaiting</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Pending Liability</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatCurrency(report.pending_stock_liability, currency)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>
                  {report.pending_in_transit_stock > 0 ? 'Delivery scheduled' : 'All shipments completed'}
                </span>
                {report.pending_in_transit_stock > 0 && (
                  <button
                    type="button"
                    onClick={() => onLogGoodsReceipt()}
                    className="text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    Receive Now →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Quarter Budget Planning Card (User Story 4 Persona Goal) */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/30 text-indigo-300 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Procurement Budget Planning for Upcoming Quarter: {report.next_quarter_label}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                    Audit Benchmark
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Based on {report.quarter_name} actual procurement consumption of{' '}
                  <strong className="text-white font-mono">{formatCurrency(report.total_quarter_spend, currency)}</strong>, 
                  current on-hand stores stock of{' '}
                  <strong className="text-white font-mono">{report.current_on_hand_inventory} units</strong>, 
                  and pending liabilities.
                </p>
              </div>

              {/* Recommended Target Box */}
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-4 shrink-0 text-left lg:text-right min-w-[220px]">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                  Recommended {report.next_quarter_key.split('-')[1]} Budget Target
                </div>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {formatCurrency(report.recommended_procurement_budget, currency)}
                </div>
                <div className="text-[10px] text-indigo-200 mt-1 flex items-center gap-1 lg:justify-end">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Includes 10% restock buffer</span>
                </div>
              </div>
            </div>

            {/* Bulleted Planning Insights */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300">
              {report.budget_planning_notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{note}</span>
                </div>
              ))}
            </div>

            {/* Quick Action to Draft PO */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400">
                Ready to execute new procurement cycle?
              </span>
              <button
                type="button"
                onClick={onCreatePO}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Draft New Purchase Order</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Breakdown Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Category Stock & Valuation Distribution ({report.quarter_name})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Physical unit breakdown and financial valuation by commodity group
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {report.categories.length} active categories
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Purchased (Units)</th>
                    <th className="py-2.5 px-3 text-right">Received (Units)</th>
                    <th className="py-2.5 px-3 text-right">On-Hand Stock</th>
                    <th className="py-2.5 px-3 text-right">Pending Balance</th>
                    <th className="py-2.5 px-3 text-center">Fulfillment</th>
                    <th className="py-2.5 px-3 text-right">Total Spend</th>
                    <th className="py-2.5 px-3 text-right">On-Hand Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.categories.map((cat) => {
                    const fulfillPercent = cat.stock_purchased > 0 
                      ? Math.round((cat.stock_received / cat.stock_purchased) * 100) 
                      : 100;
                    return (
                      <tr 
                        key={cat.category}
                        onClick={() => setSelectedCategory(selectedCategory === cat.category ? 'ALL' : cat.category)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          selectedCategory === cat.category ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{cat.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({cat.items_count} items)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                          {cat.stock_purchased}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                          {cat.stock_received}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                          {cat.on_hand_inventory}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">
                          {cat.pending_stock > 0 ? (
                            <span className="text-amber-600 font-bold">{cat.pending_stock}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, fulfillPercent)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-slate-600">{fulfillPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatCurrency(cat.total_spend, currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(cat.on_hand_valuation, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quarterly Stock Reconciliation Ledger (Item-by-Item Detail & Audit Verification) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Quarterly Physical Stock Audit & Item Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify physical quantities in stock, reconcile purchase orders, and inspect item specifications.
                </p>
              </div>

              {/* Status counter pill */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{report.audited_items_count} of {report.items.length} Items Audit Verified</span>
                </span>
              </div>
            </div>

            {/* Filter and Search Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item, supplier, PO#..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-700"
                >
                  <option value="ALL">All Categories ({report.categories.length})</option>
                  {quarterCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-700"
                >
                  <option value="ALL">All Delivery Statuses</option>
                  <option value="IN_STOCK">In Stock (Fully Received)</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="AWAITING_DELIVERY">Awaiting Delivery</option>
                </select>
              </div>

              {/* Audit Verification Filter */}
              <div>
                <select
                  value={selectedAuditFilter}
                  onChange={(e) => setSelectedAuditFilter(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-700"
                >
                  <option value="ALL">All Audit States</option>
                  <option value="VERIFIED">Audit Verified Only</option>
                  <option value="UNVERIFIED">Pending Physical Verification</option>
                </select>
              </div>
            </div>

            {/* Items Table */}
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-600">No stock items match the active filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedStatus('ALL');
                    setSelectedAuditFilter('ALL');
                  }}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">PO & Supplier</th>
                      <th className="py-2.5 px-3 text-right">Purchased</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3 text-right">On-Hand Stock</th>
                      <th className="py-2.5 px-3 text-right">Pending</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">On-Hand Value</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Audit Check</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isUpdating = auditUpdatingId === item.id;
                      return (
                        <tr 
                          key={item.id}
                          className="hover:bg-slate-50/90 transition-colors group"
                        >
                          {/* Item Description */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleViewSpecs(item)}
                              className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer group-hover:underline block"
                              title="Click to view detailed item specifications (User Story 3 & 4)"
                            >
                              {item.item_name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                {item.category}
                              </span>
                              {item.is_audit_verified && (
                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />
                                  <span>Verified</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* PO & Supplier */}
                          <td className="py-3 px-3 text-slate-600">
                            <button
                              type="button"
                              onClick={() => onViewPO(item.po_number)}
                              className="font-mono font-bold text-indigo-600 hover:underline cursor-pointer block"
                            >
                              {item.po_number}
                            </button>
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={item.supplier}>
                              {item.supplier}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.purchase_date ? formatDate(item.purchase_date) : ''}
                            </div>
                          </td>

                          {/* Stock Purchased */}
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                            {item.stock_purchased}
                          </td>

                          {/* Stock Received */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                            {item.stock_received}
                          </td>

                          {/* Current On-Hand Stock (Criteria 2) */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700 bg-indigo-50/40">
                            {item.on_hand_inventory}
                          </td>

                          {/* Pending Balance */}
                          <td className="py-3 px-3 text-right font-mono">
                            {item.pending_stock > 0 ? (
                              <span className="font-bold text-amber-600">{item.pending_stock}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(item.unit_price, currency)}
                          </td>

                          {/* On-Hand Valuation */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(item.on_hand_valuation, currency)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'In Stock'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'Partially Received'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          {/* Physical Audit Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => handleToggleAudit(item, e)}
                              disabled={isUpdating}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer inline-flex items-center justify-center ${
                                item.is_audit_verified
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : 'bg-white text-slate-400 border-slate-300 hover:border-slate-400 hover:text-slate-600'
                              }`}
                              title={item.is_audit_verified ? 'Audit verified (Click to revoke)' : 'Click to verify physical count'}
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleViewSpecs(item)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                                title="Inspect detailed specifications"
                              >
                                Specs
                              </button>
                              {item.pending_stock > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onLogGoodsReceipt(item.po_id)}
                                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Log goods receipt for this PO"
                                >
                                  Receive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No quarterly data found for {selectedQuarterKey}</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting another quarter above.</p>
        </div>
      )}
    </div>
  );
}
