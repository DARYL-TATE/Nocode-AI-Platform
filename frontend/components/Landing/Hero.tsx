'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-white pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Simplify Data Analysis & <br />
            <span className="text-blue-600">Machine Learning</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Easily analyze data, build machine learning models, and visualize results 
            without needing to code. Perfect for data of all skill levels.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}