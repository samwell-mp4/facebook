import React from 'react';
import { FileText, Download, CheckCircle, ExternalLink, Monitor, Smartphone, FileSpreadsheet } from 'lucide-react';

export default function PdfCatalogViewer({ onToast }) {
  const handleDownloadPdf = () => {
    const link = document.createElement('a');
    link.href = '/Catalogo_Snack_Store_BH_2026.pdf';
    link.download = 'Catalogo_Snack_Store_BH_2026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onToast) onToast('Iniciando download do Catálogo PDF Oficial! 📄');
  };

  return (
    <div className="admin-tab-pane">
      <div className="pane-header-row">
        <div>
          <h2>Catálogos Digitais em PDF</h2>
          <p>
            Documento em alta definição widescreen 16:9 com todas as 51 fragrâncias cadastradas, pirâmides olfativas e fotografias reais.
          </p>
        </div>
        <div className="pane-header-actions">
          <button className="btn-platform-primary" onClick={handleDownloadPdf}>
            <Download size={15} /> Baixar PDF Oficial (97 MB)
          </button>
          <a
            href="/template_pdf/catalogo_completo.html"
            target="_blank"
            rel="noreferrer"
            className="btn-platform-secondary"
          >
            <ExternalLink size={15} /> Visualizador Web 16:9
          </a>
        </div>
      </div>

      <div className="pdf-hero-card" style={{ marginTop: '0.5rem' }}>
        <div className="pdf-hero-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="live-dot-green"></span>
            <span className="pdf-tag">CATÁLOGO OFICIAL WIDESCREEN 16:9</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            Catálogo Snack Store BH <span style={{ color: '#10b981' }}>2026</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            Enquadramento responsivo em formato 16:9 widescreen para telas, apresentações corporativas, smartphones e tablets, pronto para envio direto a clientes e lojistas.
          </p>

          <div className="pdf-features-list">
            <div className="pdf-feature-item">
              <CheckCircle size={16} color="#10b981" />
              <span><strong>51 Páginas:</strong> 1 página exclusiva para cada fragrância com sua foto real tratada</span>
            </div>
            <div className="pdf-feature-item">
              <CheckCircle size={16} color="#10b981" />
              <span><strong>Enquadramento Perfeito:</strong> Proporção 16:9 nativa sem scroll horizontal</span>
            </div>
            <div className="pdf-feature-item">
              <CheckCircle size={16} color="#10b981" />
              <span><strong>Pirâmide Olfativa:</strong> Acordes com barras proporcionais e notas ilustradas</span>
            </div>
            <div className="pdf-feature-item">
              <CheckCircle size={16} color="#10b981" />
              <span><strong>Otimização de Peso:</strong> Carregamento ágil para WhatsApp e download rápido</span>
            </div>
          </div>

          <div className="pdf-cta-buttons" style={{ marginTop: '24px' }}>
            <button className="btn-platform-primary" style={{ padding: '12px 20px', fontSize: '14px' }} onClick={handleDownloadPdf}>
              <Download size={18} />
              <span>Baixar Catálogo PDF Completo (97 MB)</span>
            </button>

            <a
              href="/template_pdf/catalogo_completo.html"
              target="_blank"
              rel="noreferrer"
              className="btn-platform-secondary"
              style={{ padding: '12px 18px', fontSize: '14px' }}
            >
              <ExternalLink size={17} />
              <span>Abrir Apresentação Web</span>
            </a>
          </div>
        </div>

        <div className="pdf-preview-box">
          <img
            src="/template_pdf/preview_test_page.png"
            alt="Prévia do Catálogo PDF"
            className="pdf-preview-img"
          />
          <div className="pdf-preview-caption">
            Prévia da Página Widescreen (16:9)
          </div>
        </div>
      </div>
    </div>
  );
}
