"use cache";
const Footer = async () => {
  return (
    <footer className="py-6">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-xl font-bold">LOCKED</span>
          </div>

          <div className="flex space-x-8">
            <a href="#" className="text-gray-600 hover:text-black">
              Privacy
            </a>
            <a href="#" className="text-gray-600 hover:text-black">
              Terms
            </a>
            <a href="#" className="text-gray-600 hover:text-black">
              Contact
            </a>
            <a href="#" className="text-gray-600 hover:text-black">
              Twitter
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-gray-600">
          <p>© {new Date().getFullYear()} LOCKED. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
