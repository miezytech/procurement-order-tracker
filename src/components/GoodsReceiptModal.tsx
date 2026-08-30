import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Truck, 
  PackageCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building, 
  Calendar, 
  FileText, 
  Hash, 
  User, 
  Layers,
  HelpCircle,
  History
} from 'lucide-react';
import { PurchaseOrder, LogGoodsReceiptInput } from '../types';
import { formatCurrency, formatDate, Currency } from '../utils/formatters';

interface GoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrders: PurchaseOrder[];
  initialSelectedPo?: PurchaseOrder | null;
  onSaveReceipt: (poId: string, receiptData: LogGoodsReceiptInput) => Promise<boolean>;
  currency: Currency;
}

interface ItemArrivalState {
  item_id: string;
  item_name: string;
  quantity_ordered: number;
  quantity_previously_received: number;
  current_pending: number;
  arriving_now: number; // user input for this delivery
}

export const GoodsReceiptModal: React.FC<GoodsReceiptModalProps> = ({
  isOpen,
  onClose,
  purchaseOrders,
  initialSelectedPo,
  onSaveReceipt,
  currency
}) => {
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [receiverName, setReceiverName] = useState('Ahmad Fauzi (Inventory Receiver)');
  const [deliveryOrderRef, setDeliveryOrderRef] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [itemArrivals, setItemArrivals] = useState<ItemArrivalState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize active PO when modal opens or initial PO changes
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const localIsoDate = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
      setReceiptDate(localIsoDate);
      setErrorMsg(null);

      const targetPo = initialSelectedPo || purchaseOrders[0];
      if (targetPo) {
        setSelectedPoId(targetPo.id);
        setupItemsForPo(targetPo);
      }
    }
  }, [isOpen, initialSelectedPo, purchaseOrders]);

  const activePO = useMemo(() => {
    return purchaseOrders.find(p => p.id === selectedPoId) || null;
  }, [purchaseOrders, selectedPoId]);

  const setupItemsForPo = (po: PurchaseOrder) => {
    const arrivals: ItemArrivalState[] = po.items.map(item => {
      const ordered = item.quantity;
      const prevReceived = item.quantity_received || 0;
      const pending = Math.max(0, ordered - prevReceived);
      return {
        item_id: item.id,
        item_name: item.item_name,
        quantity_ordered: ordered,
        quantity_previously_received: prevReceived,
        current_pending: pending,
        arriving_now: pending > 0 ? pending : 0 // Suggest full remaining by default for ease of receiving
      };
    });
    setItemArrivals(arrivals);
  };

  const handlePoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const poId = e.target.value;
    setSelectedPoId(poId);
    setErrorMsg(null);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setupItemsForPo(po);
    }
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    setErrorMsg(null);
    const num = parseInt(value, 10);
    const parsed = isNaN(num) ? 0 : Math.max(0, num);

    setItemArrivals(prev =>
      prev.map(it => {
        if (it.item_id === itemId) {
          return {
            ...it,
            arriving_now: parsed
          };
        }
        return it;
      })
    );
  };

  const setItemAllPending = (itemId: string) => {
    setItemArrivals(prev =>
      prev.map(it => {
        if (it.item_id === itemId) {
          return { ...it, arriving_now: it.current_pending };
        }
        return it;
      })
    );
  };

  const setItemZero = (itemId: string) => {
    setItemArrivals(prev =>
      prev.map(it => {
        if (it.item_id === itemId) {
          return { ...it, arriving_now: 0 };
        }
        return it;
      })
    );
  };

  const receiveAllRemaining = () => {
    setItemArrivals(prev =>
      prev.map(it => ({
        ...it,
        arriving_now: it.current_pending
      }))
    );
  };

  const resetAllToZero = () => {
    setItemArrivals(prev =>
      prev.map(it => ({
        ...it,
        arriving_now: 0
      }))
    );
  };

  // Compute total arriving in this batch
  const totalArrivingNow = useMemo(() => {
    return itemArrivals.reduce((sum, it) => sum + (it.arriving_now || 0), 0);
  }, [itemArrivals]);

  // Real-time calculation of overall order status and remaining pending balance
  const projectedStats = useMemo(() => {
    let totalOrdered = 0;
    let totalProjectedReceived = 0;
    let totalProjectedPending = 0;

    itemArrivals.forEach(it => {
      totalOrdered += it.quantity_ordered;
      const newRec = it.quantity_previously_received + (it.arriving_now || 0);
      totalProjectedReceived += newRec;
      const newPend = Math.max(0, it.quantity_ordered - newRec);
      totalProjectedPending += newPend;
    });

    let projectedStatus: 'Pending' | 'Partially Fulfilled' | 'Completed';
    if (totalProjectedReceived === 0) {
      projectedStatus = 'Pending';
    } else if (totalProjectedPending > 0) {
      projectedStatus = 'Partially Fulfilled';
    } else {
      projectedStatus = 'Completed';
    }

    return {
      totalOrdered,
      totalProjectedReceived,
      totalProjectedPending,
      projectedStatus
    };
  }, [itemArrivals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePO) return;

    if (totalArrivingNow <= 0) {
      setErrorMsg('Please enter at least 1 received item quantity for this arrival log.');
      return;
    }

    // Validation: make sure no item exceeds ordered quantity
    const overReceivedItem = itemArrivals.find(
      it => it.quantity_previously_received + it.arriving_now > it.quantity_ordered
    );
    if (overReceivedItem) {
      const allowed = overReceivedItem.current_pending;
      setErrorMsg(
        `Quantity for "${overReceivedItem.item_name}" exceeds pending order balance. Maximum you can receive now is ${allowed} units.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: LogGoodsReceiptInput = {
      receiver_name: receiverName.trim() || 'Inventory Receiver',
      delivery_order_ref: deliveryOrderRef.trim() || undefined,
      receipt_date: receiptDate ? new Date(receiptDate).toISOString() : new Date().toISOString(),
      notes: deliveryNotes.trim() || undefined,
      items: itemArrivals
        .filter(it => it.arriving_now > 0)
        .map(it => ({
          item_id: it.item_id,
          received_now: it.arriving_now
        }))
    };

    const success = await onSaveReceipt(activePO.id, payload);
    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      setErrorMsg('Failed to record goods arrival. Please verify database connection.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="modal-goods-receipt-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="modal-goods-receipt-container"
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Log Goods Receipt (Rekod Barang Sampai)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 uppercase tracking-wider">
                  User Story 2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Log the arrival of ordered items, calculate real-time pending balances, and update order fulfillment status
              </p>
            </div>
          </div>

          <button
            id="btn-close-receipt-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* PO Selector & Header Information */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select PO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Select Purchase Order</span>
                </label>
                <select
                  id="select-receipt-po"
                  value={selectedPoId}
                  onChange={handlePoChange}
                  className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {purchaseOrders.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.supplier} ({po.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Info */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supplier / Vendor</span>
                </label>
                <div className="text-xs font-semibold text-slate-900 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 truncate">
                  {activePO?.supplier || '—'}
                </div>
              </div>

              {/* Order Date & Status */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Order Status</span>
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    activePO?.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : activePO?.status === 'Partially Fulfilled'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {activePO?.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {activePO?.status === 'Partially Fulfilled' && <Layers className="w-3 h-3 mr-1" />}
                    {activePO?.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                    {activePO?.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Purchased: {activePO ? formatDate(activePO.purchase_date) : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Receiver Metadata Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200/70">
              {/* Receiver Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Inventory Receiver Name</span>
                </label>
                <input
                  id="input-receiver-name"
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="e.g. Ahmad Fauzi (Inventory Receiver)"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Delivery Order Reference (Surat Jalan) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>Delivery Order / DO Ref (Surat Jalan)</span>
                </label>
                <input
                  id="input-do-reference"
                  type="text"
                  value={deliveryOrderRef}
                  onChange={(e) => setDeliveryOrderRef(e.target.value)}
                  placeholder="e.g. DO-2026-8812"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Arrival Date & Time */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Arrival Timestamp (Tarikh Sampai)</span>
                </label>
                <input
                  id="input-receipt-date"
                  type="datetime-local"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Receiving Inspection Notes (Catatan Pemeriksaan Barang)
              </label>
              <input
                id="input-receipt-notes"
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Packaging intact, goods inspected in warehouse bay 2, serial numbers verified."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Items Receipt Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-indigo-600" />
                  <span>Item Arrival Breakdown & Pending Balance</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Input "Quantity Received" for each item. The system automatically computes and displays the Pending Balance.
                </p>
              </div>

              {/* Quick Batch Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={receiveAllRemaining}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Receive All Pending
                </button>
                <button
                  type="button"
                  onClick={resetAllToZero}
                  className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Reset to 0
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th scope="col" className="py-3 px-4">#</th>
                    <th scope="col" className="py-3 px-4">Item Name (Barang Beli)</th>
                    <th scope="col" className="py-3 px-3 text-right">Quantity Ordered</th>
                    <th scope="col" className="py-3 px-3 text-right">Previously Received</th>
                    <th scope="col" className="py-3 px-4 text-center w-36 bg-indigo-50/60 text-indigo-900 border-x border-indigo-100">
                      Quantity Received Now
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Pending Balance
                      <span className="block text-[9px] font-normal text-slate-400">(Ordered - Received)</span>
                    </th>
                    <th scope="col" className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemArrivals.map((item, idx) => {
                    const totalReceivedAfter = item.quantity_previously_received + (item.arriving_now || 0);
                    const pendingBalanceAfter = Math.max(0, item.quantity_ordered - totalReceivedAfter);
                    const isExceeding = totalReceivedAfter > item.quantity_ordered;
                    const isFullyFulfilled = pendingBalanceAfter === 0;

                    return (
                      <tr key={item.item_id} className={`hover:bg-slate-50/70 transition-colors ${isExceeding ? 'bg-rose-50/50' : ''}`}>
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{item.item_name}</span>
                          <span className="text-[10px] text-slate-400">Supplier: {activePO?.supplier}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                          {item.quantity_ordered.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {item.quantity_previously_received.toLocaleString()}
                        </td>

                        {/* Input for Quantity Received in this arrival */}
                        <td className="py-2.5 px-4 bg-indigo-50/30 border-x border-indigo-100">
                          <div className="flex items-center gap-1.5 justify-center">
                            <input
                              id={`input-receive-item-${item.item_id}`}
                              type="number"
                              min="0"
                              max={item.current_pending}
                              value={item.arriving_now}
                              onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                              className={`w-20 text-center font-mono font-bold text-xs py-1.5 px-2 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                                isExceeding
                                  ? 'border-rose-300 text-rose-700 bg-rose-50 ring-rose-200'
                                  : item.arriving_now > 0
                                  ? 'border-indigo-400 text-indigo-700 bg-white ring-indigo-200'
                                  : 'border-slate-200 text-slate-700 bg-white'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setItemAllPending(item.item_id)}
                              className="px-1.5 py-1 text-[10px] font-bold rounded bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                              title="Set to max pending balance"
                            >
                              Max
                            </button>
                          </div>
                        </td>

                        {/* Automatically calculated Pending Balance */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-bold text-sm">
                            {isExceeding ? (
                              <span className="text-rose-600">Exceeds order</span>
                            ) : (
                              <span className={pendingBalanceAfter === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                                {pendingBalanceAfter.toLocaleString()} units
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {totalReceivedAfter} of {item.quantity_ordered} received
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isExceeding ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                              Error
                            </span>
                          ) : isFullyFulfilled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Fulfilled
                            </span>
                          ) : totalReceivedAfter > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              <Layers className="w-3 h-3 mr-1" />
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
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
          </div>

          {/* Dynamic Order Status Assessment Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-medium">
                  Automated Status Assessment upon Saving:
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Updated Order Status:</span>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono tracking-wide ${
                    projectedStats.projectedStatus === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : projectedStats.projectedStatus === 'Partially Fulfilled'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {projectedStats.projectedStatus}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({projectedStats.projectedStatus === 'Pending' && '0 units received'}
                    {projectedStats.projectedStatus === 'Partially Fulfilled' && `${projectedStats.totalProjectedPending} units balance still pending delivery`}
                    {projectedStats.projectedStatus === 'Completed' && 'All ordered units received & verified'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Arriving This Batch</span>
                  <span className="text-base font-bold text-indigo-300">+{totalArrivingNow.toLocaleString()} units</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Remaining Balance</span>
                  <span className={`text-base font-bold ${projectedStats.totalProjectedPending === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {projectedStats.totalProjectedPending.toLocaleString()} units
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Goods Receipt History for this PO */}
          {activePO?.receipt_logs && activePO.receipt_logs.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Previous Goods Receipt Log History ({activePO.receipt_logs.length} deliveries recorded)</span>
              </h4>

              <div className="space-y-2">
                {activePO.receipt_logs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{log.receiver_name || 'Inventory Receiver'}</span>
                        {log.delivery_order_ref && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                            DO: {log.delivery_order_ref}
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">{new Date(log.receipt_date).toLocaleString()}</span>
                      </div>
                      {log.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{log.notes}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {log.items.map(it => (
                        <span key={it.item_id} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {it.item_name}: <strong className="text-indigo-600">+{it.quantity_received}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            System location: <strong className="text-slate-700">Malaysia (MYR / RM)</strong> • Auto-calculates pending balance
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-cancel-receipt"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="btn-submit-goods-receipt"
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || totalArrivingNow <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Arrival...' : `Record Arrival (+${totalArrivingNow} units)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
