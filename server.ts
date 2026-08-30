import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PurchaseOrder, PurchaseOrderItem, ProcurementDatabase, CreatePurchaseOrderInput } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to SQLite/JSON database file
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "procurement_db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data for Procurement Officer & Inventory Receiver (Malaysia MYR / RM)
const SEED_DATA: ProcurementDatabase = {
  purchase_orders: [
    {
      id: "po_1721020800",
      po_number: "PO-2026-0000",
      purchase_date: "2026-07-15T09:00:00.000Z",
      date_formatted: "2026-07-15",
      supplier: "Mega Office Furniture Sdn Bhd",
      status: "Completed",
      notes: "July facility air quality and sanitization stations upgrade for corporate office",
      reference_no: "FAC-JUL-2026",
      total_amount: 5400,
      items_count: 3,
      total_ordered_units: 25,
      total_received_units: 25,
      total_pending_units: 0,
      items: [
        {
          id: "item_000_a",
          po_id: "po_1721020800",
          po_number: "PO-2026-0000",
          item_name: "Sharp Plasmacluster Commercial Air Purifier (Coverage 60m²)",
          supplier: "Mega Office Furniture Sdn Bhd",
          quantity: 3,
          quantity_received: 3,
          pending_balance: 0,
          unit_price: 680,
          total_price: 2040,
          category: "Facilities & Safety",
          notes: "Equipped with HEPA filter and carbon deodorizer",
          purchase_date: "2026-07-15T09:00:00.000Z"
        },
        {
          id: "item_000_b",
          po_id: "po_1721020800",
          po_number: "PO-2026-0000",
          item_name: "Automated Non-Contact Hand Sanitizer Dispenser Stand 1000ml",
          supplier: "Mega Office Furniture Sdn Bhd",
          quantity: 10,
          quantity_received: 10,
          pending_balance: 0,
          unit_price: 180,
          total_price: 1800,
          category: "Facilities & Safety",
          notes: "Battery operated with stainless steel floor stand",
          purchase_date: "2026-07-15T09:00:00.000Z"
        },
        {
          id: "item_000_c",
          po_id: "po_1721020800",
          po_number: "PO-2026-0000",
          item_name: "Hospital-Grade Alcohol Disinfectant Liquid (5-Liter Jerrycan)",
          supplier: "Mega Office Furniture Sdn Bhd",
          quantity: 12,
          quantity_received: 12,
          pending_balance: 0,
          unit_price: 130,
          total_price: 1560,
          category: "Cleaning & Maintenance",
          notes: "Certified 75% pharmaceutical grade ethanol formula",
          purchase_date: "2026-07-15T09:00:00.000Z"
        }
      ],
      receipt_logs: [
        {
          id: "rec_1721280000",
          receipt_date: "2026-07-18T14:30:00.000Z",
          receiver_name: "Ahmad Fauzi (Stor & Logistik)",
          delivery_order_ref: "DO-MOF-6190",
          notes: "All 3 air purifiers and sanitizers received in full, operational test passed.",
          items: [
            { item_id: "item_000_a", item_name: "Sharp Plasmacluster Commercial Air Purifier (Coverage 60m²)", quantity_received: 3 },
            { item_id: "item_000_b", item_name: "Automated Non-Contact Hand Sanitizer Dispenser Stand 1000ml", quantity_received: 10 },
            { item_id: "item_000_c", item_name: "Hospital-Grade Alcohol Disinfectant Liquid (5-Liter Jerrycan)", quantity_received: 12 }
          ]
        }
      ],
      last_receipt_date: "2026-07-18T14:30:00.000Z",
      created_at: "2026-07-15T09:00:00.000Z",
      updated_at: "2026-07-18T14:30:00.000Z"
    },
    {
      id: "po_1724800100",
      po_number: "PO-2026-0001",
      purchase_date: "2026-08-20T09:30:00.000Z",
      date_formatted: "2026-08-20",
      supplier: "Graha Tech Solutions Sdn Bhd",
      status: "Completed",
      notes: "Quarterly IT equipment procurement for Engineering team - All delivered and verified",
      reference_no: "REQ-IT-2026-08",
      total_amount: 11625,
      items_count: 3,
      total_ordered_units: 12,
      total_received_units: 12,
      total_pending_units: 0,
      items: [
        {
          id: "item_001",
          po_id: "po_1724800100",
          po_number: "PO-2026-0001",
          item_name: "Dell UltraSharp 27-inch 4K Monitor (U2723QE)",
          supplier: "Graha Tech Solutions Sdn Bhd",
          quantity: 4,
          quantity_received: 4,
          pending_balance: 0,
          unit_price: 2450,
          total_price: 9800,
          category: "Hardware & IT",
          notes: "Includes 3-year local warranty in Malaysia",
          purchase_date: "2026-08-20T09:30:00.000Z"
        },
        {
          id: "item_002",
          po_id: "po_1724800100",
          po_number: "PO-2026-0001",
          item_name: "Logitech MX Master 3S Ergonomic Wireless Mouse",
          supplier: "Graha Tech Solutions Sdn Bhd",
          quantity: 3,
          quantity_received: 3,
          pending_balance: 0,
          unit_price: 450,
          total_price: 1350,
          category: "Peripherals",
          notes: "Graphite black edition with quiet click switches",
          purchase_date: "2026-08-20T09:30:00.000Z"
        },
        {
          id: "item_003",
          po_id: "po_1724800100",
          po_number: "PO-2026-0001",
          item_name: "USB-C Thunderbolt 4 Braided Cable 2M",
          supplier: "Graha Tech Solutions Sdn Bhd",
          quantity: 5,
          quantity_received: 5,
          pending_balance: 0,
          unit_price: 95,
          total_price: 475,
          category: "Peripherals",
          notes: "100W Power Delivery & 40Gbps data certified",
          purchase_date: "2026-08-20T09:30:00.000Z"
        }
      ],
      receipt_logs: [
        {
          id: "rec_1724810000",
          receipt_date: "2026-08-21T11:00:00.000Z",
          receiver_name: "Ahmad Fauzi (Stor & Logistik)",
          delivery_order_ref: "DO-GTS-8841",
          notes: "Full batch delivered in pristine condition, serial numbers recorded.",
          items: [
            { item_id: "item_001", item_name: "Dell UltraSharp 27-inch 4K Monitor (U2723QE)", quantity_received: 4 },
            { item_id: "item_002", item_name: "Logitech MX Master 3S Ergonomic Wireless Mouse", quantity_received: 3 },
            { item_id: "item_003", item_name: "USB-C Thunderbolt 4 Braided Cable 2M", quantity_received: 5 }
          ]
        }
      ],
      last_receipt_date: "2026-08-21T11:00:00.000Z",
      created_at: "2026-08-20T09:30:00.000Z",
      updated_at: "2026-08-21T11:00:00.000Z"
    },
    {
      id: "po_1724886500",
      po_number: "PO-2026-0002",
      purchase_date: "2026-08-23T14:15:00.000Z",
      date_formatted: "2026-08-23",
      supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
      status: "Partially Fulfilled",
      notes: "General office stationery and paper replenishment - First partial shipment received",
      reference_no: "GA-OFFICE-088",
      total_amount: 2046,
      items_count: 3,
      total_ordered_units: 43,
      total_received_units: 18,
      total_pending_units: 25,
      items: [
        {
          id: "item_004",
          po_id: "po_1724886500",
          po_number: "PO-2026-0002",
          item_name: "PaperOne All Purpose A4 80gsm (Box of 5 Reams)",
          supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
          quantity: 20,
          quantity_received: 10,
          pending_balance: 10,
          unit_price: 72,
          total_price: 1440,
          category: "Office Supplies",
          notes: "First batch of 10 boxes arrived; remaining 10 pending next truck",
          purchase_date: "2026-08-23T14:15:00.000Z"
        },
        {
          id: "item_005",
          po_id: "po_1724886500",
          po_number: "PO-2026-0002",
          item_name: "Pilot G2 Gel Pen 0.5mm Black (Pack of 12)",
          supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
          quantity: 8,
          quantity_received: 8,
          pending_balance: 0,
          unit_price: 42,
          total_price: 336,
          category: "Office Supplies",
          notes: "Fully received in batch 1",
          purchase_date: "2026-08-23T14:15:00.000Z"
        },
        {
          id: "item_006",
          po_id: "po_1724886500",
          po_number: "PO-2026-0002",
          item_name: "3M Post-it Super Sticky Notes 3x3 (Pack of 6)",
          supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
          quantity: 15,
          quantity_received: 0,
          pending_balance: 15,
          unit_price: 18,
          total_price: 270,
          category: "Office Supplies",
          notes: "Backordered from manufacturer, pending arrival next Tuesday",
          purchase_date: "2026-08-23T14:15:00.000Z"
        }
      ],
      receipt_logs: [
        {
          id: "rec_1724900000",
          receipt_date: "2026-08-25T10:15:00.000Z",
          receiver_name: "Siti Rahmah (Inventory Receiving Officer)",
          delivery_order_ref: "DO-CS-40192",
          notes: "Delivered partial stock. 10 boxes A4 paper & 8 packs pens accepted. Post-it pending.",
          items: [
            { item_id: "item_004", item_name: "PaperOne All Purpose A4 80gsm (Box of 5 Reams)", quantity_received: 10 },
            { item_id: "item_005", item_name: "Pilot G2 Gel Pen 0.5mm Black (Pack of 12)", quantity_received: 8 }
          ]
        }
      ],
      last_receipt_date: "2026-08-25T10:15:00.000Z",
      created_at: "2026-08-23T14:15:00.000Z",
      updated_at: "2026-08-25T10:15:00.000Z"
    },
    {
      id: "po_1724929800",
      po_number: "PO-2026-0003",
      purchase_date: "2026-08-27T11:00:00.000Z",
      date_formatted: "2026-08-27",
      supplier: "Mitra Jaya Packaging Solutions Sdn Bhd",
      status: "Pending",
      notes: "Warehouse packaging supplies for fulfillment center - Awaiting delivery dispatch",
      reference_no: "WH-PACK-402",
      total_amount: 1775,
      items_count: 2,
      total_ordered_units: 260,
      total_received_units: 0,
      total_pending_units: 260,
      items: [
        {
          id: "item_007",
          po_id: "po_1724929800",
          po_number: "PO-2026-0003",
          item_name: "Heavy Duty Corrugated Carton Boxes (50x40x40cm)",
          supplier: "Mitra Jaya Packaging Solutions Sdn Bhd",
          quantity: 250,
          quantity_received: 0,
          pending_balance: 250,
          unit_price: 4.5,
          total_price: 1125,
          category: "Packaging & Shipping",
          notes: "Custom company branding stamped",
          purchase_date: "2026-08-27T11:00:00.000Z"
        },
        {
          id: "item_008",
          po_id: "po_1724929800",
          po_number: "PO-2026-0003",
          item_name: "Air Bubble Wrap Roll (1.25m x 50m Premium)",
          supplier: "Mitra Jaya Packaging Solutions Sdn Bhd",
          quantity: 10,
          quantity_received: 0,
          pending_balance: 10,
          unit_price: 65,
          total_price: 650,
          category: "Packaging & Shipping",
          notes: "Fragile goods insulation buffer",
          purchase_date: "2026-08-27T11:00:00.000Z"
        }
      ],
      receipt_logs: [],
      created_at: "2026-08-27T11:00:00.000Z",
      updated_at: "2026-08-27T11:00:00.000Z"
    },
    {
      id: "po_1724980500",
      po_number: "PO-2026-0004",
      purchase_date: "2026-08-28T16:00:00.000Z",
      date_formatted: "2026-08-28",
      supplier: "Mega Office Furniture Sdn Bhd",
      status: "Partially Fulfilled",
      notes: "Ergonomic mesh chairs for new annex workstations",
      reference_no: "FACILITY-CHAIR-09",
      total_amount: 4640,
      items_count: 1,
      total_ordered_units: 8,
      total_received_units: 4,
      total_pending_units: 4,
      items: [
        {
          id: "item_009",
          po_id: "po_1724980500",
          po_number: "PO-2026-0004",
          item_name: "Ergonomic Executive High-Back Mesh Chair (Lumbar Support)",
          supplier: "Mega Office Furniture Sdn Bhd",
          quantity: 8,
          quantity_received: 4,
          pending_balance: 4,
          unit_price: 580,
          total_price: 4640,
          category: "General",
          notes: "First 4 assembled chairs delivered; remaining 4 scheduled tomorrow",
          purchase_date: "2026-08-28T16:00:00.000Z"
        }
      ],
      receipt_logs: [
        {
          id: "rec_1724990000",
          receipt_date: "2026-08-29T09:00:00.000Z",
          receiver_name: "Marcus Vane (Procurement & Receiving)",
          delivery_order_ref: "DO-MOF-7718",
          notes: "4 chairs assembled and delivered to Level 3. 4 remaining.",
          items: [
            { item_id: "item_009", item_name: "Ergonomic Executive High-Back Mesh Chair (Lumbar Support)", quantity_received: 4 }
          ]
        }
      ],
      last_receipt_date: "2026-08-29T09:00:00.000Z",
      created_at: "2026-08-28T16:00:00.000Z",
      updated_at: "2026-08-29T09:00:00.000Z"
    }
  ],
  suppliers: [
    "Graha Tech Solutions Sdn Bhd",
    "Cahaya Stationery & Office Supplies Sdn Bhd",
    "Mitra Jaya Packaging Solutions Sdn Bhd",
    "Mega Office Furniture Sdn Bhd",
    "Bintang Logistics Enterprise"
  ],
  metadata: {
    last_updated: new Date().toISOString(),
    engine: "JSON File Database Engine (SQLite compatible schema)",
    version: "1.2.0",
    total_records: 4
  }
};

// Helper to normalize and compute receipt and pending status per Acceptance Criteria:
// Pending (0 received)
// Partially Fulfilled (Some received, balance > 0)
// Completed (All received)
function normalizePO(po: any): PurchaseOrder {
  let totalOrdered = 0;
  let totalReceived = 0;
  let totalPending = 0;

  const normalizedItems: PurchaseOrderItem[] = (po.items || []).map((item: any) => {
    const qty = Number(item.quantity) || 0;
    const rec = typeof item.quantity_received === 'number' ? Math.max(0, item.quantity_received) : 0;
    // Acceptance criteria: Pending Balance = (Quantity Ordered - Quantity Received)
    const pending = Math.max(0, qty - rec);

    totalOrdered += qty;
    totalReceived += rec;
    totalPending += pending;

    return {
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      po_id: item.po_id || po.id,
      po_number: item.po_number || po.po_number,
      item_name: item.item_name || "Item",
      supplier: item.supplier || po.supplier,
      quantity: qty,
      quantity_received: rec,
      pending_balance: pending,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || Math.round(qty * (Number(item.unit_price) || 0) * 100) / 100,
      category: item.category || "General",
      notes: item.notes,
      purchase_date: item.purchase_date || po.purchase_date || new Date().toISOString()
    };
  });

  // Assign status strictly according to Acceptance Criteria:
  // Pending (0 received)
  // Partially Fulfilled (Some received, balance > 0)
  // Completed (All received)
  let computedStatus: 'Pending' | 'Partially Fulfilled' | 'Completed';
  if (totalReceived === 0) {
    computedStatus = 'Pending';
  } else if (totalPending > 0) {
    computedStatus = 'Partially Fulfilled';
  } else {
    computedStatus = 'Completed';
  }

  return {
    id: po.id,
    po_number: po.po_number,
    purchase_date: po.purchase_date,
    date_formatted: po.date_formatted || (po.purchase_date ? po.purchase_date.split("T")[0] : ""),
    supplier: po.supplier,
    status: computedStatus,
    notes: po.notes,
    reference_no: po.reference_no,
    total_amount: Number(po.total_amount) || normalizedItems.reduce((acc, it) => acc + it.total_price, 0),
    items_count: normalizedItems.length,
    total_ordered_units: totalOrdered,
    total_received_units: totalReceived,
    total_pending_units: totalPending,
    items: normalizedItems,
    receipt_logs: Array.isArray(po.receipt_logs) ? po.receipt_logs : [],
    last_receipt_date: po.last_receipt_date,
    created_at: po.created_at || po.purchase_date,
    updated_at: po.updated_at || new Date().toISOString()
  };
}

// Database helper functions
function readDb(): ProcurementDatabase {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(SEED_DATA);
      return SEED_DATA;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.purchase_orders = (parsed.purchase_orders || []).map(normalizePO);
    return parsed;
  } catch (err) {
    console.error("Error reading database file, using fallback:", err);
    return SEED_DATA;
  }
}

function writeDb(data: ProcurementDatabase) {
  try {
    data.metadata = {
      last_updated: new Date().toISOString(),
      engine: "JSON File Database Engine (SQLite compatible schema)",
      version: "1.2.0",
      total_records: data.purchase_orders.length
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to database file:", err);
  }
}

// Generate next PO Number sequentially (e.g. PO-2026-0004)
function generateNextPoNumber(pos: PurchaseOrder[]): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  for (const po of pos) {
    const match = po.po_number.match(/PO-\d{4}-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `PO-${currentYear}-${nextSeq}`;
}

// API Routes

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", engine: "JSON/SQLite Procurement DB" });
});

// GET /api/purchase-orders - Fetch all purchase orders with optional filtering (supplier, search, month)
app.get("/api/purchase-orders", (req: Request, res: Response) => {
  const db = readDb();
  let orders = [...db.purchase_orders];

  const search = (req.query.search as string || "").toLowerCase().trim();
  const supplier = (req.query.supplier as string || "").trim();
  const month = (req.query.month as string || "").trim(); // e.g. "2026-08"

  if (supplier && supplier !== "all") {
    orders = orders.filter(po => po.supplier.toLowerCase() === supplier.toLowerCase());
  }

  if (month && month !== "all") {
    orders = orders.filter(po => {
      const d = new Date(po.purchase_date);
      if (isNaN(d.getTime())) return false;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return key === month;
    });
  }

  if (search) {
    orders = orders.filter(po => 
      po.po_number.toLowerCase().includes(search) ||
      po.supplier.toLowerCase().includes(search) ||
      (po.notes && po.notes.toLowerCase().includes(search)) ||
      po.items.some(item => 
        item.item_name.toLowerCase().includes(search) ||
        item.supplier.toLowerCase().includes(search)
      )
    );
  }

  // Sort descending by purchase date
  orders.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());

  res.json({
    success: true,
    data: orders,
    total: orders.length
  });
});

// GET /api/items - Centralized historical record of every purchased item (barang beli) with PO specifications
app.get("/api/items", (req: Request, res: Response) => {
  const db = readDb();
  let allItems: any[] = [];

  for (const po of db.purchase_orders) {
    for (const item of po.items) {
      // Determine item delivery date and status
      const lastDelivery = po.last_receipt_date || null;
      let computedItemStatus = po.status;
      if (item.quantity_received === 0) {
        computedItemStatus = 'Pending';
      } else if (item.pending_balance === 0) {
        computedItemStatus = 'Completed';
      } else {
        computedItemStatus = 'Partially Fulfilled';
      }

      allItems.push({
        ...item,
        po_status: po.status,
        status: computedItemStatus,
        delivery_date: lastDelivery,
        po_notes: po.notes || "",
        po_reference_no: po.reference_no || "",
        receipt_logs: po.receipt_logs || []
      });
    }
  }

  const search = (req.query.search as string || "").toLowerCase().trim();
  const supplier = (req.query.supplier as string || "").trim();
  const month = (req.query.month as string || "").trim(); // e.g. "2026-08"
  const status = (req.query.status as string || "").trim();
  const sortBy = (req.query.sortBy as string || "date_desc");

  if (supplier && supplier !== "all") {
    allItems = allItems.filter(item => item.supplier.toLowerCase() === supplier.toLowerCase());
  }

  if (month && month !== "all") {
    allItems = allItems.filter(item => {
      const d = new Date(item.purchase_date);
      if (isNaN(d.getTime())) return false;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return key === month;
    });
  }

  if (status && status !== "all") {
    allItems = allItems.filter(item => item.status === status || item.po_status === status);
  }

  if (search) {
    allItems = allItems.filter(item => 
      item.item_name.toLowerCase().includes(search) ||
      item.supplier.toLowerCase().includes(search) ||
      item.po_number.toLowerCase().includes(search) ||
      (item.category && item.category.toLowerCase().includes(search)) ||
      (item.notes && item.notes.toLowerCase().includes(search))
    );
  }

  // Sorting
  if (sortBy === "date_desc") {
    allItems.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
  } else if (sortBy === "date_asc") {
    allItems.sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());
  } else if (sortBy === "price_desc") {
    allItems.sort((a, b) => b.total_price - a.total_price);
  } else if (sortBy === "price_asc") {
    allItems.sort((a, b) => a.total_price - b.total_price);
  } else if (sortBy === "name_asc") {
    allItems.sort((a, b) => a.item_name.localeCompare(b.item_name));
  }

  res.json({
    success: true,
    data: allItems,
    total: allItems.length
  });
});

// GET /api/procurement/months - Summaries grouped by Month and Year (e.g. "August 2026", "July 2026")
app.get("/api/procurement/months", (_req: Request, res: Response) => {
  const db = readDb();
  const monthMap: Record<string, any> = {};

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  for (const po of db.purchase_orders) {
    const d = new Date(po.purchase_date);
    if (isNaN(d.getTime())) continue;
    const year = d.getUTCFullYear();
    const monthNum = d.getUTCMonth() + 1;
    const monthKey = `${year}-${String(monthNum).padStart(2, "0")}`;
    const monthLabel = `${monthNames[monthNum - 1]} ${year}`;

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        month_key: monthKey,
        month_label: monthLabel,
        year,
        month_number: monthNum,
        total_items: 0,
        total_units: 0,
        total_received_units: 0,
        total_pending_units: 0,
        total_spend: 0,
        pos_count: 0,
        pending_pos: 0,
        partially_fulfilled_pos: 0,
        completed_pos: 0
      };
    }

    const summary = monthMap[monthKey];
    summary.pos_count += 1;
    if (po.status === "Pending") summary.pending_pos += 1;
    else if (po.status === "Partially Fulfilled") summary.partially_fulfilled_pos += 1;
    else if (po.status === "Completed") summary.completed_pos += 1;

    for (const item of po.items) {
      summary.total_items += 1;
      summary.total_units += item.quantity;
      summary.total_received_units += (item.quantity_received || 0);
      summary.total_pending_units += (item.pending_balance !== undefined ? item.pending_balance : Math.max(0, item.quantity - (item.quantity_received || 0)));
      summary.total_spend += item.total_price;
    }
  }

  // Sort descending by month_key (e.g. 2026-08 before 2026-07)
  const sortedMonths = Object.values(monthMap).sort((a, b) => b.month_key.localeCompare(a.month_key));

  res.json({
    success: true,
    data: sortedMonths
  });
});

// GET /api/stock/quarterly - Real-time quarterly stock levels, on-hand inventory, audit status, and budget projection
app.get("/api/stock/quarterly", (req: Request, res: Response) => {
  const db = readDb();

  const quarterLabels: Record<string, { label: string; months: string[]; months_label: string; range: string }> = {
    "Q1": { label: "Q1", months: ["January", "February", "March"], months_label: "Jan - Mar", range: "1 Jan - 31 Mar" },
    "Q2": { label: "Q2", months: ["April", "May", "June"], months_label: "Apr - Jun", range: "1 Apr - 30 Jun" },
    "Q3": { label: "Q3", months: ["July", "August", "September"], months_label: "Jul - Sep", range: "1 Jul - 30 Sep" },
    "Q4": { label: "Q4", months: ["October", "November", "December"], months_label: "Oct - Dec", range: "1 Oct - 31 Dec" },
  };

  const discoveredYears = new Set<number>([2026]);
  for (const po of db.purchase_orders) {
    const d = new Date(po.purchase_date);
    if (!isNaN(d.getTime())) {
      discoveredYears.add(d.getUTCFullYear());
    }
  }

  const sortedYears = Array.from(discoveredYears).sort((a, b) => b - a);
  const availableQuarters: any[] = [];

  for (const yr of sortedYears) {
    for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
      const qKey = `${yr}-${q}`;
      const meta = quarterLabels[q];
      const isCurrent = (yr === 2026 && q === "Q3");
      availableQuarters.push({
        key: qKey,
        label: `${q} ${yr}`,
        year: yr,
        quarter: q,
        months_label: meta.months_label,
        date_range_label: `${meta.range} ${yr}`,
        is_current: isCurrent
      });
    }
  }

  const requestedQuarter = (req.query.quarter as string || "2026-Q3").trim();
  const [reqYearStr, reqQName] = requestedQuarter.split("-");
  const selectedYear = parseInt(reqYearStr, 10) || 2026;
  const selectedQName = (reqQName || "Q3") as "Q1" | "Q2" | "Q3" | "Q4";
  const selectedQKey = `${selectedYear}-${selectedQName}`;

  const qMeta = quarterLabels[selectedQName] || quarterLabels["Q3"];

  const quarterMonthIndices: number[] = 
    selectedQName === "Q1" ? [0, 1, 2] :
    selectedQName === "Q2" ? [3, 4, 5] :
    selectedQName === "Q3" ? [6, 7, 8] : [9, 10, 11];

  let totalStockPurchased = 0;
  let totalStockReceived = 0;
  let currentOnHandInventory = 0;
  let pendingInTransitStock = 0;
  let totalQuarterSpend = 0;
  let onHandValuation = 0;
  let pendingLiability = 0;
  let auditedCount = 0;

  const categoryMap: Record<string, any> = {};
  const quarterlyItems: any[] = [];
  const matchingPos = new Set<string>();

  for (const po of db.purchase_orders) {
    const poDate = new Date(po.purchase_date);
    if (isNaN(poDate.getTime())) continue;

    const poYear = poDate.getUTCFullYear();
    const poMonth = poDate.getUTCMonth();

    if (poYear === selectedYear && quarterMonthIndices.includes(poMonth)) {
      matchingPos.add(po.id);

      for (const item of po.items) {
        const purchased = Number(item.quantity) || 0;
        const received = Number(item.quantity_received) || 0;
        const onHand = received;
        const pending = item.pending_balance !== undefined ? item.pending_balance : Math.max(0, purchased - received);
        const unitPrice = Number(item.unit_price) || 0;
        const spend = Number(item.total_price) || (purchased * unitPrice);
        const itemValuation = onHand * unitPrice;
        const itemPendingValue = pending * unitPrice;

        totalStockPurchased += purchased;
        totalStockReceived += received;
        currentOnHandInventory += onHand;
        pendingInTransitStock += pending;
        totalQuarterSpend += spend;
        onHandValuation += itemValuation;
        pendingLiability += itemPendingValue;

        const isVerified = Boolean(item.is_audit_verified);
        if (isVerified) auditedCount++;

        let statusText: 'In Stock' | 'Partially Received' | 'Awaiting Delivery' = 'In Stock';
        if (received === 0) statusText = 'Awaiting Delivery';
        else if (pending > 0) statusText = 'Partially Received';
        else statusText = 'In Stock';

        const cat = item.category || 'General';
        if (!categoryMap[cat]) {
          categoryMap[cat] = {
            category: cat,
            stock_purchased: 0,
            stock_received: 0,
            on_hand_inventory: 0,
            pending_stock: 0,
            total_spend: 0,
            on_hand_valuation: 0,
            items_count: 0
          };
        }
        categoryMap[cat].stock_purchased += purchased;
        categoryMap[cat].stock_received += received;
        categoryMap[cat].on_hand_inventory += onHand;
        categoryMap[cat].pending_stock += pending;
        categoryMap[cat].total_spend += spend;
        categoryMap[cat].on_hand_valuation += itemValuation;
        categoryMap[cat].items_count += 1;

        quarterlyItems.push({
          id: item.id,
          po_id: po.id,
          po_number: po.po_number,
          item_name: item.item_name,
          category: cat,
          supplier: item.supplier || po.supplier,
          purchase_date: item.purchase_date || po.purchase_date,
          delivery_date: po.last_receipt_date || null,
          stock_purchased: purchased,
          stock_received: received,
          on_hand_inventory: onHand,
          pending_stock: pending,
          unit_price: unitPrice,
          total_spend: spend,
          on_hand_valuation: itemValuation,
          status: statusText,
          last_audit_notes: item.last_audit_notes || "",
          is_audit_verified: isVerified,
          audit_verified_at: item.audit_verified_at || null
        });
      }
    }
  }

  const fulfillmentRate = totalStockPurchased > 0 
    ? Math.round((totalStockReceived / totalStockPurchased) * 100) 
    : 0;

  let nextYear = selectedYear;
  let nextQ: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q4';
  if (selectedQName === 'Q1') nextQ = 'Q2';
  else if (selectedQName === 'Q2') nextQ = 'Q3';
  else if (selectedQName === 'Q3') nextQ = 'Q4';
  else {
    nextQ = 'Q1';
    nextYear = selectedYear + 1;
  }
  const nextQKey = `${nextYear}-${nextQ}`;
  const nextQMeta = quarterLabels[nextQ];

  let recommendedBudget = 0;
  if (totalQuarterSpend > 0) {
    recommendedBudget = Math.round((totalQuarterSpend * 1.10) + (pendingLiability * 0.25));
  } else {
    recommendedBudget = 25000;
  }

  const budgetNotes: string[] = [
    `Baseline budget benchmark derived from ${selectedQName} ${selectedYear} total procurement spend of RM ${totalQuarterSpend.toLocaleString()}.`,
    `Current on-hand inventory valuation stands at RM ${onHandValuation.toLocaleString()} across ${currentOnHandInventory} received units in stores.`,
    pendingInTransitStock > 0 
      ? `Factor in RM ${pendingLiability.toLocaleString()} in pending liabilities (${pendingInTransitStock} units in-transit) before finalizing new purchase orders.`
      : `Zero pending in-transit liability carry-over from ${selectedQName} ${selectedYear}. Full procurement capacity available.`,
    `Audit verification progress: ${auditedCount} of ${quarterlyItems.length} items verified (${quarterlyItems.length > 0 ? Math.round((auditedCount / quarterlyItems.length) * 100) : 0}% completion).`
  ];

  const report = {
    quarter_key: selectedQKey,
    quarter_name: selectedQName,
    year: selectedYear,
    label: `${selectedQName} ${selectedYear} (${qMeta.months_label})`,
    months_covered: qMeta.months,
    date_range_label: `${qMeta.range} ${selectedYear}`,

    total_stock_purchased: totalStockPurchased,
    total_stock_received: totalStockReceived,
    current_on_hand_inventory: currentOnHandInventory,
    pending_in_transit_stock: pendingInTransitStock,

    total_quarter_spend: totalQuarterSpend,
    on_hand_inventory_valuation: onHandValuation,
    pending_stock_liability: pendingLiability,

    fulfillment_rate_percentage: fulfillmentRate,
    pos_count: matchingPos.size,
    items_count: quarterlyItems.length,
    audited_items_count: auditedCount,
    categories: Object.values(categoryMap).sort((a: any, b: any) => b.total_spend - a.total_spend),
    items: quarterlyItems.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()),

    next_quarter_key: nextQKey,
    next_quarter_label: `${nextQ} ${nextYear} (${nextQMeta.months_label})`,
    recommended_procurement_budget: recommendedBudget,
    budget_planning_notes: budgetNotes
  };

  res.json({
    success: true,
    data: {
      report,
      available_quarters: availableQuarters
    }
  });
});

// POST /api/stock/audit-item - Inventory Manager quarterly audit verification & notes
app.post("/api/stock/audit-item", (req: Request, res: Response) => {
  try {
    const { itemId, isVerified, auditNotes, auditorName } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, error: "itemId is required" });
    }

    const db = readDb();
    let found = false;
    const nowIso = new Date().toISOString();

    for (const po of db.purchase_orders) {
      for (const item of po.items) {
        if (item.id === itemId) {
          item.is_audit_verified = Boolean(isVerified);
          item.audit_verified_at = isVerified ? nowIso : undefined;
          if (auditNotes !== undefined) {
            item.last_audit_notes = String(auditNotes).trim();
          }
          found = true;
          break;
        }
      }
      if (found) {
        po.updated_at = nowIso;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({ success: false, error: "Stock item not found in database." });
    }

    writeDb(db);
    res.json({ 
      success: true, 
      message: "Quarterly stock audit status updated successfully.",
      data: { itemId, isVerified, auditNotes }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update audit status." });
  }
});

// POST /api/purchase-orders - Create a new Purchase Order with mandatory item fields & automatic purchase date
app.post("/api/purchase-orders", (req: Request, res: Response) => {
  try {
    const input: CreatePurchaseOrderInput = req.body;

    // Validation: PO must have at least one item
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: A Purchase Order must include at least one item."
      });
    }

    const defaultSupplier = (input.supplier || "").trim();

    // Validation: Check mandatory fields for EVERY item entry
    // Acceptance Criteria: Mandatory fields: Item Name, Supplier/Vendor, Quantity Ordered, Unit Price, and Total Price.
    const validatedItems: PurchaseOrderItem[] = [];
    const nowIso = new Date().toISOString();
    const purchaseDate = input.purchase_date ? new Date(input.purchase_date).toISOString() : nowIso;
    const poId = `po_${Date.now()}`;

    const db = readDb();
    const poNumber = input.po_number && input.po_number.trim() !== "" 
      ? input.po_number.trim() 
      : generateNextPoNumber(db.purchase_orders);

    let totalAmount = 0;

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const indexDisplay = i + 1;

      // 1. Item Name (barang beli)
      if (!item.item_name || item.item_name.trim() === "") {
        return res.status(400).json({
          success: false,
          error: `Validation error at Item #${indexDisplay}: 'Item Name' (barang beli) is a mandatory field.`
        });
      }

      // 2. Supplier/Vendor
      const itemSupplier = (item.supplier || defaultSupplier).trim();
      if (!itemSupplier) {
        return res.status(400).json({
          success: false,
          error: `Validation error at Item #${indexDisplay} ("${item.item_name}"): 'Supplier/Vendor' is a mandatory field.`
        });
      }

      // 3. Quantity Ordered
      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: `Validation error at Item #${indexDisplay} ("${item.item_name}"): 'Quantity Ordered' must be a valid number greater than 0.`
        });
      }

      // 4. Unit Price
      const unitPrice = Number(item.unit_price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        return res.status(400).json({
          success: false,
          error: `Validation error at Item #${indexDisplay} ("${item.item_name}"): 'Unit Price' must be a non-negative number.`
        });
      }

      // 5. Total Price
      // System guarantees accurate calculation: Quantity * Unit Price
      const calculatedTotalPrice = Math.round(quantity * unitPrice * 100) / 100;
      totalAmount += calculatedTotalPrice;

      validatedItems.push({
        id: `item_${Date.now()}_${i}`,
        po_id: poId,
        po_number: poNumber,
        item_name: item.item_name.trim(),
        supplier: itemSupplier,
        quantity: quantity,
        quantity_received: 0,        // Initially 0 received
        pending_balance: quantity,   // Pending balance initially equals ordered quantity
        unit_price: unitPrice,
        total_price: calculatedTotalPrice,
        category: item.category ? item.category.trim() : "General",
        notes: item.notes ? item.notes.trim() : undefined,
        // The system automatically saves the date of purchase
        purchase_date: purchaseDate
      });
    }

    const newPO: PurchaseOrder = {
      id: poId,
      po_number: poNumber,
      // The system automatically saves the date of purchase
      purchase_date: purchaseDate,
      date_formatted: purchaseDate.split("T")[0],
      supplier: defaultSupplier || validatedItems[0].supplier,
      // Acceptance Criteria: Newly created order has 0 received -> "Pending"
      status: "Pending",
      notes: input.notes ? input.notes.trim() : undefined,
      reference_no: input.reference_no ? input.reference_no.trim() : undefined,
      total_amount: totalAmount,
      items_count: validatedItems.length,
      total_ordered_units: validatedItems.reduce((acc, it) => acc + it.quantity, 0),
      total_received_units: 0,
      total_pending_units: validatedItems.reduce((acc, it) => acc + it.quantity, 0),
      items: validatedItems,
      receipt_logs: [],
      created_at: nowIso,
      updated_at: nowIso
    };

    // Update database
    db.purchase_orders.unshift(newPO);

    // Register any new suppliers in database list
    for (const it of validatedItems) {
      if (!db.suppliers.includes(it.supplier)) {
        db.suppliers.push(it.supplier);
      }
    }
    if (newPO.supplier && !db.suppliers.includes(newPO.supplier)) {
      db.suppliers.push(newPO.supplier);
    }

    writeDb(db);

    return res.status(201).json({
      success: true,
      message: "Purchase Order recorded successfully with mandatory item specifications and purchase date.",
      data: newPO
    });
  } catch (err: any) {
    console.error("Error creating purchase order:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error while saving Purchase Order: " + (err.message || String(err))
    });
  }
});

// POST /api/purchase-orders/:id/goods-receipt - Log Goods Receipt & calculate Pending Balance (User Story 2)
// Acceptance Criteria:
// 1. Users can pull up an existing Purchase Order and input the "Quantity Received" for each item.
// 2. The system automatically calculates and displays the Pending Balance (Quantity Ordered - Quantity Received).
// 3. The system assigns a status to the order:
//    - Pending (0 received)
//    - Partially Fulfilled (Some received, balance > 0)
//    - Completed (All received).
app.post("/api/purchase-orders/:id/goods-receipt", (req: Request, res: Response) => {
  try {
    const poId = req.params.id;
    const {
      receiver_name,
      delivery_order_ref,
      receipt_date,
      notes,
      items: receivedItems
    } = req.body;

    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Goods Receipt must specify received quantities for items."
      });
    }

    const db = readDb();
    const poIndex = db.purchase_orders.findIndex(p => p.id === poId || p.po_number === poId);
    if (poIndex === -1) {
      return res.status(404).json({ success: false, error: "Purchase Order not found." });
    }

    const po = db.purchase_orders[poIndex];
    const receiptTimestamp = receipt_date ? new Date(receipt_date).toISOString() : new Date().toISOString();
    const receiver = (receiver_name || "Inventory Receiver").trim();
    const loggedItems: { item_id: string; item_name: string; quantity_received: number }[] = [];

    // Process each item arrival
    for (const entry of receivedItems) {
      const targetItem = po.items.find(it => it.id === entry.item_id);
      if (!targetItem) continue;

      let delta = 0;
      const incomingDelta = entry.received_now !== undefined 
        ? entry.received_now 
        : (entry.arriving_quantity !== undefined ? entry.arriving_quantity : entry.quantity_arrived);

      if (incomingDelta !== undefined) {
        // Delta arrived in this delivery batch
        delta = Number(incomingDelta) || 0;
        if (delta < 0) delta = 0;
        const newReceived = (targetItem.quantity_received || 0) + delta;
        targetItem.quantity_received = newReceived;
        // Acceptance criteria: Pending Balance (Quantity Ordered - Quantity Received)
        targetItem.pending_balance = Math.max(0, targetItem.quantity - newReceived);
      } else if (entry.quantity_received !== undefined) {
        // Direct set of total received
        const newTotal = Math.max(0, Number(entry.quantity_received) || 0);
        delta = newTotal - (targetItem.quantity_received || 0);
        targetItem.quantity_received = newTotal;
        // Acceptance criteria: Pending Balance (Quantity Ordered - Quantity Received)
        targetItem.pending_balance = Math.max(0, targetItem.quantity - newTotal);
      }

      if (delta > 0) {
        loggedItems.push({
          item_id: targetItem.id,
          item_name: targetItem.item_name,
          quantity_received: delta
        });
      }
    }

    // Record receipt log entry
    if (loggedItems.length > 0) {
      if (!po.receipt_logs) po.receipt_logs = [];
      po.receipt_logs.unshift({
        id: `rec_${Date.now()}`,
        receipt_date: receiptTimestamp,
        receiver_name: receiver,
        delivery_order_ref: delivery_order_ref ? String(delivery_order_ref).trim() : undefined,
        notes: notes ? String(notes).trim() : undefined,
        items: loggedItems
      });
      po.last_receipt_date = receiptTimestamp;
    }

    // Recalculate totals
    let totalOrdered = 0;
    let totalReceived = 0;
    let totalPending = 0;

    for (const it of po.items) {
      totalOrdered += it.quantity;
      totalReceived += it.quantity_received || 0;
      totalPending += it.pending_balance;
    }

    po.total_ordered_units = totalOrdered;
    po.total_received_units = totalReceived;
    po.total_pending_units = totalPending;

    // Acceptance Criteria:
    // The system assigns a status to the order:
    // Pending (0 received)
    // Partially Fulfilled (Some received, balance > 0)
    // Completed (All received).
    if (totalReceived === 0) {
      po.status = "Pending";
    } else if (totalPending > 0) {
      po.status = "Partially Fulfilled";
    } else {
      po.status = "Completed";
    }

    po.updated_at = new Date().toISOString();
    db.purchase_orders[poIndex] = po;
    writeDb(db);

    return res.json({
      success: true,
      message: `Goods receipt logged for ${po.po_number}. Status updated to "${po.status}". Pending balance: ${po.total_pending_units} units.`,
      data: po
    });
  } catch (err: any) {
    console.error("Error processing goods receipt:", err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// DELETE /api/purchase-orders/:id
app.delete("/api/purchase-orders/:id", (req: Request, res: Response) => {
  const db = readDb();
  const index = db.purchase_orders.findIndex(po => po.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Purchase Order not found" });
  }

  const removed = db.purchase_orders.splice(index, 1)[0];
  writeDb(db);

  res.json({ success: true, message: `PO ${removed.po_number} deleted`, data: removed });
});

// GET /api/suppliers - Aggregated supplier & vendor cost intelligence
app.get("/api/suppliers", (_req: Request, res: Response) => {
  const db = readDb();
  const supplierStats: Record<string, {
    name: string;
    total_orders: number;
    total_spend: number;
    total_items_count: number;
    items_supplied: string[];
    last_purchased_date: string;
  }> = {};

  // Initialize from supplier list
  for (const s of db.suppliers) {
    supplierStats[s] = {
      name: s,
      total_orders: 0,
      total_spend: 0,
      total_items_count: 0,
      items_supplied: [],
      last_purchased_date: ""
    };
  }

  // Aggregate through POs and items
  for (const po of db.purchase_orders) {
    for (const item of po.items) {
      if (!supplierStats[item.supplier]) {
        supplierStats[item.supplier] = {
          name: item.supplier,
          total_orders: 0,
          total_spend: 0,
          total_items_count: 0,
          items_supplied: [],
          last_purchased_date: ""
        };
      }
      const stat = supplierStats[item.supplier];
      stat.total_spend += item.total_price;
      stat.total_items_count += item.quantity;
      if (!stat.items_supplied.includes(item.item_name)) {
        stat.items_supplied.push(item.item_name);
      }
      if (!stat.last_purchased_date || new Date(item.purchase_date) > new Date(stat.last_purchased_date)) {
        stat.last_purchased_date = item.purchase_date;
      }
    }
  }

  for (const po of db.purchase_orders) {
    if (supplierStats[po.supplier]) {
      supplierStats[po.supplier].total_orders += 1;
    }
  }

  res.json({
    success: true,
    data: Object.values(supplierStats)
  });
});

// GET /api/stats - Procurement & Goods Receipt KPIs (User Story 1 & 2)
app.get("/api/stats", (_req: Request, res: Response) => {
  const db = readDb();
  let totalSpend = 0;
  let totalItemsCount = 0;
  let totalReceivedItems = 0;
  let totalPendingItems = 0;
  let pendingPOs = 0;
  let partiallyFulfilledPOs = 0;
  let completedPOs = 0;
  const suppliersSet = new Set<string>();

  for (const po of db.purchase_orders) {
    totalSpend += po.total_amount;
    suppliersSet.add(po.supplier);

    if (po.status === "Pending") pendingPOs++;
    else if (po.status === "Partially Fulfilled") partiallyFulfilledPOs++;
    else if (po.status === "Completed") completedPOs++;

    for (const item of po.items) {
      totalItemsCount += item.quantity;
      totalReceivedItems += (item.quantity_received || 0);
      totalPendingItems += (item.pending_balance ?? Math.max(0, item.quantity - (item.quantity_received || 0)));
      suppliersSet.add(item.supplier);
    }
  }

  res.json({
    success: true,
    data: {
      total_spend: totalSpend,
      total_pos: db.purchase_orders.length,
      total_items: totalItemsCount,
      total_suppliers: suppliersSet.size,
      total_received_items: totalReceivedItems,
      total_pending_items: totalPendingItems,
      pending_pos_count: pendingPOs,
      partially_fulfilled_pos_count: partiallyFulfilledPOs,
      completed_pos_count: completedPOs
    }
  });
});

// GET /api/database - Inspect SQLite/JSON database directly
app.get("/api/database", (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db);
});

// POST /api/database/reset - Re-seed demo database
app.post("/api/database/reset", (_req: Request, res: Response) => {
  writeDb(SEED_DATA);
  res.json({ success: true, message: "Database reset to initial demonstration dataset.", data: SEED_DATA });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Procurement Order Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
