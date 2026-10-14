import React from 'react';
import { Search, X, Sparkles, Gem, Layers, Camera } from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  totalProducts,
  filteredCount,
  arabicCount,
  brandCount,
  totalPhotos
}) {
  const filters = [
    { id: 'all', label: `Todos (${totalProducts})` },
    { id: 'arab', label: `🌟 Perfumaria Árabe (${arabicCount})` },
    { id: 'brand', label: `💎 Brand Collection (${brandCount})` },
    { id: 'fem', label: '👩 Femininos' },
    { id: 'masc', label: '👨 Masculinos' },
    { id: 'uni', label: '⚧️ Unissex' }
  ];

  return (
    <header>
      <div className="header-top">
        <div className="brand-box">
          <div className="brand-logo-badge">💎</div>
          <div className="brand-titles">
            <h1>Snack Store <span>BH</span></h1>
            <p>Central de Copyboard & Produtos Marketplaces (52 Perfumes 25ml)</p>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-pill">
            <Layers size={14} color="#f59e0b" />
            <span>Itens: <strong>{filteredCount}</strong> de {totalProducts}</span>
          </div>
          <div className="stat-pill">
            <Sparkles size={14} color="#8b5cf6" />
            <span>Árabes: <strong>{arabicCount}</strong></span>
          </div>
          <div className="stat-pill">
            <Gem size={14} color="#3b82f6" />
            <span>Brand: <strong>{brandCount}</strong></span>
          </div>
          <div className="stat-pill">
            <Camera size={14} color="#10b981" />
            <span>Fotos HD: <strong>{totalPhotos}</strong></span>
          </div>
        </div>
      </div>

      <div className="controls-container">
        <div className="search-row">
          <div className="search-input-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por nome, inspiração (ex: Yara, Good Girl), SKU, notas ou família olfativa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Limpar pesquisa"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="filter-pills">
          {filters.map((f) => (
            <button
              key={f.id}
              className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
