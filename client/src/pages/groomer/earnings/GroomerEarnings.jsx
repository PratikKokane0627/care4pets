import { useEffect, useMemo, useState } from "react";

import GroomerDataTable from "../../../components/groomer/GroomerDataTable";
import GroomerLoader from "../../../components/groomer/GroomerLoader";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";
import GroomerStatCard from "../../../components/groomer/GroomerStatCard";
import { getGroomerBookings } from "../../../services/groomerApi";
import { formatDate, money, personName, petName, serviceName } from "../../../utils/groomingUtils";
import { IndianRupee } from "lucide-react";

const GroomerEarnings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getGroomerBookings({ status: "completed", limit: 50 }).then((res) => setBookings(res.data.bookings || [])).finally(() => setLoading(false)); }, []);
  const paidCompleted = bookings.filter((booking) => booking.status === "completed" && ["paid", "Paid"].includes(booking.paymentStatus));
  const now = new Date();
  const currentMonth = paidCompleted.filter((booking) => {
    const date = new Date(booking.completedAt || booking.bookingDate);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
  const totals = useMemo(() => ({
    total: paidCompleted.reduce((sum, booking) => sum + Number(booking.price || 0), 0),
    month: currentMonth.reduce((sum, booking) => sum + Number(booking.price || 0), 0),
  }), [currentMonth, paidCompleted]);
  if (loading) return <GroomerLoader text="Loading earnings..." />;
  return <main><GroomerPageHeader title="Earnings" description="Earnings are calculated only from completed paid grooming bookings returned by the backend." /><section className="mb-6 grid gap-5 md:grid-cols-3"><GroomerStatCard title="Total Earnings" value={money(totals.total)} subtitle="Completed paid services" icon={IndianRupee} color="emerald" /><GroomerStatCard title="Current Month" value={money(totals.month)} subtitle="Completed paid this month" icon={IndianRupee} color="cyan" /><GroomerStatCard title="Paid Services" value={paidCompleted.length} subtitle="Paid and completed" icon={IndianRupee} color="indigo" /></section><GroomerDataTable data={paidCompleted} emptyTitle="No paid completed bookings" emptyDescription="Paid completed grooming bookings will appear here." columns={[{ header: "Service", render: (b) => serviceName(b.serviceId) }, { header: "Owner", render: (b) => personName(b.ownerId) }, { header: "Pet", render: (b) => petName(b.petId) }, { header: "Date", render: (b) => formatDate(b.completedAt || b.bookingDate) }, { header: "Payment", render: (b) => b.paymentStatus }, { header: "Amount", render: (b) => money(b.price) }]} /></main>;
};

export default GroomerEarnings;
