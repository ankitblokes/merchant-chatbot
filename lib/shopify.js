const SHOPIFY_STORE = process.env.SHOPIFY_STORE;           // Example: myshop.myshopify.com
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN; // From custom app -> Admin API access token
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01"; // fallback

async function shopifyGet(path) {
  if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error("Missing Shopify environment variables");
  }

  // ✅ Ensure no double slashes in URL
  const url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}${path}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Shopify API error ${res.status}: ${errText}`);
    }

    return res.json();
  } catch (err) {
    console.error("Shopify fetch error:", err.message);
    throw err;
  }
}

module.exports = { shopifyGet };
