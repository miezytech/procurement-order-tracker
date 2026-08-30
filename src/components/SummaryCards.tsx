import React from 'react';
import { DollarSign, FileText, Package, Users, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { ProcurementStats } from '../types';
import { formatCurrency, Currency } from '../utils/formatters';

interface SummaryCardsProps {
  stats: ProcurementStats;
  currency: Currency;
  onNavigateToReceipts?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, currency, onNavigateToReceipts }) => {
  const pendingUnits = stats.total_pending_items ?? Math.max(0, (stats.total_items || 0) - (stats.total_received_items || 0));
  const receivedUnits = stats.total_received_items ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Spend (MYR) */}
      <div id="metric-total-spend" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Spend (MYR / RM)
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold font-mono text-slate-900 truncate">
            {formatCurrency(stats.total_spend, currency)}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Aggregated historical purchase cost
          </p>
        </div>
      </div>

      {/* Pending Balance (User Story 2) */}
      <div 
        id="metric-pending-balance" 
        onClick={onNavigateToReceipts}
        className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-sm ${onNavigateToReceipts ? 'cursor-pointer hover:border-amber-300' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Balance</span>
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold font-mono text-amber-600">
            {pendingUnits.toLocaleString()} <span className="text-xs font-medium font-sans text-slate-400">units pending</span>
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
            <span>{receivedUnits.toLocaleString()} of {stats.total_items.toLocaleString()} received</span>
            {onNavigateToReceipts && (
              <span className="text-indigo-600 font-bold hover:underline">Track &rarr;</span>
            )}
          </p>
        </div>
      </div>

      {/* Purchase Orders Status Breakdown */}
      <div id="metric-total-pos" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Purchase Orders
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold font-mono text-slate-900">
            {stats.total_pos} <span className="text-xs font-medium font-sans text-slate-400">orders</span>
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold">
            <span className="text-amber-600 font-mono">{stats.pending_pos_count ?? 0} Pending</span>
            <span>•</span>
            <span className="text-indigo-600 font-mono">{stats.partially_fulfilled_pos_count ?? 0} Partial</span>
            <span>•</span>
            <span className="text-emerald-600 font-mono">{stats.completed_pos_count ?? 0} Done</span>
          </div>
        </div>
      </div>

      {/* Vendors / Suppliers */}
      <div id="metric-total-suppliers" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Vendors / Suppliers
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-700" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold font-mono text-slate-900">
            {stats.total_suppliers} <span className="text-xs font-medium font-sans text-slate-400">vendors</span>
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Centralized suppliers directory
          </p>
        </div>
      </div>
    </div>
  );
};
