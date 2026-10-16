import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Images,
  Tag,
  Sparkles,
  ExternalLink,
  Layers,
  Building2,
  Users,
  Download,
  Archive,
  Check
} from 'lucide-react';
import { downloadImageAs, downloadImagesAsZip } from '../utils/imageDownloader';

export default function ProductCarouselModal({
  product,
  initialIndex = 0,
  onClose,
  onToast
}) {
  if (!product) return null;

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState('');

  // Normalize image paths to ensure .webp is used
  const rawImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.coverImage
    ? [product.coverImage]
    : [];

  const images = rawImages.map((img) => img.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1))
  );

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, images.length, onClose]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const rawActive = images[currentIndex] || '';
  const activeSrc = rawActive
    ? (rawActive.startsWith('data:') || rawActive.startsWith('http') || rawActive.startsWith('blob:')
        ? rawActive
        : `/${encodeURI(rawActive)}`)
    : '';

  // Stock calculations
  const proprio = product.estoqueProprio !== undefined ? Number(product.estoqueProprio) : Number(product.qtdEstoque || 0);
  const fornQtd = Array.isArray(product.fornecedores)
    ? product.fornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0)
    : 0;

  const handleDownloadSingle = async (format) => {
    if (!activeSrc) return;
    const baseName = `${product.cod || product.sku}_${(product.cleanName || product.name || 'foto').replace(/[^a-zA-Z0-9_-]/g, '_')}_${currentIndex + 1}`;
    try {
      if (onToast) onToast(`Preparando download em ${format.toUpperCase()}... ⏳`);
      await downloadImageAs(activeSrc, baseName, format);
      if (onToast) onToast(`Foto baixada com sucesso em ${format.toUpperCase()}! 📥✨`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast(`Erro ao baixar imagem: ${err.message || 'Falha na conversão'}`);
    }
  };

  const handleDownloadAllZip = async (format = 'original') => {
    if (!images || images.length === 0) return;
    setIsZipping(true);
    setZipProgress(`0/${images.length}`);
    const zipName = `${product.cod || product.sku}_${(product.cleanName || product.name || 'fotos').replace(/[^a-zA-Z0-9_-]/g, '_')}_lote_fotos.zip`;

    try {
      if (onToast) onToast(`Iniciando download do lote ZIP com ${images.length} fotos... 📦`);
      await downloadImagesAsZip({
        images,
        zipFilename: zipName,
        format,
        onProgress: (done, total) => {
          setZipProgress(`${done}/${total}`);
        }
      });
      if (onToast) onToast(`Pacote ZIP "${zipName}" baixado com sucesso! 🎉`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast(`Erro ao gerar ZIP: ${err.message || 'Falha ao compactar'}`);
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div
        className="carousel-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="carousel-modal-header">
          <div className="carousel-header-left">
            <div className="carousel-badge-icon">
              <Images size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="code-pill">{product.cod || product.sku}</span>
                <span className={`line-badge ${product.isArabic ? 'arab' : 'brand'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                  {product.isArabic ? 'Árabe' : 'Brand Collection'}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Foto {currentIndex + 1} de {images.length || 1}
                </span>
              </div>
              <h3 className="carousel-prod-title">{product.cleanName || product.name}</h3>
              {product.ref && (
                <span className="carousel-prod-ref">
                  Inspiração: <strong>{product.ref}</strong> {product.volume ? `• ${product.volume}` : ''}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            title="Fechar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Stage Image with Navigation Arrows */}
        <div className="carousel-stage">
          {images.length > 1 && (
            <button
              type="button"
              className="carousel-arrow-btn left"
              onClick={handlePrev}
              title="Foto anterior (Seta esquerda)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="carousel-image-container">
            {activeSrc ? (
              <img
                src={activeSrc}
                alt={`${product.name} foto ${currentIndex + 1}`}
                className="carousel-main-image"
                loading="eager"
              />
            ) : (
              <div className="carousel-no-image">
                <Images size={48} opacity={0.3} />
                <p>Nenhuma imagem disponível para este produto</p>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className="carousel-arrow-btn right"
              onClick={handleNext}
              title="Próxima foto (Seta direita)"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Thumbnails Ribbon */}
        {images.length > 1 && (
          <div className="carousel-thumbs-ribbon">
            {images.map((img, idx) => {
              const thumbSrc = img.startsWith('data:') || img.startsWith('http') || img.startsWith('blob:')
                ? img
                : `/${encodeURI(img)}`;
              const isActive = idx === currentIndex;
              return (
                <div
                  key={idx}
                  className={`carousel-thumb-item ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <img src={thumbSrc} alt={`Miniatura ${idx + 1}`} loading="lazy" />
                  {isActive && <div className="thumb-active-indicator" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Specs & Financial Ribbon + Downloads */}
        <div className="carousel-footer-ribbon">
          <div className="carousel-footer-kpis">
            <div className="carousel-kpi-item">
              <span>Custo Compra:</span>
              <strong style={{ color: '#f59e0b' }}>{formatMoney(product.precoCompra)}</strong>
            </div>

            <div className="carousel-kpi-item">
              <span>Atacado Snack:</span>
              <strong style={{ color: '#10b981' }}>{formatMoney(product.precoAtacado)}</strong>
            </div>

            <div className="carousel-kpi-item">
              <span>Varejo Sugerido:</span>
              <strong style={{ color: '#38bdf8' }}>{formatMoney(product.precoVarejo)}</strong>
            </div>

            <div className="carousel-kpi-item">
              <span>Estoque Disponível:</span>
              <strong style={{ color: proprio + fornQtd > 0 ? '#fff' : '#ef4444' }}>
                🏢 {proprio} un Próprio {fornQtd > 0 ? `• 🤝 ${fornQtd} un Parceiros` : ''}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeSrc && (
              <>
                <button
                  type="button"
                  className="btn-platform-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleDownloadSingle('jpeg')}
                  title="Baixar esta foto atual convertida para JPEG (.jpg)"
                >
                  <Download size={13} /> Baixar JPEG
                </button>

                <button
                  type="button"
                  className="btn-platform-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleDownloadSingle('webp')}
                  title="Baixar esta foto atual em WebP (.webp)"
                >
                  <Download size={13} /> Baixar WebP
                </button>
              </>
            )}

            {images.length > 0 && (
              <button
                type="button"
                className="btn-platform-primary"
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => handleDownloadAllZip('original')}
                disabled={isZipping}
                title={`Baixar todas as ${images.length} fotos deste perfume em um arquivo compactado ZIP`}
              >
                <Archive size={14} />
                <span>
                  {isZipping ? `Compactando (${zipProgress})...` : `Baixar Lote ZIP (${images.length} fotos)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
