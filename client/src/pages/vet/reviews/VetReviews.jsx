import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import VetDataTable from "../../../components/vet/VetDataTable";
import VetErrorState from "../../../components/vet/VetErrorState";
import VetLoader from "../../../components/vet/VetLoader";
import VetPageHeader from "../../../components/vet/VetPageHeader";
import VetStatCard from "../../../components/vet/VetStatCard";
import { Star } from "lucide-react";
import { getVetReviews, getVetReviewSummary } from "../../../services/vetApi";
import { formatDate } from "../../../utils/dateUtils";

const VetReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0, distribution: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [reviewsRes, summaryRes] = await Promise.all([getVetReviews(), getVetReviewSummary()]);
      setReviews(reviewsRes.data.reviews || []);
      setSummary(summaryRes.data.summary || { averageRating: 0, totalReviews: 0, distribution: [] });
    } catch (err) {
      const message = err.response?.data?.message || "Could not load reviews";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <VetLoader text="Loading reviews..." />;
  if (error) return <VetErrorState message={error} onRetry={load} />;

  return (
    <main>
      <VetPageHeader title="Reviews" description="Read-only view of veterinarian reviews. Product reviews remain separate." />
      <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <VetStatCard title="Average Rating" value={Number(summary.averageRating || 0).toFixed(1)} subtitle="Out of 5" icon={Star} color="amber" />
        <VetStatCard title="Total Reviews" value={summary.totalReviews || 0} subtitle="Veterinarian reviews" icon={Star} color="cyan" />
      </section>
      <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <h2 className="text-lg font-bold text-white">Rating Distribution</h2>
        <div className="mt-5 space-y-3">
          {(summary.distribution || []).map((row) => (
            <div key={row.rating} className="grid grid-cols-[60px_1fr_40px] items-center gap-3 text-sm">
              <span className="text-slate-400">{row.rating} stars</span>
              <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-amber-400" style={{ width: `${summary.totalReviews ? (row.count / summary.totalReviews) * 100 : 0}%` }} /></div>
              <span className="text-right text-white">{row.count}</span>
            </div>
          ))}
        </div>
      </section>
      <VetDataTable
        data={reviews}
        emptyTitle="No veterinarian reviews yet"
        emptyDescription="Reviews UI is ready; owner-side vet review creation can be connected later."
        columns={[
          { header: "Reviewer", render: (row) => row.userId?.name || "Pet owner" },
          { header: "Rating", render: (row) => `${row.rating}/5` },
          { header: "Comment", render: (row) => row.comment },
          { header: "Date", render: (row) => formatDate(row.createdAt) },
        ]}
      />
    </main>
  );
};

export default VetReviews;
