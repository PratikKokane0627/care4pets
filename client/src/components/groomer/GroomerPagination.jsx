const GroomerPagination = ({ pagination = {}, onPageChange }) => {
  const current = pagination.currentPage || 1;
  const total = pagination.totalPages || 1;
  if (total <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
      <p className="text-sm text-slate-400">Page {current} of {total}</p>
      <div className="flex gap-2">
        <button type="button" disabled={current <= 1} onClick={() => onPageChange(current - 1)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-40">Previous</button>
        <button type="button" disabled={current >= total} onClick={() => onPageChange(current + 1)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};

export default GroomerPagination;
