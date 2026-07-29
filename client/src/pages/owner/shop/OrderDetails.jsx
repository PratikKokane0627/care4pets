import { useState } from "react";
import { useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { ErrorState, InfoBlock, Panel, formatDate, money } from "../ownerShared";

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  const { loading, error } = useFetch(async () => {
    const response = await api.get(`/orders/${id}`);
    setOrder(response.data.order || response.data);
  }, id);

  if (loading) return <Loader label="Loading order" />;

  return (
    <main>
      <PageHeader title="Order Details" description="Review products, totals, and delivery status." />
      <ErrorState message={error} />
      {!order ? (
        <EmptyState title="Order not found" />
      ) : (
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Order #{String(order._id || "").slice(-6)}</h2>
            <StatusBadge status={order.orderStatus} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Date" value={formatDate(order.createdAt)} />
            <InfoBlock label="Items" value={order.totalItems} />
            <InfoBlock label="Total" value={money(order.totalAmount)} />
            <InfoBlock label="Payment" value={order.paymentStatus} />
            <InfoBlock label="Shipping City" value={order.shippingAddress?.city} />
            <InfoBlock label="Phone" value={order.shippingAddress?.phone} />
          </div>
        </Panel>
      )}
    </main>
  );
};

export default OrderDetails;

