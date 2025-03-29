import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

export default function GVWSQuoteBuilder() {
  const [items, setItems] = useState([]);
  const [quoteItems, setQuoteItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerStatus, setCustomerStatus] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [quoteHistory, setQuoteHistory] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const itemFileRef = useRef();
  const customerFileRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem("gvws_quotes");
    if (saved) setQuoteHistory(JSON.parse(saved));
  }, []);

  const filteredItems = searchTerm
    ? items.filter(i =>
        i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const addToQuote = (item) => {
    const exists = quoteItems.find(i => i.sku === item.sku);
    if (exists) {
      setQuoteItems(quoteItems.map(i => i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setQuoteItems([...quoteItems, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (sku, qty) => {
    setQuoteItems(quoteItems.map(i => i.sku === sku ? { ...i, qty } : i));
  };

  const updatePrice = (sku, price) => {
    setQuoteItems(quoteItems.map(i => i.sku === sku ? { ...i, price } : i));
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: ({ data }) => {
        if (type === "items") {
          setItems(data.map(r => ({ sku: r.sku, description: r.description, price: parseFloat(r.price) })));
        } else {
          alert("Customers upload coming soon.");
        }
      },
    });
  };

  const total = quoteItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("GVWS Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Customer: ${customerName}`, 14, 30);
    doc.text(`Phone: ${customerPhone}`, 14, 36);
    doc.text(`Email: ${customerEmail}`, 14, 42);
    doc.text(`Status: ${customerStatus}`, 14, 48);
    doc.text(`Sales Rep: ${salesRep}`, 14, 54);

    const rows = quoteItems.map(i => [i.sku, i.description, i.qty, `$${i.price.toFixed(2)}`, `$${(i.qty * i.price).toFixed(2)}`]);
    doc.autoTable({ startY: 60, head: [["SKU", "Desc", "Qty", "Unit", "Total"]], body: rows });
    doc.text(`Total: $${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save("quote.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-green-700">GVWS Quote Builder</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" className="border p-2 rounded" />
        <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" className="border p-2 rounded" />
        <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" className="border p-2 rounded" />
        <input value={salesRep} onChange={e => setSalesRep(e.target.value)} placeholder="Sales Rep" className="border p-2 rounded" />
        <select value={customerStatus} onChange={e => setCustomerStatus(e.target.value)} className="border p-2 rounded">
          <option value="">Status</option>
          <option value="new">New</option>
          <option value="returning">Returning</option>
        </select>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="Search items..."
        className="border px-4 py-2 w-full mb-4 rounded"
      />
      <div className="overflow-y-auto max-h-64 mb-4">
        <table className="w-full text-sm">
          <thead><tr><th>SKU</th><th>Desc</th><th>Price</th></tr></thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.sku} className="hover:bg-green-50 cursor-pointer" onClick={() => addToQuote(item)}>
                <td className="p-1">{item.sku}</td>
                <td className="p-1">{item.description}</td>
                <td className="p-1">${item.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-2">Quote Summary</h2>
      <table className="w-full text-sm mb-4">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          {quoteItems.map(i => (
            <tr key={i.sku}>
              <td>{i.description}</td>
              <td><input type="number" value={i.qty} onChange={e => updateQty(i.sku, parseInt(e.target.value))} className="w-12 border" /></td>
              <td><input type="number" value={i.price} onChange={e => updatePrice(i.sku, parseFloat(e.target.value))} className="w-16 border" /></td>
              <td>${(i.qty * i.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center">
        <strong>Total: ${total.toFixed(2)}</strong>
        <div className="space-x-2">
          <button onClick={generatePDF} className="bg-green-600 text-white px-4 py-2 rounded">Download PDF</button>
          <button onClick={() => itemFileRef.current.click()} className="bg-blue-600 text-white px-4 py-2 rounded">Upload Items</button>
          <input ref={itemFileRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'items')} />
        </div>
      </div>
    </div>
  );
}
