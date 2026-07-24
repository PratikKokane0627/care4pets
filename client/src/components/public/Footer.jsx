import {
  FaFacebookF,
  FaInstagram,
  FaPaw,
  FaTwitter,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#020611] px-5 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <FaPaw className="text-indigo-400" />

              <span className="text-lg font-bold text-white">
                Care4Pets
              </span>
            </div>

            <p className="mt-3 max-w-sm text-center text-sm leading-6 text-slate-500 md:text-left">
              A complete platform for pet health,
              appointments, grooming, shopping and
              vaccination management.
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="#"
              aria-label="Facebook"
              className="rounded-full border border-white/10 p-3 transition hover:bg-white/10 hover:text-white"
            >
              <FaFacebookF />
            </a>

            <a
              href="#"
              aria-label="Instagram"
              className="rounded-full border border-white/10 p-3 transition hover:bg-white/10 hover:text-white"
            >
              <FaInstagram />
            </a>

            <a
              href="#"
              aria-label="Twitter"
              className="rounded-full border border-white/10 p-3 transition hover:bg-white/10 hover:text-white"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row">
          <p>© 2026 Care4Pets. All rights reserved.</p>

          <div className="flex gap-5">
            <a href="#" className="hover:text-white">
              Privacy Policy
            </a>

            <a href="#" className="hover:text-white">
              Terms
            </a>

            <Link to="/contact" className="hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;