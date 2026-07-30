import { money, Panel } from "../../pages/admin/adminShared";

const ReportPanel = ({ title, rows = [], amountKey, labelKey = "_id" }) => (
  <Panel>
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {!rows?.length ? (
      <p className="mt-4 text-sm text-slate-500">No data available.</p>
    ) : (
      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${row[labelKey]}-${index}`}
            className="flex justify-between rounded-xl border border-white/10 bg-slate-950 p-4 text-sm"
          >
            <span className="text-slate-300">{row[labelKey] || "Unknown"}</span>
            <span className="font-semibold text-white">
              {row.count || row.unitsSold || 0}
              {amountKey ? ` - ${money(row[amountKey])}` : ""}
            </span>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

export default ReportPanel;
