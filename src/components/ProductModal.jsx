import React, { useEffect, useState } from 'react';
import { X, Copy, Check, ExternalLink, Download, Sparkles } from 'lucide-react';

export default function ProductModal({ item, onClose, onCopy }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!item) return null;

  const handleCopy = (key, text, label) => {
    onCopy(text, label);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  const images = item.images || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{item.titleShort}</h2>
          <button className="modal-close-btn" onClick={onClose} title="Fechar (ESC)">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Photos Gallery */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="copy-label" style={{ color: 'var(--gold)' }}>
                📷 Fotos em Alta Resolução ({images.length} fotos)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Clique para ampliar / abrir
              </span>
            </div>

            <div className="gallery-grid">
              {images.map((img, idx) => {
                const src = `/${encodeURI(img)}`;
                return (
                  <div
                    key={idx}
                    className="gallery-thumb"
                    onClick={() => window.open(src, '_blank')}
                    title="Clique para abrir imagem original"
                  >
                    <img src={src} alt={`${item.name} ${idx + 1}`} loading="lazy" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Olfactory Notes Box */}
          <div style={{ background: '#0e1726', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold)', fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>
              <Sparkles size={16} />
              <span>PIRÂMIDE OLFATIVA & NOTAS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
              <div>
                <strong style={{ color: '#10b981' }}>🌿 Saída (Topo):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '2px' }}>{item.saida || 'Notas cítricas e frescas'}</p>
              </div>
              <div>
                <strong style={{ color: '#ec4899' }}>🌸 Coração (Corpo):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '2px' }}>{item.corpo || 'Notas florais e envolventes'}</p>
              </div>
              <div>
                <strong style={{ color: '#f59e0b' }}>🪵 Fundo (Base):</strong>
                <p style={{ color: '#cbd5e1', marginTop: '2px' }}>{item.fundo || 'Notas amadeiradas e doces'}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="copy-label" style={{ color: 'var(--gold)' }}>
                🔍 Tags de Busca Marketplace ({item.tags?.length || 0} termos)
              </span>
              <button
                className={`btn-copy ${copiedKey === 'modal-tags' ? 'copied' : ''}`}
                onClick={() => handleCopy('modal-tags', item.tagsString, 'Tags copiadas! ✅')}
              >
                {copiedKey === 'modal-tags' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'modal-tags' ? 'Copiado!' : 'Copiar Tags'}</span>
              </button>
            </div>
            <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {item.tagsString}
            </div>
          </div>

          {/* Full Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="copy-label" style={{ color: 'var(--gold)' }}>
                📄 Descrição Completa Formatada
              </span>
              <button
                className={`btn-copy ${copiedKey === 'modal-desc' ? 'copied' : ''}`}
                onClick={() => handleCopy('modal-desc', item.fullDescription, 'Descrição completa copiada! ✅')}
              >
                {copiedKey === 'modal-desc' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedKey === 'modal-desc' ? 'Copiado!' : 'Copiar Descrição'}</span>
              </button>
            </div>
            <div className="modal-desc-box">
              {item.fullDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
