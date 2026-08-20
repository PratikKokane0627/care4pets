import { Panel } from "../../pages/admin/adminShared";

const FilterPanel = ({ children, className = "grid gap-3 md:grid-cols-4" }) => (
  <Panel className="mb-5">
    <div className={className}>{children}</div>
  </Panel>
);

export default FilterPanel;
