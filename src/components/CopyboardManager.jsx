import React, { useState, useMemo, useEffect } from 'react';
import {
  Copy,
  Check,
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Images,
  ExternalLink,
  Tag,
  CheckCircle2,
  DollarSign,
  Layers,
  ShoppingBag,
  Filter,
  FileText,
  Download,
  Archive
} from 'lucide-react';
import ProductCarouselModal from './ProductCarouselModal';
import Pagination from './Pagination';
import { downloadImagesAsZip, downloadImageAs } from '../utils/imageDownloader';

export default function CopyboardManager({
  products = [],
  onToast,
  onOpenProductModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'arab', 'brand'
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'Masculino', 'Feminino', 'Compartilhável'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeCarouselProduct, setActiveCarouselProduct] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [downloadingZipSku, setDownloadingZipSku] = useState(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, genderFilter]);

  const handleDownloadZipProduct = async (p) => {
    const rawImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : p.coverImage
      ? [p.coverImage]
      : [];

    if (rawImages.length === 0) {
      if (onToast) onToast('Nenhuma imagem disponível para este produto.');
      return;
    }

    setDownloadingZipSku(p.sku);
    const zipName = `${p.cod || p.sku}_${(p.cleanName || p.name || 'fotos').replace(/[^a-zA-Z0-9_-]/g, '_')}_lote_fotos.zip`;

    try {
      if (onToast) onToast(`Iniciando download do lote ZIP (${rawImages.length} fotos)... 📦`);
      await downloadImagesAsZip({
        images: rawImages.map((img) => img.replace(/\.(jpg|jpeg|png)$/i, '.webp')),
        zipFilename: zipName,
        format: 'original'
      });
      if (onToast) onToast(`Pacote ZIP "${zipName}" baixado com sucesso! 🎉`);
    } catch (err) {
      console.error(err);
      if (onToast) onToast(`Erro ao gerar ZIP: ${err.message || 'Falha ao compactar'}`);
    } finally {
      setDownloadingZipSku(null);
    }
  };

  // Format currency
  const formatMoney = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Copy with visual feedback
  const handleCopy = (id, text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(id);
      onToast && onToast(label || 'Copiado para a área de transferência! ✅');
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(id);
      onToast && onToast(label || 'Copiado para a área de transferência! ✅');
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      if (categoryFilter === 'arab' && !p.isArabic) return false;
      if (categoryFilter === 'brand' && p.isArabic) return false;
      if (genderFilter !== 'all' && p.genderWord !== genderFilter) return false;

      if (!q) return true;

      const matchesName = (p.name || '').toLowerCase().includes(q);
      const matchesClean = (p.cleanName || '').toLowerCase().includes(q);
      const matchesCod = (p.cod || '').toLowerCase().includes(q);
      const matchesSku = (p.sku || '').toLowerCase().includes(q);
      const matchesRef = (p.ref || '').toLowerCase().includes(q);
      const matchesFamilia = (p.familia || '').toLowerCase().includes(q);

      return matchesName || matchesClean || matchesCod || matchesSku || matchesRef || matchesFamilia;
    });
  }, [products, searchQuery, categoryFilter, genderFilter]);

  // Paginated slice
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Counts
  const arabicCount = useMemo(() => products.filter((p) => p.isArabic).length, [products]);
  const brandCount = useMemo(() => products.filter((p) => !p.isArabic).length, [products]);

  return (
    <div className="admin-tab-pane copyboard-platform-pane">
      {/* Pane Header */}
      <div className="pane-header-row">
        <div>
          <h2>Central de Anúncios & Copyboard</h2>
          <p>
            Copie em 1 clique textos persuasivos, títulos otimizados, hashtags e fotos em alta definição para Mercado Livre, Shopee e WhatsApp.
          </p>
        </div>

        <div className="pane-header-actions">
          {/* View mode toggle */}
          <div className="view-mode-toggle-group">
            <button
              type="button"
              className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Cards Compactos"
            >
              <LayoutGrid size={15} /> Cards Compactos
            </button>
            <button
              type="button"
              className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Tabela Objetiva"
            >
              <List size={15} /> Tabela Objetiva
            </button>
          </div>
        </div>
      </div>

      {/* Top Quick KPIs Strip */}
      <div className="copyboard-top-stats">
        <div className="copyboard-stat-item">
          <span className="stat-lbl">Catálogo de Anúncios</span>
          <strong className="stat-val">{products.length}</strong>
          <span className="stat-desc">{filteredProducts.length} itens encontrados</span>
        </div>

        <div className="copyboard-stat-item">
          <span className="stat-lbl">Perfumaria Árabe</span>
          <strong className="stat-val" style={{ color: '#10b981' }}>{arabicCount}</strong>
          <span className="stat-desc">Lattafa, Asad, Yara, Fakhar</span>
        </div>

        <div className="copyboard-stat-item">
          <span className="stat-lbl">Brand Collection</span>
          <strong className="stat-val" style={{ color: '#38bdf8' }}>{brandCount}</strong>
          <span className="stat-desc">Miniaturas 25ml de bolso</span>
        </div>

        <div className="copyboard-stat-item">
          <span className="stat-lbl">Fotografias Reais</span>
          <strong className="stat-val" style={{ color: '#a78bfa' }}>
            {products.reduce((acc, p) => acc + (p.imageCount || p.images?.length || 0), 0)}
          </strong>
          <span className="stat-desc">WebP compactado (-95% de peso)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="prod-filter-bar-clean" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="search-box-clean" style={{ flex: '1 1 280px' }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Pesquisar anúncio por nome, código, ref olfativa ou família..."
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

        {/* Category Chips */}
        <div className="category-chips-clean">
          <button
            className={`cat-chip-btn ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            Todos ({products.length})
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
            Brand Collection ({brandCount})
          </button>
        </div>

        {/* Gender Chips */}
        <div className="category-chips-clean">
          <button
            className={`cat-chip-btn ${genderFilter === 'all' ? 'active' : ''}`}
            onClick={() => setGenderFilter('all')}
          >
            Todos Gêneros
          </button>
          <button
            className={`cat-chip-btn ${genderFilter === 'Masculino' ? 'active' : ''}`}
            onClick={() => setGenderFilter('Masculino')}
          >
            Masculino
          </button>
          <button
            className={`cat-chip-btn ${genderFilter === 'Feminino' ? 'active' : ''}`}
            onClick={() => setGenderFilter('Feminino')}
          >
            Feminino
          </button>
          <button
            className={`cat-chip-btn ${genderFilter === 'Compartilhável' ? 'active' : ''}`}
            onClick={() => setGenderFilter('Compartilhável')}
          >
            Unissex
          </button>
        </div>
      </div>

      {/* VIEW MODE: COMPACT CARDS */}
      {viewMode === 'grid' && (
        <>
          {filteredProducts.length > 0 ? (
            <div className="copyboard-compact-grid">
              {paginatedProducts.map((p) => {
                const rawCover = p.coverImage || (Array.isArray(p.images) && p.images[0]) || '';
                const coverSrc = rawCover
                  ? (rawCover.startsWith('data:') || rawCover.startsWith('http') || rawCover.startsWith('blob:')
                      ? rawCover
                      : `/${encodeURI(rawCover.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}`)
                  : '';
                const imagesCount = p.imageCount || (Array.isArray(p.images) ? p.images.length : 0);

                const isDescCopied = copiedKey === `${p.sku}_desc`;
                const isTitleCopied = copiedKey === `${p.sku}_title`;
                const isTagsCopied = copiedKey === `${p.sku}_tags`;
                const isCodCopied = copiedKey === `${p.sku}_cod`;

                return (
                  <div key={p.sku} className="copyboard-compact-card">
                    {/* Top Row: Thumbnail + Identity */}
                    <div className="copyboard-card-top">
                      <div
                        className="copyboard-thumb-box"
                        onClick={() => setActiveCarouselProduct(p)}
                        title="Ver carrossel de fotos deste perfume"
                      >
                        {coverSrc ? (
                          <img
                            src={coverSrc}
                            alt={p.cleanName || p.name}
                            className="copyboard-thumb-img"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Images size={20} color="#71717a" />
                        )}
                        <span className="thumb-count-tag">
                          {imagesCount}
                        </span>
                      </div>

                      <div className="copyboard-meta-col">
                        <div className="copyboard-badges-row">
                          <span className="code-pill">{p.cod || p.sku}</span>
                          <span className={`line-badge-mini ${p.isArabic ? 'arab' : 'brand'}`}>
                            {p.isArabic ? 'Árabe' : 'Brand'}
                          </span>
                          <span className="gender-mini-tag">{p.genderWord || p.gender}</span>
                        </div>
                        <h3 className="copyboard-perfume-title" title={p.cleanName || p.name}>
                          {p.cleanName || p.name}
                        </h3>
                        <p className="copyboard-ref-text">
                          Ref: <strong>{p.ref || 'Própria'}</strong> {p.volume ? `• ${p.volume}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Pricing Strip */}
                    <div className="copyboard-pricing-strip">
                      <div className="pricing-box">
                        <span className="lbl">Atacado</span>
                        <strong className="val green">{formatMoney(p.precoAtacado)}</strong>
                      </div>
                      <div className="pricing-box">
                        <span className="lbl">Varejo</span>
                        <strong className="val blue">{formatMoney(p.precoVarejo)}</strong>
                      </div>
                      <div className="pricing-box">
                        <span className="lbl">Custo</span>
                        <strong className="val muted">{formatMoney(p.precoCompra)}</strong>
                      </div>
                    </div>

                    {/* Main Action: 1-Click Copy Full Description */}
                    <div className="copyboard-action-stack">
                      <button
                        type="button"
                        className={`btn-copy-full-desc ${isDescCopied ? 'copied' : ''}`}
                        onClick={() => handleCopy(`${p.sku}_desc`, p.fullDescription, 'Descrição completa do anúncio copiada! 📋✨')}
                      >
                        {isDescCopied ? (
                          <>
                            <Check size={14} /> Descrição Copiada!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copiar Descrição Completa
                          </>
                        )}
                      </button>

                      {/* Micro Quick Actions */}
                      <div className="copyboard-micro-actions">
                        <button
                          type="button"
                          className={`btn-micro-copy ${isTitleCopied ? 'copied' : ''}`}
                          onClick={() => handleCopy(`${p.sku}_title`, p.titleShort || p.name, 'Título do anúncio copiado! 🏷️')}
                          title="Copiar Título SEO curto"
                        >
                          {isTitleCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>Título</span>
                        </button>

                        <button
                          type="button"
                          className={`btn-micro-copy ${isTagsCopied ? 'copied' : ''}`}
                          onClick={() => handleCopy(`${p.sku}_tags`, p.tagsString || p.tags, 'Tags e hashtags copiadas! #️⃣')}
                          title="Copiar Tags e Palavras-chave"
                        >
                          {isTagsCopied ? <Check size={12} /> : <Tag size={12} />}
                          <span>Tags</span>
                        </button>

                        <button
                          type="button"
                          className={`btn-micro-copy ${isCodCopied ? 'copied' : ''}`}
                          onClick={() => handleCopy(`${p.sku}_cod`, p.cod || p.sku, 'Código do produto copiado! 🔢')}
                          title="Copiar Código"
                        >
                          {isCodCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>Cód</span>
                        </button>

                        <button
                          type="button"
                          className="btn-micro-copy photos"
                          onClick={() => setActiveCarouselProduct(p)}
                          title="Abrir Carrossel e Downloads (JPEG, WebP, ZIP)"
                        >
                          <Images size={12} />
                          <span>{imagesCount} Fotos</span>
                        </button>

                        <button
                          type="button"
                          className="btn-micro-copy zip"
                          onClick={() => handleDownloadZipProduct(p)}
                          disabled={downloadingZipSku === p.sku}
                          title="Baixar todas as fotos deste perfume em um arquivo compactado ZIP"
                        >
                          <Archive size={12} />
                          <span>{downloadingZipSku === p.sku ? 'ZIP...' : 'ZIP'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nenhum anúncio encontrado</h3>
              <p>Tente ajustar os termos de pesquisa ou remover os filtros aplicados.</p>
            </div>
          )}
        </>
      )}

      {/* VIEW MODE: OBJETIVA / TABELA */}
      {viewMode === 'table' && (
        <>
          {filteredProducts.length > 0 ? (
            <div className="prod-table-container">
              <table className="orders-platform-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Foto & Código</th>
                    <th>Perfume & Inspiração</th>
                    <th style={{ width: '120px' }}>Linha / Gênero</th>
                    <th style={{ width: '110px' }}>Atacado</th>
                    <th style={{ width: '110px' }}>Varejo</th>
                    <th style={{ width: '330px', textAlign: 'center' }}>Copiar Recursos do Anúncio</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p) => {
                    const rawCover = p.coverImage || (Array.isArray(p.images) && p.images[0]) || '';
                    const coverSrc = rawCover
                      ? (rawCover.startsWith('data:') || rawCover.startsWith('http') || rawCover.startsWith('blob:')
                          ? rawCover
                          : `/${encodeURI(rawCover.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}`)
                      : '';
                    const imagesCount = p.imageCount || (Array.isArray(p.images) ? p.images.length : 0);

                    const isDescCopied = copiedKey === `${p.sku}_table_desc`;
                    const isTitleCopied = copiedKey === `${p.sku}_table_title`;
                    const isTagsCopied = copiedKey === `${p.sku}_table_tags`;

                    return (
                      <tr key={p.sku}>
                        <td>
                          <div className="product-thumb-code-cell">
                            <div
                              className="prod-table-thumb-wrap"
                              onClick={() => setActiveCarouselProduct(p)}
                              title="Clique para ver fotos no carrossel"
                            >
                              {coverSrc ? (
                                <img
                                  src={coverSrc}
                                  alt={p.cleanName || p.name}
                                  className="prod-table-thumb-img"
                                  loading="lazy"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <Images size={16} color="#71717a" />
                              )}
                              <div className="thumb-hover-overlay">
                                <Images size={12} color="#fff" />
                              </div>
                            </div>
                            <span className="code-pill">{p.cod || p.sku}</span>
                          </div>
                        </td>

                        <td>
                          <div className="client-cell-info">
                            <strong className="client-name-bold">{p.cleanName || p.name}</strong>
                            <span className="client-phone-sub">Ref: {p.ref || '-'} {p.volume ? `(${p.volume})` : ''}</span>
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className={`line-badge ${p.isArabic ? 'arab' : 'brand'}`} style={{ fontSize: '10px', padding: '1px 6px', width: 'fit-content' }}>
                              {p.isArabic ? 'Árabe' : 'Brand'}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.genderWord}</span>
                          </div>
                        </td>

                        <td>
                          <strong style={{ color: '#10b981' }}>{formatMoney(p.precoAtacado)}</strong>
                        </td>

                        <td>
                          <strong style={{ color: '#38bdf8' }}>{formatMoney(p.precoVarejo)}</strong>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className={`btn-platform-primary ${isDescCopied ? 'copied' : ''}`}
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => handleCopy(`${p.sku}_table_desc`, p.fullDescription, 'Descrição completa copiada! ✅')}
                              title="Copiar Descrição Completa"
                            >
                              {isDescCopied ? <Check size={12} /> : <Copy size={12} />} Descrição
                            </button>

                            <button
                              type="button"
                              className={`btn-platform-secondary ${isTitleCopied ? 'copied' : ''}`}
                              style={{ padding: '6px 10px', fontSize: '11px' }}
                              onClick={() => handleCopy(`${p.sku}_table_title`, p.titleShort || p.name, 'Título copiado! ✅')}
                              title="Copiar Título do Anúncio"
                            >
                              {isTitleCopied ? <Check size={12} /> : 'Título'}
                            </button>

                            {p.tagsString && (
                              <button
                                type="button"
                                className={`btn-platform-secondary ${isTagsCopied ? 'copied' : ''}`}
                                style={{ padding: '6px 10px', fontSize: '11px' }}
                                onClick={() => handleCopy(`${p.sku}_table_tags`, p.tagsString, 'Tags copiadas! ✅')}
                                title="Copiar Tags"
                              >
                                {isTagsCopied ? <Check size={12} /> : 'Tags'}
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn-platform-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px' }}
                              onClick={() => setActiveCarouselProduct(p)}
                              title={`Abrir Carrossel e Downloads (${imagesCount} fotos)`}
                            >
                              <Images size={12} /> {imagesCount}
                            </button>

                            <button
                              type="button"
                              className="btn-platform-secondary"
                              style={{ padding: '6px 10px', fontSize: '11px' }}
                              onClick={() => handleDownloadZipProduct(p)}
                              disabled={downloadingZipSku === p.sku}
                              title={`Baixar lote ZIP com todas as ${imagesCount} fotos`}
                            >
                              <Archive size={12} /> {downloadingZipSku === p.sku ? 'ZIP...' : 'ZIP'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Nenhum anúncio encontrado</h3>
              <p>Tente refinar sua busca ou trocar a categoria selecionada.</p>
            </div>
          )}
        </>
      )}

      {/* PAGINATION COMPONENT */}
      {filteredProducts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[12, 24, 48, 100]}
        />
      )}

      {/* Carrossel de fotos ao clicar */}
      {activeCarouselProduct && (
        <ProductCarouselModal
          product={activeCarouselProduct}
          onClose={() => setActiveCarouselProduct(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}
