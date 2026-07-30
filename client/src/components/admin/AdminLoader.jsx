const AdminLoader = ({ text = "Loading dashboard..." }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-cyan-400" />

      <p className="mt-4 text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
};

export default AdminLoader;