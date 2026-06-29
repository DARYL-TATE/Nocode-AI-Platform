import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-xl min-h-screen p-6">
      <h1 className="text-3xl font-bold text-blue-500">
        SmartML
      </h1>

      <div className="mt-10 space-y-6">
        <Link href="/dashboard" className="block text-gray-700 font-semibold">
          Dashboard
        </Link>

        <Link href="#" className="block text-gray-700 font-semibold">
          Upload Dataset
        </Link>

        <Link href="#" className="block text-gray-700 font-semibold">
          Data Overview
        </Link>

        <Link href="#" className="block text-gray-700 font-semibold">
          Data Preprocessing
        </Link>

        <Link href="#" className="block text-gray-700 font-semibold">
          ML Model
        </Link>

        <Link href="#" className="block text-gray-700 font-semibold">
          Results & Visualization
        </Link>
      </div>
    </div>
  );
}