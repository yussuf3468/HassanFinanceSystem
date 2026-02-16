import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Heart,
} from "lucide-react";
import Container from "./Container";

export default function StorefrontFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white">
      {/* Main Footer */}
      <Container className="py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-2xl">H</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">HORUMAR</h3>
                <p className="text-xs text-amber-200">
                  Your Business. Your Progress.
                </p>
              </div>
            </div>
            <p className="text-sm text-amber-100">
              Premium educational materials, stationery, and electronics in
              Eastleigh, Nairobi. Quality products for students and
              professionals.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-amber-300">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Shop All Products
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Track Your Order
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-amber-300">
              Categories
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Books & Textbooks
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  School Supplies
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Electronics
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Backpacks & Bags
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-amber-100 hover:text-white transition-colors"
                >
                  Stationery
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-amber-300">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <span className="text-amber-100">
                  Global Apartments, Eastleigh, Nairobi
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/254722979547"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-100 hover:text-white transition-colors duration-200 flex items-center gap-2 min-h-[44px] -my-2 py-2"
                  aria-label="Contact us on WhatsApp"
                >
                  <span>+254 722 979 547</span>
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                    WhatsApp
                  </span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                <span className="text-amber-100">yussufh080@gmail.com</span>
              </li>
            </ul>
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-xs font-semibold text-amber-300 mb-2">
                Business Hours
              </p>
              <p className="text-sm text-amber-100">
                Mon - Sat: 8:00 AM - 11:00 PM
                <br />
                Sunday: 10:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <Container className="py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-quaternary">
            <p className="text-center sm:text-left">
              © {currentYear} Horumar. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-1 text-sm text-white">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>
                by{" "}
                <a
                  href="https://lenzro.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Lenzro
                </a>
              </span>
            </div>

            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
