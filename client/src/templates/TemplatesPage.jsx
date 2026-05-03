import { useState } from "react";
import TemplateCard from "./TemplateCard";
import TemplatePreviewModal from "./TemplatePreviewModal";
import TemplateFilters from "./TemplateFilters";
import "./templates.css";

const TEMPLATES = [
  {
    id: 1,
    name: "Corporate Invoice",
    category: "invoice",
    description: "Clean, professional invoice for B2B transactions with itemized billing.",
    color: "#20b2aa",
    accent: "#e6f7f6",
    icon: "🏢",
    tags: ["Professional", "B2B"],
    fields: ["Invoice No", "Client", "Due Date", "Tax", "Total"],
    preview: "corporate",
  },
  {
    id: 2,
    name: "Sales Receipt",
    category: "receipt",
    description: "Minimal POS-style receipt for retail and service transactions.",
    color: "#6c63ff",
    accent: "#f0effe",
    icon: "🧾",
    tags: ["Retail", "POS"],
    fields: ["Receipt No", "Customer", "Items", "Subtotal", "Total"],
    preview: "receipt",
  },
  {
    id: 3,
    name: "Gift Voucher",
    category: "voucher",
    description: "Elegant gift voucher with redemption code for promotions and gifting.",
    color: "#f59e0b",
    accent: "#fef9ec",
    icon: "🎁",
    tags: ["Gift", "Promo"],
    fields: ["Code", "Value", "Validity", "Conditions"],
    preview: "gift",
  },
  {
    id: 4,
    name: "Discount Coupon",
    category: "voucher",
    description: "Eye-catching discount coupon with percentage or flat-amount deals.",
    color: "#ef4444",
    accent: "#fff1f1",
    icon: "🏷️",
    tags: ["Discount", "Marketing"],
    fields: ["Coupon Code", "Discount %", "Min Order", "Expiry"],
    preview: "discount",
  },
  {
    id: 5,
    name: "Credit Note",
    category: "credit",
    description: "Formal credit note for refunds and account adjustments.",
    color: "#10b981",
    accent: "#ecfdf5",
    icon: "📋",
    tags: ["Refund", "Finance"],
    fields: ["Credit No", "Original Invoice", "Amount", "Reason"],
    preview: "credit",
  },
  {
    id: 6,
    name: "Purchase Order",
    category: "invoice",
    description: "Structured PO template with vendor details and delivery terms.",
    color: "#3b82f6",
    accent: "#eff6ff",
    icon: "📦",
    tags: ["Procurement", "B2B"],
    fields: ["PO Number", "Vendor", "Delivery Date", "Terms"],
    preview: "po",
  },
];

const CATEGORIES = [
  { key: "all", label: "All Templates", count: TEMPLATES.length },
  { key: "invoice", label: "Invoices", count: TEMPLATES.filter(t => t.category === "invoice").length },
  { key: "receipt", label: "Receipts", count: TEMPLATES.filter(t => t.category === "receipt").length },
  { key: "voucher", label: "Vouchers", count: TEMPLATES.filter(t => t.category === "voucher").length },
  { key: "credit", label: "Credit Notes", count: TEMPLATES.filter(t => t.category === "credit").length },
];

export default function TemplatesPage({ onBack }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="templates-page">
      {/* Back Button */}
      {onBack && (
        <div style={{ padding: '16px 40px', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#0d9488',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '8px 0',
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="templates-hero">
        <div className="hero-glow" />
        <div className="templates-hero-inner">
          <span className="hero-badge">Layer 1 · Voucher Template Engine</span>
          <h1 className="templates-hero-title">
            Voucher <span className="title-accent">Templates</span>
          </h1>
          <p className="templates-hero-sub">
            Choose from professionally designed templates. Customize, preview, and deploy
            vouchers, invoices, and receipts in minutes.
          </p>
          <div className="hero-stats">
            <div className="stat-pill">
              <span className="stat-num">{TEMPLATES.length}</span>
              <span className="stat-label">Templates</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-pill">
              <span className="stat-num">4</span>
              <span className="stat-label">Categories</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-pill">
              <span className="stat-num">∞</span>
              <span className="stat-label">Customizable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <TemplateFilters
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Template Grid */}
      <div className="templates-container">
        {filtered.length === 0 ? (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <h3>No templates found</h3>
            <p>Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="templates-grid">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setPreviewTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
