import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const DashboardSearch = ({
  actions,
  placeholder = "Search dashboard...",
  noMatchToast = "No matching dashboard page found",
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return actions
      .filter((item) =>
        [item.label, item.hint, ...(item.keywords || [])]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
      .sort((first, second) => {
        const firstLabel = first.label.toLowerCase();
        const secondLabel = second.label.toLowerCase();
        if (firstLabel === normalizedQuery) return -1;
        if (secondLabel === normalizedQuery) return 1;
        if (firstLabel.startsWith(normalizedQuery) && !secondLabel.startsWith(normalizedQuery)) return -1;
        if (secondLabel.startsWith(normalizedQuery) && !firstLabel.startsWith(normalizedQuery)) return 1;
        return 0;
      })
      .slice(0, 6);
  }, [actions, query]);

  const openResult = (path) => {
    navigate(path);
    setQuery("");
  };

  const submitSearch = (event) => {
    event.preventDefault();

    if (matches.length) {
      openResult(matches[0].path);
      return;
    }

    toast.error(noMatchToast);
  };

  return (
    <form onSubmit={submitSearch} className="relative hidden max-w-xl flex-1 md:block">
      <div className="flex items-center rounded-xl border border-white/10 bg-slate-900 px-4 transition focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-300/10">
        <Search size={18} className="text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        )}
      </div>
    </form>
  );
};

export default DashboardSearch;
