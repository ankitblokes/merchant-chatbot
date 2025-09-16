// lib/shopify.js
const fetch = require('node-fetch');

const SHOP = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-07';

if (!SHOP || !TOKEN) {
  console.error('Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN in env');
}

const BASE = `https://${SHOP}/admin/api/${API_VER}`;

async function shopifyGet(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Shopify error ${res.status}: ${txt}`);
  }
  return res.json();
}

module.exports = { shopifyGet };
