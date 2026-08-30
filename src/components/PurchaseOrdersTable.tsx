import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Trash2, 
  Calendar, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Truck, 
  PackageCheck 
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { formatCurrency, formatDate, Currency } from '../utils/formatters';

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  currency: Currency;
  onViewPO: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => Promise<void>;
  onOpenCreatePO: () => void;
  onOpenReceiptModal: (po: PurchaseOrder) => void;
}

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  purchaseOrders,
  currency,
  onViewPO,
  onDeletePO,
  onOpenCreatePO,
  onOpenReceiptModal
}) => {
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [poSearch, setPoSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPoId(prev => (prev === id ? null : id));
  };

  const filteredOrders = purchaseOrders.filter(po => {
    if (!poSearch) return true;
    const term = poSearch.toLowerCase();
    return (
      po.po_number.toLowerCase().includes(term) ||
      po.supplier.toLowerCase().includes(term) ||
      (po.notes && po.notes.toLowerCase().includes(term)) ||
      po.items.some(it => it.item_name.toLowerCase().includes(term))
    );
  });

  const handleDelete = async (po: PurchaseOrder) => {
    if (window.confirm(`Are you sure you want to delete ${po.po_number}? This will permanently remove its ${po.items.length} item records from the database.`)) {
      setDeletingId(po.id);
      await onDeletePO(po.id);
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'Partially Fulfilled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Layers className="w-3 h-3 mr-1" />
            Partially Fulfilled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  return (
    <div id="purchase-orders-ledger" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Purchase Orders Repository</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage purchase order headers, line item specifications, and goods arrival status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="input-search-pos"
            type="text"
            value={poSearch}
            onChange={(e) => setPoSearch(e.target.value)}
            placeholder="Search PO number, supplier, item..."
            className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all w-full sm:w-64"
          />
        </div>
      </div>

      {/* PO List */}
      <div className="divide-y divide-slate-100">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No Purchase Orders Found</p>
            <p className="text-xs text-slate-400 mt-1">
              Create a new purchase order to start recording vendor items.
            </p>
            <button
              type="button"
              onClick={onOpenCreatePO}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Record New PO
            </button>
          </div>
        ) : (
          filteredOrders.map((po) => {
            const isExpanded = expandedPoId === po.id;
            return (
              <div key={po.id} id={`po-entry-${po.id}`} className="transition-colors hover:bg-slate-50/70">
                {/* Summary Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(po.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mt-0.5 sm:mt-0 cursor-pointer"
                      title={isExpanded ? "Collapse item details" : "Expand item details"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-indigo-600">
                          {po.po_number}
                        </span>
                        {getStatusBadge(po.status)}
                        {po.reference_no && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                            Ref: {po.reference_no}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {po.supplier}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Purchased: {formatDate(po.purchase_date)}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">
                          {po.items.length} {po.items.length === 1 ? 'item' : 'items'}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          Received: <strong className="text-indigo-600">{po.total_received_units || 0}</strong> / {po.total_ordered_units} units (
                          <span className={po.total_pending_units === 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                            {po.total_pending_units} pending
                          </span>)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amounts and Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 pl-10 md:pl-0">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">Total PO Value</span>
                      <span className="text-base font-mono font-bold text-slate-900">
                        {formatCurrency(po.total_amount, currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Log Arrival Button */}
                      <button
                        type="button"
                        onClick={() => onOpenReceiptModal(po)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors cursor-pointer"
                        title="Log Arrival (Barang Sampai) for this Purchase Order"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Log Arrival</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewPO(po)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="View Official Purchase Order Voucher Slip"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Slip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(po)}
                        disabled={deletingId === po.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Purchase Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Items Table inside PO */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Item Breakdown & Goods Receipt Status for {po.po_number}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        Recorded on: {new Date(po.purchase_date).toLocaleString()}
                      </span>
                    </div>

                    {po.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                        PO Description/Notes: {po.notes}
                      </p>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">#</th>
                            <th className="py-2.5 px-4">Item Name (Barang Beli)</th>
                            <th className="py-2.5 px-4">Supplier/Vendor</th>
                            <th className="py-2.5 px-3 text-right">Ordered</th>
                            <th className="py-2.5 px-3 text-right">Received</th>
                            <th className="py-2.5 px-3 text-right text-indigo-900 bg-indigo-50/40">Pending Balance</th>
                            <th className="py-2.5 px-4 text-right">Unit Price</th>
                            <th className="py-2.5 px-4 text-right">Total Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {po.items.map((item, idx) => {
                            const rec = item.quantity_received || 0;
                            const pending = item.pending_balance !== undefined ? item.pending_balance : Math.max(0, item.quantity - rec);

                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-4 font-bold text-slate-900">
                                  {item.item_name}
                                  {item.notes && (
                                    <span className="text-[10px] text-slate-400 block font-normal italic">{item.notes}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-slate-600 font-medium">{item.supplier}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium">{item.quantity.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">{rec.toLocaleString()}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold bg-indigo-50/20">
                                  {pending === 0 ? (
                                    <span className="text-emerald-600">0 (Fulfilled)</span>
                                  ) : (
                                    <span className="text-amber-600">{pending.toLocaleString()}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatCurrency(item.unit_price, currency)}</td>
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total_price, currency)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={7} className="py-2.5 px-4 text-right text-slate-600 uppercase text-[11px]">
                              Order Total ({currency}):
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-indigo-600 text-sm">
                              {formatCurrency(po.total_amount, currency)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
