import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  PackageCheck, 
  Search, 
  Filter, 
  Building, 
  Calendar, 
  Eye, 
  Clock, 
  CheckCircle2, 
  Layers, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  FileText
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { formatCurrency, formatDate, Currency } from '../utils/formatters';

interface GoodsReceiptViewProps {
  purchaseOrders: PurchaseOrder[];
  currency: Currency;
  onOpenReceiptModal: (po?: PurchaseOrder) => void;
  onViewPO: (po: PurchaseOrder) => void;
}

export const GoodsReceiptView: React.FC<GoodsReceiptViewProps> = ({
  purchaseOrders,
  currency,
  onOpenReceiptModal,
  onViewPO
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Partially Fulfilled' | 'Completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPoIds, setExpandedPoIds] = useState<Set<string>>(new Set());

  // Aggregate metrics for inventory receiving
  const metrics = useMemo(() => {
    let totalOrdered = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let completedCount = 0;

    purchaseOrders.forEach(po => {
      totalOrdered += po.total_ordered_units || 0;
      totalReceived += po.total_received_units || 0;
      totalPending += po.total_pending_units || 0;

      if (po.status === 'Pending') pendingCount++;
      else if (po.status === 'Partially Fulfilled') partialCount++;
      else if (po.status === 'Completed') completedCount++;
    });

    return {
      totalOrdered,
      totalReceived,
      totalPending,
      pendingCount,
      partialCount,
      completedCount,
      fulfillmentRate: totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0
    };
  }, [purchaseOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        term === '' ||
        po.po_number.toLowerCase().includes(term) ||
        po.supplier.toLowerCase().includes(term) ||
        (po.reference_no && po.reference_no.toLowerCase().includes(term)) ||
        po.items.some(it => it.item_name.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, statusFilter, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedPoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPoIds(new Set(purchaseOrders.map(p => p.id)));
  };

  const collapseAll = () => {
    setExpandedPoIds(new Set());
  };

  return (
    <div id="goods-receipt-view" className="space-y-6">
      {/* Role Context & Acceptance Criteria Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
              US-2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  User Story 2: Track Goods Receipt & Pending Balance
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">
                  Inventory Receiver Role
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong>Inventory Receiver Goal:</strong> Log the arrival of goods (<em>barang sampai</em>) against their original order and view outstanding pending balances to easily monitor awaiting deliveries.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
              ✓ Input Quantity Received
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
              ✓ Auto Pending Balance (Ordered - Received)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
              ✓ 3 Auto Statuses (Pending / Partial / Completed)
            </span>
          </div>
        </div>
      </div>

      {/* Receiver Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Balance Units */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Pending Balance</span>
            <span className="text-2xl font-mono font-bold text-amber-600 mt-1 block">
              {metrics.totalPending.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Awaiting supplier delivery to warehouse
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Received to Date */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Goods Received (Barang Sampai)</span>
            <span className="text-2xl font-mono font-bold text-emerald-600 mt-1 block">
              {metrics.totalReceived.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Verified & accepted into inventory
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Ordered Units */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Units Ordered</span>
            <span className="text-2xl font-mono font-bold text-slate-900 mt-1 block">
              {metrics.totalOrdered.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Fulfillment progress: <strong className="text-indigo-600 font-mono">{metrics.fulfillmentRate}%</strong>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-2">Order Status Breakdown</span>
          <div className="space-y-1.5 text-xs font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending (0 received):
              </span>
              <span className="font-mono text-slate-900">{metrics.pendingCount} POs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-indigo-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Partially Fulfilled:
              </span>
              <span className="font-mono text-slate-900">{metrics.partialCount} POs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed (All received):
              </span>
              <span className="font-mono text-slate-900">{metrics.completedCount} POs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Receiving Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar & Action Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <span>Purchase Order Delivery & Receipt Tracking</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select any purchase order to record received item quantities, inspect pending delivery balances, or view delivery orders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="search-receipt-orders"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PO#, supplier, item..."
                className="text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all w-full sm:w-64"
              />
            </div>

            {/* Direct Log Arrival Button */}
            <button
              id="btn-open-log-arrival"
              type="button"
              onClick={() => onOpenReceiptModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Log Goods Receipt (Barang Sampai)</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0" aria-label="Status filter">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Orders ({purchaseOrders.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Pending'
                  ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending Delivery ({metrics.pendingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Partially Fulfilled')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Partially Fulfilled'
                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                  : 'text-slate-500 hover:text-indigo-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Partially Fulfilled ({metrics.partialCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Completed ({metrics.completedCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Expand All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* PO Orders List */}
        <div className="divide-y divide-slate-100">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No Purchase Orders Found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try selecting another status filter or clearing your search term.'
                  : 'Record a new purchase order first to begin logging goods arrival.'}
              </p>
            </div>
          ) : (
            filteredOrders.map((po) => {
              const isExpanded = expandedPoIds.has(po.id);
              const progress = po.total_ordered_units > 0 
                ? Math.round(((po.total_received_units || 0) / po.total_ordered_units) * 100) 
                : 0;

              return (
                <div key={po.id} id={`receipt-po-card-${po.id}`} className="transition-colors hover:bg-slate-50/50">
                  {/* Summary Bar */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: PO Identity & Supplier */}
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(po.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mt-0.5 cursor-pointer"
                        title={isExpanded ? 'Collapse item details' : 'Expand item details'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-indigo-600">
                            {po.po_number}
                          </span>

                          {/* Order Status Badge */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            po.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : po.status === 'Partially Fulfilled'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {po.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {po.status === 'Partially Fulfilled' && <Layers className="w-3 h-3 mr-1" />}
                            {po.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                            {po.status}
                          </span>

                          {po.reference_no && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                              Ref: {po.reference_no}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {po.supplier}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Order Date: {formatDate(po.purchase_date)}
                          </span>
                          {po.last_receipt_date && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <History className="w-3 h-3" />
                                Last arrival: {new Date(po.last_receipt_date).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress Bar and Unit Metrics */}
                    <div className="flex-1 max-w-xs pl-10 lg:pl-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">
                          {po.total_received_units || 0} / {po.total_ordered_units} received
                        </span>
                        <span className="font-mono font-bold text-indigo-600">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            po.status === 'Completed'
                              ? 'bg-emerald-500'
                              : po.status === 'Partially Fulfilled'
                              ? 'bg-indigo-600'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Ordered: {po.total_ordered_units} units</span>
                        <span className={po.total_pending_units === 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                          Pending: {po.total_pending_units} units
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pl-10 lg:pl-0">
                      <button
                        type="button"
                        onClick={() => onOpenReceiptModal(po)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all cursor-pointer"
                        title="Log Arrival of goods for this purchase order"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Log Arrival</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewPO(po)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="View Official PO Voucher Slip"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Slip</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Itemized Goods Receipt Table */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Line Item Receipt Ledger for {po.po_number}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Total Order Value: {formatCurrency(po.total_amount, currency)}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">#</th>
                              <th className="py-2.5 px-4">Item Name (Barang Beli)</th>
                              <th className="py-2.5 px-4 text-right">Quantity Ordered</th>
                              <th className="py-2.5 px-4 text-right">Quantity Received</th>
                              <th className="py-2.5 px-4 text-right">Pending Balance (Balance Belum Sampai)</th>
                              <th className="py-2.5 px-4 text-center">Fulfillment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {po.items.map((item, idx) => {
                              const rec = item.quantity_received || 0;
                              const pending = item.pending_balance !== undefined 
                                ? item.pending_balance 
                                : Math.max(0, item.quantity - rec);
                              const isComplete = pending === 0;

                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70">
                                  <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="py-2.5 px-4">
                                    <span className="font-bold text-slate-900 block">{item.item_name}</span>
                                    {item.notes && (
                                      <span className="text-[10px] text-slate-400 italic block">{item.notes}</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700">
                                    {item.quantity.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-700">
                                    {rec.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-bold">
                                    {isComplete ? (
                                      <span className="text-emerald-600">0 units (Fulfilled)</span>
                                    ) : (
                                      <span className="text-amber-600">{pending.toLocaleString()} units pending</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    {isComplete ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Completed
                                      </span>
                                    ) : rec > 0 ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        <Layers className="w-3 h-3 mr-1" />
                                        Partially Fulfilled
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Receipt logs if any */}
                      {po.receipt_logs && po.receipt_logs.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs">
                          <span className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            Delivery Arrival Logs ({po.receipt_logs.length}):
                          </span>
                          <div className="space-y-1.5">
                            {po.receipt_logs.map(log => (
                              <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg gap-1">
                                <div>
                                  <strong className="text-slate-800">{log.receiver_name}</strong>
                                  {log.delivery_order_ref && <span className="ml-1.5 font-mono text-indigo-600">[{log.delivery_order_ref}]</span>}
                                  <span className="text-slate-400 ml-2">• {new Date(log.receipt_date).toLocaleString()}</span>
                                  {log.notes && <span className="block text-slate-500 italic mt-0.5">Note: "{log.notes}"</span>}
                                </div>
                                <div className="text-right font-medium">
                                  {log.items.map(it => `${it.item_name} (+${it.quantity_received})`).join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
