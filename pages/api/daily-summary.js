// pages/api/daily-summary.js
const { shopifyGet } = require('../../lib/shopify');

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your shop domain
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Simple Auth Check ---
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ---------------- Functions ----------------
  async function getSalesToday() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000 - 1);
    const startISO = start.toISOString();
    const endISO = end.toISOString();
    const path = `/orders.json?status=any&created_at_min=${encodeURIComponent(startISO)}&created_at_max=${encodeURIComponent(endISO)}&limit=250&fields=id,total_price,financial_status,fulfillment_status`;
    const data = await shopifyGet(path);
    const orders = data.orders || [];
    const total = orders.reduce((s,o)=> s + (parseFloat(o.total_price||0)), 0);
    const cancelled = orders.filter(o => o.cancelled_at).length || 0;
    const pending = orders.filter(o => o.fulfillment_status === null || o.fulfillment_status === 'unfulfilled').length;
    return { orders_count: orders.length, total_amount: total, cancelled, pending };
  }

  async function getOutOfStockCount() {
    let since_id = 0;
    let outCount = 0;
    while (true) {
      const path = `/products.json?limit=250&since_id=${since_id}&fields=id,variants`;
      const data = await shopifyGet(path);
      const products = data.products || [];
      if (!products.length) break;
      for (const p of products) {
        for (const v of p.variants) {
          if ((Number(v.inventory_quantity || 0)) <= 0) outCount++;
        }
      }
      since_id = products[products.length-1].id;
      if (products.length < 250) break;
    }
    return outCount;
  }

  async function getNewCustomersToday() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 24*60*60*1000 - 1);
    const path = `/customers/count.json?created_at_min=${encodeURIComponent(start.toISOString())}&created_at_max=${encodeURIComponent(end.toISOString())}`;
    const data = await shopifyGet(path);
    return data.count || 0;
  }

  async function getAbandonedCountToday() {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const path = `/checkouts.json?created_at_min=${encodeURIComponent(start.toISOString())}&limit=250`;
      const data = await shopifyGet(path);
      const checkouts = data.checkouts || [];
      return { count: checkouts.length, value: (checkouts.reduce((s,c)=> s + (parseFloat(c.subtotal_price||0)),0)) };
    } catch (e) {
      return { count: 0, value: 0 };
    }
  }

  // ---------------- Main Handler ----------------
  try {
    const [sales, outCount, newCustomers, abandoned] = await Promise.all([
      getSalesToday(),
      getOutOfStockCount(),
      getNewCustomersToday(),
      getAbandonedCountToday()
    ]);

    res.status(200).json({
      date: (new Date()).toISOString().slice(0,10),
      sales,
      products: { out_of_stock_count: outCount },
      customers: { new_today: newCustomers },
      abandoned_checkouts: abandoned
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
