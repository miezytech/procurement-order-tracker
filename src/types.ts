export const STANDARD_ITEM_CATEGORIES = [
  'Raw Materials',
  'Office Supplies',
  'Equipment',
  'Packaging',
  'Maintenance & Hardware',
  'General'
] as const;

export type StandardItemCategory = typeof STANDARD_ITEM_CATEGORIES[number];

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  po_number: string;
  item_name: string;      // Mandatory: Item Name (barang beli)
  supplier: string;       // Mandatory: Supplier/Vendor
  quantity: number;       // Mandatory: Quantity Ordered
  quantity_received: number; // Quantity Received to date (barang sampai)
  pending_balance: number;   // Pending Balance (Quantity Ordered - Quantity Received)
  unit_price: number;     // Mandatory: Unit Price (MYR / RM)
  total_price: number;    // Mandatory: Total Price (quantity * unit_price)
  category?: string;
  notes?: string;
  purchase_date: string;  // Mandatory: Automatically saved date of purchase (ISO string)
  is_audit_verified?: boolean;
  audit_verified_at?: string;
  last_audit_notes?: string;
}

export interface ReceiptLogItem {
  item_id: string;
  item_name: string;
  quantity_received: number;
}

export interface ReceiptLogEntry {
  id: string;
  receipt_date: string;
  receiver_name?: string;
  delivery_order_ref?: string; // Surat Jalan / DO Reference
  notes?: string;
  items: ReceiptLogItem[];
}

export type POStatus = 'Pending' | 'Partially Fulfilled' | 'Completed';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  purchase_date: string;  // Automatically saved date (ISO string)
  date_formatted: string;
  supplier: string;       // Primary supplier/vendor
  status: POStatus;       // 'Pending' (0 received), 'Partially Fulfilled' (some received, balance > 0), 'Completed' (all received)
  notes?: string;
  reference_no?: string;
  total_amount: number;
  items_count: number;
  total_ordered_units: number;
  total_received_units: number;
  total_pending_units: number;
  items: PurchaseOrderItem[];
  receipt_logs?: ReceiptLogEntry[];
  last_receipt_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderItemInput {
  item_name: string;
  supplier: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  notes?: string;
}

export interface CreatePurchaseOrderInput {
  po_number?: string;
  supplier: string;
  purchase_date?: string; // Optional override, defaults to now()
  status?: POStatus;
  notes?: string;
  reference_no?: string;
  items: CreateOrderItemInput[];
}

export interface GoodsReceiptItemInput {
  item_id: string;
  received_now: number; // additional received quantity arriving in this shipment
}

export interface LogGoodsReceiptInput {
  receiver_name?: string;
  delivery_order_ref?: string;
  receipt_date?: string;
  notes?: string;
  items: GoodsReceiptItemInput[];
}

export interface ProcurementDatabase {
  purchase_orders: PurchaseOrder[];
  suppliers: string[];
  metadata: {
    last_updated: string;
    engine: string;
    version: string;
    total_records: number;
  };
}

export interface ProcurementStats {
  total_spend: number;
  total_pos: number;
  total_items: number;
  total_suppliers: number;
  total_received_items: number;
  total_pending_items: number;
  pending_pos_count: number;
  partially_fulfilled_pos_count: number;
  completed_pos_count: number;
}

export interface ItemWithParentPO extends PurchaseOrderItem {
  po_status: POStatus;
  status: POStatus;
  delivery_date?: string;
  po_notes?: string;
  po_reference_no?: string;
  receipt_logs?: ReceiptLogEntry[];
  parent_po?: PurchaseOrder;
}

export interface MonthlyProcurementSummary {
  month_key: string;      // e.g. "2026-08"
  month_label: string;    // e.g. "August 2026"
  year: number;
  month_number: number;   // 1 - 12
  total_items: number;
  total_units: number;
  total_received_units: number;
  total_pending_units: number;
  total_spend: number;
  pos_count: number;
  pending_pos: number;
  partially_fulfilled_pos: number;
  completed_pos: number;
}

export type QuarterName = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface AvailableQuarter {
  key: string;            // e.g. "2026-Q3"
  label: string;          // e.g. "Q3 2026"
  year: number;           // 2026
  quarter: QuarterName;   // "Q3"
  months_label: string;   // "Jul - Sep"
  is_current?: boolean;
}

export interface QuarterlyCategoryBreakdown {
  category: string;
  stock_purchased: number;
  stock_received: number;
  on_hand_inventory: number;
  pending_stock: number;
  total_spend: number;
  on_hand_valuation: number;
  items_count: number;
}

export interface QuarterlyStockItem {
  id: string;
  po_id: string;
  po_number: string;
  item_name: string;
  category: string;
  supplier: string;
  purchase_date: string;
  delivery_date?: string;
  stock_purchased: number;        // total ordered quantity
  stock_received: number;         // total received quantity
  on_hand_inventory: number;      // current on-hand inventory for this period
  pending_stock: number;          // pending in-transit balance
  unit_price: number;
  total_spend: number;
  on_hand_valuation: number;
  status: 'In Stock' | 'Partially Received' | 'Awaiting Delivery';
  last_audit_notes?: string;
  is_audit_verified?: boolean;
  audit_verified_at?: string;
}

export interface QuarterlyStockReport {
  quarter_key: string;            // e.g. "2026-Q3"
  quarter_name: QuarterName;      // "Q1" | "Q2" | "Q3" | "Q4"
  year: number;                   // 2026
  label: string;                  // e.g. "Q3 2026 (Jul - Sep)"
  months_covered: string[];       // ["July", "August", "September"]
  date_range_label: string;       // "1 Jul 2026 - 30 Sep 2026"
  
  // Core criteria: total stock purchased, total stock received, and current on-hand inventory
  total_stock_purchased: number;
  total_stock_received: number;
  current_on_hand_inventory: number;
  pending_in_transit_stock: number;
  
  // Financial valuations (MYR / RM)
  total_quarter_spend: number;
  on_hand_inventory_valuation: number;
  pending_stock_liability: number;
  
  // Audit and performance metrics
  fulfillment_rate_percentage: number;
  pos_count: number;
  items_count: number;
  audited_items_count: number;
  categories: QuarterlyCategoryBreakdown[];
  items: QuarterlyStockItem[];

  // Upcoming quarter budget planning
  next_quarter_key: string;
  next_quarter_label: string;
  recommended_procurement_budget: number;
  budget_planning_notes: string[];
}

