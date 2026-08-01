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
  Search,
  Settings,
  Star,
  Stethoscope,
  Syringe,
  UserRound,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const navigationItems = [
  { label: "Dashboard", path: "/vet/dashboard", icon: LayoutDashboard },
  { label: "Appointments", path: "/vet/appointments", icon: CalendarDays },
  { label: "Patients", path: "/vet/patients", icon: PawPrint },
  { label: "Prescriptions", path: "/vet/prescriptions", icon: ClipboardList },
  { label: "Availability", path: "/vet/availability", icon: Stethoscope },
  { label: "Reviews", path: "/vet/reviews", icon: Star },
  { label: "Notifications", path: "/vet/notifications", icon: Bell },
  { label: "Profile", path: "/vet/profile", icon: UserRound },
  { label: "Change Password", path: "/vet/change-password", icon: Settings },
];

const VetLayout = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const vetName = storedUser.name || storedUser.fullName || "Veterinarian";
  const vetEmail = storedUser.email || "vet@care4pets.com";
  const profileImage = typeof storedUser.profileImage === "string" ? storedUser.profileImage : storedUser.profileImage?.url;

  useEffect(() => {
    const close = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {sidebarOpen && <button type="button" aria-label="Close sidebar overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-900 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <button type="button" onClick={() => navigate("/vet/dashboard")} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950">
              <Syringe size={25} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black">Care<span className="text-cyan-400">4</span>Pets</h1>
              <p className="text-xs text-slate-500">Veterinarian Panel</p>
            </div>
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"><X size={21} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Care Workspace</p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-gradient-to-r from-indigo-500/20 to-cyan-500/10 text-cyan-400" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={19} /> {item.label}
              </NavLink>
            );
          })}
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
          <div className="hidden max-w-xl flex-1 items-center rounded-xl border border-white/10 bg-slate-900 px-4 md:flex">
            <Search size={18} className="text-slate-500" />
            <input type="search" placeholder="Search dashboard..." className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => navigate("/vet/notifications")} className="relative rounded-xl border border-white/10 bg-slate-900 p-3 text-slate-400 transition hover:text-white" aria-label="Open notifications">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-indigo-500/20 text-indigo-400">
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
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/vet/profile"); }} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={17} /> Profile Settings</button>
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
