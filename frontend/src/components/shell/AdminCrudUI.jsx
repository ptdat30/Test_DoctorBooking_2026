export const CrudPagination = ({
  currentPage,
  totalPages,
  totalItems,
  indexOfFirstItem,
  indexOfLastItem,
  onPageChange,
  itemLabel = 'mục',
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  const btn = (label, page, disabled = false, active = false) => (
    <button
      key={label}
      type="button"
      onClick={() => !disabled && onPageChange(page)}
      disabled={disabled}
      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      {label}
    </button>
  );

  pages.push(btn('‹', currentPage - 1, currentPage === 1));
  if (start > 1) {
    pages.push(btn('1', 1));
    if (start > 2) pages.push(<span key="d1" className="px-1 text-neutral-400">…</span>);
  }
  for (let i = start; i <= end; i++) pages.push(btn(String(i), i, false, currentPage === i));
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push(<span key="d2" className="px-1 text-neutral-400">…</span>);
    pages.push(btn(String(totalPages), totalPages));
  }
  pages.push(btn('›', currentPage + 1, currentPage === totalPages));

  return (
    <div className="app-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-neutral-500">
        Hiển thị {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, totalItems)} / {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">{pages}</div>
    </div>
  );
};

export const tableHeadClass = 'px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500';
export const tableCellClass = 'px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-700';
