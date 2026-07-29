import { toast } from "react-hot-toast";

import ResourceListPage from "../../../components/owner/ResourceListPage";
import api from "../../../services/api";
import { Button, formatDate, getId, money } from "../ownerShared";

const Orders = () => {
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
      description="Order history and delivery status."
      endpoint="/orders/my-orders"
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

