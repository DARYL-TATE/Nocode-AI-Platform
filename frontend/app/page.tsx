'use client';

import Link from 'next/link';
import { FiUploadCloud, FiBarChart2, FiCpu, FiTrendingUp } from 'react-icons/fi';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ============ NAVIGATION BAR ============ */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-blue-600">
              SmartML
            </Link>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
            Simplify Data Analysis & <br />
            <span className="text-blue-600">Machine Learning</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Easily analyze data, build machine learning models, and visualize results
            without needing to code. Perfect for data of all skill levels.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-md"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              SmartML Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to build AI models without coding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition border border-gray-100">
              <div className="inline-flex p-4 rounded-xl bg-blue-50 mb-4">
                <FiUploadCloud className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Dataset</h3>
              <p className="text-gray-600">Easily upload CSV, Excel files to get started</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition border border-gray-100">
              <div className="inline-flex p-4 rounded-xl bg-green-50 mb-4">
                <FiBarChart2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Preprocessing</h3>
              <p className="text-gray-600">AI-driven tools to clean and prepare your datasets</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition border border-gray-100">
              <div className="inline-flex p-4 rounded-xl bg-purple-50 mb-4">
                <FiCpu className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Models</h3>
              <p className="text-gray-600">Create machine learning models with just a few clicks</p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition border border-gray-100">
              <div className="inline-flex p-4 rounded-xl bg-orange-50 mb-4">
                <FiTrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visualize Results</h3>
              <p className="text-gray-600">See insights with interactive charts and graphs</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SmartML</h3>
              <p className="text-gray-400">No-code AI platform for data science</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartML. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}