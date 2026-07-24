import { FaQuoteLeft, FaStar } from "react-icons/fa";

const testimonials = [
  {
    name: "Ananya Sharma",
    role: "Pet Owner",
    pet: "Bruno",
    message:
      "Care4Pets makes it easy to manage Bruno’s vaccination records and veterinary appointments. Everything is available in one place.",
  },
  {
    name: "Rahul Patil",
    role: "Pet Owner",
    pet: "Rocky",
    message:
      "The grooming booking process is simple and quick. I can track every booking without making repeated phone calls.",
  },
  {
    name: "Sneha Kulkarni",
    role: "Pet Owner",
    pet: "Milo",
    message:
      "I really like the vaccination reminders. They help me make sure Milo never misses an important vaccine date.",
  },
];

const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="px-5 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Our community
          </p>

          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Trusted by Pet Owners
          </h2>

          <p className="mt-4 leading-7 text-slate-400">
            See how Care4Pets helps pet owners manage daily care,
            appointments and health records.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-3xl border border-white/10 bg-[#0b1222] p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30"
            >
              <FaQuoteLeft className="text-3xl text-indigo-400/50" />

              <div className="mt-5 flex gap-1 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar key={star} />
                ))}
              </div>

              <p className="mt-5 leading-7 text-slate-300">
                “{testimonial.message}”
              </p>

              <div className="mt-7 border-t border-white/10 pt-5">
                <h3 className="font-semibold text-white">
                  {testimonial.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {testimonial.role} · Pet: {testimonial.pet}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;