import AdminPageHeader from "./AdminPageHeader";
import { InfoBlock, Panel } from "../../pages/admin/adminShared";

const DetailGrid = ({ title, description, values }) => (
  <main>
    <AdminPageHeader title={title} description={description} />
    <Panel className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Object.entries(values).map(([label, value]) => (
        <InfoBlock key={label} label={label} value={value} />
      ))}
    </Panel>
  </main>
);

export default DetailGrid;
