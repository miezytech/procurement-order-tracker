import React from 'react';
import { 
  X, 
  Package, 
  Building2, 
  DollarSign, 
  Calendar, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Tag,
  Hash
} from 'lucide-react';
import { ItemWithParentPO, PurchaseOrder } from '../types';
import { formatCurrency, formatDate, formatDateTime, Currency } from '../utils/formatters';

interface ItemDetailModalProps {
  item: ItemWithParentPO | null;
  onClose: () => void;
  onViewPO?: (poNumber: string) => void;
  onLogGoodsReceipt?: (poId: string) => void;
  purchaseOrders?: PurchaseOrder[];
  currency?: Currency;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onViewPO,
  onLogGoodsReceipt,
  purchaseOrders = [],
  currency = 'MYR',
}) => {
  if (!item) return null;

  const activeCurrency: Currency = (currency as Currency) || 'MYR';

  // Find parent PO if available to get full receipt logs and reference
  const parentPO = purchaseOrders.find(
    po => po.id === item.po_id || po.po_number === item.po_number
  );

  const receiptLogs = item.receipt_logs || parentPO?.receipt_logs || [];
  // Filter receipt logs that specifically touched this item
  const itemReceiptLogs = receiptLogs.filter(log => 
    log.items.some(it => it.item_id === item.id || it.item_name === item.item_name)
  );

  const totalOrdered = item.quantity;
  const totalReceived = item.quantity_received || 0;
  const pendingBalance = item.pending_balance !== undefined 
    ? item.pending_balance 
    : Math.max(0, totalOrdered - totalReceived);

  const fulfillmentPercentage = totalOrdered > 0 
    ? Math.min(100, Math.round((totalReceived / totalOrdered) * 100)) 
    : 0;

  // Status computation
  let status: 'Pending' | 'Partially Fulfilled' | 'Completed' = item.status || 'Pending';
  if (totalReceived === 0) {
    status = 'Pending';
  } else if (pendingBalance === 0) {
    status = 'Completed';
  } else {
    status = 'Partially Fulfilled';
  }

  const lastDeliveryDate = item.delivery_date || parentPO?.last_receipt_date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between border-b border-slate-700">
          <div className="flex items-start space-x-3.5 pr-4">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg shrink-0 mt-0.5">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-slate-700 text-slate-200 rounded border border-slate-600">
                  {item.category || 'General Procurement'}
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {item.po_number}
                </span>
              </div>
              <h2 id="item-modal-title" className="text-xl font-bold text-white tracking-tight leading-snug">
                {item.item_name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Key Specifications Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Supplier / Vendor Card */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Supplier / Vendor</span>
              </div>
              <div className="font-semibold text-slate-900 text-base">
                {item.supplier}
              </div>
              {item.po_reference_no && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ref: <strong className="text-slate-800">{item.po_reference_no}</strong></span>
                </div>
              )}
            </div>

            {/* 2. Price Card (Malaysian Ringgit MYR) */}
            <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Price & Valuation ({activeCurrency})</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Unit Price</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrency(item.unit_price, activeCurrency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Total Spend</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {formatCurrency(item.total_price, activeCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Quantity & Fulfillment Status Card */}
          <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Quantity & Fulfillment Status</span>
              </div>

              {/* Status Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                status === 'Completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : status === 'Partially Fulfilled'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
                {status === 'Partially Fulfilled' && <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />}
                {status === 'Pending' && <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />}
                {status}
              </span>
            </div>

            {/* Quantity Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100">
                <span className="text-xs text-slate-500 block font-medium">Ordered</span>
                <span className="text-lg font-bold text-slate-800">{totalOrdered}</span>
                <span className="text-[11px] text-slate-400 block">units</span>
              </div>
              <div className="bg-emerald-50/60 p-2.5 rounded-md border border-emerald-100">
                <span className="text-xs text-emerald-700 block font-medium">Received (Sampai)</span>
                <span className="text-lg font-bold text-emerald-800">{totalReceived}</span>
                <span className="text-[11px] text-emerald-600 block">units</span>
              </div>
              <div className={`p-2.5 rounded-md border ${
                pendingBalance > 0 
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                  : 'bg-slate-50 border-slate-100 text-slate-700'
              }`}>
                <span className="text-xs text-amber-800 block font-medium">Pending Balance</span>
                <span className="text-lg font-bold text-amber-700">{pendingBalance}</span>
                <span className="text-[11px] text-amber-600 block">units</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Fulfillment Progress</span>
                <span>{fulfillmentPercentage}% Received</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    status === 'Completed' 
                      ? 'bg-emerald-500' 
                      : status === 'Partially Fulfilled' 
                      ? 'bg-indigo-500' 
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${fulfillmentPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4. Delivery & Receipt History */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Delivery Date & Receiving History</span>
              </div>
              {lastDeliveryDate ? (
                <span className="text-xs font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Last Arrival: {formatDate(lastDeliveryDate)}
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Awaiting Delivery
                </span>
              )}
            </div>

            {/* Chronological Receipt Batches */}
            {itemReceiptLogs.length > 0 ? (
              <div className="space-y-2 pt-1">
                {itemReceiptLogs.map((log, idx) => {
                  const itemEntry = log.items.find(it => it.item_id === item.id || it.item_name === item.item_name);
                  return (
                    <div 
                      key={log.id || idx} 
                      className="p-3 bg-white rounded border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-medium">
                        <span className="text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Batch Delivery on {formatDateTime(log.receipt_date)}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          +{itemEntry?.quantity_received || 0} units received
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-0.5">
                        <div>
                          <span className="text-slate-400">DO Ref: </span>
                          <strong className="text-slate-700">{log.delivery_order_ref || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Receiver: </span>
                          <span className="text-slate-700">{log.receiver_name || 'Staff'}</span>
                        </div>
                      </div>

                      {log.notes && (
                        <p className="text-slate-500 italic bg-slate-50 p-1.5 rounded text-[11px]">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500 bg-white rounded border border-dashed border-slate-200">
                <Truck className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p>No delivery receipt has been logged yet for this item.</p>
                <p className="text-slate-400 mt-0.5">Shipment is pending dispatch from {item.supplier}.</p>
              </div>
            )}
          </div>

          {/* 5. Detailed Specifications & Notes */}
          {item.notes && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Tag className="w-4 h-4 text-slate-400" />
                <span>Technical Specifications & Item Notes</span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {item.notes}
              </p>
            </div>
          )}

          {/* Purchase Order Metadata Card */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Purchase Order & Date</span>
                <span className="font-semibold text-slate-900 text-sm">
                  {item.po_number} • Purchased on {formatDate(item.purchase_date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onViewPO && (
                <button
                  onClick={() => onViewPO(item.po_number)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors flex items-center gap-1"
                >
                  <span>View PO Slip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {pendingBalance > 0 && onLogGoodsReceipt && (
                <button
                  onClick={() => onLogGoodsReceipt(item.po_id)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Receive Units</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
