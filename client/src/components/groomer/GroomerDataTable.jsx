import GroomerEmptyState from "./GroomerEmptyState";

const GroomerDataTable = ({ columns = [], data = [], emptyTitle, emptyDescription }) => {
  if (!data.length) return <GroomerEmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
            <tr>{columns.map((column) => <th key={column.key || column.header} className="px-5 py-4">{column.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, index) => (
              <tr key={row._id || row.id || index} className="transition hover:bg-white/[0.03]">
                {columns.map((column) => <td key={column.key || column.header} className="px-5 py-4 align-top text-sm text-slate-300">{column.render ? column.render(row, index) : row[column.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroomerDataTable;
