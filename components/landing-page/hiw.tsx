import { ArrowRight } from "lucide-react";
import Link from "next/link";

const HIW = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How LOCKED Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple setup. Serious commitment. Real results.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Set Your Goal",
              description:
                "Define exactly what you want to achieve and by when.",
            },
            {
              step: "02",
              title: "Set the Stakes",
              description:
                "Choose a penalty amount that will actually motivate you.",
            },
            {
              step: "03",
              title: "Provide Proof",
              description:
                "Submit evidence before your deadline to avoid the penalty.",
            },
            {
              step: "04",
              title: "Succeed or Pay",
              description:
                "Achieve your goal or automatically pay your penalty.",
            },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800"
          >
            Start Your First Goal
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="text-gray-500 mt-4">No credit card required to start</p>
        </div>
      </div>
    </section>
  );
};

export default HIW;
