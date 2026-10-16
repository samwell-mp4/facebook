import React, { useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Sparkles, Gem, CheckCircle } from 'lucide-react';
import { downloadImageAs } from '../utils/imageDownloader';

export default function StoryModal({ item, allItems, onClose, onSelect, onToast }) {
  const currentIndex = allItems.findIndex((i) => i.sku === item.sku);

  const handlePrev = (e) => {
    e?.stopPropagation();
    const prevIdx = (currentIndex - 1 + allItems.length) % allItems.length;
    onSelect(allItems[prevIdx]);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    const nextIdx = (currentIndex + 1) % allItems.length;
    onSelect(allItems[nextIdx]);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.path;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onToast) onToast(`Story ${item.filename} baixado! 📥`);
  };

  const handleDownloadFormat = async (format) => {
    try {
      if (onToast) onToast(`Preparando download em ${format.toUpperCase()}... ⏳`);
      await downloadImageAs(item.path, item.filename, format);
      if (onToast) onToast(`Story ${item.nome} baixado em ${format.toUpperCase()}! 📥`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast(`Erro no download: ${err.message}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allItems]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="story-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Navigation Arrow Left */}
        <button
          className="story-nav-btn prev"
          onClick={handlePrev}
          title="Perfume anterior (Seta esquerda)"
        >
          <ChevronLeft size={28} />
        </button>

        {/* Navigation Arrow Right */}
        <button
          className="story-nav-btn next"
          onClick={handleNext}
          title="Próximo perfume (Seta direita)"
        >
          <ChevronRight size={28} />
        </button>

        {/* Close Button */}
        <button className="modal-close-btn story-close-btn" onClick={onClose} title="Fechar (Esc)">
          <X size={20} />
        </button>

        {/* Story Preview Column */}
        <div className="story-modal-preview">
          <img
            src={item.path ? item.path.replace(/\.png$/i, '.webp') : item.path}
            onError={(e) => {
              if (e.target.src !== item.path) e.target.src = item.path;
            }}
            alt={`Story ${item.nome}`}
            className="story-modal-image"
          />
        </div>

        {/* Story Details Sidebar */}
        <div className="story-modal-sidebar">
          <div className="story-sidebar-header">
            <div className="story-tag-row">
              {item.isArabic ? (
                <span className="badge-arabic-pill">
                  <Sparkles size={13} /> Perfumaria Árabe
                </span>
              ) : (
                <span className="badge-brand-pill">
                  <Gem size={13} /> Brand Collection
                </span>
              )}
              <span className="badge-dim-pill">Nº {item.numero}</span>
            </div>

            <h2 className="story-sidebar-title">{item.nome}</h2>
            <p className="story-sidebar-ref">
              Inspiração / Ref: <strong>{item.ref || 'Fiel ao original'}</strong>
            </p>
          </div>

          <div className="story-specs-box">
            <div className="story-spec-row">
              <span className="lbl">Resolução Nata:</span>
              <span className="val">1080 × 1920 px (9:16)</span>
            </div>
            <div className="story-spec-row">
              <span className="lbl">Formato:</span>
              <span className="val">PNG Sem Compressão / Ultra HD</span>
            </div>
            <div className="story-spec-row">
              <span className="lbl">Tamanho do Arquivo:</span>
              <span className="val">{item.sizeKb}</span>
            </div>
            <div className="story-spec-row">
              <span className="lbl">Família Olfativa:</span>
              <span className="val">{item.familia_olfativa}</span>
            </div>
            <div className="story-spec-row">
              <span className="lbl">Arquivo:</span>
              <span className="val code">{item.filename}</span>
            </div>
          </div>

          <div className="story-guidelines">
            <h4>
              <CheckCircle size={15} color="#10b981" /> Pronto para Publicação:
            </h4>
            <ul>
              <li>Ideal para Instagram Stories & Destaques</li>
              <li>Perfeito para Status do WhatsApp Comercial</li>
              <li>Pronto para TikTok & Reels</li>
              <li>Pirâmide olfativa e notas ilustradas integradas</li>
            </ul>
          </div>

          <div className="story-sidebar-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn-primary-download" onClick={handleDownload}>
              <Download size={16} />
              <span>Baixar PNG Original (1080×1920)</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="btn-platform-secondary"
                style={{ padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                onClick={() => handleDownloadFormat('jpeg')}
                title="Converter e baixar em JPEG (ideal para WhatsApp)"
              >
                <Download size={13} /> Baixar JPEG
              </button>

              <button
                type="button"
                className="btn-platform-secondary"
                style={{ padding: '8px', fontSize: '12px', justifyContent: 'center' }}
                onClick={() => handleDownloadFormat('webp')}
                title="Converter e baixar em WebP (super leve)"
              >
                <Download size={13} /> Baixar WebP
              </button>
            </div>
          </div>

          <div className="story-modal-counter">
            {currentIndex + 1} de {allItems.length} stories
          </div>
        </div>
      </div>
    </div>
  );
}
