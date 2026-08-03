import { useEffect, useState } from "react";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerSearchBar from "../../../components/groomer/GroomerSearchBar";
import GroomerStatusBadge from "../../../components/groomer/GroomerStatusBadge";
import { getGroomingServices } from "../../../services/groomerApi";
import { money } from "../../../utils/groomingUtils";

const GroomerServices = () => {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getGroomingServices({ limit: 50, ...(search && { search }) })
      .then((res) => setServices(res.data.services || []))
      .finally(() => setLoading(false));
  }, [search]);
  if (loading) return <GroomerLoader text="Loading services..." />;
  return <main><GroomerPageHeader title="Services" description="Read-only list of admin-managed grooming services." /><div className="mb-5 rounded-2xl border border-white/10 bg-slate-900 p-5"><GroomerSearchBar value={search} onChange={setSearch} placeholder="Search services" /></div><GroomerDataTable data={services} emptyTitle="No services found" columns={[{ header: "Service", render: (s) => <><p className="font-semibold text-white">{s.serviceName}</p><p className="text-xs text-slate-500">{s.description}</p></> }, { header: "Category", render: (s) => s.category }, { header: "Duration", render: (s) => `${s.duration} min` }, { header: "Price", render: (s) => money(s.price) }, { header: "Status", render: (s) => <GroomerStatusBadge status={s.isActive ? "active" : "inactive"} /> }]} /></main>;
};

export default GroomerServices;
