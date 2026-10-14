import React from 'react';
import { Search, X, Sparkles, Gem, Layers, Camera, Smartphone, FileText, ClipboardList } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
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
            <p>Central de Catálogos & Marketplaces (Perfumaria 25ml)</p>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="header-nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'copyboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('copyboard')}
          >
            <ClipboardList size={16} />
            <span>Copyboard & Anúncios</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
          >
            <Smartphone size={16} />
            <span>Stories 1080×1920</span>
            <span className="tab-pill-badge">51 PNGs</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => setActiveTab('pdf')}
          >
            <FileText size={16} />
            <span>Catálogo PDF 16:9</span>
          </button>
        </nav>

        <div className="stats-bar">
          <div className="stat-pill">
            <Layers size={14} color="#f59e0b" />
            <span>Itens: <strong>{totalProducts}</strong></span>
          </div>
          <div className="stat-pill">
            <Smartphone size={14} color="#10b981" />
            <span>Stories: <strong>51</strong></span>
          </div>
          <div className="stat-pill">
            <Camera size={14} color="#8b5cf6" />
            <span>Fotos HD: <strong>{totalPhotos}</strong></span>
          </div>
        </div>
      </div>

      {/* Controls only shown in copyboard tab */}
      {activeTab === 'copyboard' && (
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
      )}
    </header>
  );
}
