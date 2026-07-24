import {
  FiClock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
} from "react-icons/fi";
import { useState } from "react";

const initialFormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const Contact = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setSuccessMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Contact data:", formData);

    setSuccessMessage(
      "Your message has been submitted successfully."
    );

    setFormData(initialFormData);
  };

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-16 pt-24 lg:px-8">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Contact Care4Pets
          </p>

          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            How Can We Help You?
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Contact our support team for help with pet profiles,
            appointments, grooming, vaccinations, orders or payments.
          </p>
        </div>
      </section>

      <section className="px-5 pb-24 pt-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <article className="rounded-3xl border border-white/10 bg-[#0b1222] p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl text-indigo-400">
                  <FiMail />
                </span>

                <div>
                  <h2 className="font-semibold text-white">
                    Email Support
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Send us an email anytime.
                  </p>

                  <a
                    href="mailto:support@care4pets.com"
                    className="mt-2 block text-cyan-400 hover:text-cyan-300"
                  >
                    support@care4pets.com
                  </a>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-[#0b1222] p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-xl text-cyan-400">
                  <FiPhone />
                </span>

                <div>
                  <h2 className="font-semibold text-white">
                    Phone Support
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Speak with our support team.
                  </p>

                  <a
                    href="tel:+919876543210"
                    className="mt-2 block text-cyan-400 hover:text-cyan-300"
                  >
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-[#0b1222] p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-400">
                  <FiMapPin />
                </span>

                <div>
                  <h2 className="font-semibold text-white">
                    Office Location
                  </h2>

                  <p className="mt-2 text-slate-400">
                    Sangli, Maharashtra, India
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-[#0b1222] p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-500/10 text-xl text-yellow-400">
                  <FiClock />
                </span>

                <div>
                  <h2 className="font-semibold text-white">
                    Support Hours
                  </h2>

                  <p className="mt-2 leading-7 text-slate-400">
                    Monday to Saturday
                    <br />
                    9:00 AM to 7:00 PM
                  </p>
                </div>
              </div>
            </article>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-[#0b1222] p-7 sm:p-9"
          >
            <h2 className="text-2xl font-bold text-white">
              Send Us a Message
            </h2>

            <p className="mt-2 text-slate-400">
              Fill in the form and our team will contact you.
            </p>

            {successMessage && (
              <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
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
                  className="w-full rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
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
                  className="w-full rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
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
                placeholder="Enter subject"
                required
                className="w-full rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
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
                placeholder="How can we help you?"
                rows="7"
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-[#070d1b] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
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
      </section>
    </>
  );
};

export default Contact;