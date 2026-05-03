export default function TemplateFilters({
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className="templates-filters-bar">
      <div className="filters-inner">
        {/* Search */}
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="templates-search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => onSearchChange("")}>✕</button>
          )}
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`cat-pill ${activeCategory === cat.key ? "cat-pill-active" : ""}`}
              onClick={() => onCategoryChange(cat.key)}
            >
              {cat.label}
              <span className="cat-count">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
