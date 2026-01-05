import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Commit.<span className="text-gray-400"> Or </span>
            <span className="text-red-600">Pay.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            The accountability app that uses financial penalties to ensure you
            actually achieve your goals. No excuses. No procrastination. Just
            results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 inline-flex items-center justify-center"
            >
              Start Your First Goal
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="border-2 border-black text-black px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 inline-flex items-center justify-center"
            >
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold">10,000+</div>
              <div className="text-gray-600">Goals Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">$250K+</div>
              <div className="text-gray-600">In Penalties Protected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">94%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">4.8/5</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
