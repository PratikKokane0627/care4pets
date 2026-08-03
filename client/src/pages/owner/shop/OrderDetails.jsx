import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../../components/owner/EmptyState";
import Loader from "../../../components/owner/Loader";
import PageHeader from "../../../components/owner/PageHeader";
import StatusBadge from "../../../components/owner/StatusBadge";
import useFetch from "../../../hooks/useFetch";
import api from "../../../services/api";
import { Button, ErrorState, InfoBlock, Panel, formatDate, getId, money } from "../ownerShared";

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
        <div className="space-y-6">
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

          <Panel>
            <h2 className="mb-5 text-xl font-bold text-white">Order Items</h2>
            <div className="space-y-4">
              {(order.items || []).map((item) => {
                const productId = getId(item.productId) || item.productId;

                return (
                  <article
                    key={`${productId}-${item.productName}`}
                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-900">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white">{item.productName}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Qty {item.quantity} · {money(item.price)} each
                      </p>
                    </div>
                    {order.orderStatus === "Delivered" && productId && (
                      <Button
                        as={Link}
                        to={`/owner/shop/${productId}?orderId=${getId(order)}#product-reviews`}
                      >
                        Review Product
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </Panel>
        </div>
      )}
    </main>
  );
};

export default OrderDetails;

