import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Download, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  Truck, 
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { ItemWithParentPO, MonthlyProcurementSummary, PurchaseOrder } from '../types';
import { formatCurrency, formatDate, formatMonthYear, MONTH_NAMES, Currency } from '../utils/formatters';

interface MonthlyPurchaseHistoryProps {
  items: ItemWithParentPO[];
  purchaseOrders: PurchaseOrder[];
  monthlySummaries: MonthlyProcurementSummary[];
  currency: Currency;
  onSelectItem: (item: ItemWithParentPO) => void;
  onViewPO: (poNumber: string) => void;
  onLogGoodsReceipt: (poId: string) => void;
  onCreatePO?: () => void;
  onRefresh?: () => void;
}

export const MonthlyPurchaseHistory: React.FC<MonthlyPurchaseHistoryProps> = ({
  items,
  purchaseOrders,
  monthlySummaries,
  currency,
  onSelectItem,
  onViewPO,
  onLogGoodsReceipt,
  onCreatePO,
  onRefresh
}) => {
  // Default to August 2026 (current application month)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'name_asc'>('date_desc');

  // Extract selected year and month number
  const [selectedYear, selectedMonthNum] = useMemo(() => {
    if (selectedMonth === 'all') return [2026, 8];
    const [y, m] = selectedMonth.split('-');
    return [parseInt(y, 10) || 2026, parseInt(m, 10) || 8];
  }, [selectedMonth]);

  // Unique list of suppliers for filter dropdown
  const suppliersList = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.supplier) set.add(it.supplier);
    });
    return Array.from(set).sort();
  }, [items]);

  // Unique list of categories for filter dropdown (Acceptance Criteria 2 & 5)
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    // Standard required categories first
    ['Raw Materials', 'Office Supplies', 'Equipment', 'Packaging', 'Maintenance & Hardware', 'General'].forEach(c => set.add(c));
    items.forEach(it => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set);
  }, [items]);

  // Quick navigation: previous month
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth('2026-08');
      return;
    }
    let y = selectedYear;
    let m = selectedMonthNum - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  // Quick navigation: next month
  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth('2026-08');
      return;
    }
    let y = selectedYear;
    let m = selectedMonthNum + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  // Handle month dropdown change
  const handleMonthDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      setSelectedMonth('all');
    } else {
      const mNum = parseInt(val, 10);
      setSelectedMonth(`${selectedYear}-${String(mNum).padStart(2, '0')}`);
    }
  };

  // Handle year dropdown change
  const handleYearDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yNum = parseInt(e.target.value, 10);
    const mStr = selectedMonth === 'all' ? '08' : String(selectedMonthNum).padStart(2, '0');
    setSelectedMonth(`${yNum}-${mStr}`);
  };

  // Filter items according to month, search, status, and supplier
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Month filter
      if (selectedMonth !== 'all') {
        const d = new Date(item.purchase_date);
        if (isNaN(d.getTime())) return false;
        const itemMonthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        if (itemMonthKey !== selectedMonth) return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        const itemStatus = item.status || item.po_status;
        if (itemStatus !== statusFilter) return false;
      }

      // 3. Supplier filter
      if (supplierFilter !== 'all') {
        if (item.supplier.toLowerCase() !== supplierFilter.toLowerCase()) return false;
      }

      // 4. Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.item_name.toLowerCase().includes(q);
        const matchesSupplier = item.supplier.toLowerCase().includes(q);
        const matchesPO = item.po_number.toLowerCase().includes(q);
        const matchesCategory = !!(item.category && item.category.toLowerCase().includes(q));
        const matchesNotes = !!(item.notes && item.notes.toLowerCase().includes(q));
        const matchesRef = !!(item.po_reference_no && item.po_reference_no.toLowerCase().includes(q));
        if (!matchesName && !matchesSupplier && !matchesPO && !matchesCategory && !matchesNotes && !matchesRef) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime();
      }
      if (sortBy === 'price_desc') {
        return b.total_price - a.total_price;
      }
      if (sortBy === 'price_asc') {
        return a.total_price - b.total_price;
      }
      if (sortBy === 'name_asc') {
        return a.item_name.localeCompare(b.item_name);
      }
      return 0;
    });
  }, [items, selectedMonth, statusFilter, supplierFilter, searchQuery, sortBy]);

  // Compute monthly stats for the active view
  const monthStats = useMemo(() => {
    let spend = 0;
    let unitsOrdered = 0;
    let unitsReceived = 0;
    let unitsPending = 0;
    const poSet = new Set<string>();

    filteredItems.forEach(item => {
      spend += item.total_price;
      unitsOrdered += item.quantity;
      unitsReceived += (item.quantity_received || 0);
      unitsPending += (item.pending_balance !== undefined ? item.pending_balance : Math.max(0, item.quantity - (item.quantity_received || 0)));
      poSet.add(item.po_number);
    });

    return {
      totalSpend: spend,
      totalItemsCount: filteredItems.length,
      totalUnitsOrdered: unitsOrdered,
      totalUnitsReceived: unitsReceived,
      totalUnitsPending: unitsPending,
      distinctPOsCount: poSet.size
    };
  }, [filteredItems]);

  // Export CSV of current search results
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = [
      'Item Name',
      'Category',
      'Supplier',
      'PO Number',
      'Purchase Date',
      'Quantity Ordered',
      'Quantity Received',
      'Pending Balance',
      'Unit Price (RM)',
      'Total Price (RM)',
      'Status',
      'Delivery Date',
      'Specifications & Notes'
    ];

    const rows = filteredItems.map(it => [
      `"${it.item_name.replace(/"/g, '""')}"`,
      `"${(it.category || 'General').replace(/"/g, '""')}"`,
      `"${it.supplier.replace(/"/g, '""')}"`,
      it.po_number,
      it.purchase_date.split('T')[0],
      it.quantity,
      it.quantity_received || 0,
      it.pending_balance || 0,
      it.unit_price,
      it.total_price,
      it.status || it.po_status,
      it.delivery_date ? it.delivery_date.split('T')[0] : 'Pending',
      `"${(it.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `procurement_${selectedMonth}_items.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentDisplayMonthLabel = selectedMonth === 'all' 
    ? 'All Procurement Records' 
    : formatMonthYear(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Header & Date Filter Control Station */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Monthly Procurement Search & History</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Monthly Purchase Search & Specifications
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Filter and inspect procurement records by month to review goods purchased, vendor specifications, and arrival fulfillment in Malaysian Ringgit (MYR).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Refresh Monthly Records"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Print Month</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar - Acceptance Criteria 1: Month and Year selector */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Month & Year:
              </span>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {currentDisplayMonthLabel}
              </span>
            </div>

            {/* Quick Month Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Quick switch:</span>
              <button
                onClick={() => setSelectedMonth('2026-08')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedMonth === '2026-08'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                August 2026 (Current)
              </button>

              <button
                onClick={() => setSelectedMonth('2026-07')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedMonth === '2026-07'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                July 2026
              </button>

              <button
                onClick={() => setSelectedMonth('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedMonth === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Months
              </button>
            </div>
          </div>

          {/* Interactive Month & Year Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Step navigation */}
            <div className="sm:col-span-3 flex items-center space-x-1">
              <button
                onClick={handlePrevMonth}
                disabled={selectedMonth === 'all'}
                className="flex-1 py-2 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 shadow-xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Month</span>
              </button>

              <button
                onClick={handleNextMonth}
                disabled={selectedMonth === 'all'}
                className="flex-1 py-2 px-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1 shadow-xs"
                title="Next Month"
              >
                <span>Next Month</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month Dropdown */}
            <div className="sm:col-span-4">
              <label htmlFor="select-month-dropdown" className="sr-only">Select Month</label>
              <select
                id="select-month-dropdown"
                value={selectedMonth === 'all' ? 'all' : String(selectedMonthNum)}
                onChange={handleMonthDropdownChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium shadow-xs"
              >
                <option value="all">-- All Months --</option>
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={String(idx + 1)}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="sm:col-span-2">
              <label htmlFor="select-year-dropdown" className="sr-only">Select Year</label>
              <select
                id="select-year-dropdown"
                value={selectedYear}
                onChange={handleYearDropdownChange}
                disabled={selectedMonth === 'all'}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium shadow-xs disabled:opacity-50"
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Native Month-Picker Input */}
            <div className="sm:col-span-3">
              <label htmlFor="native-month-picker" className="sr-only">Calendar Month Picker</label>
              <input
                id="native-month-picker"
                type="month"
                value={selectedMonth === 'all' ? '2026-08' : selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Search, Status, and Supplier Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Keyword search input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, specs, supplier, PO# in this month..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs font-medium"
            >
              <option value="all">All Statuses (Pending & Received)</option>
              <option value="Completed">Completed (100% Received)</option>
              <option value="Partially Fulfilled">Partially Fulfilled</option>
              <option value="Pending">Pending (0% Received)</option>
            </select>
          </div>

          {/* Supplier filter */}
          <div className="sm:col-span-2">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs font-medium"
            >
              <option value="all">All Suppliers</option>
              {suppliersList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs font-medium"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="price_desc">Price: Highest First</option>
              <option value="price_asc">Price: Lowest First</option>
              <option value="name_asc">Item Name: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Monthly KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Spend */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              {selectedMonth === 'all' ? 'Total Procurement Spend' : `Spend in ${formatMonthYear(selectedMonth)}`}
            </span>
            <span className="text-xl font-bold text-slate-900">
              {formatCurrency(monthStats.totalSpend, currency)}
            </span>
          </div>
        </div>

        {/* Total Items in Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Purchased Items
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-slate-900">{monthStats.totalItemsCount}</span>
              <span className="text-xs text-slate-500">lines ({monthStats.totalUnitsOrdered} units)</span>
            </div>
          </div>
        </div>

        {/* Pending Units in Month */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Pending Balance (Barang Sampai)
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-bold text-amber-700">{monthStats.totalUnitsPending}</span>
              <span className="text-xs text-slate-500">units to arrive</span>
            </div>
          </div>
        </div>

        {/* PO Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Purchase Orders in Month
            </span>
            <span className="text-xl font-bold text-slate-900">
              {monthStats.distinctPOsCount} POs
            </span>
          </div>
        </div>
      </div>

      {/* Acceptance Criteria 2: The search results display a list of all items purchased in that month. */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-800 text-base">
              Purchased Items List: {currentDisplayMonthLabel}
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-200 text-slate-700">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any item row to inspect detailed specifications and delivery logs.</span>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4">Item & Specifications</th>
                  <th className="py-3.5 px-4">Supplier / Vendor</th>
                  <th className="py-3.5 px-4">PO Ref & Date</th>
                  <th className="py-3.5 px-4 text-center">Qty Ordered</th>
                  <th className="py-3.5 px-4 text-center">Qty Received</th>
                  <th className="py-3.5 px-4 text-center">Pending Balance</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-right">Total Price</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Delivery Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredItems.map((item) => {
                  const totalOrdered = item.quantity;
                  const totalReceived = item.quantity_received || 0;
                  const pendingBalance = item.pending_balance !== undefined 
                    ? item.pending_balance 
                    : Math.max(0, totalOrdered - totalReceived);

                  let itemStatus = item.status || item.po_status || 'Pending';
                  if (totalReceived === 0) itemStatus = 'Pending';
                  else if (pendingBalance === 0) itemStatus = 'Completed';
                  else itemStatus = 'Partially Fulfilled';

                  const deliveryDateStr = item.delivery_date 
                    ? formatDate(item.delivery_date)
                    : null;

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Item & Specifications */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm line-clamp-2">
                          {item.item_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 rounded">
                            {item.category || 'General'}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[180px]" title={item.notes}>
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.supplier}</span>
                        </div>
                      </td>

                      {/* PO Ref & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-700 text-[11px]">
                          {item.po_number}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatDate(item.purchase_date)}
                        </div>
                      </td>

                      {/* Qty Ordered */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {totalOrdered}
                      </td>

                      {/* Qty Received */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-semibold ${totalReceived > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {totalReceived}
                        </span>
                      </td>

                      {/* Pending Balance */}
                      <td className="py-3.5 px-4 text-center">
                        {pendingBalance > 0 ? (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {pendingBalance}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatCurrency(item.unit_price, currency)}
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.total_price, currency)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          itemStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : itemStatus === 'Partially Fulfilled'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {itemStatus === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />}
                          {itemStatus === 'Partially Fulfilled' && <Clock className="w-3 h-3 mr-1 text-indigo-600" />}
                          {itemStatus === 'Pending' && <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />}
                          {itemStatus}
                        </span>
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {deliveryDateStr ? (
                          <span className="text-slate-700 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {deliveryDateStr}
                          </span>
                        ) : (
                          <span className="text-amber-600 text-[11px] italic">
                            Awaiting arrival
                          </span>
                        )}
                      </td>

                      {/* Action: Acceptance Criteria 3 */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectItem(item);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors inline-flex items-center gap-1"
                          title="View detailed specifications"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Specs</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              No procurement records found for {currentDisplayMonthLabel}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              {searchQuery || statusFilter !== 'all' || supplierFilter !== 'all'
                ? 'Try adjusting your search criteria or clearing active filters.'
                : `There are no purchase orders recorded in ${currentDisplayMonthLabel}. You can choose another month or record a new purchase order.`}
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setSelectedMonth('2026-08');
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSupplierFilter('all');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
              >
                Go to August 2026 (Active Data)
              </button>

              <button
                onClick={() => {
                  setSelectedMonth('2026-07');
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSupplierFilter('all');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Go to July 2026
              </button>

              {onCreatePO && (
                <button
                  onClick={onCreatePO}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  + Create New Purchase Order
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Archive Overview Card */}
      {monthlySummaries.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Procurement Archive by Month
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {monthlySummaries.map(ms => {
              const isActive = selectedMonth === ms.month_key;
              return (
                <div
                  key={ms.month_key}
                  onClick={() => setSelectedMonth(ms.month_key)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{ms.month_label}</span>
                    <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                      {ms.pos_count} POs
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">{ms.total_items} items ({ms.total_units} units)</span>
                    <span className="font-bold text-slate-800">{formatCurrency(ms.total_spend, currency)}</span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-700">{ms.total_received_units} received</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-700">{ms.total_pending_units} pending balance</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
