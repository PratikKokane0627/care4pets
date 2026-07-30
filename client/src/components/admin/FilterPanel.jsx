import { Panel } from "../../pages/admin/adminShared";

const FilterPanel = ({ children }) => (
  <Panel className="mb-5">
    <div className="grid gap-3 md:grid-cols-4">{children}</div>
  </Panel>
);

export default FilterPanel;
