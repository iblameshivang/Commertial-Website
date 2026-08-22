import React, { useMemo } from 'react';

export default function AdminDashboard({ products = [], categories = [] }) {
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);

  const {
    totalProducts,
    totalCategories,
    totalStockUnits,
    stockByCategory,
    categoryDistribution,
    lowStockItems,
  } = useMemo(() => {
    const categoryMap = new Map();

    const normalizeCategory = (name) => {
      if (typeof name !== 'string') return { key: 'uncategorized', displayName: 'Uncategorized' };
      const trimmed = name.trim();
      if (!trimmed) return { key: 'uncategorized', displayName: 'Uncategorized' };
      return { key: trimmed.toLowerCase(), displayName: trimmed };
    };

    safeCategories.forEach((cat) => {
      if (cat && typeof cat.name === 'string') {
        const { key, displayName } = normalizeCategory(cat.name);
        if (!categoryMap.has(key)) {
          categoryMap.set(key, { displayName, stock: 0, productCount: 0, fromProp: true });
        }
      }
    });

    let totalStockSum = 0;
    const lowStockList = [];

    safeProducts.forEach((prod) => {
      if (!prod) return;

      // Safely parse stock - handle strings, null, undefined, 0, NaN
      let stock = 0;
      const rawStock = prod.stock;
      
      if (rawStock !== null && rawStock !== undefined && rawStock !== '') {
        const parsedStock = typeof rawStock === 'string' ? parseInt(rawStock, 10) : Number(rawStock);
        if (Number.isFinite(parsedStock) && parsedStock >= 0) {
          stock = Math.floor(parsedStock);
        }
      }
      // stock defaults to 0 if parsing fails

      totalStockSum += stock;

      // Safely map category name
      // Safely map category name across different backend response formats
      const rawCatName = prod.category_name || prod.category || 'Uncategorized';
      const { key: catKey, displayName: catDisplayName } = normalizeCategory(rawCatName);
      
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, { displayName: catDisplayName, stock: 0, productCount: 0, fromProp: false });
      }

      const existingCat = categoryMap.get(catKey);
      existingCat.stock += stock;
      existingCat.productCount += 1;

      // Capture all products with stock <= 5 (including 0)
      if (stock <= 5) {
        lowStockList.push({
          id: prod.id ?? `${prod.name}-${stock}-${Math.random()}`,
          name: prod.name || 'Unnamed Product',
          category: catDisplayName,
          stock,
        });
      }
    });

    const categoryList = Array.from(categoryMap.values());
    const prodCount = safeProducts.length;

    const uniqueCategoryCount = categoryList.filter(
      (c) => c.fromProp || c.productCount > 0 || c.stock > 0
    ).length;

    const sortedStockByCat = [...categoryList]
      .filter((c) => c.productCount > 0 || c.stock > 0)
      .sort((a, b) => b.stock - a.stock);
    const maxStock = sortedStockByCat.length > 0 ? sortedStockByCat[0].stock : 0;

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#3b82f6'];
    let cumulativeOffset = 0;
    const sortedDistByCat = [...categoryList]
      .filter((c) => c.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount)
      .map((item, index) => {
        const rawPct = prodCount > 0 ? (item.productCount / prodCount) * 100 : 0;
        const percentage = Number.isFinite(rawPct) ? Number(rawPct.toFixed(1)) : 0;
        const offset = cumulativeOffset;
        cumulativeOffset += percentage;

        return {
          ...item,
          percentage,
          strokeDasharray: `${percentage} ${Math.max(100 - percentage, 0)}`,
          strokeDashoffset: -offset,
          color: palette[index % palette.length],
        };
      });

    lowStockList.sort((a, b) => a.stock - b.stock);

    return {
      totalProducts: prodCount,
      totalCategories: uniqueCategoryCount,
      totalStockUnits: totalStockSum,
      stockByCategory: { items: sortedStockByCat, maxStock },
      categoryDistribution: sortedDistByCat,
      lowStockItems: lowStockList,
    };
  }, [safeProducts, safeCategories]);

  const radius = 15.91549430918954;

  return (
    <div className="adm-dashboard">
      <style>{`
        .adm-dashboard {
          --adm-bg: #f8fafc;
          --adm-card-bg: #ffffff;
          --adm-text-main: #0f172a;
          --adm-text-muted: #64748b;
          --adm-border: #e2e8f0;
          --adm-primary: #6366f1;
          --adm-emerald: #10b981;
          --adm-amber: #f59e0b;
          --adm-radius: 16px;
          --adm-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: var(--adm-text-main);
          padding: 20px;
          box-sizing: border-box;
          background: var(--adm-bg);
          min-height: 100vh;
          overflow: visible;
          display: flex;
          flex-direction: column;
        }
        .adm-dashboard *, .adm-dashboard *::before, .adm-dashboard *::after { box-sizing: border-box; }
        .adm-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          gap: 16px;
          overflow: hidden;
        }

        /* Header */
        .adm-header {
          margin-bottom: 14px;
          flex-shrink: 0;
        }
        .adm-header h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--adm-text-main);
        }
        .adm-header p {
          margin: 4px 0 0 0;
          font-size: 0.95rem;
          color: var(--adm-text-muted);
        }

        /* KPI Grid */
        .adm-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }
        .adm-kpi-card {
          background: var(--adm-card-bg);
          border: 2px solid var(--adm-border);
          border-radius: 14px;
          padding: 24px 18px;
          box-shadow: var(--adm-shadow);
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .adm-kpi-card:hover {
          border-color: var(--accent-color);
        }
        .adm-kpi-accent-1 { --accent-color: #6366f1; }
        .adm-kpi-accent-2 { --accent-color: #10b981; }
        .adm-kpi-accent-3 { --accent-color: #f59e0b; }
        .adm-kpi-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--accent-color);
        }
        .adm-kpi-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--adm-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 10px 0;
        }
        .adm-kpi-value {
          font-size: 2.8rem;
          font-weight: 800;
          color: var(--accent-color);
          margin: 0;
          line-height: 1;
        }

        /* Charts Grid */
        .adm-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          flex-shrink: 0;
          min-height: 0;
        }
        .adm-chart-card {
          background: var(--adm-card-bg);
          border: 2px solid var(--adm-border);
          border-radius: 14px;
          padding: 20px;
          box-shadow: var(--adm-shadow);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .adm-chart-card:hover {
          border-color: var(--adm-primary);
        }
        .adm-chart-bar-container { }
        .adm-chart-donut-container { }
        .adm-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 16px 0;
          color: var(--adm-text-main);
          letter-spacing: -0.3px;
          flex-shrink: 0;
        }

        /* Stock by Category */
        .adm-bar-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }
        .adm-bar-item {
          flex-shrink: 0;
        }
        .adm-bar-meta {
          display: flex;
          justify-content: space-between;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--adm-text-main);
        }
        .adm-bar-track {
          width: 100%;
          height: 14px;
          background-color: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        .adm-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        /* Donut Chart */
        .adm-donut-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-height: 0;
          justify-content: center;
        }
        .adm-donut-graphic {
          position: relative;
          width: 180px;
          height: 180px;
          flex-shrink: 0;
        }
        .adm-donut-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .adm-donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .adm-donut-total {
          font-size: 2.8rem;
          font-weight: 800;
          color: var(--adm-text-main);
          line-height: 1;
        }
        .adm-donut-tag {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--adm-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .adm-donut-legend {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          flex-shrink: 1;
          max-height: 100%;
        }
        .adm-donut-legend::-webkit-scrollbar {
          width: 6px;
        }
        .adm-donut-legend::-webkit-scrollbar-track {
          background: transparent;
        }
        .adm-donut-legend::-webkit-scrollbar-thumb {
          background: var(--adm-border);
          border-radius: 3px;
        }
        .adm-legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.95rem;
          padding: 0px 0;
          flex-shrink: 0;
        }
        .adm-legend-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .adm-legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Table Card */
        .adm-table-card {
          background: var(--adm-card-bg);
          border: 2px solid var(--adm-border);
          border-radius: 14px;
          padding: 20px;
          box-shadow: var(--adm-shadow);
          position: relative;
          overflow: hidden;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .adm-table-wrapper {
          overflow-x: auto;
          overflow-y: auto;
          position: relative;
          z-index: 1;
          flex: 1;
          min-height: 0;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 1rem;
        }
        .admin-table thead {
          border-bottom: 2px solid var(--adm-border);
          position: sticky;
          top: 0;
          background: var(--adm-card-bg);
          z-index: 10;
        }
        .admin-table th {
          padding: 14px 12px;
          text-align: left;
          font-weight: 700;
          color: var(--adm-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.85rem;
        }
        .admin-table tbody tr {
          border-bottom: 1px solid var(--adm-border);
          transition: background 0.2s ease;
        }
        .admin-table tbody tr:hover {
          background: #f8fafc;
        }
        .admin-table td {
          padding: 12px 12px;
          color: var(--adm-text-main);
          vertical-align: middle;
        }

        /* Pills */
        .adm-pill {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .adm-pill-amber {
          background: #fef3c7;
          color: #92400e;
        }
        .adm-pill-red {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Healthy Banner */
        .adm-healthy-banner {
          padding: 16px 20px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 10px;
          color: #065f46;
          font-size: 1rem;
          font-weight: 600;
        }



        /* Responsive */
        @media (max-width: 1200px) {
          .adm-charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .adm-dashboard { padding: 16px; }
          .adm-charts-grid { grid-template-columns: 1fr; }
          .adm-header h1 { font-size: 1.4rem; }
          .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .adm-dashboard { padding: 12px; }
          .adm-kpi-grid { grid-template-columns: 1fr; }
          .adm-charts-grid { grid-template-columns: 1fr; }
          .adm-header h1 { font-size: 1.2rem; }
          .adm-kpi-value { font-size: 1.4rem; }
          .adm-header { margin-bottom: 12px; }
        }
      `}</style>

      {/* Header */}
      <div className="adm-header">
        <h1>Admin Dashboard</h1>
        <p>Real-time inventory & stock management overview</p>
      </div>

      {/* Content */}
      <div className="adm-content">
      {/* KPI Cards */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card adm-kpi-accent-1">
          <div className="adm-kpi-bar" />
          <div className="adm-kpi-label">Total Categories</div>
          <div className="adm-kpi-value">{totalCategories}</div>
        </div>
        <div className="adm-kpi-card adm-kpi-accent-2">
          <div className="adm-kpi-bar" />
          <div className="adm-kpi-label">Total Products</div>
          <div className="adm-kpi-value">{totalProducts}</div>
        </div>
        <div className="adm-kpi-card adm-kpi-accent-3">
          <div className="adm-kpi-bar" />
          <div className="adm-kpi-label">Total Stock Units</div>
          <div className="adm-kpi-value">{totalStockUnits.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="adm-charts-grid">
        <div className="adm-chart-card adm-chart-bar-container">
          <h3 className="adm-card-title">Stock by Category</h3>
          <div className="adm-bar-list">
            {stockByCategory.items.map((cat, idx) => {
              const width = stockByCategory.maxStock > 0 ? (cat.stock / stockByCategory.maxStock) * 100 : 0;
              return (
                <div key={cat.displayName} className="adm-bar-item">
                  <div className="adm-bar-meta">
                    <span>{cat.displayName}</span>
                    <span>{cat.stock} units</span>
                  </div>
                  <div className="adm-bar-track">
                    <div className="adm-bar-fill" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="adm-chart-card adm-chart-donut-container">
          <h3 className="adm-card-title">Category Distribution</h3>
          <div className="adm-donut-wrapper">
            <div className="adm-donut-graphic">
              <svg viewBox="0 0 42 42" className="adm-donut-svg">
                <circle cx="21" cy="21" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="5" />
                {categoryDistribution.map((item) => (
                  <circle
                    key={item.displayName}
                    cx="21"
                    cy="21"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="5"
                    strokeDasharray={item.strokeDasharray}
                    strokeDashoffset={item.strokeDashoffset}
                  />
                ))}
              </svg>
              <div className="adm-donut-center">
                <span className="adm-donut-total">{totalProducts}</span>
                <span className="adm-donut-tag">Products</span>
              </div>
            </div>
            <div className="adm-donut-legend">
              {categoryDistribution.map((item) => (
                <div key={item.displayName} className="adm-legend-item">
                  <div className="adm-legend-left">
                    <span className="adm-legend-dot" style={{ backgroundColor: item.color }} />
                    <span>{item.displayName}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="adm-table-card">
        <h3 className="adm-card-title">Low Stock & Inventory Alerts</h3>
        {lowStockItems.length === 0 ? (
          <div className="adm-healthy-banner">All inventory stock levels are healthy</div>
        ) : (
          <div className="adm-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 600 }}>{prod.name}</td>
                    <td>{prod.category}</td>
                    <td style={{ fontWeight: 600 }}>{prod.stock}</td>
                    <td>
                      {prod.stock === 0 ? (
                        <span className="adm-pill adm-pill-red">Out of Stock</span>
                      ) : (
                        <span className="adm-pill adm-pill-amber">Low Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
