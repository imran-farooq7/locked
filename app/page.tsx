import Features from "@/components/landing-page/features";
import Hero from "@/components/landing-page/hero";
import HIW from "@/components/landing-page/hiw";
import Navbar from "@/components/landing-page/navbar";
import Testimonials from "@/components/landing-page/testimonials";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HIW />
      <Testimonials />
    </div>
  );
};

export default Home;
