import React from 'react';
import { 
  X, 
  Printer, 
  Calendar, 
  Building, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Layers, 
  PackageCheck,
  History
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { formatCurrency, formatDateTime, formatDate, Currency } from '../utils/formatters';

interface PODetailModalProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onOpenReceiptModal?: (po: PurchaseOrder) => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  po,
  isOpen,
  onClose,
  currency,
  onOpenReceiptModal
}) => {
  if (!isOpen || !po) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = () => {
    switch (po.status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed (All Received)</span>
          </span>
        );
      case 'Partially Fulfilled':
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Partially Fulfilled ({po.total_pending_units} units pending)</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending (0 Received)</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        id="po-detail-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">Purchase Order Voucher Slip (Voucher Pesanan Pembelian)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PO Document Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Slip Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  PURCHASE ORDER
                </span>
                {statusBadge()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Centralized Procurement Office (Malaysia) • Official Purchasing & Goods Receipt Record
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">
                PO Identifier
              </span>
              <span className="text-lg font-mono font-bold text-indigo-600">
                {po.po_number}
              </span>
            </div>
          </div>

          {/* PO Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1.5">
                Supplier / Vendor Details
              </span>
              <p className="text-sm font-bold text-slate-900">{po.supplier}</p>
              <p className="text-slate-500 mt-0.5">Registered Vendor in Malaysia</p>
              {po.reference_no && (
                <p className="text-slate-500 mt-1">
                  Requisition Reference: <strong className="text-slate-800 font-mono">{po.reference_no}</strong>
                </p>
              )}
            </div>

            <div>
              <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1.5">
                Date & Delivery Fulfillment
              </span>
              <div className="space-y-1">
                <p className="text-slate-700">
                  <strong>Date of Purchase:</strong> {formatDate(po.purchase_date)}
                </p>
                <p className="text-slate-500 text-[11px] font-mono">
                  <strong>System Recorded:</strong> {formatDateTime(po.purchase_date)}
                </p>
                <p className="text-slate-700">
                  <strong>Receipt Progress:</strong> {po.total_received_units || 0} / {po.total_ordered_units} units received (
                  <span className={po.total_pending_units === 0 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {po.total_pending_units} pending delivery
                  </span>)
                </p>
              </div>
            </div>
          </div>

          {po.notes && (
            <div className="text-xs text-slate-700 bg-indigo-50/40 border border-indigo-100 rounded-xl p-4">
              <span className="font-bold text-indigo-900 block mb-1">PO Notes / Requisition Purpose:</span>
              <p className="text-slate-600">{po.notes}</p>
            </div>
          )}

          {/* Itemized Table with Quantity Ordered, Received, and Pending Balance */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Purchased Items Specification & Pending Delivery Status (Barang Beli & Status Sampai)</span>
              <span className="font-mono text-[11px] text-slate-400 lowercase">Currency: {currency} (RM)</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Item Description (Barang Beli)</th>
                    <th className="py-3 px-3 text-right">Ordered</th>
                    <th className="py-3 px-3 text-right">Received</th>
                    <th className="py-3 px-3 text-right text-indigo-900 bg-indigo-50/50">Pending Balance</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.items.map((item, idx) => {
                    const rec = item.quantity_received || 0;
                    const pending = item.pending_balance !== undefined ? item.pending_balance : Math.max(0, item.quantity - rec);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.item_name}</span>
                          <span className="text-[10px] text-slate-400 block">Vendor: {item.supplier}</span>
                          {item.notes && (
                            <span className="block text-[11px] font-normal text-slate-500 italic mt-0.5">{item.notes}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                          {rec.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold bg-indigo-50/20">
                          {pending === 0 ? (
                            <span className="text-emerald-600">0 (Fulfilled)</span>
                          ) : (
                            <span className="text-amber-600">{pending.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatCurrency(item.unit_price, currency)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.total_price, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={6} className="py-3.5 px-4 text-right uppercase text-[11px] text-slate-600">
                      Total Order Amount:
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-base text-indigo-600">
                      {formatCurrency(po.total_amount, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Delivery & Goods Receipt Log History (User Story 2) */}
          {po.receipt_logs && po.receipt_logs.length > 0 ? (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Goods Receipt & Delivery Log History (Rekod Penerimaan Barang Sampai)</span>
              </h4>
              <div className="space-y-2">
                {po.receipt_logs.map((log) => (
                  <div key={log.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{log.receiver_name}</span>
                        {log.delivery_order_ref && (
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                            DO: {log.delivery_order_ref}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">{new Date(log.receipt_date).toLocaleString()}</span>
                      </div>
                      {log.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{log.notes}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      {log.items.map(it => (
                        <span key={it.item_id} className="inline-block text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium border border-emerald-200 ml-1">
                          +{it.quantity_received} {it.item_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No goods receipt logged yet for this Purchase Order (All {po.total_ordered_units} units pending arrival).</span>
              </div>
              {onOpenReceiptModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReceiptModal(po);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  Log Arrival Now
                </button>
              )}
            </div>
          )}

          {/* Verification & Sign-off */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Procurement Officer (Pegawai Perolehan):</p>
              <div className="h-14 border-b border-dashed border-slate-300 flex items-end pb-1">
                <span className="text-slate-800 font-medium">Procurement Officer</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Authorized Purchase Order Record</p>
            </div>
            <div>
              <p className="font-bold text-slate-700">Inventory Receiver (Penerima Stor):</p>
              <div className="h-14 border-b border-dashed border-slate-300 flex items-end pb-1">
                <span className="text-indigo-700 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 
                  {po.status === 'Completed' ? 'All Goods Received & Verified' : `${po.total_received_units || 0} Units Received (${po.total_pending_units} Pending)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Status: {po.status}</p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Official Malaysia Procurement System • Currency: <strong>MYR (RM)</strong>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenReceiptModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceiptModal(po);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Log Goods Receipt (Barang Sampai)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
