const SearchBar = ({ value, onChange, placeholder = "Search" }) => (
  <input
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/25 focus:border-cyan-400"
  />
);

export default SearchBar;
