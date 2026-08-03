import GroomerEmptyState from "../../../components/groomer/GroomerEmptyState";
import GroomerPageHeader from "../../../components/groomer/GroomerPageHeader";

const GroomerNotifications = () => (
  <main>
    <GroomerPageHeader title="Notifications" description="Notifications routes are disabled in the current backend." />
    <GroomerEmptyState title="Notifications unavailable" description="This page is ready for display once the backend notification APIs are enabled." />
  </main>
);

export default GroomerNotifications;
