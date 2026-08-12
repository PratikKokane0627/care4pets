import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IndianRupee, RefreshCw } from "lucide-react";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerErrorState from "../../../components/groomer/GroomerErrorState";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatCard from "../../../components/groomer/GroomerStatCard";
import GroomerStatusBadge from "../../../components/groomer/GroomerStatusBadge";
import { getGroomerBookings } from "../../../services/groomerApi";
import {
  formatDate,
  money,
  personName,
  petName,
  serviceName,
} from "../../../utils/groomingUtils";

const isCompleted = (booking) =>
  String(booking.status || "").toLowerCase() === "completed";

const isInCurrentMonth = (booking, now) => {
  const date = new Date(booking.completedAt || booking.bookingDate);

  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const GroomerEarnings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      const response = await getGroomerBookings({
        status: "completed",
        limit: 50,
        sort: "newest",
      });

      setBookings(response.data.bookings || []);

      if (silent) toast.success("Earnings refreshed");
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not load groomer earnings";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completedBookings = useMemo(
    () => bookings.filter(isCompleted),
    [bookings]
  );

  const totals = useMemo(() => {
    const now = new Date();
    const currentMonthBookings = completedBookings.filter((booking) =>
      isInCurrentMonth(booking, now)
    );

    return {
      total: completedBookings.reduce(
        (sum, booking) => sum + Number(booking.price || 0),
        0
      ),
      month: currentMonthBookings.reduce(
        (sum, booking) => sum + Number(booking.price || 0),
        0
      ),
      currentMonthCount: currentMonthBookings.length,
    };
  }, [completedBookings]);

  if (loading) return <GroomerLoader text="Loading earnings..." />;

  if (error) {
    return (
      <GroomerErrorState
        title="Earnings unavailable"
        message={error}
        onRetry={() => load()}
      />
    );
  }

  return (
    <main>
      <GroomerPageHeader
        title="Earnings"
        description="Earnings are calculated from completed grooming bookings assigned to you."
        actions={
          <button
            type="button"
            disabled={refreshing}
            onClick={() => load({ silent: true })}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 hover:border-cyan-400/40 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <section className="mb-6 grid gap-5 md:grid-cols-3">
        <GroomerStatCard
          title="Total Earnings"
          value={money(totals.total)}
          subtitle="Completed services"
          icon={IndianRupee}
          color="emerald"
        />
        <GroomerStatCard
          title="Current Month"
          value={money(totals.month)}
          subtitle={`${totals.currentMonthCount} completed this month`}
          icon={IndianRupee}
          color="cyan"
        />
        <GroomerStatCard
          title="Completed Services"
          value={completedBookings.length}
          subtitle="Assigned and finished"
          icon={IndianRupee}
          color="indigo"
        />
      </section>

      <GroomerDataTable
        data={completedBookings}
        emptyTitle="No completed bookings"
        emptyDescription="Completed grooming bookings will appear here."
        columns={[
          { header: "Service", render: (booking) => serviceName(booking.serviceId) },
          { header: "Owner", render: (booking) => personName(booking.ownerId) },
          { header: "Pet", render: (booking) => petName(booking.petId) },
          {
            header: "Date",
            render: (booking) =>
              formatDate(booking.completedAt || booking.bookingDate),
          },
          {
            header: "Payment",
            render: (booking) => (
              <GroomerStatusBadge status={booking.paymentStatus || "pending"} />
            ),
          },
          { header: "Amount", render: (booking) => money(booking.price) },
        ]}
      />
    </main>
  );
};

export default GroomerEarnings;
