import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

import api from "../../services/api";
import { getPublicCart } from "../../utils/publicCart";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const closeMenu = () => setMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `font-medium transition-colors duration-200 ${
      isActive ? "!text-[#00d9ff]" : "!text-slate-400 hover:!text-white"
    }`;

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
  };

  const refreshCartCount = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setCartCount(getPublicCart().reduce((sum, item) => sum + (item.quantity || 1), 0));
      return;
    }

    try {
      const response = await api.get("/cart/summary");
      setCartCount(response.data.summary?.totalItems || 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener("public-cart-updated", refreshCartCount);
    window.addEventListener("owner-shop-counts-updated", refreshCartCount);
    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("focus", refreshCartCount);

    return () => {
      window.removeEventListener("public-cart-updated", refreshCartCount);
      window.removeEventListener("owner-shop-counts-updated", refreshCartCount);
      window.removeEventListener("storage", refreshCartCount);
      window.removeEventListener("focus", refreshCartCount);
    };
  }, [refreshCartCount]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <NavLink to="/" onClick={closeMenu} className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
            <FaPaw />
          </span>
          <span className="font-bold text-white">Care4Pets</span>
        </NavLink>

        <div className="hidden items-center gap-7 lg:flex">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/about" className={navLinkClass}>About</NavLink>
          <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
          <NavLink to="/products" className={navLinkClass}>Products</NavLink>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <form onSubmit={submitSearch} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 transition focus-within:border-cyan-400/60">
            <FiSearch className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </form>

          <NavLink to="/cart" className="relative rounded-full border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/10">
            <FiShoppingBag />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-cyan-400 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-950 ring-2 ring-slate-950">
                {cartCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/login" className="rounded-full bg-indigo-500 p-2.5 text-white transition hover:bg-indigo-400">
            <FiUser />
          </NavLink>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="rounded-lg border border-white/10 p-2.5 text-white lg:hidden"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#060b18] px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-5">
            <NavLink to="/" end onClick={closeMenu} className={navLinkClass}>Home</NavLink>
            <NavLink to="/about" onClick={closeMenu} className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" onClick={closeMenu} className={navLinkClass}>Contact</NavLink>
            <NavLink to="/products" onClick={closeMenu} className={navLinkClass}>Products</NavLink>
            <NavLink to="/cart" onClick={closeMenu} className={navLinkClass}>Cart</NavLink>
            <NavLink to="/login" onClick={closeMenu} className="rounded-xl bg-indigo-500 px-4 py-3 text-center font-semibold text-white">
              Login
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
