import NotificationCenter from "../../../components/common/NotificationCenter";
import VetPageHeader from "../../../components/vet/VetPageHeader";

const VetNotifications = () => (
  <NotificationCenter
    HeaderComponent={VetPageHeader}
    title="Notifications"
    description="Review appointment requests, booking updates, payments, and system alerts."
    eventName="vet-notifications-updated"
    loadingText="Fetching your latest veterinarian alerts."
    emptyDescription="Appointment requests and system alerts will appear here."
  />
);

export default VetNotifications;
