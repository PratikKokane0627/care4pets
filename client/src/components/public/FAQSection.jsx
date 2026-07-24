import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
  {
    question: "What is Care4Pets?",
    answer:
      "Care4Pets is a pet care management platform where pet owners can manage pets, book veterinary appointments, schedule grooming, track vaccinations and purchase pet products.",
  },
  {
    question: "Can I add multiple pets?",
    answer:
      "Yes. You can create and manage multiple pet profiles from your owner dashboard.",
  },
  {
    question: "How do vaccination reminders work?",
    answer:
      "You can save vaccination details and upcoming due dates. Care4Pets will display reminders so you do not miss important vaccinations.",
  },
  {
    question: "Can I book veterinary and grooming services?",
    answer:
      "Yes. You can browse available services, select a date and submit a booking request from your account.",
  },
  {
    question: "Is online payment supported?",
    answer:
      "Yes. Care4Pets supports secure online payments through Razorpay for eligible orders and services.",
  },
  {
    question: "Can I track my orders?",
    answer:
      "Yes. You can view order history, payment status and order status from your dashboard.",
  },
];

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex((previousIndex) =>
      previousIndex === index ? null : index
    );
  };

  return (
    <section
      id="faq"
      className="bg-[#070d1b] px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Frequently asked questions
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Have Questions? We Have Answers
          </h2>

          <p className="mt-4 leading-7 text-slate-400">
            Learn more about pets, appointments, grooming,
            vaccinations, payments and orders.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;

            return (
              <article
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1222]"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-white">
                    {faq.question}
                  </span>

                  <FiChevronDown
                    className={`shrink-0 text-xl text-indigo-400 transition duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-6 py-5">
                    <p className="leading-7 text-slate-400">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;