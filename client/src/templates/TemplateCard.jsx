export default function TemplateCard({ template, onPreview }) {
  const { name, description, color, accent, icon, tags, fields } = template;

  return (
    <div className="template-card" style={{ "--card-color": color, "--card-accent": accent }}>
      {/* Card Top Preview Area */}
      <div className="card-preview-area">
        <div className="card-mock-doc">
          <div className="mock-header" style={{ background: color }}>
            <span className="mock-icon">{icon}</span>
            <div className="mock-header-lines">
              <div className="mock-line mock-line-title" />
              <div className="mock-line mock-line-sub" />
            </div>
          </div>
          <div className="mock-body">
            {fields.map((field, i) => (
              <div key={i} className="mock-field-row">
                <div className="mock-field-label" />
                <div className="mock-field-value" style={{ width: `${50 + (i % 3) * 15}%` }} />
              </div>
            ))}
            <div className="mock-total-row">
              <div className="mock-total-box" style={{ background: color + "22", borderColor: color }} />
            </div>
          </div>
        </div>
        <div className="card-preview-overlay">
          <button className="btn-preview-overlay" onClick={onPreview}>
            <span>👁</span> Preview
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <div className="card-top-row">
          <span className="card-icon" style={{ background: accent }}>{icon}</span>
          <div className="card-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag" style={{ color, background: accent }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <h3 className="card-title">{name}</h3>
        <p className="card-desc">{description}</p>

        <div className="card-fields-preview">
          <span className="fields-label">Fields:</span>
          {fields.slice(0, 3).map((f) => (
            <span key={f} className="field-chip">{f}</span>
          ))}
          {fields.length > 3 && (
            <span className="field-chip field-chip-more">+{fields.length - 3}</span>
          )}
        </div>

        <div className="card-actions">
          <button className="btn-use-template" style={{ background: color }} onClick={onPreview}>
            Use Template
          </button>
          <button className="btn-preview-sm" onClick={onPreview}>
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
