const ErrorState = ({ message, onRetry }) =>
  message ? (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300/30 px-3 py-1.5 font-semibold text-red-200 hover:bg-red-500/10"
        >
          Retry
        </button>
      )}
    </div>
  ) : null;

export default ErrorState;
