"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">S</span>
          </div>
          <span>
            Solum <span className="text-blue-500">Health</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/"
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === "/"
              ? "bg-blue-600/10 text-blue-400 font-medium"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Service Requests
        </Link>
        <Link
          href="/dashboard"
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === "/dashboard"
              ? "bg-blue-600/10 text-blue-400 font-medium"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Accuracy Dashboard
        </Link>
        <Link
          href="/upload"
          className={`px-4 py-2 rounded-lg transition-colors ${
            pathname === "/upload"
              ? "bg-blue-600/10 text-blue-400 font-medium"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          New Upload
        </Link>
      </div>
    </nav>
  );
}
