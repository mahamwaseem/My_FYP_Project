import { useState } from "react";

const PREVIEW_CONTENT = {
  corporate: {
    title: "INVOICE",
    subtitle: "Corporate Billing Document",
    from: { label: "FROM", name: "Your Company Ltd.", detail: "123 Business Ave, City" },
    to: { label: "BILL TO", name: "Client Corp Inc.", detail: "456 Client Rd, Town" },
    rows: [
      { desc: "Consulting Services", qty: "10 hrs", rate: "PKR 5,000", amount: "PKR 50,000" },
      { desc: "Software License", qty: "1", rate: "PKR 25,000", amount: "PKR 25,000" },
      { desc: "Support & Maintenance", qty: "1 mo", rate: "PKR 10,000", amount: "PKR 10,000" },
    ],
    subtotal: "PKR 85,000",
    tax: "PKR 14,450",
    total: "PKR 99,450",
  },
  receipt: {
    title: "RECEIPT",
    subtitle: "Sales Transaction",
    from: { label: "FROM", name: "FinTrack Store", detail: "POS Terminal #3" },
    to: { label: "CUSTOMER", name: "Walk-in Customer", detail: "Date: Today" },
    rows: [
      { desc: "Product A", qty: "2", rate: "PKR 1,200", amount: "PKR 2,400" },
      { desc: "Product B", qty: "1", rate: "PKR 3,500", amount: "PKR 3,500" },
    ],
    subtotal: "PKR 5,900",
    tax: "PKR 1,003",
    total: "PKR 6,903",
  },
  gift: {
    title: "GIFT VOUCHER",
    subtitle: "Exclusive Reward",
    from: { label: "FROM", name: "FinTrack Rewards", detail: "Gift Program 2025" },
    to: { label: "FOR", name: "Valued Customer", detail: "Special Occasion" },
    rows: [
      { desc: "Gift Value", qty: "—", rate: "—", amount: "PKR 5,000" },
      { desc: "Voucher Code", qty: "GIFT-2025-XYZ", rate: "—", amount: "—" },
    ],
    subtotal: "PKR 5,000",
    tax: "No Tax",
    total: "PKR 5,000",
  },
  discount: {
    title: "DISCOUNT COUPON",
    subtitle: "Limited Time Offer",
    from: { label: "ISSUED BY", name: "FinTrack Promos", detail: "Marketing Dept." },
    to: { label: "COUPON CODE", name: "SAVE20-2025", detail: "Min. order PKR 2,000" },
    rows: [
      { desc: "Discount Type", qty: "Percentage", rate: "20%", amount: "Up to PKR 1,000" },
      { desc: "Valid Until", qty: "31 Dec 2025", rate: "—", amount: "—" },
    ],
    subtotal: "Variable",
    tax: "—",
    total: "20% OFF",
  },
  credit: {
    title: "CREDIT NOTE",
    subtitle: "Account Adjustment",
    from: { label: "ISSUED BY", name: "Your Company Ltd.", detail: "Finance Department" },
    to: { label: "TO", name: "Client Corp Inc.", detail: "Ref: INV-2025-001" },
    rows: [
      { desc: "Returned Goods", qty: "2", rate: "PKR 1,200", amount: "PKR 2,400" },
      { desc: "Service Reversal", qty: "1", rate: "PKR 5,000", amount: "PKR 5,000" },
    ],
    subtotal: "PKR 7,400",
    tax: "(PKR 1,258)",
    total: "PKR 8,658 CR",
  },
  po: {
    title: "PURCHASE ORDER",
    subtitle: "Procurement Document",
    from: { label: "FROM", name: "Your Company Ltd.", detail: "Procurement Dept." },
    to: { label: "VENDOR", name: "Supplier Co.", detail: "Vendor ID: SUP-441" },
    rows: [
      { desc: "Office Supplies", qty: "50 units", rate: "PKR 300", amount: "PKR 15,000" },
      { desc: "IT Equipment", qty: "2 units", rate: "PKR 45,000", amount: "PKR 90,000" },
    ],
    subtotal: "PKR 105,000",
    tax: "PKR 17,850",
    total: "PKR 122,850",
  },
};

export default function TemplatePreviewModal({ template, onClose }) {
  const [activeTab, setActiveTab] = useState("preview");
  const data = PREVIEW_CONTENT[template.preview] || PREVIEW_CONTENT.corporate;
  const { color } = template;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header" style={{ borderColor: color }}>
          <div className="modal-header-left">
            <span className="modal-icon">{template.icon}</span>
            <div>
              <h2 className="modal-title">{template.name}</h2>
              <p className="modal-subtitle">{template.description}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {["preview", "fields", "customize"].map((tab) => (
            <button
              key={tab}
              className={`modal-tab ${activeTab === tab ? "modal-tab-active" : ""}`}
              style={activeTab === tab ? { color, borderColor: color } : {}}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === "preview" && (
            <div className="preview-doc-wrapper">
              <div className="preview-doc">
                {/* Document Header */}
                <div className="doc-header" style={{ background: color }}>
                  <div>
                    <div className="doc-title">{data.title}</div>
                    <div className="doc-subtitle">{data.subtitle}</div>
                  </div>
                  <div className="doc-meta">
                    <div className="doc-meta-item">
                      <span>No.</span>
                      <strong>#2025-001</strong>
                    </div>
                    <div className="doc-meta-item">
                      <span>Date</span>
                      <strong>03 May 2025</strong>
                    </div>
                  </div>
                </div>

                {/* From / To */}
                <div className="doc-parties">
                  <div className="doc-party">
                    <div className="party-label">{data.from.label}</div>
                    <div className="party-name">{data.from.name}</div>
                    <div className="party-detail">{data.from.detail}</div>
                  </div>
                  <div className="doc-party">
                    <div className="party-label">{data.to.label}</div>
                    <div className="party-name">{data.to.name}</div>
                    <div className="party-detail">{data.to.detail}</div>
                  </div>
                </div>

                {/* Line Items */}
                <table className="doc-table">
                  <thead>
                    <tr style={{ background: color + "15", borderBottom: `2px solid ${color}` }}>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.desc}</td>
                        <td>{row.qty}</td>
                        <td>{row.rate}</td>
                        <td><strong>{row.amount}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="doc-totals">
                  <div className="totals-row"><span>Subtotal</span><span>{data.subtotal}</span></div>
                  <div className="totals-row"><span>Tax (17%)</span><span>{data.tax}</span></div>
                  <div className="totals-row totals-grand" style={{ color }}>
                    <span>Total</span>
                    <span>{data.total}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="doc-footer">
                  <span>Generated by FinTrack · Voucher Module</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "fields" && (
            <div className="fields-tab">
              <p className="fields-intro">This template includes the following dynamic fields:</p>
              <div className="fields-list">
                {template.fields.map((field) => (
                  <div key={field} className="field-item">
                    <span className="field-dot" style={{ background: color }} />
                    <span className="field-name">{field}</span>
                    <span className="field-type">Text</span>
                  </div>
                ))}
                <div className="field-item">
                  <span className="field-dot" style={{ background: color }} />
                  <span className="field-name">Generated Date</span>
                  <span className="field-type">Auto</span>
                </div>
                <div className="field-item">
                  <span className="field-dot" style={{ background: color }} />
                  <span className="field-name">Serial Number</span>
                  <span className="field-type">Auto-increment</span>
                </div>
              </div>
              <div className="coming-soon-note">
                ⚙️ Field customization is available once the Voucher Module is active.
              </div>
            </div>
          )}

          {activeTab === "customize" && (
            <div className="customize-tab">
              <div className="coming-soon-banner">
                <div className="cs-icon">🚀</div>
                <h3>Customization Coming Soon</h3>
                <p>
                  The Voucher Module is under development. Once active, you'll be able
                  to edit colors, fonts, fields, and branding directly here.
                </p>
                <div className="cs-features">
                  {["Custom Colors & Branding", "Add/Remove Fields", "Logo Upload", "PDF Export", "Django Integration"].map((f) => (
                    <span key={f} className="cs-feature" style={{ borderColor: color, color }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-modal-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-modal-primary" style={{ background: color }}>
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
}
