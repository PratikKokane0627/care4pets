import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../../services/api";
import AdminLoader from "./AdminLoader";
import AdminPageHeader from "./AdminPageHeader";
import DataTable from "./DataTable";
import Pagination from "./Pagination";
import ErrorState from "./ErrorState";
import { toArray } from "../../pages/admin/adminShared";

const pageSize = 10;

const ResourceShell = ({
  title,
  description,
  action,
  endpoint,
  keys,
  columns,
  filters,
  emptyTitle,
  emptyDescription,
}) => {
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const keySignature = keys.join("|");
  const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&limit=${pageSize}&_=${refreshKey}`;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(url);
        if (!mounted) return;
        setItems(toArray(res.data, keySignature.split("|")));
        setPagination(
          res.data.pagination || {
            currentPage: res.data.currentPage || page,
            totalPages: res.data.totalPages || 1,
            total: res.data.total || res.data.totalServices || res.data.totalProducts,
          }
        );
      } catch (err) {
        const message = err.response?.data?.message || "Could not load records";
        setError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [keySignature, page, url]);

  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <main>
      <AdminPageHeader title={title} description={description} action={action} />
      <ErrorState message={error} onRetry={refresh} />
      {filters?.({ refresh, page, setPage })}
      {loading ? (
        <AdminLoader text={`Loading ${title.toLowerCase()}...`} />
      ) : (
        <>
          <DataTable
            columns={columns({ refresh })}
            data={items}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </main>
  );
};

export default ResourceShell;
