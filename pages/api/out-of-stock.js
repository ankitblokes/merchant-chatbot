// pages/api/out-of-stock.js
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

  try {
    let since_id = 0;
    const out = [];

    while (true) {
      const path = `/products.json?limit=250&since_id=${since_id}&fields=id,title,variants`;
      const data = await shopifyGet(path);
      const products = data.products || [];
      if (!products.length) break;

      for (const p of products) {
        for (const v of p.variants) {
          const qty = Number(v.inventory_quantity || 0);
          if (qty <= 0) {
            out.push({
              product_id: p.id,
              title: p.title,
              variant_id: v.id,
              variant_title: v.title || 'Default',
              sku: v.sku || null,
              quantity: qty
            });
          }
        }
      }

      since_id = products[products.length - 1].id;
      if (products.length < 250) break;
    }

    res.status(200).json({ out_of_stock: out, count: out.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
