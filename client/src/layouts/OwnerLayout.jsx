import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PawPrint,
  Scissors,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Syringe,
  UserRound,
  X,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { OwnerProvider } from "../context/OwnerContext";
import DashboardSearch from "../components/common/DashboardSearch";
import api from "../services/api";
import { getUnreadNotificationCount } from "../services/notificationApi";

const navigationItems = [
  {
    title: "Dashboard",
    path: "/owner/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Pets",
    path: "/owner/pets",
    icon: PawPrint,
  },
  {
    title: "Appointments",
    path: "/owner/appointments",
    icon: CalendarDays,
  },
  {
    title: "Veterinarians",
    path: "/owner/veterinarians",
    icon: Stethoscope,
  },
  {
    title: "Groomer",
    path: "/owner/groomers",
    icon: Scissors,
  },
  {
    title: "Health Records",
    path: "/owner/health-records",
    icon: HeartPulse,
  },
  {
    title: "Vaccinations",
    path: "/owner/vaccinations",
    icon: Syringe,
  },
  {
    title: "Grooming Service",
    path: "/owner/grooming",
    icon: ShoppingBag,
  },
  {
    title: "Pet Shop",
    path: "/owner/shop",
    icon: Package,
  },
  {
    title: "Wishlist",
    path: "/owner/shop/wishlist",
    icon: Heart,
    countKey: "wishlist",
  },
  {
    title: "Cart",
    path: "/owner/cart",
    icon: ShoppingCart,
    countKey: "cart",
  },
  {
    title: "Orders",
    path: "/owner/orders",
    icon: ShoppingBag,
  },
  {
    title: "Notifications",
    path: "/owner/notifications",
    icon: Bell,
  },
];

const searchableActions = [
  { label: "Dashboard", hint: "Owner overview and quick stats", path: "/owner/dashboard", keywords: ["home", "overview", "stats"] },
  { label: "My Pets", hint: "Pet profiles and details", path: "/owner/pets", keywords: ["pet", "pets", "profiles"] },
  { label: "Appointments", hint: "View veterinary appointments", path: "/owner/appointments", keywords: ["appointment", "appointments", "booking", "bookings"] },
  { label: "Book Appointment", hint: "Schedule a veterinary visit", path: "/owner/appointments/book", keywords: ["book", "vet", "doctor", "schedule"] },
  { label: "Veterinarians", hint: "Find and view vets", path: "/owner/veterinarians", keywords: ["vet", "vets", "doctor", "clinic"] },
  { label: "Groomer", hint: "Find groomers", path: "/owner/groomers", keywords: ["groomer", "groomers"] },
  { label: "Grooming Service", hint: "Book and review grooming services", path: "/owner/grooming", keywords: ["grooming", "service", "services", "review"] },
  { label: "Health Records", hint: "Pet medical history", path: "/owner/health-records", keywords: ["health", "records", "medical"] },
  { label: "Vaccinations", hint: "Pet vaccination records", path: "/owner/vaccinations", keywords: ["vaccine", "vaccination", "vaccinations"] },
  { label: "Pet Shop", hint: "Browse products", path: "/owner/shop", keywords: ["shop", "product", "products"] },
  { label: "Wishlist", hint: "Saved shop items", path: "/owner/shop/wishlist", keywords: ["wishlist", "saved"] },
  { label: "Cart", hint: "Shopping cart", path: "/owner/cart", keywords: ["cart", "checkout"] },
  { label: "Orders", hint: "Order history", path: "/owner/orders", keywords: ["order", "orders", "purchase"] },
  { label: "Notifications", hint: "Owner alerts", path: "/owner/notifications", keywords: ["notification", "notifications", "alerts"] },
  { label: "My Profile", hint: "Owner profile details", path: "/owner/profile", keywords: ["profile", "account"] },
  { label: "Settings", hint: "Owner account settings", path: "/owner/settings", keywords: ["settings", "password"] },
];

const OwnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shopCounts, setShopCounts] = useState({
    cart: 0,
    wishlist: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [storedUser, setStoredUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );

  useEffect(() => {
    const syncUser = () => {
      setStoredUser(JSON.parse(localStorage.getItem("user") || "{}"));
    };
    const refreshUser = async () => {
      try {
        const response = await api.get("/auth/profile");
        const user = response.data.user || response.data;
        const normalizedUser = {
          ...user,
          profileImage:
            typeof user.profileImage === "string"
              ? user.profileImage
              : user.profileImage?.url || "",
        };

        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setStoredUser(normalizedUser);
      } catch {
        syncUser();
      }
    };

    refreshUser();
    window.addEventListener("owner-profile-updated", syncUser);
    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", refreshUser);

    return () => {
      window.removeEventListener("owner-profile-updated", syncUser);
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", refreshUser);
    };
  }, []);

  useEffect(() => {
    const refreshNotificationCount = async () => {
      try {
        const response = await getUnreadNotificationCount();
        setUnreadNotifications(response.data.unreadCount || 0);
      } catch {
        setUnreadNotifications(0);
      }
    };

    refreshNotificationCount();
  }, [location.pathname]);

  useEffect(() => {
    const refreshShopCounts = async () => {
      try {
        const [cartRes, wishlistRes] = await Promise.all([
          api.get("/cart/summary").catch(() => ({ data: { summary: {} } })),
          api.get("/wishlist/summary").catch(() => ({ data: { summary: {} } })),
        ]);

        setShopCounts({
          cart:
            cartRes.data.summary?.totalProducts ??
            cartRes.data.summary?.availableItems ??
            cartRes.data.summary?.totalItems ??
            0,
          wishlist: wishlistRes.data.summary?.totalItems || 0,
        });
      } catch {
        setShopCounts({ cart: 0, wishlist: 0 });
      }
    };

    refreshShopCounts();
    window.addEventListener("owner-shop-counts-updated", refreshShopCounts);
    window.addEventListener("focus", refreshShopCounts);

    return () => {
      window.removeEventListener("owner-shop-counts-updated", refreshShopCounts);
      window.removeEventListener("focus", refreshShopCounts);
    };
  }, []);

  useEffect(() => {
    const refreshNotificationCount = async () => {
      try {
        const response = await getUnreadNotificationCount();
        setUnreadNotifications(response.data.unreadCount || 0);
      } catch {
        setUnreadNotifications(0);
      }
    };

    refreshNotificationCount();
    window.addEventListener("owner-notifications-updated", refreshNotificationCount);
    window.addEventListener("focus", refreshNotificationCount);

    return () => {
      window.removeEventListener("owner-notifications-updated", refreshNotificationCount);
      window.removeEventListener("focus", refreshNotificationCount);
    };
  }, []);

  useEffect(() => {
    const close = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const owner = {
    name: storedUser.name || "Pet Owner",
    email: storedUser.email || "owner@care4pets.com",
    image:
      typeof storedUser.profileImage === "string"
        ? storedUser.profileImage
        : storedUser.profileImage?.url || "",
  };

  const OwnerAvatar = ({ size = "h-10 w-10" }) =>
    owner.image ? (
      <img
        src={owner.image}
        alt={owner.name}
        className={`${size} rounded-full object-cover`}
      />
    ) : (
      <span
        className={`${size} flex shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300`}
      >
        <UserRound size={size.includes("h-9") ? 18 : 20} />
      </span>
    );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-slate-900 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <button
            type="button"
            onClick={() => navigate("/owner/dashboard")}
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
              <PawPrint size={24} />
            </span>

            <div className="text-left">
              <h1 className="text-xl font-bold">
                Care<span className="text-cyan-400">4Pets</span>
              </h1>

              <p className="text-xs text-slate-500">Owner Portal</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="theme-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Main menu
          </p>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={navLinkClass}
              >
                <Icon size={20} />
                <span className="min-w-0 flex-1">{item.title}</span>
                {item.countKey && (
                  <span className="rounded-full bg-slate-950/25 px-2 py-0.5 text-xs font-bold">
                    {shopCounts[item.countKey]}
                  </span>
                )}
              </NavLink>
            );
          })}

          <p className="mb-3 mt-7 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Account
          </p>

          <NavLink
            to="/owner/profile"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <UserRound size={20} />
            My Profile
          </NavLink>

          <NavLink
            to="/owner/settings"
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <Settings size={20} />
            Settings
          </NavLink>
        </nav>

        {/* Sidebar owner */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-black/10">
            <OwnerAvatar />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{owner.name}</p>
              <p className="truncate text-xs text-slate-500">{owner.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="text-slate-500 transition hover:text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-72">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/10 p-2.5 text-slate-300 hover:bg-white/5 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <DashboardSearch actions={searchableActions} placeholder="Search owner dashboard..." noMatchToast="No matching owner page found" />

            <div className="md:hidden">
              <h2 className="font-semibold text-white">Owner Portal</h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Manage your pets and their healthcare
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate("/owner/shop/wishlist")}
              className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="Wishlist"
            >
              <Heart size={20} />
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-cyan-400 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                {shopCounts.wishlist}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/owner/cart")}
              className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="Cart"
            >
              <ShoppingCart size={20} />
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-cyan-400 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                {shopCounts.cart}
              </span>
            </button>

            {/* Notification */}
            <button
              type="button"
              onClick={() => navigate("/owner/notifications")}
              className="relative rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
              title="Notifications"
            >
              <Bell size={20} />

              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white ring-2 ring-slate-950">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((previous) => !previous)}
                className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-white/5"
              >
                <OwnerAvatar size="h-9 w-9" />

                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold">{owner.name}</p>
                  <p className="text-xs text-slate-500">Pet Owner</p>
                </div>

                <ChevronDown
                  size={17}
                  className={`hidden text-slate-500 transition md:block ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/owner/profile");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <UserRound size={18} />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate("/owner/settings");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Settings size={18} />
                    Settings
                  </button>

                  <div className="my-2 border-t border-white/10" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Child pages render here */}
        <OwnerProvider>
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </OwnerProvider>
      </div>
    </div>
  );
};

export default OwnerLayout;
