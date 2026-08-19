import NotificationCenter from "../../../components/common/NotificationCenter";
import AdminPageHeader from "../../../components/admin/AdminPageHeader";

const Notifications = () => (
  <NotificationCenter
    HeaderComponent={AdminPageHeader}
    title="Notifications"
    description="Review platform alerts, applications, bookings, orders, and system activity."
    eventName="admin-notifications-updated"
    loadingText="Fetching the latest administrator alerts."
    emptyDescription="New applications, bookings, orders, and system alerts will appear here."
  />
);

export default Notifications;
