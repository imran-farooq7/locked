import Link from "next/link";

const CTA = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Achieve Your Goals?
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands who have transformed their productivity with financial
          accountability
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800"
          >
            Start Free Trial
          </Link>
          <Link
            href="/demo"
            className="border-2 border-black text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50"
          >
            Schedule a Demo
          </Link>
        </div>

        <div className="mt-10 text-gray-500 text-sm">
          <p>
            No credit card required • 7-day money-back guarantee • Cancel
            anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
