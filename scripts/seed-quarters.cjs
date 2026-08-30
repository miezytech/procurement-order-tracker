const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'procurement_db.json');

const raw = fs.readFileSync(DB_PATH, 'utf-8');
const db = JSON.parse(raw);

// Check if Q1 and Q2 already exist
const hasQ1 = db.purchase_orders.some(p => p.po_number === 'PO-2026-0101');
const hasQ2 = db.purchase_orders.some(p => p.po_number === 'PO-2026-0201');

const q1Orders = [
  {
    id: "po_2026_0101",
    po_number: "PO-2026-0101",
    purchase_date: "2026-01-22T10:00:00.000Z",
    date_formatted: "2026-01-22",
    supplier: "Graha Tech Solutions Sdn Bhd",
    status: "Completed",
    notes: "Q1 IT infrastructure & workstation hardware rollout",
    reference_no: "IT-Q1-2026-01",
    total_amount: 14500,
    items_count: 2,
    total_ordered_units: 6,
    total_received_units: 6,
    total_pending_units: 0,
    items: [
      {
        id: "item_q1_01",
        po_id: "po_2026_0101",
        po_number: "PO-2026-0101",
        item_name: "Lenovo ThinkPad E14 Gen 5 (Intel i7, 16GB RAM, 512GB SSD)",
        supplier: "Graha Tech Solutions Sdn Bhd",
        quantity: 4,
        quantity_received: 4,
        pending_balance: 0,
        unit_price: 3200,
        total_price: 12800,
        category: "Hardware & IT",
        notes: "Pre-configured with enterprise security image",
        purchase_date: "2026-01-22T10:00:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-03-31T09:00:00.000Z",
        last_audit_notes: "Quarterly audit verified. Asset tags IT-2026-01 to 04 assigned."
      },
      {
        id: "item_q1_02",
        po_id: "po_2026_0101",
        po_number: "PO-2026-0101",
        item_name: "TP-Link Omada 24-Port Gigabit Managed Rackmount Switch",
        supplier: "Graha Tech Solutions Sdn Bhd",
        quantity: 2,
        quantity_received: 2,
        pending_balance: 0,
        unit_price: 850,
        total_price: 1700,
        category: "Hardware & IT",
        notes: "Installed in server rack A and B",
        purchase_date: "2026-01-22T10:00:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-03-31T09:15:00.000Z",
        last_audit_notes: "Mounted in Server Room Rack 2."
      }
    ],
    receipt_logs: [
      {
        id: "rec_q1_01",
        receipt_date: "2026-01-26T11:00:00.000Z",
        receiver_name: "Ahmad Fauzi (Stor & Logistik)",
        delivery_order_ref: "DO-GTS-5510",
        notes: "Delivered in full, tested and verified.",
        items: [
          { item_id: "item_q1_01", item_name: "Lenovo ThinkPad E14 Gen 5 (Intel i7, 16GB RAM, 512GB SSD)", quantity_received: 4 },
          { item_id: "item_q1_02", item_name: "TP-Link Omada 24-Port Gigabit Managed Rackmount Switch", quantity_received: 2 }
        ]
      }
    ],
    last_receipt_date: "2026-01-26T11:00:00.000Z",
    created_at: "2026-01-22T10:00:00.000Z",
    updated_at: "2026-01-26T11:00:00.000Z"
  },
  {
    id: "po_2026_0102",
    po_number: "PO-2026-0102",
    purchase_date: "2026-02-18T14:30:00.000Z",
    date_formatted: "2026-02-18",
    supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
    status: "Completed",
    notes: "Q1 records archiving cabinets and filing binders",
    reference_no: "ADM-Q1-2026",
    total_amount: 3120,
    items_count: 2,
    total_ordered_units: 11,
    total_received_units: 11,
    total_pending_units: 0,
    items: [
      {
        id: "item_q1_03",
        po_id: "po_2026_0102",
        po_number: "PO-2026-0102",
        item_name: "Lion Steel 4-Drawer Vertical Filing Cabinet (Lockable)",
        supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
        quantity: 3,
        quantity_received: 3,
        pending_balance: 0,
        unit_price: 720,
        total_price: 2160,
        category: "Office Supplies",
        notes: "Grey enamel finish with master keys",
        purchase_date: "2026-02-18T14:30:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-03-31T10:00:00.000Z",
        last_audit_notes: "Keys recorded in central key register."
      },
      {
        id: "item_q1_04",
        po_id: "po_2026_0102",
        po_number: "PO-2026-0102",
        item_name: "Bantex Lever Arch File 70mm A4 (Carton of 20 Files)",
        supplier: "Cahaya Stationery & Office Supplies Sdn Bhd",
        quantity: 8,
        quantity_received: 8,
        pending_balance: 0,
        unit_price: 120,
        total_price: 960,
        category: "Office Supplies",
        notes: "Assorted spine colors for audit filing",
        purchase_date: "2026-02-18T14:30:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-03-31T10:15:00.000Z",
        last_audit_notes: "Stocked in Stationery Store Rm 102."
      }
    ],
    receipt_logs: [
      {
        id: "rec_q1_02",
        receipt_date: "2026-02-22T14:00:00.000Z",
        receiver_name: "Siti Rahmah (Inventory Receiving Officer)",
        delivery_order_ref: "DO-CS-38821",
        notes: "All cabinets and cartons received intact.",
        items: [
          { item_id: "item_q1_03", item_name: "Lion Steel 4-Drawer Vertical Filing Cabinet (Lockable)", quantity_received: 3 },
          { item_id: "item_q1_04", item_name: "Bantex Lever Arch File 70mm A4 (Carton of 20 Files)", quantity_received: 8 }
        ]
      }
    ],
    last_receipt_date: "2026-02-22T14:00:00.000Z",
    created_at: "2026-02-18T14:30:00.000Z",
    updated_at: "2026-02-22T14:00:00.000Z"
  }
];

const q2Orders = [
  {
    id: "po_2026_0201",
    po_number: "PO-2026-0201",
    purchase_date: "2026-04-16T11:00:00.000Z",
    date_formatted: "2026-04-16",
    supplier: "Mega Office Furniture Sdn Bhd",
    status: "Completed",
    notes: "Q2 Ergonomic workstations upgrade for product team",
    reference_no: "FAC-Q2-004",
    total_amount: 7200,
    items_count: 1,
    total_ordered_units: 6,
    total_received_units: 6,
    total_pending_units: 0,
    items: [
      {
        id: "item_q2_01",
        po_id: "po_2026_0201",
        po_number: "PO-2026-0201",
        item_name: "Dual-Motor Electric Height Adjustable Standing Desk (150x75cm)",
        supplier: "Mega Office Furniture Sdn Bhd",
        quantity: 6,
        quantity_received: 6,
        pending_balance: 0,
        unit_price: 1200,
        total_price: 7200,
        category: "Facilities & Safety",
        notes: "Oak top finish with digital height memory handset",
        purchase_date: "2026-04-16T11:00:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-06-30T11:00:00.000Z",
        last_audit_notes: "All 6 desks deployed on Level 2 east wing."
      }
    ],
    receipt_logs: [
      {
        id: "rec_q2_01",
        receipt_date: "2026-04-20T16:00:00.000Z",
        receiver_name: "Ahmad Fauzi (Stor & Logistik)",
        delivery_order_ref: "DO-MOF-6890",
        notes: "Desks assembled and function-tested.",
        items: [
          { item_id: "item_q2_01", item_name: "Dual-Motor Electric Height Adjustable Standing Desk (150x75cm)", quantity_received: 6 }
        ]
      }
    ],
    last_receipt_date: "2026-04-20T16:00:00.000Z",
    created_at: "2026-04-16T11:00:00.000Z",
    updated_at: "2026-04-20T16:00:00.000Z"
  },
  {
    id: "po_2026_0202",
    po_number: "PO-2026-0202",
    purchase_date: "2026-05-19T13:45:00.000Z",
    date_formatted: "2026-05-19",
    supplier: "Graha Tech Solutions Sdn Bhd",
    status: "Completed",
    notes: "Q2 Server room power protection and network expansion",
    reference_no: "IT-Q2-NET-09",
    total_amount: 6800,
    items_count: 2,
    total_ordered_units: 4,
    total_received_units: 4,
    total_pending_units: 0,
    items: [
      {
        id: "item_q2_02",
        po_id: "po_2026_0202",
        po_number: "PO-2026-0202",
        item_name: "Cisco Business 250 Series Smart Switch 48-Port Gigabit PoE+",
        supplier: "Graha Tech Solutions Sdn Bhd",
        quantity: 2,
        quantity_received: 2,
        pending_balance: 0,
        unit_price: 2600,
        total_price: 5200,
        category: "Hardware & IT",
        notes: "Equipped with 370W PoE budget and 4x 10G SFP+ uplinks",
        purchase_date: "2026-05-19T13:45:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-06-30T11:30:00.000Z",
        last_audit_notes: "Active in main telecom distribution frame."
      },
      {
        id: "item_q2_03",
        po_id: "po_2026_0202",
        po_number: "PO-2026-0202",
        item_name: "Schneider Electric APC Easy UPS 1500VA Floor Tower (BVX1500LI-MS)",
        supplier: "Graha Tech Solutions Sdn Bhd",
        quantity: 2,
        quantity_received: 2,
        pending_balance: 0,
        unit_price: 800,
        total_price: 1600,
        category: "Hardware & IT",
        notes: "Battery backup units for core rack switches",
        purchase_date: "2026-05-19T13:45:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-06-30T11:45:00.000Z",
        last_audit_notes: "Self-test passed, installed in rack base."
      }
    ],
    receipt_logs: [
      {
        id: "rec_q2_02",
        receipt_date: "2026-05-23T10:30:00.000Z",
        receiver_name: "Marcus Vane (Procurement & Receiving)",
        delivery_order_ref: "DO-GTS-7104",
        notes: "Cisco switches and APC UPS delivered and signed.",
        items: [
          { item_id: "item_q2_02", item_name: "Cisco Business 250 Series Smart Switch 48-Port Gigabit PoE+", quantity_received: 2 },
          { item_id: "item_q2_03", item_name: "Schneider Electric APC Easy UPS 1500VA Floor Tower (BVX1500LI-MS)", quantity_received: 2 }
        ]
      }
    ],
    last_receipt_date: "2026-05-23T10:30:00.000Z",
    created_at: "2026-05-19T13:45:00.000Z",
    updated_at: "2026-05-23T10:30:00.000Z"
  },
  {
    id: "po_2026_0203",
    po_number: "PO-2026-0203",
    purchase_date: "2026-06-22T15:30:00.000Z",
    date_formatted: "2026-06-22",
    supplier: "Mitra Jaya Packaging Solutions Sdn Bhd",
    status: "Completed",
    notes: "Q2 Warehouse dispatch shipping labels and pallet wrapping film",
    reference_no: "WH-Q2-PACK",
    total_amount: 2880,
    items_count: 2,
    total_ordered_units: 80,
    total_received_units: 80,
    total_pending_units: 0,
    items: [
      {
        id: "item_q2_04",
        po_id: "po_2026_0203",
        po_number: "PO-2026-0203",
        item_name: "Zebra Direct Thermal Shipping Labels 4x6 (Roll of 500)",
        supplier: "Mitra Jaya Packaging Solutions Sdn Bhd",
        quantity: 40,
        quantity_received: 40,
        pending_balance: 0,
        unit_price: 32,
        total_price: 1280,
        category: "Packaging & Shipping",
        notes: "Compatible with Zebra ZD421 barcode printers",
        purchase_date: "2026-06-22T15:30:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-06-30T14:00:00.000Z",
        last_audit_notes: "Counted 40 rolls on Pallet R-08."
      },
      {
        id: "item_q2_05",
        po_id: "po_2026_0203",
        po_number: "PO-2026-0203",
        item_name: "Industrial Stretch Film Hand Wrap Roll 500mm x 2.2kg 23mic",
        supplier: "Mitra Jaya Packaging Solutions Sdn Bhd",
        quantity: 40,
        quantity_received: 40,
        pending_balance: 0,
        unit_price: 40,
        total_price: 1600,
        category: "Packaging & Shipping",
        notes: "High puncture resistance cast film",
        purchase_date: "2026-06-22T15:30:00.000Z",
        is_audit_verified: true,
        audit_verified_at: "2026-06-30T14:15:00.000Z",
        last_audit_notes: "Stored in Packaging Bay 2."
      }
    ],
    receipt_logs: [
      {
        id: "rec_q2_03",
        receipt_date: "2026-06-25T11:00:00.000Z",
        receiver_name: "Siti Rahmah (Inventory Receiving Officer)",
        delivery_order_ref: "DO-MJ-9912",
        notes: "Full quantity received at loading dock.",
        items: [
          { item_id: "item_q2_04", item_name: "Zebra Direct Thermal Shipping Labels 4x6 (Roll of 500)", quantity_received: 40 },
          { item_id: "item_q2_05", item_name: "Industrial Stretch Film Hand Wrap Roll 500mm x 2.2kg 23mic", quantity_received: 40 }
        ]
      }
    ],
    last_receipt_date: "2026-06-25T11:00:00.000Z",
    created_at: "2026-06-22T15:30:00.000Z",
    updated_at: "2026-06-25T11:00:00.000Z"
  }
];

if (!hasQ1) {
  db.purchase_orders.push(...q1Orders);
}
if (!hasQ2) {
  db.purchase_orders.push(...q2Orders);
}

// Ensure audit verification fields exist on Q3 items too
for (const po of db.purchase_orders) {
  for (const it of po.items) {
    if (it.is_audit_verified === undefined) {
      if (it.quantity_received > 0 && it.pending_balance === 0) {
        it.is_audit_verified = true;
        it.audit_verified_at = it.delivery_date || po.last_receipt_date || po.purchase_date;
        it.last_audit_notes = "Physical count verified against Delivery Order.";
      } else {
        it.is_audit_verified = false;
      }
    }
  }
}

db.metadata.total_records = db.purchase_orders.length;
db.metadata.last_updated = new Date().toISOString();

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
console.log(`Successfully updated database with ${db.purchase_orders.length} POs across quarters.`);
