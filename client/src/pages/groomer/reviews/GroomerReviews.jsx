import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatCard from "../../../components/groomer/GroomerStatCard";
import { getGroomerReviews } from "../../../services/groomerApi";
import { formatDate } from "../../../utils/groomingUtils";

const GroomerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getGroomerReviews();
      setReviews(response.data.reviews || []);
      setSummary(response.data.summary || { averageRating: 0, totalReviews: 0, distribution: [] });
    } catch (err) {
      const message = err.response?.data?.message || "Could not load groomer reviews";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <GroomerLoader text="Loading reviews..." />;
  if (error) return <GroomerErrorState title="Reviews unavailable" message={error} onRetry={load} />;

  return (
    <main>
      <GroomerPageHeader
        title="Reviews"
        description="Read-only view of owner reviews from completed grooming bookings."
      />

      <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <GroomerStatCard
          title="Average Rating"
          value={Number(summary.averageRating || 0).toFixed(1)}
          subtitle="Out of 5"
          icon={Star}
          color="amber"
        />
        <GroomerStatCard
          title="Total Reviews"
          value={summary.totalReviews || 0}
          subtitle="Grooming reviews"
          icon={Star}
          color="cyan"
        />
      </section>

      <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <h2 className="text-lg font-bold text-white">Rating Distribution</h2>
        <div className="mt-5 space-y-3">
          {(summary.distribution || []).map((row) => (
            <div key={row.rating} className="grid grid-cols-[64px_1fr_42px] items-center gap-3 text-sm">
              <span className="text-slate-400">{row.rating} stars</span>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${summary.totalReviews ? (row.count / summary.totalReviews) * 100 : 0}%` }}
                />
              </div>
              <span className="text-right text-white">{row.count}</span>
            </div>
          ))}
        </div>
      </section>

      <GroomerDataTable
        data={reviews}
        emptyTitle="No groomer reviews yet"
        emptyDescription="Owner reviews will appear here after completed grooming bookings."
        columns={[
          { header: "Reviewer", render: (row) => row.userId?.name || "Pet owner" },
          { header: "Rating", render: (row) => `${row.rating}/5` },
          { header: "Comment", render: (row) => row.comment },
          { header: "Booking", render: (row) => formatDate(row.groomingBookingId?.bookingDate) },
          { header: "Date", render: (row) => formatDate(row.createdAt) },
        ]}
      />
    </main>
  );
};

export default GroomerReviews;
