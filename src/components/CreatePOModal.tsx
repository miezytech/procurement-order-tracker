import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, AlertCircle, CheckCircle2, Building, DollarSign, PackagePlus } from 'lucide-react';
import { CreateOrderItemInput, CreatePurchaseOrderInput } from '../types';
import { formatCurrency, Currency } from '../utils/formatters';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poData: CreatePurchaseOrderInput) => Promise<boolean>;
  existingSuppliers: string[];
  suggestedPoNumber: string;
  currency: Currency;
}

interface ItemRowState extends CreateOrderItemInput {
  tempId: string;
}

const CATEGORIES = [
  'Raw Materials',
  'Office Supplies',
  'Equipment',
  'Packaging',
  'Maintenance & Hardware',
  'General'
];

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingSuppliers,
  suggestedPoNumber,
  currency
}) => {
  const [poNumber, setPoNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [defaultCategory, setDefaultCategory] = useState<string>('Raw Materials');
  const [customDate, setCustomDate] = useState('');
  const [useAutoDate, setUseAutoDate] = useState(true);
  const [notes, setNotes] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Automatically generated current date/time string for display
  const [currentTimestamp, setCurrentTimestamp] = useState('');

  // Items list
  const [items, setItems] = useState<ItemRowState[]>([
    {
      tempId: 'row_1',
      item_name: '',
      supplier: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      category: 'Raw Materials',
      notes: ''
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      setPoNumber(suggestedPoNumber || 'PO-' + new Date().getFullYear() + '-0001');
      const now = new Date();
      setCurrentTimestamp(now.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      setCustomDate(now.toISOString().split('T')[0]);
      setSupplier('');
      setDefaultCategory('Raw Materials');
      setNotes('');
      setReferenceNo('');
      setValidationError(null);
      setItems([
        {
          tempId: 'row_1',
          item_name: '',
          supplier: '',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          category: 'Raw Materials',
          notes: ''
        }
      ]);
    }
  }, [isOpen, suggestedPoNumber]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        tempId: `row_${Date.now()}_${prev.length + 1}`,
        item_name: '',
        supplier: supplier || '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        category: defaultCategory || 'Raw Materials',
        notes: ''
      }
    ]);
  };

  const handleDefaultCategoryChange = (newCat: string) => {
    setDefaultCategory(newCat);
    // Optionally update items that still have empty or unedited default
    setItems(prev => prev.map(it => {
      if (!it.item_name) {
        return { ...it, category: newCat };
      }
      return it;
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof CreateOrderItemInput, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'quantity') {
        const qty = Math.max(0, Number(value) || 0);
        item.quantity = qty;
        item.total_price = Math.round(qty * item.unit_price * 100) / 100;
      } else if (field === 'unit_price') {
        const price = Math.max(0, Number(value) || 0);
        item.unit_price = price;
        item.total_price = Math.round(item.quantity * price * 100) / 100;
      } else {
        (item as any)[field] = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  // If header supplier changes, populate items that don't have supplier set
  const handlePrimarySupplierChange = (val: string) => {
    setSupplier(val);
    setItems(prev =>
      prev.map(it => (!it.supplier || it.supplier === supplier ? { ...it, supplier: val } : it))
    );
  };

  // Grand totals
  const totalAmount = items.reduce((sum, it) => sum + (it.total_price || 0), 0);
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Primary validations
    if (!supplier.trim()) {
      setValidationError("Please select or enter the Primary Supplier/Vendor for this Purchase Order.");
      return;
    }

    if (items.length === 0) {
      setValidationError("A Purchase Order must contain at least one item.");
      return;
    }

    // Acceptance Criteria: Each item entry must include mandatory fields:
    // Item Name, Supplier/Vendor, Quantity Ordered, Unit Price, and Total Price.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowNum = i + 1;

      if (!item.item_name.trim()) {
        setValidationError(`Item #${rowNum}: 'Item Name' (barang beli) is mandatory.`);
        return;
      }

      const itemSupplier = item.supplier.trim() || supplier.trim();
      if (!itemSupplier) {
        setValidationError(`Item #${rowNum} ("${item.item_name}"): 'Supplier/Vendor' is mandatory.`);
        return;
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        setValidationError(`Item #${rowNum} ("${item.item_name}"): 'Quantity Ordered' must be greater than 0.`);
        return;
      }

      if (item.unit_price === undefined || item.unit_price < 0) {
        setValidationError(`Item #${rowNum} ("${item.item_name}"): 'Unit Price' must be 0 or higher.`);
        return;
      }

      if (!item.category || item.category.trim() === '') {
        setValidationError(`Item #${rowNum} ("${item.item_name}"): 'Item Category' is mandatory (e.g., Raw Materials, Office Supplies, Equipment, Packaging).`);
        return;
      }
    }

    setIsSubmitting(true);

    const payload: CreatePurchaseOrderInput = {
      po_number: poNumber.trim() || undefined,
      supplier: supplier.trim(),
      // The system automatically saves the date of purchase (defaults to now on server, or custom date if specified)
      purchase_date: useAutoDate ? undefined : new Date(customDate).toISOString(),
      notes: notes.trim() || undefined,
      reference_no: referenceNo.trim() || undefined,
      status: 'Completed',
      items: items.map(it => ({
        item_name: it.item_name.trim(),
        supplier: it.supplier.trim() || supplier.trim(),
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        total_price: Math.round(Number(it.quantity) * Number(it.unit_price) * 100) / 100,
        category: it.category || 'General',
        notes: it.notes?.trim() || undefined
      }))
    };

    const success = await onSubmit(payload);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        id="create-po-modal" 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Record New Purchase Order (PO)
              </h2>
              <p className="text-xs text-slate-400">
                Log purchased items (barang beli), suppliers, and prices into the database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Automated Date of Purchase Banner - Acceptance Criteria #3 */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-start gap-3.5 text-xs text-indigo-950">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold text-indigo-950">
                  Automated Purchase Date Recording
                </span>
                <button
                  type="button"
                  onClick={() => setUseAutoDate(!useAutoDate)}
                  className="text-indigo-600 underline font-semibold hover:text-indigo-800 text-left cursor-pointer"
                >
                  {useAutoDate ? 'Switch to manual historical date' : 'Use live current timestamp'}
                </button>
              </div>
              {useAutoDate ? (
                <p className="text-indigo-900/80 mt-1 font-medium">
                  The system will automatically timestamp and save the date of purchase: <strong className="font-mono">{currentTimestamp}</strong>.
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <label htmlFor="custom-purchase-date" className="font-semibold text-slate-700">
                    Manual Purchase Date:
                  </label>
                  <input
                    id="custom-purchase-date"
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="border border-indigo-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Validation Error Box */}
          {validationError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* PO Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label htmlFor="po-number" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                PO Number <span className="text-indigo-600 font-normal lowercase">(auto)</span>
              </label>
              <input
                id="po-number"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-0004"
                className="w-full text-xs font-mono rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="po-supplier" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Primary Supplier / Vendor <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="po-supplier"
                  type="text"
                  value={supplier}
                  onChange={(e) => handlePrimarySupplierChange(e.target.value)}
                  placeholder="e.g. Southern Steel Berhad"
                  list="existing-suppliers-list"
                  required
                  className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <datalist id="existing-suppliers-list">
                  {existingSuppliers.map((s, idx) => (
                    <option key={idx} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Acceptance Criteria 1: Item Category Selection (Raw Materials, Office Supplies, Equipment, Packaging) */}
            <div>
              <label htmlFor="po-default-category" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Item Category <span className="text-rose-500">*</span></span>
                {defaultCategory === 'Raw Materials' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Production</span>
                )}
              </label>
              <select
                id="po-default-category"
                value={defaultCategory}
                onChange={(e) => handleDefaultCategoryChange(e.target.value)}
                required
                className={`w-full text-xs font-semibold rounded-xl border px-3 py-2.5 transition-all focus:outline-none ${
                  defaultCategory === 'Raw Materials'
                    ? 'border-amber-400 bg-amber-50/60 text-amber-900 focus:ring-2 focus:ring-amber-500'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-800'
                }`}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c} {c === 'Raw Materials' ? '(Production Inputs)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="po-reference" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Reference / Requisition <span className="text-slate-400 font-normal lowercase">(opt)</span>
              </label>
              <input
                id="po-reference"
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. REQ-RAW-099"
                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="po-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Procurement Notes & Description
            </label>
            <input
              id="po-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly office consumables restocking for 3rd floor"
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Mandatory Item Entries Section - Acceptance Criteria #2 */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Purchased Items (Barang Beli) List</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mandatory: <strong>Item Name</strong>, <strong>Supplier</strong>, <strong>Quantity</strong>, <strong>Unit Price</strong>, & <strong>Total Price</strong>.
                </p>
              </div>

              <button
                id="btn-add-item-row"
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item (Barang Beli)</span>
              </button>
            </div>

            {/* Items Cards / Table */}
            <div className="space-y-3 mt-3">
              {items.map((item, idx) => (
                <div
                  key={item.tempId}
                  id={`item-row-${idx + 1}`}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 relative transition-all hover:border-slate-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      Item #{idx + 1} (Barang Beli)
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Item Name (Mandatory) */}
                    <div className="sm:col-span-4">
                      <label htmlFor={`item-name-${idx}`} className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Item Name (Barang Beli) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id={`item-name-${idx}`}
                        type="text"
                        required
                        value={item.item_name}
                        onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                        placeholder="e.g. Ergonomic Office Chair"
                        className="w-full text-xs rounded border border-slate-300 bg-white px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Specific Supplier / Vendor (Mandatory) */}
                    <div className="sm:col-span-3">
                      <label htmlFor={`item-supplier-${idx}`} className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Supplier / Vendor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id={`item-supplier-${idx}`}
                        type="text"
                        required
                        value={item.supplier}
                        onChange={(e) => handleItemChange(idx, 'supplier', e.target.value)}
                        placeholder={supplier || "Vendor name"}
                        className="w-full text-xs rounded border border-slate-300 bg-white px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Quantity Ordered (Mandatory) */}
                    <div className="sm:col-span-2">
                      <label htmlFor={`item-qty-${idx}`} className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id={`item-qty-${idx}`}
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1.5 focus:border-emerald-500 focus:outline-none text-right font-medium"
                      />
                    </div>

                    {/* Unit Price (Mandatory) */}
                    <div className="sm:col-span-3">
                      <label htmlFor={`item-price-${idx}`} className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Unit Price <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id={`item-price-${idx}`}
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1.5 focus:border-emerald-500 focus:outline-none text-right font-medium"
                      />
                    </div>
                  </div>

                  {/* Second row: Category, Item Notes & Auto-computed Total Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-2.5 pt-2 border-t border-slate-200">
                    <div className="sm:col-span-4">
                      <label htmlFor={`item-cat-${idx}`} className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Item Category <span className="text-rose-500">*</span></span>
                        {item.category === 'Raw Materials' && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Raw Material</span>
                        )}
                      </label>
                      <select
                        id={`item-cat-${idx}`}
                        value={item.category}
                        required
                        onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                        className={`w-full text-xs rounded border px-2.5 py-1.5 focus:outline-none font-medium transition-all ${
                          item.category === 'Raw Materials'
                            ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:ring-2 focus:ring-amber-500'
                            : 'border-slate-300 bg-white text-slate-700 focus:border-indigo-500'
                        }`}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>
                            {c} {c === 'Raw Materials' ? '(Production Feedstock)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor={`item-notes-${idx}`} className="block text-[10px] font-medium text-slate-500 mb-0.5">
                        Specs / Warranty Notes (Optional)
                      </label>
                      <input
                        id={`item-notes-${idx}`}
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        placeholder="e.g. Model X, 2-yr warranty"
                        className="w-full text-xs rounded border border-slate-300 bg-white px-2 py-1 focus:outline-none"
                      />
                    </div>

                    {/* Mandatory Total Price (System auto-calculates) */}
                    <div className="sm:col-span-4 flex flex-col justify-end">
                      <div className="bg-white border border-slate-200 rounded px-2.5 py-1 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Total Price:
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {formatCurrency(item.total_price, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Order Summary Calculation Box - Matching Sleek Interface Design */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Order Amount
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono font-medium">
                  Calculated
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-medium">
                {items.length} item line{items.length > 1 ? 's' : ''} • {totalUnits} total unit{totalUnits > 1 ? 's' : ''} ordered
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                {formatCurrency(totalAmount, currency)}
              </div>
              <div className="text-[10px] text-indigo-400 font-medium mt-0.5">
                Verified: Sum of all item line totals
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-submit-po"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving to Database...' : 'Record Purchase Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
