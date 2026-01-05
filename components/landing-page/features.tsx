import { Shield, TrendingUp, Zap } from "lucide-react";

const Features = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why LOCKED Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional goal-setting fails because there's no real consequence.
            We fix that with automated accountability.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border hover:border-black transition-colors">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Financial Stakes</h3>
            <p className="text-gray-600">
              Set a penalty amount that actually matters. When money's on the
              line, you'll find motivation you never knew you had.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border hover:border-black transition-colors">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Automated Enforcement</h3>
            <p className="text-gray-600">
              No manual checks or reminders. Our system automatically charges
              penalties if you fail to provide proof by your deadline.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border hover:border-black transition-colors">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Transparent</h3>
            <p className="text-gray-600">
              Powered by Stripe for secure payments. Clear rules, no hidden
              fees, and complete control over your goals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
