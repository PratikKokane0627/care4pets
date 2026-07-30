import { toast } from "react-hot-toast";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, formatDate, getId, money } from "../ownerShared";

const Orders = () => {
  const location = useLocation();
  const [status, setStatus] = useState("");

  const endpoint = useMemo(() => "/orders/my-orders", []);

  const cancel = async (order, refresh) => {
    try {
      await api.patch(`/orders/${getId(order)}/cancel`);
      toast.success("Order cancelled");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel order");
    }
  };

  return (
    <ResourceListPage
      title="Orders"
      description={
        location.state?.orderPlaced
          ? "Order placed successfully. Your newest order is highlighted below."
          : "Order history and delivery status."
      }
      endpoint={endpoint}
      dataKeys={["orders"]}
      searchPlaceholder="Search orders"
      getTitle={(order) => `Order #${String(order._id || "").slice(-6)}`}
      getSubtitle={(order) => formatDate(order.createdAt)}
      getMeta={(order) => [
        `${order.totalItems || 0} items`,
        money(order.totalAmount),
        `Payment: ${order.paymentStatus || "Pending"}`,
      ]}
      getStatus={(order) => order.orderStatus || "Pending"}
      emptyTitle="No orders yet"
      emptyMessage="Your shop orders will appear here."
      emptyAction={
        <Button as={Link} to="/owner/shop">
          Browse Shop
        </Button>
      }
      renderBeforeList={() => (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {location.state?.orderPlaced && (
            <span className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
              Order placed successfully
            </span>
          )}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition hover:border-white/25 focus:border-cyan-400"
          >
            <option value="">All order statuses</option>
            {["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      )}
      filterItem={(order) => !status || order.orderStatus === status}
      highlightItem={(order) => location.state?.orderId && getId(order) === location.state.orderId}
      renderActions={(order, { refresh }) =>
        ["Pending", "Confirmed"].includes(order.orderStatus) ? (
          <Button variant="danger" onClick={() => cancel(order, refresh)}>
            Cancel Order
          </Button>
        ) : null
      }
    />
  );
};

export default Orders;

