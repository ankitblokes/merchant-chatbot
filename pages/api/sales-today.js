// pages/api/sales-today.js
const { shopifyGet } = require('../../lib/shopify');

export default async function handler(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // local 00:00
    const end = new Date(start.getTime() + 24*60*60*1000 - 1);

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    const path = `/orders.json?status=any&created_at_min=${encodeURIComponent(startISO)}&created_at_max=${encodeURIComponent(endISO)}&limit=250&fields=id,created_at,total_price,currency,financial_status,line_items`;
    const data = await shopifyGet(path);
    const orders = data.orders || [];

    const total = orders.reduce((s,o) => s + (parseFloat(o.total_price||0)), 0);
    res.status(200).json({
      date: start.toISOString().slice(0,10),
      orders_count: orders.length,
      total_amount: total,
      currency: orders.length ? orders[0].currency : 'INR',
      orders // raw list (optional)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
