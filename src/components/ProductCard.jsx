import React, { useState } from 'react';
import { Copy, Check, Eye, Images, Sparkles, Tag } from 'lucide-react';

export default function ProductCard({ item, onCopy, onOpenModal }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (key, text, label) => {
    onCopy(text, label);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 1500);
  };

  const coverSrc = rawCover
    ? (rawCover.startsWith('data:') || rawCover.startsWith('http') || rawCover.startsWith('blob:')
        ? rawCover
        : `/${encodeURI(rawCover.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}`)
    : '';

  return (
    <div className="product-card">
      {/* Media Cover */}
      <div className="card-media" onClick={() => onOpenModal(item)}>
        <img
          src={coverSrc}
          alt={item.name}
          className="card-image"
          loading="lazy"
          onError={(e) => {
            // Fallback placeholder se imagem falhar
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="card-media-overlay">
          <div className="media-top-badges">
            <span className={`line-badge ${item.isArabic ? 'arab' : 'brand'}`}>
              {item.isArabic ? 'Árabe' : 'Brand'}
            </span>
            <div className="photo-count-badge">
              <Images size={13} />
              <span>{item.imageCount || item.images?.length || 0} fotos</span>
            </div>
          </div>

          <span className={`gender-badge ${
            item.genderWord === 'Feminino' ? 'fem' : item.genderWord === 'Masculino' ? 'masc' : 'uni'
          }`}>
            {item.genderWord}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="card-body">
        <div className="perfume-header-info">
          <div className="perfume-sku-tag">
            <span>SKU: {item.sku}</span> • <span>CÓD: {item.cod}</span>
          </div>
          <h3 className="perfume-title">{item.name}</h3>
          <div className="perfume-ref">
            Inspiração: <strong>{item.ref}</strong>
          </div>
          <span className="family-badge">{item.familia}</span>
        </div>

        {/* Pricing Strip */}
        <div className="card-pricing-strip">
          <div className="card-price-chip wholesale">
            <span className="price-type">Atacado</span>
            <span className="price-number">R$ {Number(item.precoAtacado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="card-price-chip retail">
            <span className="price-type">Varejo</span>
            <span className="price-number">R$ {Number(item.precoVarejo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Copy SKU */}
        <div className="copy-block">
          <div className="copy-block-header">
            <span className="copy-label">SKU de Identificação</span>
            <button
              className={`btn-copy ${copiedKey === 'sku' ? 'copied' : ''}`}
              onClick={() => handleCopy('sku', item.sku, 'SKU copiado! ✅')}
            >
              {copiedKey === 'sku' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedKey === 'sku' ? 'Copiado!' : 'Copiar SKU'}</span>
            </button>
          </div>
          <div className="copy-content-preview">{item.sku}</div>
        </div>

        {/* Copy Short Title */}
        <div className="copy-block">
          <div className="copy-block-header">
            <span className="copy-label">Título Marketplace ({item.titleShort?.length || 0} carac.)</span>
            <button
              className={`btn-copy ${copiedKey === 'title' ? 'copied' : ''}`}
              onClick={() => handleCopy('title', item.titleShort, 'Título curto copiado! ✅')}
            >
              {copiedKey === 'title' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedKey === 'title' ? 'Copiado!' : 'Copiar Título'}</span>
            </button>
          </div>
          <div className="copy-content-preview" title={item.titleShort}>
            {item.titleShort}
          </div>
        </div>

        {/* Copy Tags */}
        <div className="copy-block">
          <div className="copy-block-header">
            <span className="copy-label">Tags / Busca ({item.tags?.length || 0} termos)</span>
            <button
              className={`btn-copy ${copiedKey === 'tags' ? 'copied' : ''}`}
              onClick={() => handleCopy('tags', item.tagsString, 'Tags copiadas! ✅')}
            >
              {copiedKey === 'tags' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedKey === 'tags' ? 'Copiado!' : 'Copiar Tags'}</span>
            </button>
          </div>
          <div className="copy-content-preview" title={item.tagsString}>
            {item.tagsString}
          </div>
        </div>

        {/* Card Actions */}
        <div className="card-footer-actions">
          <button
            className={`btn-main-copy ${copiedKey === 'desc' ? 'copied' : ''}`}
            onClick={() => handleCopy('desc', item.fullDescription, 'Descrição completa copiada! ✅')}
          >
            {copiedKey === 'desc' ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedKey === 'desc' ? 'Descrição Copiada! ✅' : 'Copiar Descrição Completa'}</span>
          </button>

          <button
            className="btn-view-details"
            onClick={() => onOpenModal(item)}
          >
            <Eye size={15} />
            <span>Ver Fotos & Anúncio Completo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
