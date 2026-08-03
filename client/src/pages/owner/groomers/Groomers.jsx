import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, ErrorState, Panel, SearchBox, getId, toArray } from "../ownerShared";

const availableSlots = (availability = []) =>
  availability.filter((slot) => slot.isAvailable && slot.startTime && slot.endTime);

const Groomers = () => {
  const [groomers, setGroomers] = useState([]);
  const [search, setSearch] = useState("");

  const { loading, error } = useFetch(async () => {
    const response = await api.get("/groomers/available");
    setGroomers(toArray(response.data, ["groomers"]));
  }, "owner-groomers");

  const visibleGroomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groomers;

    return groomers.filter((groomer) => {
      const user = groomer.userId || {};
      return [
        user.name,
        user.phone,
        groomer.bio,
        ...(groomer.skills || []),
        ...(groomer.serviceAreas || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [groomers, search]);

  if (loading) return <Loader label="Loading groomers" />;

  return (
    <main>
      <PageHeader
        title="Groomer"
        description="View active groomers and book grooming services."
        actions={<Button as={Link} to="/owner/grooming/book">Book Grooming</Button>}
      />
      <ErrorState message={error} />
      <Panel>
        <SearchBox value={search} onChange={setSearch} placeholder="Search groomers" />
        {visibleGroomers.length === 0 ? (
          <EmptyState title="No groomers found" description="Active groomers will appear here." />
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleGroomers.map((groomer) => {
              const user = groomer.userId || {};
              return (
                <article
                  key={getId(groomer)}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-2xl hover:shadow-cyan-950/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-cyan-400/10 text-cyan-300">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name || "Groomer"} className="h-full w-full object-cover" />
                      ) : (
                        <Scissors size={28} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-white">{user.name || "Groomer"}</h2>
                      <p className="text-sm text-slate-400">{groomer.experience || 0} years experience</p>
                    </div>
                  </div>
                  {groomer.bio && <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">{groomer.bio}</p>}
                  {!!groomer.skills?.length && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {groomer.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  {!!groomer.serviceAreas?.length && (
                    <p className="mt-4 text-sm text-slate-500">Areas: {groomer.serviceAreas.join(", ")}</p>
                  )}
                  <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Availability</p>
                    {availableSlots(groomer.availability).length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {availableSlots(groomer.availability).slice(0, 4).map((slot) => (
                          <span key={slot.day} className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {slot.day.slice(0, 3)} {slot.startTime}-{slot.endTime}
                          </span>
                        ))}
                        {availableSlots(groomer.availability).length > 4 && (
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                            +{availableSlots(groomer.availability).length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">No availability added.</p>
                    )}
                  </div>
                  <Button as={Link} to={`/owner/grooming/book?groomerId=${getId(user)}`} className="mt-5 w-full">
                    Book with groomer
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </main>
  );
};

export default Groomers;
