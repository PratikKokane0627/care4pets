import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    FiMenu,
    FiSearch,
    FiShoppingBag,
    FiUser,
    FiX,
} from "react-icons/fi";
import { FaPaw } from "react-icons/fa";

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const navLinkClass = ({ isActive }) =>
        isActive
            ? "text-cyan-400"
            : "text-slate-300 transition hover:text-white";

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030712]/90 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
                <NavLink
                    to="/"
                    onClick={closeMenu}
                    className="flex items-center gap-2"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
                        <FaPaw />
                    </span>

                    <div>
                        <span className="font-bold text-white">
                            Care4Pets
                        </span>

                        <span className="ml-1 text-xs text-cyan-400">
                            Premium
                        </span>
                    </div>
                </NavLink>

                <div className="hidden items-center gap-7 lg:flex">
                    <NavLink to="/" className={navLinkClass}>
                        Home
                    </NavLink>

                    <a
                        href="#features"
                        className="text-slate-300 transition hover:text-white"
                    >
                        Features
                    </a>

                    <a
                        href="#services"
                        className="text-slate-300 transition hover:text-white"
                    >
                        Services
                    </a>

                    <a
                        href="#testimonials"
                        className="text-slate-300 transition hover:text-white"
                    >
                        Community
                    </a>

                    
                    <a
                        href="#faq"
                        className="text-slate-300 transition hover:text-white"
                    >
                        FAQ
                    </a>
                    <a
                        href="#contact"
                        className="text-slate-300 transition hover:text-white"
                    >
                        Contact
                    </a>
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                        <FiSearch className="text-slate-400" />

                        <input
                            type="text"
                            placeholder="Search services..."
                            className="w-36 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    <NavLink
                        to="/cart"
                        className="rounded-full border border-white/10 p-2.5 text-slate-300 transition hover:bg-white/10"
                    >
                        <FiShoppingBag />
                    </NavLink>

                    <NavLink
                        to="/login"
                        className="rounded-full bg-indigo-500 p-2.5 text-white transition hover:bg-indigo-400"
                    >
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
                        <NavLink
                            to="/"
                            onClick={closeMenu}
                            className={navLinkClass}
                        >
                            Home
                        </NavLink>

                        <a
                            href="#features"
                            onClick={closeMenu}
                            className="text-slate-300"
                        >
                            Features
                        </a>

                        <a
                            href="#services"
                            onClick={closeMenu}
                            className="text-slate-300"
                        >
                            Services
                        </a>

                        <a
                            href="#testimonials"
                            onClick={closeMenu}
                            className="text-slate-300"
                        >
                            Community
                        </a>

                      
                        <a
                            href="#faq"
                            onClick={closeMenu}
                            className="text-slate-300"
                        >
                            FAQ
                        </a>
                          <a
                            href="#contact"
                            onClick={closeMenu}
                            className="text-slate-300"
                        >
                            Contact
                        </a>

                        <NavLink
                            to="/login"
                            onClick={closeMenu}
                            className="rounded-xl bg-indigo-500 px-4 py-3 text-center font-semibold text-white"
                        >
                            Login
                        </NavLink>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;