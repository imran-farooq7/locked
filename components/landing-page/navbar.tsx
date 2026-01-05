import Link from "next/link";
import React from "react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold">LOCKED</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-black">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-black">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-black">
              Pricing
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-black">
              Testimonials
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-black">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
