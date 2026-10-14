import React, { useState, useMemo } from 'react';
import { CATALOG_DATA } from './data/catalogData';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import Toast from './components/Toast';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Copy to clipboard with Toast
  const handleCopy = (text, label = 'Copiado para a área de transferência! ✅') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage(label);
      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setToastMessage(label);
      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    });
  };

  // Filter & Search
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return CATALOG_DATA.filter((item) => {
      // 1. Category Filter
      if (activeFilter === 'arab' && !item.isArabic) return false;
      if (activeFilter === 'brand' && item.isArabic) return false;
      if (activeFilter === 'fem' && item.genderWord !== 'Feminino') return false;
      if (activeFilter === 'masc' && item.genderWord !== 'Masculino') return false;
      if (activeFilter === 'uni' && item.genderWord !== 'Unissex') return false;

      // 2. Search Query
      if (!q) return true;

      const searchable = [
        item.name,
        item.cleanName,
        item.sku,
        item.cod,
        item.ref,
        item.familia,
        item.saida,
        item.corpo,
        item.fundo,
        item.genderWord,
        item.titleShort,
        item.titleLong,
        item.tagsString
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(q);
    });
  }, [searchQuery, activeFilter]);

  // Statistics
  const arabicCount = useMemo(() => CATALOG_DATA.filter((p) => p.isArabic).length, []);
  const brandCount = useMemo(() => CATALOG_DATA.filter((p) => !p.isArabic).length, []);
  const totalPhotos = useMemo(
    () => CATALOG_DATA.reduce((acc, p) => acc + (p.imageCount || p.images?.length || 0), 0),
    []
  );

  return (
    <>
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        totalProducts={CATALOG_DATA.length}
        filteredCount={filteredProducts.length}
        arabicCount={arabicCount}
        brandCount={brandCount}
        totalPhotos={totalPhotos}
      />

      <main>
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((item) => (
              <ProductCard
                key={item.sku}
                item={item}
                onCopy={handleCopy}
                onOpenModal={setActiveModalProduct}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>
              Nenhum produto encontrado
            </h3>
            <p style={{ fontSize: '14px' }}>
              Tente buscar por outro termo ou remova o filtro ativo.
            </p>
          </div>
        )}
      </main>

      {activeModalProduct && (
        <ProductModal
          item={activeModalProduct}
          onClose={() => setActiveModalProduct(null)}
          onCopy={handleCopy}
        />
      )}

      <Toast message={toastMessage} />
    </>
  );
}
