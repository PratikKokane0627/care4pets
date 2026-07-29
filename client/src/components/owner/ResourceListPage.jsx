import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import useFetch from "../../hooks/useFetch";
import api from "../../services/api";
import {
  ErrorState,
  Panel,
  SearchBox,
  getId,
  itemImage,
  toArray,
} from "../../pages/owner/ownerShared";
import EmptyState from "./EmptyState";
import Loader from "./Loader";
import PageHeader from "./PageHeader";
import StatusBadge from "./StatusBadge";

const ResourceListPage = ({
  title,
  description,
  endpoint,
  dataKeys,
  searchPlaceholder,
  getTitle,
  getSubtitle,
  getMeta = () => [],
  getStatus,
  getImage,
  imageFallback,
  emptyTitle,
  emptyMessage,
  action,
  renderActions,
  renderFooter,
  renderBeforeList,
  detailPath,
}) => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((value) => value + 1);

  const { loading, error } = useFetch(async () => {
    const response = await api.get(endpoint);
    setItems(toArray(response.data, dataKeys));
  }, `${endpoint}-${refreshKey}`);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) =>
      [getTitle(item), getSubtitle(item), ...getMeta(item)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [getMeta, getSubtitle, getTitle, items, query]);

  return (
    <main>
      <PageHeader
        title={title}
        description={description}
        actions={action}
      />
      <ErrorState message={error} />

      <Panel>
        {renderBeforeList && <div className="mb-5">{renderBeforeList({ items, refresh })}</div>}
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder || `Search ${title.toLowerCase()}`}
        />

        {loading ? (
          <div className="mt-5">
            <Loader />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-5">
            <EmptyState title={emptyTitle} message={emptyMessage} />
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item, index) => {
              const id = getId(item);
              const image = getImage?.(item) || itemImage(item) || imageFallback;
              const meta = getMeta(item);
              const status = getStatus?.(item);

              return (
                <article
                  key={id || index}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-2xl hover:shadow-cyan-950/20"
                >
                  {image && (
                    <div className="aspect-[16/9] overflow-hidden bg-slate-900">
                      <img
                        src={image}
                        alt={getTitle(item)}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {getTitle(item)}
                        </h3>
                        <p className="mt-1 text-sm text-cyan-200">
                          {getSubtitle(item)}
                        </p>
                      </div>
                      {status && <StatusBadge status={status} />}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-400">
                      {meta.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {id && detailPath !== null && (
                        <Link
                          to={detailPath ? detailPath(item) : `${id}`}
                          className="inline-flex rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/5 hover:text-white"
                        >
                          View Details
                        </Link>
                      )}
                      {renderActions?.(item, { refresh })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {renderFooter && <div className="mt-5">{renderFooter({ items, refresh })}</div>}
      </Panel>
    </main>
  );
};

export default ResourceListPage;
