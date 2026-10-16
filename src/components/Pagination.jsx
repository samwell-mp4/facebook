import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 15,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50]
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis if many pages
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="platform-pagination-bar">
      {/* Items Range Info */}
      <div className="pagination-info">
        <span>
          Mostrando <strong>{startIdx}</strong> a <strong>{endIdx}</strong> de <strong>{totalItems}</strong> itens
        </span>

        {onPageSizeChange && (
          <div className="pagination-page-size-select">
            <label htmlFor="pageSizeSelect">Exibir:</label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="page-size-dropdown"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} por pág.
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-btn first"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            title="Primeira página"
          >
            <ChevronsLeft size={15} />
          </button>

          <button
            type="button"
            className="pagination-btn prev"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            title="Página anterior"
          >
            <ChevronLeft size={15} />
            <span className="btn-label-text">Anterior</span>
          </button>

          <div className="pagination-pages-list">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} className="pagination-ellipsis">
                    …
                  </span>
                );
              }
              const isActive = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  className={`pagination-page-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="pagination-btn next"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            title="Próxima página"
          >
            <span className="btn-label-text">Próxima</span>
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            className="pagination-btn last"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            title="Última página"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
