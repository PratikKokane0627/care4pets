import NotificationCenter from "../../../components/common/NotificationCenter";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";

const GroomerNotifications = () => (
  <NotificationCenter
    HeaderComponent={GroomerPageHeader}
    title="Notifications"
    description="Review grooming assignments, booking updates, payments, and system alerts."
    eventName="groomer-notifications-updated"
    loadingText="Fetching your latest groomer alerts."
    emptyDescription="Grooming assignments and system alerts will appear here."
  />
);

export default GroomerNotifications;
