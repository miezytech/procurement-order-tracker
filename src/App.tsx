import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  FileText, 
  TrendingUp, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Clock,
  Sparkles,
  Building,
  RefreshCw,
  Truck,
  PackageCheck,
  Calendar,
  Search,
  BarChart3
} from 'lucide-react';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  ProcurementStats, 
  CreatePurchaseOrderInput, 
  LogGoodsReceiptInput,
  ItemWithParentPO,
  MonthlyProcurementSummary
} from './types';
import { Currency } from './utils/formatters';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { ItemsHistoryTable } from './components/ItemsHistoryTable';
import { PurchaseOrdersTable } from './components/PurchaseOrdersTable';
import { GoodsReceiptView } from './components/GoodsReceiptView';
import { VendorAnalyticsView } from './components/VendorAnalyticsView';
import { MonthlyPurchaseHistory } from './components/MonthlyPurchaseHistory';
import { QuarterlyStockDashboard } from './components/QuarterlyStockDashboard';
import { CreatePOModal } from './components/CreatePOModal';
import { PODetailModal } from './components/PODetailModal';
import { GoodsReceiptModal } from './components/GoodsReceiptModal';
import { DatabaseViewerModal } from './components/DatabaseViewerModal';
import { ItemDetailModal } from './components/ItemDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'quarterly' | 'monthly' | 'receipts' | 'pos' | 'items' | 'analytics'>('quarterly');
  // Based in Malaysia: MYR (RM) as primary currency
  const [currency, setCurrency] = useState<Currency>('MYR');
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(Date.now());
  
  // Data states
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [items, setItems] = useState<ItemWithParentPO[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlyProcurementSummary[]>([]);
  const [stats, setStats] = useState<ProcurementStats>({
    total_spend: 0,
    total_pos: 0,
    total_items: 0,
    total_suppliers: 0,
    total_received_items: 0,
    total_pending_items: 0,
    pending_pos_count: 0,
    partially_fulfilled_pos_count: 0,
    completed_pos_count: 0
  });
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPoForReceipt, setSelectedPoForReceipt] = useState<PurchaseOrder | null>(null);
  const [isDbViewerOpen, setIsDbViewerOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ItemWithParentPO | null>(null);

  // Load all procurement data from API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [posRes, itemsRes, statsRes, suppliersRes, monthsRes] = await Promise.all([
        fetch('/api/purchase-orders'),
        fetch('/api/items'),
        fetch('/api/stats'),
        fetch('/api/suppliers'),
        fetch('/api/procurement/months')
      ]);

      if (posRes.ok) {
        const json = await posRes.json();
        setPurchaseOrders(json.data || []);
      }
      if (itemsRes.ok) {
        const json = await itemsRes.json();
        setItems(json.data || []);
      }
      if (statsRes.ok) {
        const json = await statsRes.json();
        setStats(json.data || { 
          total_spend: 0, 
          total_pos: 0, 
          total_items: 0, 
          total_suppliers: 0,
          total_received_items: 0,
          total_pending_items: 0,
          pending_pos_count: 0,
          partially_fulfilled_pos_count: 0,
          completed_pos_count: 0
        });
      }
      if (suppliersRes.ok) {
        const json = await suppliersRes.json();
        const supList = (json.data || []).map((s: any) => s.name || s);
        setSuppliers(supList);
      }
      if (monthsRes.ok) {
        const json = await monthsRes.json();
        setMonthlySummaries(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching procurement records:', err);
      setNotification({
        type: 'error',
        message: 'Could not connect to JSON database server. Retrying...'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle PO Creation (User Story 1)
  const handleCreatePO = async (poData: CreatePurchaseOrderInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to record Purchase Order.'
        });
        return false;
      }

      setNotification({
        type: 'success',
        message: `Successfully recorded ${data.data.po_number} with ${data.data.items_count} item entries in the database!`
      });
      setLastDataUpdate(Date.now());
      await loadData();
      return true;
    } catch (err: any) {
      console.error('Error creating purchase order:', err);
      setNotification({
        type: 'error',
        message: 'Network error submitting Purchase Order: ' + (err.message || String(err))
      });
      return false;
    }
  };

  // Handle Goods Receipt (User Story 2: Barang Sampai & Pending Balance)
  const handleSaveReceipt = async (poId: string, receiptData: LogGoodsReceiptInput): Promise<boolean> => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/goods-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to record Goods Receipt.'
        });
        return false;
      }

      const updatedPo: PurchaseOrder = data.data;
      setNotification({
        type: 'success',
        message: `Goods receipt recorded for ${updatedPo.po_number}! Status: "${updatedPo.status}". Pending Balance: ${updatedPo.total_pending_units} units.`
      });

      setLastDataUpdate(Date.now());
      await loadData();
      return true;
    } catch (err: any) {
      console.error('Error saving goods receipt:', err);
      setNotification({
        type: 'error',
        message: 'Network error saving goods receipt: ' + (err.message || String(err))
      });
      return false;
    }
  };

  // Open Goods Receipt Modal for specific PO or general picker
  const handleOpenReceiptModal = (po?: PurchaseOrder) => {
    setSelectedPoForReceipt(po || null);
    setIsReceiptModalOpen(true);
  };

  // Handle PO Deletion
  const handleDeletePO = async (id: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({
          type: 'success',
          message: 'Purchase Order deleted from database.'
        });
        await loadData();
      }
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      setNotification({
        type: 'error',
        message: 'Failed to delete Purchase Order.'
      });
    }
  };

  // Handle Reset / Seed
  const handleResetSeed = async () => {
    if (!window.confirm("Restore sample Malaysia procurement & receipt dataset into the JSON database? This will reset all current records.")) {
      return;
    }
    setIsSeeding(true);
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      if (res.ok) {
        setNotification({
          type: 'success',
          message: 'Database restored to initial Malaysia (MYR) demonstration dataset with sample receipt logs.'
        });
        setLastDataUpdate(Date.now());
        await loadData();
      }
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Auto-dismiss notification after 6s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Compute suggested next PO number
  const suggestedPoNumber = React.useMemo(() => {
    const year = new Date().getFullYear();
    let maxNum = 0;
    for (const po of purchaseOrders) {
      const match = po.po_number.match(/PO-\d{4}-(\d+)/);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }
    const nextSeq = String(maxNum + 1).padStart(4, '0');
    return `PO-${year}-${nextSeq}`;
  }, [purchaseOrders]);

  const totalPendingUnits = stats.total_pending_items ?? 0;

  return (
    <div className="flex h-screen w-full bg-[#0F172A] font-sans antialiased overflow-hidden text-slate-800">
      {/* Sleek Dark Slate Sidebar (Matching Theme) */}
      <aside 
        id="sleek-sidebar"
        className="w-20 md:w-20 bg-[#0F172A] border-r border-slate-800 flex flex-col items-center py-6 gap-8 z-30 shrink-0 select-none"
      >
        {/* Brand Logo Box */}
        <div 
          onClick={() => setActiveTab('items')}
          className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer hover:bg-indigo-500 transition-all"
          title="Procurement & Inventory Ledger"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        {/* Sidebar Nav Icons */}
        <nav className="flex md:flex-col gap-3 md:gap-4 items-center">
          {/* Tab 0: Quarterly Stock Dashboard (User Story 4 - Inventory Manager) */}
          <button
            type="button"
            onClick={() => setActiveTab('quarterly')}
            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'quarterly'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Quarterly Stock Dashboard & Auditing (User Story 4)"
          >
            <BarChart3 className="w-6 h-6" />
            <span className="sr-only">Quarterly Stock Dashboard</span>
          </button>

          {/* Tab 1: Monthly Purchase Search & History (User Story 3) */}
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'monthly'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Monthly Purchase Search & Specifications (User Story 3)"
          >
            <Calendar className="w-6 h-6" />
            <span className="sr-only">Monthly Search</span>
          </button>

          {/* Tab 2: Goods Receipt & Pending Balance (User Story 2) */}
          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`p-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'receipts'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Track Goods Receipt & Pending Balance (Barang Sampai)"
          >
            <Truck className="w-6 h-6" />
            {totalPendingUnits > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#0F172A]" />
            )}
          </button>

          {/* Tab 3: Purchase Orders */}
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Purchase Orders (POs)"
          >
            <FileText className="w-6 h-6" />
          </button>

          {/* Tab 4: Items Ledger */}
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'items'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Purchased Items Ledger (Barang Beli)"
          >
            <Package className="w-6 h-6" />
          </button>

          {/* Tab 5: Vendor Cost Analytics */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Vendor Cost Analytics"
          >
            <TrendingUp className="w-6 h-6" />
          </button>
        </nav>

        {/* Bottom Sidebar Action: Database Inspector */}
        <div className="md:mt-auto flex md:flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDbViewerOpen(true)}
            className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
            title="Open SQLite/JSON Database Inspector"
          >
            <span className="text-xs font-mono font-bold text-slate-400">DB</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9] overflow-y-auto">
        {/* Top Application Header */}
        <Header
          onOpenCreatePO={() => setIsCreateOpen(true)}
          onOpenDbViewer={() => setIsDbViewerOpen(true)}
          onResetSeed={handleResetSeed}
          onOpenReceiptModal={() => handleOpenReceiptModal()}
          currency={currency}
          onCurrencyChange={setCurrency}
          isSeeding={isSeeding}
        />

        {/* Notification Toast */}
        {notification && (
          <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4 w-full">
            <div
              id="system-notification-banner"
              className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-xs transition-all ${
                notification.type === 'success'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-700 ml-4 font-bold text-base cursor-pointer"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Body Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex-1 w-full space-y-6">
          {/* User Story Context & Acceptance Criteria Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                  {activeTab === 'quarterly' ? 'US-4' : activeTab === 'monthly' ? 'US-3' : activeTab === 'receipts' ? 'US-2' : 'US-1'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-bold text-slate-900">
                      {activeTab === 'quarterly' 
                        ? 'User Story 4: Up-to-Date Quarterly Stock Reporting'
                        : activeTab === 'monthly'
                        ? 'User Story 3: Monthly Purchase Search & History'
                        : activeTab === 'receipts'
                        ? 'User Story 2: Track Goods Receipt & Pending Balance'
                        : 'User Story 1: Purchase Order & Item Specifications'}
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active Currency: MYR (RM)
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {activeTab === 'quarterly' ? 'Inventory Manager View' : 'Procurement Officer View'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'quarterly'
                      ? 'Real-time summary of stock levels broken down by quarter (Q1, Q2, Q3, Q4). View total stock purchased, stock received, and on-hand stores inventory with automatic updates as shipments arrive.'
                      : activeTab === 'monthly'
                      ? 'Search and filter all procurement records by month (e.g. August 2026), inspect items purchased, and click any item to view detailed specifications (Supplier, Price, Quantity, Status, Delivery Date).'
                      : 'Track purchase orders, goods arrival delivery notes, and outstanding inventory balances in real time.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('quarterly')}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    activeTab === 'quarterly'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  US-4: Quarterly Stock
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('monthly')}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    activeTab === 'monthly'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  US-3: Monthly Search
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('receipts')}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    activeTab === 'receipts'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  US-2: Goods Arrival
                </button>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Real-Time Stock Sync
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Top Metrics */}
          <SummaryCards 
            stats={stats} 
            currency={currency} 
            onNavigateToReceipts={() => setActiveTab('receipts')}
          />

          {/* View Selection Tabs & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
            <nav className="flex space-x-2 overflow-x-auto w-full sm:w-auto" aria-label="Tabs">
              {/* Tab 0: Quarterly Stock Dashboard (User Story 4) */}
              <button
                id="tab-quarterly-stock"
                type="button"
                onClick={() => setActiveTab('quarterly')}
                className={`pb-2.5 px-3.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'quarterly'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Quarterly Stock Dashboard (User Story 4)</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                  Q1–Q4
                </span>
              </button>

              {/* Tab 1: Monthly Purchase Search & History (User Story 3) */}
              <button
                id="tab-monthly-history"
                type="button"
                onClick={() => setActiveTab('monthly')}
                className={`pb-2.5 px-3.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Monthly Purchase Search (User Story 3)</span>
                {monthlySummaries.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold">
                    {monthlySummaries.length} months
                  </span>
                )}
              </button>

              {/* Tab 2: Goods Receipt & Pending Balance */}
              <button
                id="tab-goods-receipt"
                type="button"
                onClick={() => setActiveTab('receipts')}
                className={`pb-2.5 px-3.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'receipts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Goods Receipt & Balance (Barang Sampai)</span>
                {totalPendingUnits > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-bold">
                    {totalPendingUnits} pending
                  </span>
                )}
              </button>

              {/* Tab 3: Purchase Orders */}
              <button
                id="tab-purchase-orders"
                type="button"
                onClick={() => setActiveTab('pos')}
                className={`pb-2.5 px-3.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'pos'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Purchase Orders (POs)</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200/80 text-slate-700">
                  {purchaseOrders.length}
                </span>
              </button>

              {/* Tab 4: Items Ledger */}
              <button
                id="tab-items-history"
                type="button"
                onClick={() => setActiveTab('items')}
                className={`pb-2.5 px-3.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'items'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Purchased Items Ledger (Barang Beli)</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-200/80 text-slate-700">
                  {items.length}
                </span>
              </button>

              {/* Tab 5: Vendor Cost Analytics */}
              <button
                id="tab-vendor-analytics"
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`pb-2.5 px-3.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Vendor Cost Analytics</span>
              </button>
            </nav>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-1 shrink-0">
              <button
                id="btn-refresh-data"
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Refresh ledger data from database"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Log Arrival CTA */}
              <button
                id="btn-action-log-arrival"
                type="button"
                onClick={() => handleOpenReceiptModal()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Log Arrival</span>
              </button>

              {/* Record PO button */}
              <button
                id="btn-quick-record-po"
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record PO</span>
              </button>
            </div>
          </div>

          {/* Tab Views */}
          {isLoading && items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-indigo-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Connecting to SQLite/JSON Procurement Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'quarterly' && (
                <QuarterlyStockDashboard
                  currency={currency}
                  onSelectItem={(item) => setSelectedItemForDetail(item)}
                  onViewPO={(poNumber) => {
                    const po = purchaseOrders.find(p => p.po_number === poNumber);
                    if (po) setSelectedPO(po);
                  }}
                  onLogGoodsReceipt={(poId) => {
                    const po = purchaseOrders.find(p => p.id === poId);
                    if (po) handleOpenReceiptModal(po);
                    else handleOpenReceiptModal();
                  }}
                  onCreatePO={() => setIsCreateOpen(true)}
                  onRefreshParent={loadData}
                  lastUpdatedTimestamp={lastDataUpdate}
                />
              )}

              {activeTab === 'monthly' && (
                <MonthlyPurchaseHistory
                  items={items}
                  purchaseOrders={purchaseOrders}
                  monthlySummaries={monthlySummaries}
                  currency={currency}
                  onSelectItem={(item) => setSelectedItemForDetail(item)}
                  onViewPO={(poNumber) => {
                    const po = purchaseOrders.find(p => p.po_number === poNumber);
                    if (po) setSelectedPO(po);
                  }}
                  onLogGoodsReceipt={(poId) => {
                    const po = purchaseOrders.find(p => p.id === poId);
                    if (po) handleOpenReceiptModal(po);
                    else handleOpenReceiptModal();
                  }}
                  onCreatePO={() => setIsCreateOpen(true)}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'receipts' && (
                <GoodsReceiptView
                  purchaseOrders={purchaseOrders}
                  currency={currency}
                  onOpenReceiptModal={(po) => handleOpenReceiptModal(po)}
                  onViewPO={(po) => setSelectedPO(po)}
                />
              )}

              {activeTab === 'items' && (
                <ItemsHistoryTable
                  items={items}
                  purchaseOrders={purchaseOrders}
                  currency={currency}
                  onViewPO={(po) => setSelectedPO(po)}
                  onOpenCreatePO={() => setIsCreateOpen(true)}
                  onSelectItem={(item) => setSelectedItemForDetail(item as ItemWithParentPO)}
                />
              )}

              {activeTab === 'pos' && (
                <PurchaseOrdersTable
                  purchaseOrders={purchaseOrders}
                  currency={currency}
                  onViewPO={(po) => setSelectedPO(po)}
                  onDeletePO={handleDeletePO}
                  onOpenCreatePO={() => setIsCreateOpen(true)}
                  onOpenReceiptModal={(po) => handleOpenReceiptModal(po)}
                />
              )}

              {activeTab === 'analytics' && (
                <VendorAnalyticsView
                  items={items}
                  purchaseOrders={purchaseOrders}
                  currency={currency}
                />
              )}
            </>
          )}
        </main>

        {/* Sleek Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SQLite/JSON Database Storage: <strong className="font-mono text-slate-700">data/procurement_db.json</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Malaysia Edition (MYR / RM)</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Procurement & Inventory Receiving System • User Stories 1, 2, 3 & 4 Implemented
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <CreatePOModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePO}
        existingSuppliers={suppliers}
        suggestedPoNumber={suggestedPoNumber}
        currency={currency}
      />

      <GoodsReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedPoForReceipt(null);
        }}
        purchaseOrders={purchaseOrders}
        initialSelectedPo={selectedPoForReceipt}
        onSaveReceipt={handleSaveReceipt}
        currency={currency}
      />

      <PODetailModal
        po={selectedPO}
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        currency={currency}
        onOpenReceiptModal={(po) => handleOpenReceiptModal(po)}
      />

      <ItemDetailModal
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        purchaseOrders={purchaseOrders}
        currency={currency}
        onViewPO={(poNumber) => {
          const po = purchaseOrders.find(p => p.po_number === poNumber);
          if (po) {
            setSelectedItemForDetail(null);
            setSelectedPO(po);
          }
        }}
        onLogGoodsReceipt={(poId) => {
          const po = purchaseOrders.find(p => p.id === poId);
          setSelectedItemForDetail(null);
          if (po) handleOpenReceiptModal(po);
          else handleOpenReceiptModal();
        }}
      />

      <DatabaseViewerModal
        isOpen={isDbViewerOpen}
        onClose={() => setIsDbViewerOpen(false)}
      />
    </div>
  );
}
