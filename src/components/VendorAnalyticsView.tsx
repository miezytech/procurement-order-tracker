import React from 'react';
import { Building2, TrendingUp, Package, Calendar } from 'lucide-react';
import { PurchaseOrderItem, PurchaseOrder } from '../types';
import { formatCurrency, formatDate, Currency } from '../utils/formatters';

interface VendorAnalyticsViewProps {
  items: PurchaseOrderItem[];
  purchaseOrders: PurchaseOrder[];
  currency: Currency;
}

export const VendorAnalyticsView: React.FC<VendorAnalyticsViewProps> = ({
  items,
  purchaseOrders,
  currency
}) => {
  // Aggregate vendor metrics
  const vendorMetrics = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      totalSpend: number;
      totalUnits: number;
      ordersCount: number;
      items: { name: string; unitPrice: number; date: string }[];
      lastOrderDate: string;
    }>();

    for (const item of items) {
      const v = item.supplier || 'Unknown';
      if (!map.has(v)) {
        map.set(v, {
          name: v,
          totalSpend: 0,
          totalUnits: 0,
          ordersCount: 0,
          items: [],
          lastOrderDate: item.purchase_date
        });
      }
      const record = map.get(v)!;
      record.totalSpend += item.total_price;
      record.totalUnits += item.quantity;
      record.items.push({
        name: item.item_name,
        unitPrice: item.unit_price,
        date: item.purchase_date
      });
      if (new Date(item.purchase_date) > new Date(record.lastOrderDate)) {
        record.lastOrderDate = item.purchase_date;
      }
    }

    // Calculate unique orders count per vendor
    for (const [v, record] of map.entries()) {
      const distinctPos = new Set<string>();
      items.filter(it => it.supplier === v).forEach(it => distinctPos.add(it.po_number));
      record.ordersCount = distinctPos.size;
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [items]);

  const grandTotal = vendorMetrics.reduce((sum, v) => sum + v.totalSpend, 0);

  return (
    <div id="vendor-analytics-view" className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Vendor Cost & Spending Analysis</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Accurate historical comparison of vendor expenditures and price structures
            </p>
          </div>
          <div className="text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            Active Vendors Tracked: <strong className="text-slate-900 font-bold">{vendorMetrics.length}</strong>
          </div>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vendorMetrics.map((vendor) => {
          const spendPercentage = grandTotal > 0 ? (vendor.totalSpend / grandTotal) * 100 : 0;
          return (
            <div
              key={vendor.name}
              id={`vendor-card-${vendor.name.replace(/\s+/g, '-').toLowerCase()}`}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 truncate max-w-[200px]" title={vendor.name}>
                        {vendor.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        Last active: {formatDate(vendor.lastOrderDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spend & Progress bar */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Cumulative Spend</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatCurrency(vendor.totalSpend, currency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, spendPercentage))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono text-right mt-1.5">
                    {spendPercentage.toFixed(1)}% of total procurement budget
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block">Purchase Orders</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{vendor.ordersCount}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block">Total Units</span>
                    <span className="font-bold text-slate-800 font-mono text-sm mt-0.5 block">{vendor.totalUnits.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Sample items from this vendor */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Catalog Samples & Price Points
                </span>
                <div className="space-y-1.5">
                  {vendor.items.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                      <span className="truncate max-w-[150px]" title={it.name}>• {it.name}</span>
                      <span className="font-mono font-bold text-slate-800 ml-2 shrink-0 text-[11px]">
                        {formatCurrency(it.unitPrice, currency)}
                      </span>
                    </div>
                  ))}
                  {vendor.items.length > 3 && (
                    <span className="text-[10px] text-slate-400 italic block mt-1">
                      + {vendor.items.length - 3} more items recorded
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
