import React from 'react';
import { FileText, Download, CheckCircle, ExternalLink, Monitor, Smartphone } from 'lucide-react';

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
    <div className="pdf-viewer-page">
      <div className="pdf-hero-card">
        <div className="pdf-hero-info">
          <span className="live-dot-green"></span>
          <span className="pdf-tag">CATÁLOGO OFICIAL WIDESCREEN 16:9</span>
          <h2>Catálogo Snack Store BH <span>2026</span></h2>
          <p>
            Documento completo em alta definição com todas as 51 fragrâncias cadastradas. Enquadramento responsivo em formato 16:9 widescreen para telas, apresentações corporativas e tablets.
          </p>

          <div className="pdf-features-list">
            <div className="pdf-feature-item">
              <CheckCircle size={16} color="#10b981" />
              <span><strong>51 Páginas:</strong> 1 página para cada fragrância com sua foto real tratada</span>
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
              <span><strong>Otimização de Peso:</strong> Redução de 746 MB para 97 MB (carregamento rápido)</span>
            </div>
          </div>

          <div className="pdf-cta-buttons">
            <button className="btn-primary-download" onClick={handleDownloadPdf}>
              <Download size={18} />
              <span>Baixar Catálogo PDF Completo (97 MB)</span>
            </button>

            <a
              href="/template_pdf/catalogo_completo.html"
              target="_blank"
              rel="noreferrer"
              className="btn-outline-open"
            >
              <ExternalLink size={17} />
              <span>Visualizar Catálogo Web Interativo</span>
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
