import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatCard from "../../../components/groomer/GroomerStatCard";
import { getGroomerReviews, getGroomerReviewsById } from "../../../services/groomerApi";
import { formatDate, petName, serviceName } from "../../../utils/groomingUtils";

const emptyDistribution = () =>
  [5, 4, 3, 2, 1].map((rating) => ({ rating, count: 0 }));

const normalizeDistribution = (payload = {}) => {
  if (Array.isArray(payload.summary?.distribution)) {
    return payload.summary.distribution;
  }

  const breakdown = payload.ratingBreakdown || {};

  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: breakdown[rating] || breakdown[String(rating)] || 0,
  }));
};

const normalizeReviewPayload = (payload = {}) => {
  const reviews = payload.reviews || [];
  const summary = payload.summary || payload.groomer || {};

  return {
    reviews,
    summary: {
      averageRating: summary.averageRating || 0,
      totalReviews: summary.totalReviews ?? reviews.length,
      distribution: normalizeDistribution(payload),
    },
  };
};

const storedGroomerId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.id || user._id || "";
  } catch {
    return "";
  }
};

const GroomerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: emptyDistribution(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let response = await getGroomerReviews();
      let normalized = normalizeReviewPayload(response.data);

      if (!normalized.reviews.length) {
        const groomerId = storedGroomerId();

        if (groomerId) {
          try {
            response = await getGroomerReviewsById(groomerId);
            normalized = normalizeReviewPayload(response.data);
          } catch {
            // Keep the authenticated groomer endpoint result if public lookup fails.
          }
        }
      }

      setReviews(normalized.reviews);
      setSummary(normalized.summary);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load groomer reviews";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ratingAverages = useMemo(() => {
    if (!reviews.length) return { service: 0, groomer: 0 };

    return {
      service:
        reviews.reduce(
          (sum, review) => sum + Number(review.serviceRating || review.rating || 0),
          0
        ) / reviews.length,
      groomer:
        reviews.reduce(
          (sum, review) => sum + Number(review.groomerRating || review.rating || 0),
          0
        ) / reviews.length,
    };
  }, [reviews]);

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
        <GroomerStatCard
          title="Service Rating"
          value={ratingAverages.service.toFixed(1)}
          subtitle="Average service score"
          icon={Star}
          color="emerald"
        />
        <GroomerStatCard
          title="Groomer Rating"
          value={ratingAverages.groomer.toFixed(1)}
          subtitle="Average groomer score"
          icon={Star}
          color="indigo"
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
          { header: "Pet", render: (row) => petName(row.groomingBookingId?.petId) },
          { header: "Service", render: (row) => serviceName(row.groomingBookingId?.serviceId) },
          { header: "Service Rating", render: (row) => `${row.serviceRating || row.rating}/5` },
          { header: "Groomer Rating", render: (row) => `${row.groomerRating || row.rating}/5` },
          { header: "Comment", render: (row) => row.comment },
          { header: "Date", render: (row) => formatDate(row.createdAt) },
        ]}
      />
    </main>
  );
};

export default GroomerReviews;
