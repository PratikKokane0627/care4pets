const GroomerConfirmModal = ({ open, title = "Confirm action", message, confirmText = "Confirm", danger = false, loading = false, children, onConfirm, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-60">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${danger ? "bg-red-500 text-white" : "bg-cyan-400 text-slate-950"}`}>{loading ? "Please wait..." : confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default GroomerConfirmModal;
