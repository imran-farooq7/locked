const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Real People, Real Results</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands who have achieved their goals with LOCKED
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Chen",
              role: "Entrepreneur",
              content:
                "I finally finished my app prototype after 6 months of procrastination. The $500 penalty was the push I needed.",
              saved: "$500",
            },
            {
              name: "Marcus Johnson",
              role: "Writer",
              content:
                "Wrote my first novel in 90 days. Would have taken me years without LOCKED holding me accountable.",
              saved: "$1,000",
            },
            {
              name: "Alex Rivera",
              role: "Fitness Coach",
              content:
                "Lost 20 pounds in 3 months. Knowing I'd lose $750 kept me going to the gym every day.",
              saved: "$750",
            },
          ].map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
              <p className="text-gray-700 mb-6">{testimonial.content}</p>
              <div className="text-green-600 font-bold">
                ✓ Protected ${testimonial.saved}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
