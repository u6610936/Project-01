import { useMemo, useState } from "react";
import products from "../data/products.json";
import { load, save } from "../utils/storage";

const TX_KEY = "transactions";
const CAT_KEY = "extraCategories";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(n) {
  return `฿${Number(n || 0).toLocaleString()}`;
}

function unique(arr) {
  return Array.from(new Set(arr));
}

export default function SalesJournal() {
  const [transactions, setTransactions] = useState(() => load(TX_KEY, []));
  const [extraCategories, setExtraCategories] = useState(() => load(CAT_KEY, []));
  const [newCategory, setNewCategory] = useState("");

  const [selectedName, setSelectedName] = useState(products[0]?.itemName ?? "");
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(todayISO());

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.itemName === selectedName);
  }, [selectedName]);

  const unitPrice = selectedProduct?.unitPrice ?? 0;
  const productCategory = selectedProduct?.category ?? "";
  const total = unitPrice * Number(qty || 0);

  const categoryOptions = useMemo(() => {
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    const fromExtra = extraCategories.filter(Boolean);
    return unique([...fromProducts, ...fromExtra]).sort();
  }, [extraCategories]);

  const [selectedCategory, setSelectedCategory] = useState(
    products[0]?.category ?? ""
  );

  const today = todayISO();

  const totalToday = useMemo(() => {
    return transactions
      .filter((t) => t.date === today)
      .reduce((sum, t) => sum + Number(t.total || 0), 0);
  }, [transactions, today]);

  function addTransaction(e) {
    e.preventDefault();

    if (!selectedProduct) return;
    if (!qty || Number(qty) <= 0) return;
    if (!date) return;
    if (!selectedCategory) return;

    const newTx = {
      id: String(Date.now()),
      itemName: selectedProduct.itemName,
      category: selectedCategory, 
      unitPrice: selectedProduct.unitPrice,
      quantity: Number(qty),
      date,
      total: selectedProduct.unitPrice * Number(qty),
    };

    const next = [newTx, ...transactions];
    setTransactions(next);
    save(TX_KEY, next);
  }

  function removeTransaction(id) {
    const next = transactions.filter((t) => t.id !== id);
    setTransactions(next);
    save(TX_KEY, next);
  }

  function addCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;

    const exists = extraCategories.some(
      (c) => c.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setNewCategory("");
      return;
    }

    const next = [...extraCategories, name];
    setExtraCategories(next);
    save(CAT_KEY, next);
    setNewCategory("");

    setSelectedCategory(name);
  }

  function deleteCategory(name) {
    const next = extraCategories.filter((c) => c !== name);
    setExtraCategories(next);
    save(CAT_KEY, next);

    if (selectedCategory === name) {
      setSelectedCategory(productCategory);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Journal</h1>
          <p className="page-subtitle">
            Add sales records and manage categories (saved locally in your browser)
          </p>
        </div>

        <div className="card" style={{ padding: 12, minWidth: 260 }}>
          <div className="card-title">Today’s Sales</div>
          <div className="big-number" style={{ fontSize: 28 }}>
            {formatMoney(totalToday)}
          </div>
          <div className="muted">{today}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Record New Sale</h3>
            <span className="muted">Auto-calc total</span>
          </div>

          <form onSubmit={addTransaction} className="form-grid">
            <div className="field">
              <label>Item</label>
              <select
                value={selectedName}
                onChange={(e) => {
                  const nextName = e.target.value;
                  setSelectedName(nextName);

                  const nextProduct = products.find((p) => p.itemName === nextName);
                  setSelectedCategory(nextProduct?.category ?? "");
                }}
              >
                {products.map((p) => (
                  <option key={p.itemName} value={p.itemName}>
                    {p.itemName}
                  </option>
                ))}
              </select>
            </div>

            {/* Category dropdown */}
            <div className="field">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="muted" style={{ marginTop: 6 }}>
                Default follows the selected item. You can change it.
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="grid-3" style={{ marginTop: 2 }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="card-title">Selected Category</div>
                <div style={{ fontWeight: 900 }}>{selectedCategory || "-"}</div>
              </div>

              <div className="card" style={{ padding: 12 }}>
                <div className="card-title">Unit Price</div>
                <div style={{ fontWeight: 900 }}>{formatMoney(unitPrice)}</div>
              </div>

              <div className="card" style={{ padding: 12 }}>
                <div className="card-title">Total</div>
                <div style={{ fontWeight: 900 }}>{formatMoney(total)}</div>
              </div>
            </div>

            <button className="btn primary" type="submit">
              Add Transaction
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Extra Categories</h3>
            <span className="muted">{extraCategories.length} items</span>
          </div>

          <form onSubmit={addCategory} className="form-grid">
            <div className="field">
              <label>Add a new category</label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. drinks"
              />
            </div>
            <button className="btn" type="submit">
              Add category
            </button>
          </form>

          {extraCategories.length === 0 ? (
            <p className="muted" style={{ marginTop: 10 }}>
              No extra categories yet.
            </p>
          ) : (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {extraCategories.map((c) => (
                <span key={c} className="badge">
                  {c}
                  <button
                    onClick={() => deleteCategory(c)}
                    type="button"
                    aria-label={`Delete ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Transactions</h3>
          <span className="muted">{transactions.length} rows</span>
        </div>

        {transactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.itemName}</td>
                    <td>{t.category}</td>
                    <td>{formatMoney(t.unitPrice)}</td>
                    <td>{t.quantity}</td>
                    <td>{formatMoney(t.total)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn danger"
                          onClick={() => removeTransaction(t.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}