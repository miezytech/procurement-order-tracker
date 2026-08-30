import React from 'react';
import { Database, PlusCircle, RotateCcw, ShieldCheck, Box, Truck } from 'lucide-react';
import { Currency } from '../utils/formatters';

interface HeaderProps {
  onOpenCreatePO: () => void;
  onOpenDbViewer: () => void;
  onResetSeed: () => void;
  onOpenReceiptModal: () => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  isSeeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreatePO,
  onOpenDbViewer,
  onResetSeed,
  onOpenReceiptModal,
  currency,
  onCurrencyChange,
  isSeeding
}) => {
  return (
    <header id="app-header" className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Box className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Purchase & Inventory System
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> Malaysia (MYR)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Procurement & Inventory Receiving • Orders, Goods Arrival & Pending Balances
          </p>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Currency Switcher: MYR (default) / USD */}
        <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200 p-0.5 text-xs">
          <button
            id="btn-currency-myr"
            type="button"
            onClick={() => onCurrencyChange('MYR')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currency === 'MYR'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Display amounts in Malaysian Ringgit (RM)"
          >
            MYR (RM)
          </button>
          <button
            id="btn-currency-usd"
            type="button"
            onClick={() => onCurrencyChange('USD')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              currency === 'USD'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Display amounts in US Dollars ($)"
          >
            USD
          </button>
        </div>

        {/* Database JSON Inspector */}
        <button
          id="btn-inspect-database"
          type="button"
          onClick={onOpenDbViewer}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Inspect live SQLite/JSON database file"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>DB Inspector</span>
        </button>

        {/* Reset Data Button */}
        <button
          id="btn-reset-demo-data"
          type="button"
          onClick={onResetSeed}
          disabled={isSeeding}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
          title="Reload baseline demonstration dataset (Malaysia currency)"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">Reset Data</span>
        </button>

        {/* Log Arrival CTA (Inventory Receiver) */}
        <button
          id="btn-header-log-arrival"
          type="button"
          onClick={onOpenReceiptModal}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer"
          title="Log Goods Receipt (Barang Sampai)"
        >
          <Truck className="w-3.5 h-3.5 text-amber-600" />
          <span>Log Arrival</span>
        </button>

        {/* Record PO Button (Procurement Officer) */}
        <button
          id="btn-open-create-po"
          type="button"
          onClick={onOpenCreatePO}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Record PO</span>
          <span className="sm:hidden">New PO</span>
        </button>

        {/* Profile Avatar & Info matching theme */}
        <div className="hidden xl:flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-900">Ahmad Fauzi</p>
            <p className="text-[11px] text-slate-400">Inventory & Procurement</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-xs">
            AF
          </div>
        </div>
      </div>
    </header>
  );
};
