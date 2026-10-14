import React, { useState, useMemo } from 'react';
import { STORIES_MANIFEST } from '../data/storiesManifest';
import StoryCard from './StoryCard';
import StoryModal from './StoryModal';
import { Search, Download, Sparkles, Gem, Layers, CheckCircle2, X } from 'lucide-react';

export default function StoryGallery({ onToast }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeStory, setActiveStory] = useState(null);

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
    <div className="story-gallery-page">
      {/* Top Banner / Actions */}
      <div className="story-gallery-header">
        <div className="story-header-text">
          <div className="story-title-badge">
            <span className="live-dot"></span> NOVO MODO DE CATÁLOGO
          </div>
          <h2>Stories Individuais <span>1080×1920</span></h2>
          <p>
            Imagens verticais individuais em resolução nativa (9:16), com a fotografia real tratada, pirâmide olfativa completa e acordes de cada fragrância.
          </p>
        </div>

        <div className="story-header-actions">
          <button className="btn-download-all-zip" onClick={handleDownloadZip}>
            <Download size={18} />
            <div className="btn-text">
              <strong>Baixar Todos os 51 Stories (ZIP)</strong>
              <span>Pacote completo pronto (49.3 MB)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="story-gallery-controls">
        <div className="search-input-box story-search-box">
          <Search className="search-icon" size={17} />
          <input
            type="text"
            placeholder="Pesquisar story por nome, número (ex: 445, A007), inspiração ou família..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="story-filter-pills">
          <button
            className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            Todos ({STORIES_MANIFEST.length})
          </button>
          <button
            className={`filter-btn ${categoryFilter === 'arab' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('arab')}
          >
            <Sparkles size={13} /> Árabes ({arabicCount})
          </button>
          <button
            className={`filter-btn ${categoryFilter === 'brand' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('brand')}
          >
            <Gem size={13} /> Brand Collection ({brandCount})
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <div className="stories-grid">
          {filteredStories.map((item) => (
            <StoryCard
              key={item.sku}
              item={item}
              onOpenModal={setActiveStory}
              onToast={onToast}
            />
          ))}
        </div>
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
