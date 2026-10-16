import React, { useState, useMemo, useEffect } from 'react';
import { STORIES_MANIFEST } from '../data/storiesManifest';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
import Pagination from './Pagination';
import { Search, Download, Sparkles, Gem, Layers, CheckCircle2, X } from 'lucide-react';

export default function StoryGallery({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeStory, setActiveStory] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  // Filter stories
  const filteredStories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return STORIES_MANIFEST.filter((item) => {
      // 1. Category Filter
      if (categoryFilter === 'arab' && !item.isArabic) return false;
      if (categoryFilter === 'brand' && item.isArabic) return false;

      // 2. Search
      if (!q) return true;
      const searchable = [
        item.nome,
        item.numero,
        item.sku,
        item.ref,
        item.familia_olfativa,
        item.filename
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(q);
    });
  }, [searchQuery, categoryFilter]);

  const arabicCount = useMemo(() => STORIES_MANIFEST.filter((s) => s.isArabic).length, []);
  const brandCount = useMemo(() => STORIES_MANIFEST.filter((s) => !s.isArabic).length, []);

  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/catalogo-story/catalogo-stories-completo-1080x1920.zip';
    link.download = 'catalogo-stories-completo-1080x1920.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onToast) onToast('Iniciando download do pacote ZIP com todos os 51 Stories! 📦');
  };

  return (
    <div className="admin-tab-pane">
      {/* Top Banner / Actions */}
      <div className="pane-header-row">
        <div>
          <h2>Stories Individuais & Criativos 1080×1920</h2>
          <p>
            Imagens verticais individuais em proporção nativa 9:16 com fotografia real tratada, pirâmide olfativa completa e acordes de cada fragrância.
          </p>
        </div>

        <div className="pane-header-actions">
          <button className="btn-platform-primary" onClick={handleDownloadZip}>
            <Download size={16} /> Baixar Todos os 51 Stories (ZIP - 49.3 MB)
          </button>
        </div>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="prod-filter-bar-clean" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-box-clean" style={{ flex: '1 1 280px' }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Pesquisar story por nome, número (ex: 445, A007), inspiração ou família..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="category-chips-clean">
          <button
            className={`cat-chip-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            Todos ({STORIES_MANIFEST.length})
          </button>
          <button
            className={`cat-chip-btn ${categoryFilter === 'arab' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('arab')}
          >
            <Sparkles size={12} /> Árabes ({arabicCount})
          </button>
          <button
            className={`cat-chip-btn ${categoryFilter === 'brand' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('brand')}
          >
            <Gem size={12} /> Brand ({brandCount})
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <>
          <div className="stories-grid">
            {filteredStories
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((item) => (
                <StoryCard
                  key={item.sku}
                  item={item}
                  onOpenModal={setActiveStory}
                  onToast={onToast}
                />
              ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredStories.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[12, 24, 48]}
          />
        </>
      ) : (
        <div className="empty-state">
          <h3>Nenhum Story encontrado</h3>
          <p>Tente refinar sua busca ou trocar a categoria selecionada.</p>
        </div>
      )}

      {/* Story Full Screen Modal */}
      {activeStory && (
        <StoryModal
          item={activeStory}
          allItems={filteredStories}
          onClose={() => setActiveStory(null)}
          onSelect={setActiveStory}
          onToast={onToast}
        />
      )}
    </div>
  );
}
