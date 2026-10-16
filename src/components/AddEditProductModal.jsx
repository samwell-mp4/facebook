import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Save,
  Sparkles,
  Building2,
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  Check,
  Compass,
  FileText,
  DollarSign,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function AddEditProductModal({
  product = null, // null for new, product object for edit
  onClose,
  onSaveProduct,
  onToast
}) {
  const isEditing = Boolean(product);
  const fileInputRef = useRef(null);

  // Informações Básicas
  const [cod, setCod] = useState(product?.cod || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [cleanName, setCleanName] = useState(product?.cleanName || '');
  const [ref, setRef] = useState(product?.ref || '');
  const [isArabic, setIsArabic] = useState(product?.isArabic ?? true);
  const [gender, setGender] = useState(product?.gender || 'MASCULINO');
  const [volume, setVolume] = useState(product?.volume || '25ml');

  // Preços e Estoque
  const [precoCompra, setPrecoCompra] = useState(product?.precoCompra !== undefined ? String(product.precoCompra) : '37');
  const [precoAtacado, setPrecoAtacado] = useState(product?.precoAtacado !== undefined ? String(product.precoAtacado) : '50');
  const [precoVarejo, setPrecoVarejo] = useState(product?.precoVarejo !== undefined ? String(product.precoVarejo) : '84.9');
  const [estoqueProprio, setEstoqueProprio] = useState(
    product?.estoqueProprio !== undefined ? String(product.estoqueProprio) : (product?.qtdEstoque !== undefined ? String(product.qtdEstoque) : '5')
  );

  // Galeria de Fotos e Imagem de Capa
  const initialImages = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : (product?.coverImage ? [product.coverImage] : []);
  const [images, setImages] = useState(initialImages);
  const [coverImage, setCoverImage] = useState(product?.coverImage || initialImages[0] || '');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Notas e Pirâmide Olfativa
  const [familia, setFamilia] = useState(product?.familia || '');
  const [saida, setSaida] = useState(product?.saida || '');
  const [corpo, setCorpo] = useState(product?.corpo || '');
  const [fundo, setFundo] = useState(product?.fundo || '');
  const [fullDescription, setFullDescription] = useState(
    product?.fullDescription || product?.descricao || ''
  );

  // Active Tab for organization
  const [activeTab, setActiveTab] = useState('geral'); // 'geral', 'fotos', 'olfativa', 'descricao'

  // Cálculos de margem em tempo real
  const custoNum = Number(String(precoCompra).replace(',', '.')) || 0;
  const atacadoNum = Number(String(precoAtacado).replace(',', '.')) || 0;
  const varejoNum = Number(String(precoVarejo).replace(',', '.')) || 0;
  const proprioNum = Math.max(0, parseInt(estoqueProprio) || 0);

  const lucroVarejo = Math.max(0, varejoNum - custoNum);
  const margemVarejo = custoNum > 0 ? (lucroVarejo / custoNum) * 100 : 0;
  const lucroAtacado = Math.max(0, atacadoNum - custoNum);
  const margemAtacado = custoNum > 0 ? (lucroAtacado / custoNum) * 100 : 0;

  const handleNameChange = (val) => {
    setName(val);
    if (!cleanName || cleanName === name.replace(/^(Arabic\s+[A-Za-z0-9]+\s+|Brand Collection\s+[0-9]+\s+)/i, '')) {
      const simplified = val.replace(/^(Arabic\s+[A-Za-z0-9]+\s+|Brand Collection\s+[0-9]+\s+)/i, '');
      setCleanName(simplified);
    }
  };

  const handleCodChange = (val) => {
    const upper = val.toUpperCase();
    setCod(upper);
    if (!sku || sku.startsWith('ARAB-') || sku.startsWith('BRAND-')) {
      setSku(isArabic ? `ARAB-${upper}` : `BRAND-${upper}`);
    }
  };

  const handleCategoryToggle = (arabic) => {
    setIsArabic(arabic);
    if (cod) {
      setSku(arabic ? `ARAB-${cod}` : `BRAND-${cod}`);
    }
  };

  // Helper para resolver URL da imagem
  const resolveImgSrc = (img) => {
    if (!img) return '';
    if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://') || img.startsWith('blob:')) {
      return img;
    }
    const clean = img.startsWith('/') ? img.slice(1) : img;
    return `/${encodeURI(clean.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}`;
  };

  // Upload local de arquivos de foto
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);

    let loadedCount = 0;
    const newImgs = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        loadedCount++;
        if (loadedCount === files.length) setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;
        newImgs.push(result);
        loadedCount++;
        if (loadedCount === files.length) {
          setImages((prev) => {
            const merged = [...prev, ...newImgs];
            if (!coverImage && merged.length > 0) {
              setCoverImage(merged[0]);
            }
            return merged;
          });
          setIsUploading(false);
          onToast && onToast(`${newImgs.length} foto(s) adicionada(s) à galeria! 📸✨`);
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === files.length) setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Adicionar foto por URL
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setImages((prev) => {
      const merged = [...prev, trimmed];
      if (!coverImage) {
        setCoverImage(trimmed);
      }
      return merged;
    });
    setNewImageUrl('');
    onToast && onToast('Foto adicionada via link! 🔗✨');
  };

  // Remover foto da galeria
  const handleRemoveImage = (indexToRemove) => {
    const target = images[indexToRemove];
    const nextImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(nextImages);
    if (coverImage === target) {
      setCoverImage(nextImages[0] || '');
    }
  };

  // Definir foto como capa principal
  const handleSetCover = (img) => {
    setCoverImage(img);
    onToast && onToast('Foto principal de capa atualizada! ⭐');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do perfume!');
      return;
    }
    const finalCod = (cod.trim() || 'NOVO').toUpperCase();
    const finalSku = sku.trim() || (isArabic ? `ARAB-${finalCod}` : `BRAND-${finalCod}`);

    const existingFornecedores = Array.isArray(product?.fornecedores) ? product.fornecedores : [];
    const totalExt = existingFornecedores.reduce((acc, f) => acc + (Number(f.qtd) || 0), 0);
    const totalEstoque = proprioNum + totalExt;

    // Define foto de capa final
    const finalCover = coverImage || images[0] || '';

    const payload = {
      ...(product || {}),
      cod: finalCod,
      sku: finalSku,
      name: name.trim(),
      cleanName: cleanName.trim() || name.trim(),
      ref: ref.trim(),
      isArabic,
      collectionName: isArabic ? 'Linha Perfumaria Árabe' : 'Brand Collection',
      gender: gender.toUpperCase(),
      genderWord: gender === 'FEMININO' ? 'Feminino' : gender === 'MASCULINO' ? 'Masculino' : 'Unissex',
      volume: volume.trim() || '25ml',
      precoCompra: custoNum,
      precoAtacado: atacadoNum,
      precoVarejo: varejoNum,
      lucroAtacado: Math.round(lucroAtacado * 100) / 100,
      margemAtacado: Math.round(margemAtacado * 10) / 10,
      lucroVarejo: Math.round(lucroVarejo * 100) / 100,
      margemVarejo: Math.round(margemVarejo * 10) / 10,
      lucroRevendedor: Math.max(0, Math.round((varejoNum - atacadoNum) * 100) / 100),
      estoqueProprio: proprioNum,
      qtdEstoque: totalEstoque,
      fornecedores: existingFornecedores,
      images: images.length > 0 ? images : (finalCover ? [finalCover] : []),
      coverImage: finalCover,
      imageCount: images.length > 0 ? images.length : (finalCover ? 1 : 0),
      familia: familia.trim(),
      saida: saida.trim(),
      corpo: corpo.trim(),
      fundo: fundo.trim(),
      fullDescription: fullDescription.trim(),
      titleShort: product?.titleShort || `${isArabic ? 'Perfume Árabe' : 'Perfume Brand Collection'} ${finalCod} ${cleanName.trim()} ${volume} ${gender}`,
      titleLong: product?.titleLong || `${isArabic ? 'Perfume Árabe' : 'Perfume Brand Collection'} N° ${finalCod} ${cleanName.trim()} ${volume} - Inspiração ${ref || cleanName.trim()} - Original Lacrado Snack Store BH`,
      tags: product?.tags || [cleanName.toLowerCase(), finalCod.toLowerCase(), isArabic ? 'perfume arabe' : 'brand collection'],
      tagsString: product?.tagsString || `${cleanName.toLowerCase()}, ${finalCod.toLowerCase()}, ${isArabic ? 'perfume arabe' : 'brand collection'}`
    };

    onSaveProduct && onSaveProduct(payload);
    onToast && onToast(isEditing ? `Perfume "${payload.cleanName}" atualizado com sucesso! 📦✨` : `Novo perfume "${payload.cleanName}" cadastrado no catálogo! 💎✨`);
    onClose();
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal-clean-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-clean-header">
          <div className="header-icon-title">
            <div className="header-badge-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>{isEditing ? 'Editar Perfume do Catálogo' : 'Cadastrar Novo Perfume'}</h3>
              <p className="modal-subtitle">
                {isEditing ? `Código: ${product.cod || product.sku} • Gerencie fotos, notas e preços` : 'Cadastre foto de capa, galeria, notas olfativas e custos'}
              </p>
            </div>
          </div>
          <button className="admin-modal-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="product-modal-subnav">
          <button
            type="button"
            className={`subnav-tab-btn ${activeTab === 'geral' ? 'active' : ''}`}
            onClick={() => setActiveTab('geral')}
          >
            📦 Dados Básicos & Preços
          </button>
          <button
            type="button"
            className={`subnav-tab-btn ${activeTab === 'fotos' ? 'active' : ''}`}
            onClick={() => setActiveTab('fotos')}
          >
            📸 Galeria de Fotos ({images.length})
          </button>
          <button
            type="button"
            className={`subnav-tab-btn ${activeTab === 'olfativa' ? 'active' : ''}`}
            onClick={() => setActiveTab('olfativa')}
          >
            🌸 Pirâmide Olfativa
          </button>
          <button
            type="button"
            className={`subnav-tab-btn ${activeTab === 'descricao' ? 'active' : ''}`}
            onClick={() => setActiveTab('descricao')}
          >
            📝 Descrição & Venda
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="modal-clean-body">
          {/* TAB 1: DADOS BÁSICOS & PREÇOS */}
          {activeTab === 'geral' && (
            <>
              {/* Categoria Selector */}
              <div className="form-group-clean">
                <label className="field-label-clean">Linha / Categoria do Perfume *</label>
                <div className="segmented-type-toggle">
                  <button
                    type="button"
                    className={`btn-seg-toggle arab ${isArabic ? 'active' : ''}`}
                    onClick={() => handleCategoryToggle(true)}
                  >
                    🕌 Perfumaria Árabe (Lattafa / etc.)
                  </button>
                  <button
                    type="button"
                    className={`btn-seg-toggle brand ${!isArabic ? 'active' : ''}`}
                    onClick={() => handleCategoryToggle(false)}
                  >
                    💎 Brand Collection (Miniaturas 25ml)
                  </button>
                </div>
              </div>

              {/* Código e SKU */}
              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Código do Perfume *</label>
                  <input
                    type="text"
                    placeholder={isArabic ? 'Ex: A007' : 'Ex: 005'}
                    value={cod}
                    onChange={(e) => handleCodChange(e.target.value)}
                    className="admin-form-input"
                    required
                  />
                </div>
                <div className="form-group-clean">
                  <label className="field-label-clean">SKU / Identificador Único *</label>
                  <input
                    type="text"
                    placeholder={isArabic ? 'ARAB-A007' : 'BRAND-005'}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="admin-form-input"
                    required
                    disabled={isEditing}
                  />
                </div>
              </div>

              {/* Nome e Nome de Exibição */}
              <div className="form-clean-grid two">
                <div className="form-group-clean">
                  <label className="field-label-clean">Nome Completo do Perfume *</label>
                  <input
                    type="text"
                    placeholder="Ex: Arabic A007 Fakhar Black"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="admin-form-input"
                    required
                  />
                </div>
                <div className="form-group-clean">
                  <label className="field-label-clean">Nome Curto / Amigável *</label>
                  <input
                    type="text"
                    placeholder="Ex: Fakhar Black"
                    value={cleanName}
                    onChange={(e) => setCleanName(e.target.value)}
                    className="admin-form-input"
                    required
                  />
                </div>
              </div>

              {/* Inspiração Olfativa e Gênero */}
              <div className="form-clean-grid three">
                <div className="form-group-clean">
                  <label className="field-label-clean">Inspiração / Referência</label>
                  <input
                    type="text"
                    placeholder="Ex: Lattafa Fakhar Black / YSL Y EDP"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="admin-form-input"
                  />
                </div>
                <div className="form-group-clean">
                  <label className="field-label-clean">Gênero</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="UNISSEX">Unissex / Compartilhável</option>
                  </select>
                </div>
                <div className="form-group-clean">
                  <label className="field-label-clean">Volumetria</label>
                  <input
                    type="text"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="admin-form-input"
                    placeholder="Ex: 25ml"
                  />
                </div>
              </div>

              {/* Preços e Custos */}
              <div className="pricing-box-clean">
                <span className="section-label-sub">Tabela de Preços e Margens de Lucro</span>
                <div className="form-clean-grid three">
                  <div className="form-group-clean">
                    <label className="field-label-clean">Custo Compra (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="37.00"
                      value={precoCompra}
                      onChange={(e) => setPrecoCompra(e.target.value)}
                      className="admin-form-input"
                      style={{ color: '#f59e0b', fontWeight: 700 }}
                      required
                    />
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Preço Atacado (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="50.00"
                      value={precoAtacado}
                      onChange={(e) => setPrecoAtacado(e.target.value)}
                      className="admin-form-input"
                      style={{ color: '#38bdf8', fontWeight: 700 }}
                      required
                    />
                  </div>

                  <div className="form-group-clean">
                    <label className="field-label-clean">Preço Varejo (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="84.90"
                      value={precoVarejo}
                      onChange={(e) => setPrecoVarejo(e.target.value)}
                      className="admin-form-input"
                      style={{ color: '#10b981', fontWeight: 700 }}
                      required
                    />
                  </div>
                </div>

                {/* Margens calculadas */}
                <div className="margins-preview-strip">
                  <div className="margin-pill">
                    <span>Margem Varejo:</span>
                    <strong style={{ color: '#10b981' }}>+{margemVarejo.toFixed(0)}% (R$ {lucroVarejo.toFixed(2)})</strong>
                  </div>
                  <div className="margin-pill">
                    <span>Margem Atacado:</span>
                    <strong style={{ color: '#38bdf8' }}>+{margemAtacado.toFixed(0)}% (R$ {lucroAtacado.toFixed(2)})</strong>
                  </div>
                </div>
              </div>

              {/* Estoque Próprio Inicial */}
              <div className="form-group-clean">
                <label className="field-label-clean">
                  <Building2 size={15} color="#10b981" /> Estoque Próprio Físico (Frascos no Galpão) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={estoqueProprio}
                  onChange={(e) => setEstoqueProprio(e.target.value)}
                  className="admin-form-input"
                  required
                />
              </div>

              {/* Atalho para ir à Galeria de Fotos */}
              <div className="quick-switch-strip">
                <div className="quick-switch-left">
                  <ImageIcon size={16} color="#c084fc" />
                  <span>
                    {images.length > 0
                      ? `${images.length} foto(s) na galeria cadastrada(s)`
                      : 'Nenhuma foto vinculada ainda'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-quick-switch"
                  onClick={() => setActiveTab('fotos')}
                >
                  Gerenciar Fotos & Capa →
                </button>
              </div>
            </>
          )}

          {/* TAB 2: GALERIA DE FOTOS */}
          {activeTab === 'fotos' && (
            <div className="product-photo-gallery-manager">
              <div className="gallery-header-row">
                <div>
                  <h4 className="gallery-title">Galeria de Fotos do Perfume</h4>
                  <p className="gallery-desc">
                    Adicione fotos do produto para o catálogo, anúncios e stories. Selecione a foto de capa principal.
                  </p>
                </div>
                <span className="gallery-count-badge">
                  {images.length} {images.length === 1 ? 'Foto' : 'Fotos'}
                </span>
              </div>

              {/* Controles de Upload e URL */}
              <div className="photo-actions-box">
                {/* Upload Local */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  className="btn-upload-photos"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={isUploading}
                >
                  <Upload size={16} />
                  {isUploading ? 'Processando fotos...' : 'Carregar Fotos do Dispositivo'}
                </button>

                {/* Adicionar por URL */}
                <div className="photo-url-input-wrap">
                  <input
                    type="text"
                    placeholder="Ou cole a URL direta de uma foto..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="admin-form-input mini"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-add-url"
                    onClick={handleAddImageUrl}
                    title="Adicionar foto pela URL"
                  >
                    <Plus size={16} /> Adicionar Link
                  </button>
                </div>
              </div>

              {/* Grid de Miniaturas */}
              {images.length === 0 ? (
                <div className="photo-empty-state">
                  <div className="photo-empty-icon">
                    <ImageIcon size={36} color="#71717a" />
                  </div>
                  <strong>Nenhuma foto adicionada ao perfume</strong>
                  <p>
                    Clique no botão acima para carregar fotos do computador/celular ou cole o link de uma imagem da web.
                  </p>
                </div>
              ) : (
                <div className="photo-thumbnails-grid">
                  {images.map((img, idx) => {
                    const isCover = coverImage === img || (!coverImage && idx === 0);
                    const src = resolveImgSrc(img);

                    return (
                      <div
                        key={`${img.slice(0, 30)}_${idx}`}
                        className={`photo-thumb-card ${isCover ? 'is-cover' : ''}`}
                      >
                        <img
                          src={src}
                          alt={`Foto ${idx + 1}`}
                          className="photo-thumb-preview"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.3';
                          }}
                        />

                        {isCover && (
                          <div className="cover-badge-pill" title="Esta é a foto principal exibida no catálogo">
                            <Star size={11} fill="#facc15" color="#facc15" /> Capa
                          </div>
                        )}

                        <div className="photo-card-hover-actions">
                          {!isCover && (
                            <button
                              type="button"
                              className="btn-thumb-action star"
                              onClick={() => handleSetCover(img)}
                              title="Definir como foto de capa principal"
                            >
                              <Star size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-thumb-action delete"
                            onClick={() => handleRemoveImage(idx)}
                            title="Remover foto da galeria"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PIRÂMIDE OLFATIVA */}
          {activeTab === 'olfativa' && (
            <div className="product-olfactory-section">
              <div className="gallery-header-row" style={{ marginBottom: '14px' }}>
                <div>
                  <h4 className="gallery-title">Notas e Pirâmide Olfativa</h4>
                  <p className="gallery-desc">
                    Descreva a evolução olfativa da fragrância para encantar clientes e revendedores.
                  </p>
                </div>
                <div className="header-badge-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                  <Compass size={18} />
                </div>
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Família Olfativa</label>
                <input
                  type="text"
                  placeholder="Ex: Oriental Fougère Amadeirado, Floral Âmbar, Chipre Floral"
                  value={familia}
                  onChange={(e) => setFamilia(e.target.value)}
                  className="admin-form-input"
                />
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">🌿 Notas de Saída (Topo / Primeiras impressões)</label>
                <input
                  type="text"
                  placeholder="Ex: Maçã, Bergamota, Gengibre fresco, Pimenta Rosa"
                  value={saida}
                  onChange={(e) => setSaida(e.target.value)}
                  className="admin-form-input"
                />
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">🌸 Notas de Coração (Corpo / Identidade do perfume)</label>
                <input
                  type="text"
                  placeholder="Ex: Lavanda, Sálvia, Bagas de Zimbro, Gerânio nobre"
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                  className="admin-form-input"
                />
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">🪵 Notas de Fundo (Base / Fixação duradoura)</label>
                <input
                  type="text"
                  placeholder="Ex: Fava Tonka, Madeira de Âmbar, Cedro da Virgínia, Vetiver"
                  value={fundo}
                  onChange={(e) => setFundo(e.target.value)}
                  className="admin-form-input"
                />
              </div>
            </div>
          )}

          {/* TAB 4: DESCRIÇÃO & ARGUMENTOS DE VENDA */}
          {activeTab === 'descricao' && (
            <div className="product-description-section">
              <div className="gallery-header-row" style={{ marginBottom: '14px' }}>
                <div>
                  <h4 className="gallery-title">Descrição Comercial & Argumentos</h4>
                  <p className="gallery-desc">
                    Texto completo que aparecerá ao copiar anúncios no Copyboard e detalhes do produto.
                  </p>
                </div>
                <div className="header-badge-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <FileText size={18} />
                </div>
              </div>

              <div className="form-group-clean">
                <label className="field-label-clean">Descrição Completa</label>
                <textarea
                  rows={8}
                  placeholder="Escreva sobre a fragrância, fixação, ocasiões recomendadas e diferenciais de atacado..."
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  className="admin-form-textarea"
                />
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="modal-clean-footer">
            <button type="button" className="btn-platform-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-platform-primary">
              <Save size={16} /> {isEditing ? 'Salvar Alterações do Perfume' : 'Concluir Cadastro do Perfume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
