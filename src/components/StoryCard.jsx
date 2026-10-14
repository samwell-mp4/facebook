import React from 'react';
import { Download, Eye, ExternalLink, Sparkles, Gem } from 'lucide-react';

export default function StoryCard({ item, onOpenModal, onToast }) {
  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = item.path;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onToast) onToast(`Story ${item.filename} baixado! 📥`);
  };

  return (
    <div className="story-card" onClick={() => onOpenModal(item)}>
      <div className="story-thumbnail-wrapper">
        <img
          src={item.path}
          alt={`Story ${item.nome}`}
          loading="lazy"
          className="story-thumbnail-img"
        />
        <div className="story-badge-top">
          {item.isArabic ? (
            <span className="badge-arabic-pill">
              <Sparkles size={11} /> Árabe
            </span>
          ) : (
            <span className="badge-brand-pill">
              <Gem size={11} /> Brand
            </span>
          )}
          <span className="badge-dim-pill">1080×1920</span>
        </div>

        <div className="story-hover-overlay">
          <button className="story-overlay-btn" onClick={() => onOpenModal(item)}>
            <Eye size={18} /> Visualizar
          </button>
        </div>
      </div>

      <div className="story-card-footer">
        <div className="story-card-info">
          <div className="story-num-badge">Nº {item.numero}</div>
          <h3 className="story-card-title">{item.nome}</h3>
          <p className="story-card-sub">{item.familia_olfativa || item.marca}</p>
        </div>

        <div className="story-card-actions">
          <button
            className="btn-story-download"
            onClick={handleDownload}
            title="Baixar PNG em alta resolução (1080x1920)"
          >
            <Download size={15} />
            <span>Baixar PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
