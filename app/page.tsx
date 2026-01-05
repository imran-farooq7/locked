import Hero from "@/components/landing-page/hero";
import Navbar from "@/components/landing-page/navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
    </div>
  );
};

export default Home;
