import { useState, useEffect } from "react";

const fmt = (n) => "Rs " + (Math.round(n || 0)).toLocaleString();
const todayStr = () => new Date().toLocaleDateString("en-PK");
const weekLabel = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(new Date().setDate(diff));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const f = (dt) => dt.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
  return `${f(mon)} – ${f(sun)}`;
};
const inCurrentWeek = (dateStr) => {
  if (!dateStr) return false;
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - day + (day === 0 ? -6 : 1)); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
  const parts = dateStr.split("/");
  if (parts.length !== 3) return false;
  const dt = new Date(parseInt(parts[2]), parseInt(parts[0])-1, parseInt(parts[1]));
  return dt >= mon && dt <= sun;
};
const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k) ?? "null") ?? def; } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const INIT_PRODUCTS = [
  { id:1,  name:"Pencil",       cat:"Stationery", emoji:"✏️",  salePrice:10,  costPrice:6,   bundleQty:12, bundleCost:72  },
  { id:2,  name:"Pen (Blue)",   cat:"Stationery", emoji:"🖊️", salePrice:15,  costPrice:9,   bundleQty:12, bundleCost:108 },
  { id:3,  name:"Pen (Black)",  cat:"Stationery", emoji:"🖋️", salePrice:15,  costPrice:9,   bundleQty:12, bundleCost:108 },
  { id:4,  name:"Eraser",       cat:"Stationery", emoji:"🧹",  salePrice:10,  costPrice:6,   bundleQty:10, bundleCost:60  },
  { id:5,  name:"Ruler",        cat:"Stationery", emoji:"📏",  salePrice:20,  costPrice:12,  bundleQty:10, bundleCost:120 },
  { id:6,  name:"Sharpener",    cat:"Stationery", emoji:"✂️", salePrice:10,  costPrice:6,   bundleQty:10, bundleCost:60  },
  { id:7,  name:"Notebook",     cat:"Stationery", emoji:"📓",  salePrice:80,  costPrice:55,  bundleQty:6,  bundleCost:330 },
  { id:8,  name:"Copy (Small)", cat:"Stationery", emoji:"📒",  salePrice:40,  costPrice:28,  bundleQty:10, bundleCost:280 },
  { id:9,  name:"Geometry Box", cat:"Stationery", emoji:"📐",  salePrice:150, costPrice:100, bundleQty:4,  bundleCost:400 },
  { id:10, name:"Marker",       cat:"Stationery", emoji:"🖍️", salePrice:30,  costPrice:18,  bundleQty:12, bundleCost:216 },
  { id:11, name:"Water Bottle", cat:"Food",       emoji:"🍶",  salePrice:50,  costPrice:35,  bundleQty:12, bundleCost:420 },
  { id:12, name:"Juice Pack",   cat:"Food",       emoji:"🧃",  salePrice:40,  costPrice:28,  bundleQty:12, bundleCost:336 },
  { id:13, name:"Biscuits",     cat:"Food",       emoji:"🍪",  salePrice:30,  costPrice:20,  bundleQty:12, bundleCost:240 },
  { id:14, name:"Chips",        cat:"Food",       emoji:"🥔",  salePrice:20,  costPrice:13,  bundleQty:24, bundleCost:312 },
  { id:15, name:"Chocolate",    cat:"Food",       emoji:"🍫",  salePrice:50,  costPrice:35,  bundleQty:12, bundleCost:420 },
  { id:16, name:"Candy",        cat:"Food",       emoji:"🍬",  salePrice:5,   costPrice:3,   bundleQty:50, bundleCost:150 },
  { id:17, name:"Sandwich",     cat:"Food",       emoji:"🥪",  salePrice:80,  costPrice:55,  bundleQty:4,  bundleCost:220 },
  { id:18, name:"Cake Slice",   cat:"Food",       emoji:"🍰",  salePrice:60,  costPrice:40,  bundleQty:6,  bundleCost:240 },
];

export default function App() {
  const [tab, setTab]         = useState("pos");
  const [products, setProducts] = useState(() => load("ss2_products", INIT_PRODUCTS));
  const [sales, setSales]     = useState(() => load("ss2_sales", []));
  const [purchases, setPurchases] = useState(() => load("ss2_purchases", []));
  const [profits, setProfits] = useState(() => load("ss2_profits", []));
  const [cart, setCart]       = useState([]);
  const [catF, setCatF]       = useState("All");
  const [search, setSearch]   = useState("");
  const [discount, setDiscount] = useState("");
  const [paid, setPaid]       = useState("");
  const [receipt, setReceipt] = useState(null);
  const [toast, setToast]     = useState("");
  const [modal, setModal]     = useState(null);
  const [editProd, setEditProd] = useState(null);
  const [nProd, setNProd]     = useState({ name:"", cat:"Stationery", emoji:"📦", salePrice:"", costPrice:"", bundleQty:"", bundleCost:"" });
  const [nPurch, setNPurch]   = useState({ productId:"", bundlesQty:"1", note:"", date:todayStr() });
  const [nProfit, setNProfit] = useState({ amount:"", note:"", date:todayStr() });

  useEffect(() => { save("ss2_products", products); }, [products]);
  useEffect(() => { save("ss2_sales", sales); }, [sales]);
  useEffect(() => { save("ss2_purchases", purchases); }, [purchases]);
  useEffect(() => { save("ss2_profits", profits); }, [profits]);

  const toast2 = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };
  const closeModal = () => { setModal(null); setEditProd(null); };

  // Cart
  const filtered = products.filter(p =>
    (catF === "All" || p.cat === catF) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const addToCart = (p) => setCart(prev => {
    const ex = prev.find(c => c.id === p.id);
    return ex ? prev.map(c => c.id === p.id ? { ...c, qty: c.qty+1 } : c) : [...prev, { ...p, qty:1 }];
  });
  const setQty = (id, q) => setCart(prev => q <= 0 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, qty:q } : c));

  const subtotal  = cart.reduce((s,c) => s + c.salePrice*c.qty, 0);
  const totalCost = cart.reduce((s,c) => s + c.costPrice*c.qty, 0);
  const discAmt   = Math.min(subtotal, parseFloat(discount)||0);
  const total     = subtotal - discAmt;
  const profit    = total - totalCost;
  const paidAmt   = parseFloat(paid)||0;
  const change    = paidAmt - total;

  const checkout = () => {
    if (!cart.length) { toast2("Cart is empty!"); return; }
    const sale = { id:Date.now(), date:todayStr(), time:new Date().toLocaleTimeString("en-PK"),
      items:[...cart], subtotal, discount:discAmt, total, cost:totalCost, profit, paid:paidAmt, change };
    setSales(p => [sale, ...p]);
    setReceipt(sale);
    setCart([]); setDiscount(""); setPaid("");
  };

  // Weekly stats
  const wSales     = sales.filter(s => inCurrentWeek(s.date));
  const wRevenue   = wSales.reduce((s,x) => s+x.total, 0);
  const wSaleProfit= wSales.reduce((s,x) => s+x.profit, 0);
  const wPurch     = purchases.filter(p => inCurrentWeek(p.date));
  const wPurchCost = wPurch.reduce((s,p) => s+p.totalCost, 0);
  const wProfits   = profits.filter(p => inCurrentWeek(p.date));
  const wProfitRec = wProfits.reduce((s,p) => s+p.amount, 0);

  const allRevenue  = sales.reduce((s,x) => s+x.total, 0);
  const allProfit   = sales.reduce((s,x) => s+x.profit, 0);
  const allPurchCost= purchases.reduce((s,p) => s+p.totalCost, 0);
  const allProfitRec= profits.reduce((s,p) => s+p.amount, 0);

  const unpaidPurch = purchases.filter(p => !p.paid);
  const unpaidTotal = unpaidPurch.reduce((s,p) => s+p.totalCost, 0);

  // Product CRUD
  const addProduct = () => {
    if (!nProd.name || !nProd.salePrice) { toast2("Name & sale price required"); return; }
    const bq = parseInt(nProd.bundleQty)||1;
    const bc = parseFloat(nProd.bundleCost)||0;
    const p = { ...nProd, id:Date.now(), salePrice:parseFloat(nProd.salePrice)||0,
      costPrice: nProd.costPrice ? parseFloat(nProd.costPrice) : Math.round(bc/bq),
      bundleQty:bq, bundleCost:bc };
    setProducts(prev => [...prev, p]);
    setNProd({ name:"", cat:"Stationery", emoji:"📦", salePrice:"", costPrice:"", bundleQty:"", bundleCost:"" });
    closeModal(); toast2("Product added!");
  };
  const saveEdit = () => {
    const bq = parseInt(editProd.bundleQty)||1;
    const bc = parseFloat(editProd.bundleCost)||0;
    setProducts(prev => prev.map(p => p.id === editProd.id ? { ...editProd,
      salePrice:parseFloat(editProd.salePrice)||0,
      costPrice:parseFloat(editProd.costPrice)||Math.round(bc/bq),
      bundleQty:bq, bundleCost:bc } : p));
    closeModal(); toast2("Updated!");
  };

  // Purchase
  const savePurch = () => {
    if (!nPurch.productId || !nPurch.bundlesQty) { toast2("Select product & qty"); return; }
    const prod = products.find(p => p.id === parseInt(nPurch.productId));
    if (!prod) return;
    const bq = parseInt(nPurch.bundlesQty);
    const rec = { id:Date.now(), date:nPurch.date||todayStr(), productId:prod.id,
      productName:prod.name, emoji:prod.emoji, bundlesQty:bq,
      bundleCost:prod.bundleCost, totalCost:prod.bundleCost*bq,
      totalItems:prod.bundleQty*bq, note:nPurch.note, paid:false };
    setPurchases(prev => [rec, ...prev]);
    setNPurch({ productId:"", bundlesQty:"1", note:"", date:todayStr() });
    closeModal(); toast2("Purchase recorded!");
  };
  const togglePaid = (id) => setPurchases(prev => prev.map(p => p.id===id ? { ...p, paid:!p.paid } : p));

  // Profit
  const saveProfit = () => {
    if (!nProfit.amount) { toast2("Enter amount"); return; }
    const rec = { id:Date.now(), date:nProfit.date||todayStr(), amount:parseFloat(nProfit.amount), note:nProfit.note };
    setProfits(prev => [rec, ...prev]);
    setNProfit({ amount:"", note:"", date:todayStr() });
    closeModal(); toast2("Profit recorded!");
  };

  return (
    <div style={{ fontFamily:"'Poppins','Segoe UI',sans-serif", background:"#0d1117", minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", color:"#e2e8f0" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#131929,#0d1117)", padding:"16px 16px 12px", borderBottom:"1px solid #1e2d3d" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#f7931e,#e84393)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🏪</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:17, color:"#fff" }}>IPS School Store</div>
            <div style={{ fontSize:10, color:"#475569" }}>Week: {weekLabel()}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:"#475569" }}>Week Revenue</div>
            <div style={{ fontWeight:800, fontSize:15, color:"#f7931e" }}>{fmt(wRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:"flex", background:"#111827", borderBottom:"1px solid #1e2d3d" }}>
        {[["pos","🛒","Sale"],["weekly","📊","Weekly"],["purchase","📦","Stock"],["history","🧾","History"],["products","⚙️","Items"]].map(([k,ic,lb]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:"1 0 auto", padding:"10px 4px", border:"none", background:"transparent", fontWeight:tab===k?800:500, fontSize:11, color:tab===k?"#f7931e":"#64748b", borderBottom:tab===k?"2px solid #f7931e":"2px solid transparent", cursor:"pointer" }}>
            {ic}<br/>{lb}
          </button>
        ))}
      </div>

      {/* ═══════════ POS ═══════════ */}
      {tab==="pos" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"10px 12px 0", background:"#111827", borderBottom:"1px solid #1e2d3d" }}>
            <input placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:"1px solid #1e2d3d", fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:10, background:"#0d1117", color:"#e2e8f0" }} />
            <div style={{ display:"flex", gap:8, paddingBottom:10, overflowX:"auto" }}>
              {["All","Stationery","Food"].map(c => (
                <button key={c} onClick={() => setCatF(c)} style={{ padding:"5px 14px", borderRadius:20, border:"none", cursor:"pointer", whiteSpace:"nowrap", background:catF===c?"#f7931e":"#1e2d3d", color:catF===c?"#fff":"#94a3b8", fontWeight:700, fontSize:12 }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignContent:"start" }}>
            {filtered.map(p => {
              const inC = cart.find(c => c.id===p.id);
              const margin = p.salePrice - p.costPrice;
              return (
                <button key={p.id} onClick={() => addToCart(p)} style={{ background:inC?"#1a2535":"#111827", border:`2px solid ${inC?"#f7931e":"#1e2d3d"}`, borderRadius:16, padding:"12px 8px", cursor:"pointer", textAlign:"center", position:"relative" }}>
                  {inC && <div style={{ position:"absolute", top:5, right:5, background:"#f7931e", color:"#fff", borderRadius:"50%", width:20, height:20, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{inC.qty}</div>}
                  <div style={{ fontSize:26, marginBottom:3 }}>{p.emoji}</div>
                  <div style={{ fontWeight:700, fontSize:12, color:"#e2e8f0", marginBottom:2, lineHeight:1.3 }}>{p.name}</div>
                  <div style={{ fontWeight:800, color:"#f7931e", fontSize:14 }}>{fmt(p.salePrice)}</div>
                  <div style={{ fontSize:10, color:"#22c55e", marginTop:1 }}>profit +{fmt(margin)}</div>
                </button>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div style={{ background:"#111827", borderTop:"1px solid #1e2d3d", maxHeight:"56vh", overflowY:"auto" }}>
              <div style={{ padding:"10px 14px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:800, fontSize:14, color:"#fff" }}>🛒 Cart ({cart.reduce((s,c)=>s+c.qty,0)} items)</span>
                <button onClick={() => setCart([])} style={{ background:"#2d1a1e", color:"#f87171", border:"none", borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>Clear</button>
              </div>
              {cart.map(item => (
                <div key={item.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderBottom:"1px solid #1e2d3d" }}>
                  <span style={{ fontSize:18 }}>{item.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{item.name}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{fmt(item.salePrice)} × {item.qty} <span style={{ color:"#22c55e" }}>| +{fmt((item.salePrice-item.costPrice)*item.qty)}</span></div>
                  </div>
                  <div style={{ fontWeight:800, color:"#f7931e", fontSize:13, minWidth:52, textAlign:"right" }}>{fmt(item.salePrice*item.qty)}</div>
                  <div style={{ display:"flex", gap:4 }}>
                    <QB onClick={() => setQty(item.id, item.qty-1)} label="−" />
                    <QB onClick={() => setQty(item.id, item.qty+1)} label="+" accent />
                  </div>
                </div>
              ))}
              <div style={{ padding:"12px 14px", background:"#0d1117" }}>
                <SR label="Subtotal" val={fmt(subtotal)} />
                <SR label="Cost (total)" val={fmt(totalCost)} color="#64748b" />
                <SR label="Gross Profit" val={fmt(profit)} color="#22c55e" />
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
                  <span style={{ fontSize:12, color:"#94a3b8", width:68 }}>Discount</span>
                  <input type="number" placeholder="0" value={discount} onChange={e=>setDiscount(e.target.value)} style={DI} />
                  {discAmt>0 && <span style={{ fontSize:12, color:"#f87171", minWidth:52, textAlign:"right", fontWeight:700 }}>-{fmt(discAmt)}</span>}
                </div>
                <SR label="TOTAL" val={fmt(total)} big />
                <div style={{ display:"flex", alignItems:"center", gap:8, margin:"6px 0" }}>
                  <span style={{ fontSize:12, color:"#94a3b8", width:68 }}>Paid</span>
                  <input type="number" placeholder="0" value={paid} onChange={e=>setPaid(e.target.value)} style={DI} />
                  {paidAmt>0 && <span style={{ fontSize:12, fontWeight:800, color:change>=0?"#22c55e":"#f87171", minWidth:52, textAlign:"right" }}>
                    {change>=0 ? `↩ ${fmt(change)}` : `Need ${fmt(-change)}`}
                  </span>}
                </div>
                <button onClick={checkout} style={{ width:"100%", padding:"13px", marginTop:10, background:"linear-gradient(135deg,#f7931e,#e84393)", color:"#fff", border:"none", borderRadius:14, fontWeight:800, fontSize:15, cursor:"pointer" }}>
                  ✓ Complete Sale — {fmt(total)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ WEEKLY ═══════════ */}
      {tab==="weekly" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>
          <SecTitle icon="📊" label={`This Week — ${weekLabel()}`} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <SC icon="💰" label="Revenue" val={fmt(wRevenue)}   color="#f7931e" />
            <SC icon="📈" label="Sale Profit" val={fmt(wSaleProfit)} color="#22c55e" />
            <SC icon="📦" label="Stock Bought" val={fmt(wPurchCost)} color="#e84393" />
            <SC icon="🤝" label="Profit Received" val={fmt(wProfitRec)} color="#a78bfa" />
          </div>

          {/* Net this week */}
          <div style={{ background:"#131929", border:"1px solid #1e2d3d", borderRadius:14, padding:"14px", marginBottom:14 }}>
            <div style={{ fontWeight:800, color:"#94a3b8", fontSize:12, marginBottom:8 }}>THIS WEEK SUMMARY</div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:"#94a3b8" }}>Sale Revenue</span>
              <span style={{ fontWeight:700, color:"#f7931e" }}>{fmt(wRevenue)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:"#94a3b8" }}>Stock Purchased</span>
              <span style={{ fontWeight:700, color:"#e84393" }}>- {fmt(wPurchCost)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:13, color:"#94a3b8" }}>Profit from Sales</span>
              <span style={{ fontWeight:700, color:"#22c55e" }}>{fmt(wSaleProfit)}</span>
            </div>
            <div style={{ borderTop:"1px dashed #1e2d3d", paddingTop:8, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:14, fontWeight:800, color:"#fff" }}>Profit Received</span>
              <span style={{ fontSize:16, fontWeight:800, color:"#a78bfa" }}>{fmt(wProfitRec)}</span>
            </div>
          </div>

          <button onClick={() => { setNProfit({ amount:"", note:"", date:todayStr() }); setModal("addProfit"); }}
            style={{ width:"100%", padding:13, background:"#1e1a35", color:"#a78bfa", border:"1px solid #4c3a8f", borderRadius:14, fontWeight:800, fontSize:13, cursor:"pointer", marginBottom:14 }}>
            + Record Profit Received from Shopkeeper
          </button>

          {profits.length > 0 && (
            <>
              <SecTitle icon="🤝" label="Profit Received Log" />
              {profits.map(p => (
                <div key={p.id} style={{ background:"#111827", border:"1px solid #1e2d3d", borderRadius:14, padding:"12px 14px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:800, color:"#a78bfa", fontSize:16 }}>{fmt(p.amount)}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{p.date}{p.note ? ` · ${p.note}` : ""}</div>
                  </div>
                  <button onClick={() => setProfits(prev => prev.filter(x => x.id!==p.id))} style={DB}>🗑</button>
                </div>
              ))}
            </>
          )}

          <div style={{ height:12 }} />
          <SecTitle icon="📋" label="All-Time Totals" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <SC icon="🛒" label="Total Revenue" val={fmt(allRevenue)}   color="#f7931e" />
            <SC icon="📈" label="Total Profit"  val={fmt(allProfit)}    color="#22c55e" />
            <SC icon="📦" label="Total Purchases" val={fmt(allPurchCost)} color="#e84393" />
            <SC icon="🤝" label="Profit Received" val={fmt(allProfitRec)} color="#a78bfa" />
          </div>
        </div>
      )}

      {/* ═══════════ STOCK/PURCHASE ═══════════ */}
      {tab==="purchase" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>
          {unpaidPurch.length > 0 && (
            <div style={{ background:"#2d1a1e", border:"1px solid #7f1d1d", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontWeight:800, color:"#f87171", fontSize:13 }}>⚠️ Amount Due to Wholesale</div>
              <div style={{ fontWeight:800, fontSize:22, color:"#fff", marginTop:2 }}>{fmt(unpaidTotal)}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{unpaidPurch.length} unpaid purchase{unpaidPurch.length!==1?"s":""} — tap "Unpaid" to mark paid</div>
            </div>
          )}

          <button onClick={() => { setNPurch({ productId:"", bundlesQty:"1", note:"", date:todayStr() }); setModal("addPurchase"); }}
            style={{ width:"100%", padding:13, background:"#1f1a10", color:"#f7931e", border:"1px solid #854d0e", borderRadius:14, fontWeight:800, fontSize:13, cursor:"pointer", marginBottom:14 }}>
            + Record Wholesale Purchase (Bundle)
          </button>

          <SecTitle icon="📦" label="Purchase History" />
          {purchases.length===0 ? <Empty icon="📦" text="No purchases yet" /> : purchases.map(p => (
            <div key={p.id} style={{ background:"#111827", border:"1px solid #1e2d3d", borderRadius:14, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:24 }}>{p.emoji}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:700, color:"#e2e8f0", fontSize:14 }}>{p.productName}</div>
                    <button onClick={() => togglePaid(p.id)} style={{ padding:"3px 10px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background:p.paid?"#14532d":"#2d1a1e", color:p.paid?"#22c55e":"#f87171" }}>
                      {p.paid ? "✓ Paid" : "Unpaid"}
                    </button>
                  </div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:3 }}>
                    {p.bundlesQty} bundle{p.bundlesQty!==1?"s":""} × {fmt(p.bundleCost)} = <span style={{ color:"#f7931e", fontWeight:700 }}>{fmt(p.totalCost)}</span>
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{p.totalItems} pcs · {p.date}{p.note ? ` · ${p.note}` : ""}</div>
                </div>
                <button onClick={() => setPurchases(prev => prev.filter(x => x.id!==p.id))} style={DB}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ HISTORY ═══════════ */}
      {tab==="history" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <SC icon="🛒" label="Total Sales" val={sales.length} color="#f7931e" />
            <SC icon="💰" label="Revenue" val={fmt(allRevenue)} color="#22c55e" />
          </div>
          {sales.length===0 ? <Empty icon="🧾" text="No sales yet" /> : sales.map(s => (
            <div key={s.id} style={{ background:"#111827", border:"1px solid #1e2d3d", borderRadius:14, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div>
                  <span style={{ fontWeight:800, color:"#f7931e", fontSize:15 }}>{fmt(s.total)}</span>
                  <span style={{ fontSize:11, color:"#64748b", marginLeft:8 }}>{s.date} {s.time}</span>
                </div>
                <span style={{ fontWeight:700, color:"#22c55e", fontSize:13 }}>+{fmt(s.profit)}</span>
              </div>
              {s.items.map(i => (
                <div key={i.id} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", padding:"2px 0" }}>
                  <span>{i.emoji} {i.name} ×{i.qty}</span>
                  <span>{fmt(i.salePrice*i.qty)} <span style={{ color:"#22c55e" }}>+{fmt((i.salePrice-i.costPrice)*i.qty)}</span></span>
                </div>
              ))}
              {s.discount>0 && <div style={{ fontSize:12, color:"#f87171", marginTop:4 }}>Discount: -{fmt(s.discount)}</div>}
              <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>Paid {fmt(s.paid)} · Change {fmt(s.change)}</div>
            </div>
          ))}
          {sales.length>0 && (
            <button onClick={() => { if(window.confirm("Clear all sales history?")) setSales([]); }}
              style={{ width:"100%", padding:12, marginTop:4, background:"#2d1a1e", color:"#f87171", border:"1px solid #7f1d1d", borderRadius:12, fontWeight:700, fontSize:13, cursor:"pointer" }}>
              🗑 Clear Sales History
            </button>
          )}
        </div>
      )}

      {/* ═══════════ PRODUCTS ═══════════ */}
      {tab==="products" && (
        <div style={{ flex:1, overflowY:"auto", padding:12 }}>
          <button onClick={() => setModal("addProduct")}
            style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#f7931e,#e84393)", color:"#fff", border:"none", borderRadius:14, fontWeight:800, fontSize:14, cursor:"pointer", marginBottom:14 }}>
            + Add New Product
          </button>
          {products.map(p => {
            const margin = p.salePrice - p.costPrice;
            const pct = p.salePrice ? Math.round(margin/p.salePrice*100) : 0;
            return (
              <div key={p.id} style={{ background:"#111827", border:"1px solid #1e2d3d", borderRadius:14, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:26 }}>{p.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{p.name} <span style={{ fontSize:10, color:"#64748b" }}>({p.cat})</span></div>
                    <div style={{ fontSize:12, marginTop:2 }}>
                      <span style={{ color:"#f7931e", fontWeight:700 }}>{fmt(p.salePrice)}</span>
                      <span style={{ color:"#64748b" }}> sale · </span>
                      <span style={{ color:"#94a3b8" }}>{fmt(p.costPrice)} cost</span>
                      <span style={{ color:"#22c55e", fontWeight:700 }}> · +{fmt(margin)} ({pct}%)</span>
                    </div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>
                      Bundle: {p.bundleQty} pcs @ {fmt(p.bundleCost)} ({fmt(Math.round(p.bundleCost/p.bundleQty))}/pc)
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <button onClick={() => { setEditProd({...p}); setModal("editProduct"); }} style={{ ...DB, background:"#1e3a5f", color:"#60a5fa" }}>✏️</button>
                    <button onClick={() => setProducts(prev => prev.filter(x => x.id!==p.id))} style={DB}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ MODALS ═══════════ */}

      {/* Receipt */}
      {receipt && (
        <BS onClose={() => setReceipt(null)}>
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:44 }}>✅</div>
            <div style={{ fontWeight:800, fontSize:20, color:"#fff" }}>Sale Complete!</div>
            <div style={{ fontSize:11, color:"#64748b" }}>{receipt.date} · {receipt.time}</div>
          </div>
          <div style={{ background:"#0d1117", borderRadius:12, padding:14, marginBottom:14 }}>
            {receipt.items.map(i => (
              <div key={i.id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", color:"#94a3b8" }}>
                <span>{i.emoji} {i.name} ×{i.qty}</span>
                <span>{fmt(i.salePrice*i.qty)} <span style={{ color:"#22c55e" }}>+{fmt((i.salePrice-i.costPrice)*i.qty)}</span></span>
              </div>
            ))}
            <div style={{ borderTop:"1px dashed #1e2d3d", marginTop:8, paddingTop:8 }}>
              {receipt.discount>0 && <SR label="Discount" val={`-${fmt(receipt.discount)}`} />}
              <SR label="Total" val={fmt(receipt.total)} big />
              <SR label="Cost" val={fmt(receipt.cost)} color="#64748b" />
              <SR label="Sale Profit" val={fmt(receipt.profit)} color="#22c55e" />
              <SR label="Paid / Change" val={`${fmt(receipt.paid)} / ${fmt(receipt.change)}`} />
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:11, color:"#64748b", marginBottom:12 }}>🏪 IPS School Store</div>
          <button onClick={() => setReceipt(null)} style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#f7931e,#e84393)", color:"#fff", border:"none", borderRadius:14, fontWeight:800, fontSize:15, cursor:"pointer" }}>New Sale</button>
        </BS>
      )}

      {/* Add Product */}
      {modal==="addProduct" && (
        <BS onClose={closeModal}>
          <MT>Add New Product</MT>
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:10 }}>
            <FI label="Emoji" val={nProd.emoji} set={v => setNProd(p=>({...p,emoji:v}))} />
            <FI label="Product Name" val={nProd.name} set={v => setNProd(p=>({...p,name:v}))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <FI label="Sale Price (Rs)" val={nProd.salePrice} set={v => setNProd(p=>({...p,salePrice:v}))} type="number" />
            <FI label="Cost/Unit (auto if blank)" val={nProd.costPrice} set={v => setNProd(p=>({...p,costPrice:v}))} type="number" />
            <FI label="Bundle Qty (pcs)" val={nProd.bundleQty} set={v => setNProd(p=>({...p,bundleQty:v}))} type="number" />
            <FI label="Bundle Cost (Rs)" val={nProd.bundleCost} set={v => setNProd(p=>({...p,bundleCost:v}))} type="number" />
          </div>
          {nProd.bundleQty && nProd.bundleCost && (
            <div style={{ background:"#0d1117", borderRadius:10, padding:"8px 12px", marginBottom:10, fontSize:12, color:"#22c55e" }}>
              Auto cost/unit = {fmt(Math.round(parseFloat(nProd.bundleCost)/parseInt(nProd.bundleQty)))}
            </div>
          )}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:4 }}>Category</div>
            <select value={nProd.cat} onChange={e => setNProd(p=>({...p,cat:e.target.value}))} style={{ ...DI, width:"100%", boxSizing:"border-box" }}>
              <option>Stationery</option><option>Food</option>
            </select>
          </div>
          <button onClick={addProduct} style={PB}>Add Product</button>
        </BS>
      )}

      {/* Edit Product */}
      {modal==="editProduct" && editProd && (
        <BS onClose={closeModal}>
          <MT>Edit Product</MT>
          <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:10 }}>
            <FI label="Emoji" val={editProd.emoji} set={v => setEditProd(p=>({...p,emoji:v}))} />
            <FI label="Name" val={editProd.name} set={v => setEditProd(p=>({...p,name:v}))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <FI label="Sale Price" val={editProd.salePrice} set={v => setEditProd(p=>({...p,salePrice:v}))} type="number" />
            <FI label="Cost/Unit" val={editProd.costPrice} set={v => setEditProd(p=>({...p,costPrice:v}))} type="number" />
            <FI label="Bundle Qty" val={editProd.bundleQty} set={v => setEditProd(p=>({...p,bundleQty:v}))} type="number" />
            <FI label="Bundle Cost" val={editProd.bundleCost} set={v => setEditProd(p=>({...p,bundleCost:v}))} type="number" />
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:4 }}>Category</div>
            <select value={editProd.cat} onChange={e => setEditProd(p=>({...p,cat:e.target.value}))} style={{ ...DI, width:"100%", boxSizing:"border-box" }}>
              <option>Stationery</option><option>Food</option>
            </select>
          </div>
          <button onClick={saveEdit} style={PB}>Save Changes</button>
        </BS>
      )}

      {/* Add Purchase */}
      {modal==="addPurchase" && (
        <BS onClose={closeModal}>
          <MT>Wholesale Purchase</MT>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:"#94a3b8", marginBottom:4 }}>Product</div>
            <select value={nPurch.productId} onChange={e => setNPurch(p=>({...p,productId:e.target.value}))} style={{ ...DI, width:"100%", boxSizing:"border-box" }}>
              <option value="">— Select product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name} | bundle={p.bundleQty} pcs @ {fmt(p.bundleCost)}</option>)}
            </select>
          </div>
          <FI label="Number of Bundles" val={nPurch.bundlesQty} set={v => setNPurch(p=>({...p,bundlesQty:v}))} type="number" />
          <FI label="Date" val={nPurch.date} set={v => setNPurch(p=>({...p,date:v}))} type="date" />
          <FI label="Note (optional)" val={nPurch.note} set={v => setNPurch(p=>({...p,note:v}))} />
          {nPurch.productId && nPurch.bundlesQty && (() => {
            const prod = products.find(p => p.id===parseInt(nPurch.productId));
            if (!prod) return null;
            const tc = prod.bundleCost * parseInt(nPurch.bundlesQty);
            const ti = prod.bundleQty * parseInt(nPurch.bundlesQty);
            return (
              <div style={{ background:"#0d1117", borderRadius:10, padding:"10px 12px", marginBottom:12 }}>
                <div style={{ fontSize:12, color:"#94a3b8" }}>Total Items: <span style={{ color:"#e2e8f0", fontWeight:700 }}>{ti} pcs</span></div>
                <div style={{ fontSize:14, color:"#f7931e", fontWeight:800, marginTop:4 }}>Total Cost: {fmt(tc)}</div>
              </div>
            );
          })()}
          <button onClick={savePurch} style={PB}>Record Purchase</button>
        </BS>
      )}

      {/* Add Profit */}
      {modal==="addProfit" && (
        <BS onClose={closeModal}>
          <MT>Profit from Shopkeeper</MT>
          <FI label="Amount Received (Rs)" val={nProfit.amount} set={v => setNProfit(p=>({...p,amount:v}))} type="number" />
          <FI label="Date" val={nProfit.date} set={v => setNProfit(p=>({...p,date:v}))} type="date" />
          <FI label="Note (optional)" val={nProfit.note} set={v => setNProfit(p=>({...p,note:v}))} />
          <button onClick={saveProfit} style={{ ...PB, background:"linear-gradient(135deg,#7c3aed,#a78bfa)" }}>Save Entry</button>
        </BS>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"#131929", color:"#fff", border:"1px solid #f7931e", padding:"10px 20px", borderRadius:20, fontSize:13, fontWeight:700, boxShadow:"0 4px 20px rgba(0,0,0,0.5)", zIndex:1000, whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Mini components ─────────────────────────────────────────
function SC({ icon, label, val, color }) {
  return (
    <div style={{ background:"#111827", border:`1px solid #1e2d3d`, borderRadius:14, padding:"13px", borderLeft:`3px solid ${color}` }}>
      <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
      <div style={{ fontWeight:800, fontSize:16, color }}>{val}</div>
      <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>{label}</div>
    </div>
  );
}
function SR({ label, val, big, color }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"3px 0" }}>
      <span style={{ fontSize:big?14:12, fontWeight:big?800:500, color:"#94a3b8" }}>{label}</span>
      <span style={{ fontSize:big?16:13, fontWeight:800, color:color||(big?"#f7931e":"#e2e8f0") }}>{val}</span>
    </div>
  );
}
function BS({ children, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:500 }} onClick={onClose}>
      <div style={{ background:"#111827", borderRadius:"20px 20px 0 0", padding:20, width:"100%", maxWidth:430, maxHeight:"90vh", overflowY:"auto", border:"1px solid #1e2d3d" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function MT({ children }) { return <div style={{ fontWeight:800, fontSize:17, color:"#fff", marginBottom:14 }}>{children}</div>; }
function FI({ label, val, set, type="text" }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:12, color:"#94a3b8", marginBottom:4 }}>{label}</div>
      <input type={type} value={val} onChange={e => set(e.target.value)} style={{ ...DI, width:"100%", boxSizing:"border-box" }} />
    </div>
  );
}
function SecTitle({ icon, label }) { return <div style={{ fontWeight:700, fontSize:12, color:"#64748b", marginBottom:8, letterSpacing:0.5 }}>{icon} {label.toUpperCase()}</div>; }
function Empty({ icon, text }) { return <div style={{ textAlign:"center", padding:"32px 20px", color:"#475569" }}><div style={{ fontSize:36 }}>{icon}</div><div style={{ marginTop:8, fontWeight:600 }}>{text}</div></div>; }
function QB({ onClick, label, accent }) {
  return <button onClick={onClick} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${accent?"#f7931e":"#1e2d3d"}`, background:accent?"#f7931e":"#1a1f2e", color:accent?"#fff":"#e2e8f0", fontWeight:800, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>{label}</button>;
}

const DI = { padding:"9px 12px", borderRadius:10, border:"1px solid #1e2d3d", fontSize:13, outline:"none", background:"#0d1117", color:"#e2e8f0" };
const PB = { width:"100%", padding:13, background:"linear-gradient(135deg,#f7931e,#e84393)", color:"#fff", border:"none", borderRadius:14, fontWeight:800, fontSize:15, cursor:"pointer" };
const DB = { background:"#2d1a1e", color:"#f87171", border:"none", borderRadius:8, padding:"6px 10px", fontSize:13, cursor:"pointer" };
