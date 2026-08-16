const VetConfirmModal = ({ open, title = "Confirm action", message, confirmText = "Confirm", cancelText = "Cancel", danger = false, loading = false, size = "md", children, onConfirm, onClose }) => {
  if (!open) return null;
  const widthClass = size === "lg" ? "max-w-3xl" : "max-w-md";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-900 shadow-2xl shadow-black/50 ${widthClass}`}>
        <div className="border-b border-white/10 px-6 py-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {message && <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>}
        </div>
        {children && <div className="max-h-[58vh] overflow-y-auto px-6 py-5 theme-scrollbar">{children}</div>}
        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-60">{cancelText}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${danger ? "bg-red-500 text-white hover:bg-red-400" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"}`}>{loading ? "Please wait..." : confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default VetConfirmModal;
