import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Settings,
  Star,
  Stethoscope,
  Syringe,
  UserRound,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardSearch from "../components/common/DashboardSearch";
import { getUnreadNotificationCount } from "../services/notificationApi";
import { getMyVetProfile } from "../services/vetApi";

const navigationItems = [
  { label: "Dashboard", path: "/vet/dashboard", icon: LayoutDashboard },
  { label: "Appointments", path: "/vet/appointments", icon: CalendarDays },
  { label: "Patients", path: "/vet/patients", icon: PawPrint },
  { label: "Prescriptions", path: "/vet/prescriptions", icon: ClipboardList },
  { label: "Availability", path: "/vet/availability", icon: Stethoscope },
  { label: "Reviews", path: "/vet/reviews", icon: Star },
  { label: "Notifications", path: "/vet/notifications", icon: Bell },
];

const searchableActions = [
  { label: "Dashboard", hint: "Overview, approval status, stats", path: "/vet/dashboard", keywords: ["home", "overview", "stats", "approval", "active"] },
  { label: "Pending appointments", hint: "Requests awaiting your action", path: "/vet/appointments?status=pending", keywords: ["pending", "request", "requests", "awaiting"] },
  { label: "Accepted appointments", hint: "Confirmed visits", path: "/vet/appointments?status=accepted", keywords: ["accepted", "confirmed"] },
  { label: "Completed appointments", hint: "Finished consultations", path: "/vet/appointments?status=completed", keywords: ["completed", "done", "finished"] },
  { label: "Rejected appointments", hint: "Declined requests", path: "/vet/appointments?status=rejected", keywords: ["rejected", "declined"] },
  { label: "All appointments", hint: "Appointment list and filters", path: "/vet/appointments", keywords: ["appointment", "appointments", "booking", "bookings"] },
  { label: "Patients", hint: "Pets assigned to you", path: "/vet/patients", keywords: ["patient", "patients", "pet", "pets"] },
  { label: "Prescriptions", hint: "Completed consultation records", path: "/vet/prescriptions", keywords: ["prescription", "prescriptions", "medicine", "medical"] },
  { label: "Availability", hint: "Working days and hours", path: "/vet/availability", keywords: ["availability", "available", "schedule", "time", "hours"] },
  { label: "Reviews", hint: "Owner feedback and ratings", path: "/vet/reviews", keywords: ["review", "reviews", "rating", "ratings"] },
  { label: "Notifications", hint: "Unread alerts", path: "/vet/notifications", keywords: ["notification", "notifications", "alert", "alerts"] },
  { label: "My Profile", hint: "Clinic and personal details", path: "/vet/profile", keywords: ["profile", "account", "clinic"] },
  { label: "Settings", hint: "Security settings", path: "/vet/settings", keywords: ["settings", "password", "security"] },
];

const VetLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storedUser, setStoredUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [vetProfileImage, setVetProfileImage] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const vetName = storedUser.name || storedUser.fullName || "Veterinarian";
  const vetEmail = storedUser.email || "vet@care4pets.com";
  const userProfileImage = typeof storedUser.profileImage === "string" ? storedUser.profileImage : storedUser.profileImage?.url;
  const profileImage = vetProfileImage || userProfileImage;

  useEffect(() => {
    const syncUser = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setStoredUser(user);
      const image = typeof user.profileImage === "string" ? user.profileImage : user.profileImage?.url;
      setVetProfileImage(image || "");
    };
    const loadProfile = () => {
      syncUser();
      getMyVetProfile()
        .then((res) => setVetProfileImage(res.data.vet?.profileImage?.url || ""))
        .catch(() => {});
    };
    loadProfile();
    window.addEventListener("vet-profile-updated", syncUser);
    return () => window.removeEventListener("vet-profile-updated", syncUser);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const loadUnreadCount = () => {
      getUnreadNotificationCount()
        .then((res) => setUnreadNotifications(res.data.unreadCount || 0))
        .catch(() => setUnreadNotifications(0));
    };

    loadUnreadCount();
    window.addEventListener("focus", loadUnreadCount);
    window.addEventListener("vet-notifications-updated", loadUnreadCount);
    return () => {
      window.removeEventListener("focus", loadUnreadCount);
      window.removeEventListener("vet-notifications-updated", loadUnreadCount);
    };
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${
      isActive
        ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {sidebarOpen && <button type="button" aria-label="Close sidebar overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-900 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <button type="button" onClick={() => navigate("/vet/dashboard")} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Syringe size={25} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black">Care<span className="text-cyan-400">4Pets</span></h1>
              <p className="text-xs text-slate-500">Veterinarian Panel</p>
            </div>
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"><X size={21} /></button>
        </div>

        <nav className="theme-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Care Workspace</p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass}
              >
                <Icon size={19} /> {item.label}
              </NavLink>
            );
          })}

          <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Account</p>

          <NavLink to="/vet/profile" onClick={() => setSidebarOpen(false)} className={navLinkClass}>
            <UserRound size={19} /> My Profile
          </NavLink>

          <NavLink to="/vet/settings" onClick={() => setSidebarOpen(false)} className={navLinkClass}>
            <Settings size={19} /> Settings
          </NavLink>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={19} /> Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-white/10 p-2.5 text-slate-300 lg:hidden"><Menu size={22} /></button>
          <DashboardSearch actions={searchableActions} placeholder="Search vet dashboard..." noMatchToast="No matching vet page found" />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => navigate("/vet/notifications")} className="relative rounded-xl border border-white/10 bg-slate-900 p-3 text-slate-400 transition hover:text-white" aria-label="Open notifications">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>
            <div className="relative" ref={dropdownRef}>
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-cyan-300/25 bg-indigo-500/20 text-indigo-400">
                  {profileImage ? <img src={profileImage} alt={vetName} className="h-full w-full object-cover" /> : <UserRound size={19} />}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-36 truncate text-sm font-semibold">{vetName}</p>
                  <p className="text-xs text-slate-500">Veterinarian</p>
                </div>
                <ChevronDown size={16} className="hidden text-slate-500 sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl shadow-black/40">
                  <div className="border-b border-white/10 px-3 py-3">
                    <p className="font-semibold text-white">{vetName}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{vetEmail}</p>
                  </div>
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/vet/profile"); }} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><UserRound size={17} /> My Profile</button>
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/vet/settings"); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={17} /> Settings</button>
                  <div className="my-2 border-t border-white/10" />
                  <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><LogOut size={17} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
};

export default VetLayout;
