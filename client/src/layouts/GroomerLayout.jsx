import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  Scissors,
  Search,
  Settings,
  Star,
  Store,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getMyGroomerProfile } from "../services/groomerApi";

const navigationItems = [
  { label: "Dashboard", path: "/groomer/dashboard", icon: LayoutDashboard },
  { label: "Grooming Bookings", path: "/groomer/bookings", icon: ClipboardList },
  { label: "Schedule", path: "/groomer/schedule", icon: CalendarDays },
  { label: "Customers", path: "/groomer/customers", icon: Users },
  { label: "Pets", path: "/groomer/pets", icon: PawPrint },
  { label: "Services", path: "/groomer/services", icon: Store },
  { label: "Availability", path: "/groomer/availability", icon: Scissors },
  { label: "Earnings", path: "/groomer/earnings", icon: IndianRupee },
  { label: "Reviews", path: "/groomer/reviews", icon: Star },
  { label: "Notifications", path: "/groomer/notifications", icon: Bell },
  { label: "Profile", path: "/groomer/profile", icon: UserRound },
  { label: "Change Password", path: "/groomer/change-password", icon: Settings },
];

const searchableActions = [
  { label: "Pending bookings", path: "/groomer/bookings?status=pending", keywords: ["pending", "requests"] },
  { label: "Accepted bookings", path: "/groomer/bookings?status=accepted", keywords: ["accepted", "confirmed"] },
  { label: "Completed bookings", path: "/groomer/bookings?status=completed", keywords: ["completed", "done"] },
  { label: "Schedule", path: "/groomer/schedule", keywords: ["today", "upcoming", "calendar"] },
  { label: "Customers", path: "/groomer/customers", keywords: ["owners", "clients"] },
  { label: "Pets", path: "/groomer/pets", keywords: ["pet", "animals"] },
  { label: "Services", path: "/groomer/services", keywords: ["service", "price"] },
  { label: "Availability", path: "/groomer/availability", keywords: ["time", "hours"] },
  { label: "Profile", path: "/groomer/profile", keywords: ["account"] },
];

const GroomerLayout = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const user = profile?.userId || storedUser;
  const groomerName = user?.name || "Groomer";
  const groomerEmail = user?.email || "groomer@care4pets.com";
  const profileImage = typeof user?.profileImage === "string" ? user.profileImage : user?.profileImage?.url;

  useEffect(() => {
    const loadProfile = () => getMyGroomerProfile()
      .then((res) => setProfile(res.data.profile))
      .catch(() => {});
    loadProfile();
    window.addEventListener("groomer-profile-updated", loadProfile);
    return () => window.removeEventListener("groomer-profile-updated", loadProfile);
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const matches = search.trim()
    ? searchableActions.filter((item) => [item.label, ...item.keywords].some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))).slice(0, 6)
    : searchableActions.slice(0, 5);

  const openResult = (path) => {
    navigate(path);
    setSearch("");
    setSearchOpen(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (matches.length) openResult(matches[0].path);
    else toast.error("No matching groomer page found");
  };

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
          <button type="button" onClick={() => navigate("/groomer/dashboard")} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">
              <Scissors size={25} />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black">Care<span className="text-cyan-400">4Pets</span></h1>
              <p className="text-xs text-slate-500">Groomer Panel</p>
            </div>
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"><X size={21} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Grooming Workspace</p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${isActive ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={19} /> {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"><LogOut size={19} /> Logout</button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-white/10 p-2.5 text-slate-300 lg:hidden"><Menu size={22} /></button>
          <form ref={searchRef} onSubmit={submitSearch} className="relative hidden max-w-xl flex-1 md:block">
            <div className={`flex items-center rounded-xl border bg-slate-900 px-4 transition ${searchOpen ? "border-cyan-300/40 ring-2 ring-cyan-300/10" : "border-white/10"}`}>
              <Search size={18} className="text-slate-500" />
              <input type="search" value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} placeholder="Search groomer panel..." className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
            </div>
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl shadow-black/40">
                {matches.map((item) => <button key={item.path} type="button" onClick={() => openResult(item.path)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-cyan-400/10">{item.label}</button>)}
              </div>
            )}
          </form>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => navigate("/groomer/notifications")} className="relative rounded-xl border border-white/10 bg-slate-900 p-3 text-slate-400 transition hover:text-white" aria-label="Open notifications">
              <Bell size={20} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-cyan-300/25 bg-indigo-500/20 text-indigo-400">
                  {profileImage ? <img src={profileImage} alt={groomerName} className="h-full w-full object-cover" /> : <UserRound size={19} />}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-36 truncate text-sm font-semibold">{groomerName}</p>
                  <p className="text-xs text-slate-500">Groomer</p>
                </div>
                <ChevronDown size={16} className="hidden text-slate-500 sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl shadow-black/40">
                  <div className="border-b border-white/10 px-3 py-3">
                    <p className="font-semibold text-white">{groomerName}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">{groomerEmail}</p>
                  </div>
                  <button type="button" onClick={() => { setProfileOpen(false); navigate("/groomer/profile"); }} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><Settings size={17} /> Profile Settings</button>
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

export default GroomerLayout;
