import { useState } from "react";
import {
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
} from "react-icons/fi";

const initialFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const ContactSection = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Contact form data:", formData);

    setSubmitted(true);
    setFormData(initialFormData);
  };

  return (
    <section
      id="contact"
      className="px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Contact us
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            We’re Here to Help You and Your Pet
          </h2>

          <p className="mt-4 leading-7 text-slate-400">
            Have questions about appointments, grooming,
            vaccinations, payments or orders? Send us a message.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0b1222] p-7">
            <h3 className="text-2xl font-semibold text-white">
              Get in Touch
            </h3>

            <p className="mt-3 leading-7 text-slate-400">
              Our support team is available to help you with
              Care4Pets services and account-related questions.
            </p>

            <div className="mt-8 space-y-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-400">
                  <FiMail />
                </span>

                <div>
                  <p className="font-semibold text-white">
                    Email
                  </p>

                  <a
                    href="mailto:support@care4pets.com"
                    className="mt-1 block text-slate-400 transition hover:text-cyan-400"
                  >
                    support@care4pets.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-xl text-cyan-400">
                  <FiPhone />
                </span>

                <div>
                  <p className="font-semibold text-white">
                    Phone
                  </p>

                  <a
                    href="tel:+919876543210"
                    className="mt-1 block text-slate-400 transition hover:text-cyan-400"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-400">
                  <FiMapPin />
                </span>

                <div>
                  <p className="font-semibold text-white">
                    Location
                  </p>

                  <p className="mt-1 text-slate-400">
                    Sangli, Maharashtra, India
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                Support Hours
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Monday to Saturday
                <br />
                9:00 AM to 7:00 PM
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-[#0b1222] p-7"
          >
            {submitted && (
              <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                Your message has been submitted successfully.
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Subject
              </label>

              <input
                id="subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Enter message subject"
                required
                className="w-full rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Message
              </label>

              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message"
                rows="6"
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400"
              />
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-semibold text-white transition hover:bg-indigo-400"
            >
              Send Message
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;