import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Calendar, Building2, Package, Tag, Eye, Info } from 'lucide-react';
import { PurchaseOrderItem, PurchaseOrder } from '../types';
import { formatCurrency, formatDate, formatMonthYear, Currency } from '../utils/formatters';

interface ItemsHistoryTableProps {
  items: PurchaseOrderItem[];
  purchaseOrders: PurchaseOrder[];
  currency: Currency;
  onViewPO: (po: PurchaseOrder) => void;
  onOpenCreatePO: () => void;
  onSelectItem?: (item: PurchaseOrderItem) => void;
}

export const ItemsHistoryTable: React.FC<ItemsHistoryTableProps> = ({
  items,
  purchaseOrders,
  currency,
  onViewPO,
  onOpenCreatePO,
  onSelectItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'unit_desc' | 'name_asc'>('date_desc');

  // Distinct suppliers and categories
  const suppliers = useMemo(() => {
    const s = new Set<string>();
    items.forEach(it => {
      if (it.supplier) s.add(it.supplier);
    });
    return Array.from(s).sort();
  }, [items]);

  const categories = useMemo(() => {
    const c = new Set<string>();
    items.forEach(it => {
      if (it.category) c.add(it.category);
    });
    return Array.from(c).sort();
  }, [items]);

  // Distinct months in items
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      const d = new Date(it.purchase_date);
      if (!isNaN(d.getTime())) {
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        set.add(key);
      }
    });
    return Array.from(set).sort().reverse();
  }, [items]);

  // Filter & sort
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch =
          searchTerm === '' ||
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSupplier =
          selectedSupplier === 'all' || item.supplier.toLowerCase() === selectedSupplier.toLowerCase();

        const matchesCategory =
          selectedCategory === 'all' || item.category === selectedCategory;

        let matchesMonth = true;
        if (selectedMonth !== 'all') {
          const d = new Date(item.purchase_date);
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
          matchesMonth = key === selectedMonth;
        }

        return matchesSearch && matchesSupplier && matchesCategory && matchesMonth;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') {
          return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime();
        }
        if (sortBy === 'total_desc') {
          return b.total_price - a.total_price;
        }
        if (sortBy === 'total_asc') {
          return a.total_price - b.total_price;
        }
        if (sortBy === 'unit_desc') {
          return b.unit_price - a.unit_price;
        }
        if (sortBy === 'name_asc') {
          return a.item_name.localeCompare(b.item_name);
        }
        return 0;
      });
  }, [items, searchTerm, selectedSupplier, selectedCategory, selectedMonth, sortBy]);

  // Aggregates of filtered records
  const filteredTotalValue = useMemo(() => {
    return filteredItems.reduce((acc, it) => acc + it.total_price, 0);
  }, [filteredItems]);

  const filteredTotalQuantity = useMemo(() => {
    return filteredItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [filteredItems]);

  return (
    <div id="centralized-items-history" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span>Purchased Items Ledger (Barang Beli)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Centralized historical record of every purchased item, supplier, and purchase price
            </p>
          </div>

          {/* Quick Metrics of displayed list */}
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{filteredItems.length}</strong> of <strong className="text-slate-900">{items.length}</strong> items
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold font-mono">
              Total: {formatCurrency(filteredTotalValue, currency)}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="input-search-items"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search item, vendor, PO#..."
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Month Filter */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              id="select-month-filter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium transition-all"
            >
              <option value="all">All Months</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthYear(m)}</option>
              ))}
            </select>
          </div>

          {/* Filter by Supplier */}
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              id="select-supplier-filter"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium transition-all"
            >
              <option value="all">All Suppliers / Vendors</option>
              {suppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filter by Category */}
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              id="select-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-700 font-medium transition-all"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="total_desc">Total Cost: High to Low</option>
              <option value="total_asc">Total Cost: Low to High</option>
              <option value="unit_desc">Unit Price: High to Low</option>
              <option value="name_asc">Item Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table id="table-purchased-items" className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
            <tr>
              <th scope="col" className="py-3.5 px-5">Date Saved</th>
              <th scope="col" className="py-3.5 px-5">Item Name (Barang Beli)</th>
              <th scope="col" className="py-3.5 px-5">Supplier / Vendor</th>
              <th scope="col" className="py-3.5 px-4">PO Number</th>
              <th scope="col" className="py-3.5 px-3 text-right">Ordered</th>
              <th scope="col" className="py-3.5 px-3 text-right">Received</th>
              <th scope="col" className="py-3.5 px-3 text-right text-indigo-900 bg-indigo-50/50">Pending Balance</th>
              <th scope="col" className="py-3.5 px-4 text-right">Unit Price</th>
              <th scope="col" className="py-3.5 px-4 text-right">Total Price</th>
              <th scope="col" className="py-3.5 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-14 text-slate-400">
                  <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No purchased items found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm || selectedSupplier !== 'all'
                      ? 'Try adjusting your search terms or supplier filter'
                      : 'Record your first purchase order to start tracking vendor costs.'}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenCreatePO}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    Record New Purchase Order
                  </button>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const parentPO = purchaseOrders.find(p => p.id === item.po_id || p.po_number === item.po_number);
                const rec = item.quantity_received || 0;
                const pending = item.pending_balance !== undefined ? item.pending_balance : Math.max(0, item.quantity - rec);
                return (
                  <tr
                    key={item.id}
                    id={`item-record-${item.id}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Date of Purchase (Automatically Saved) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{formatDate(item.purchase_date)}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block ml-5">
                        {new Date(item.purchase_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Item Name (Barang Beli) */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectItem && onSelectItem(item)}
                        className="text-left font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer block"
                        title="Click to view full item specifications"
                      >
                        {item.item_name}
                      </button>
                      {item.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          {item.notes}
                        </div>
                      )}
                      {item.category && (
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                          {item.category}
                        </span>
                      )}
                    </td>

                    {/* Supplier/Vendor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">
                          {item.supplier}
                        </span>
                      </div>
                    </td>

                    {/* PO Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.po_number}
                      </span>
                    </td>

                    {/* Quantity Ordered */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800">
                      {item.quantity.toLocaleString()}
                    </td>

                    {/* Quantity Received */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-600">
                      {rec.toLocaleString()}
                    </td>

                    {/* Pending Balance */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold bg-indigo-50/20">
                      {pending === 0 ? (
                        <span className="text-emerald-600">0 (Fulfilled)</span>
                      ) : (
                        <span className="text-amber-600">{pending.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                      {formatCurrency(item.unit_price, currency)}
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.total_price, currency)}
                    </td>

                    {/* Actions: View Specs & View PO */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {onSelectItem && (
                          <button
                            type="button"
                            onClick={() => onSelectItem(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="View Item Specifications & Delivery History"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            <span>Specs</span>
                          </button>
                        )}

                        {parentPO && (
                          <button
                            type="button"
                            onClick={() => onViewPO(parentPO)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="View PO Details & Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View PO</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      {filteredItems.length > 0 && (
        <div className="bg-slate-50/70 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-4">
            <span>
              Total Units: <strong className="text-slate-800 font-mono">{filteredTotalQuantity.toLocaleString()}</strong>
            </span>
            <span>•</span>
            <span>
              Distinct Line Items: <strong className="text-slate-800">{filteredItems.length}</strong>
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span>Cumulative Cost:</span>
            <span className="text-indigo-600 font-mono">{formatCurrency(filteredTotalValue, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
