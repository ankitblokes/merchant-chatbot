// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([
    { who: 'bot', text: 'Hi 👋 — Tap "Show Daily Summary" or ask: orders, stock, abandoned' }
  ]);
  const [loading, setLoading] = useState(false);

  function push(msg) {
    setMessages(prev => [...prev, msg]);
  }

  async function showDaily() {
    setLoading(true);
    push({ who: 'user', text: 'Show Daily Summary' });
    try {
      const r = await fetch('/api/daily-summary');
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');

      const s = json.sales;
      const outCount = json.products.out_of_stock_count;
      const newC = json.customers.new_today;
      const ab = json.abandoned_checkouts;

      const summary = `
📊 Daily Summary (${json.date})

🧾 Orders: ${s.orders_count}
💸 Revenue: ${s.total_amount.toFixed(2)} ${s.currency || ''}
❌ Cancelled: ${s.cancelled}
📦 Pending: ${s.pending}

🛍️ Out of stock items: ${outCount}
👥 New customers: ${newC}
🛒 Abandoned checkouts: ${ab.count} (${ab.value.toFixed(2)})
      `;
      push({ who: 'bot', text: summary });
    } catch (e) {
      push({ who: 'bot', text: 'Error fetching summary: ' + e.message });
    } finally {
      setLoading(false);
    }
  }

  async function showOutOfStock() {
    setLoading(true);
    push({ who: 'user', text: 'Show Out of Stock' });
    try {
      const r = await fetch('/api/out-of-stock');
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Error');
      if ((json.out_of_stock || []).length === 0) {
        push({ who: 'bot', text: '✅ All products in stock' });
      } else {
        const lines = json.out_of_stock.slice(0, 30).map(i => `${i.title} — ${i.variant_title} (Qty:${i.quantity})`);
        push({ who: 'bot', text: `🚨 Out of stock (${json.count}):\n` + lines.join('\n') });
      }
    } catch (e) {
      push({ who: 'bot', text: 'Error: ' + e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{fontFamily:'Arial, sans-serif', padding:20, maxWidth:800, margin:'0 auto'}}>
      <h1>Merchant Chatbot — Daily Summary</h1>

      <div style={{display:'flex', gap:10, marginBottom:10}}>
        <button onClick={showDaily} disabled={loading} style={{padding:'8px 12px'}}>Show Daily Summary</button>
        <button onClick={showOutOfStock} disabled={loading} style={{padding:'8px 12px'}}>Show Out of Stock</button>
        <button onClick={()=>alert('Future: View Orders list')} style={{padding:'8px 12px'}}>View Orders</button>
      </div>

      <div style={{border:'1px solid #eaeaea', borderRadius:8, padding:12, minHeight:300, background:'#fafafa'}}>
        {messages.map((m,i) => (
          <div key={i} style={{marginBottom:10, textAlign: m.who === 'user' ? 'right' : 'left'}}>
            <div style={{
              display:'inline-block',
              padding:'8px 12px',
              borderRadius:12,
              background: m.who === 'user' ? '#0b5' : '#fff',
              color: m.who === 'user' ? '#000' : '#111',
              boxShadow:'0 1px 0 rgba(0,0,0,0.05)',
              whiteSpace:'pre-wrap',
              maxWidth: '100%'
            }}>{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
