import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.header
      className="sticky top-0 z-50 bg-black text-white flex justify-between items-center px-6 py-4 shadow-md"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Logo and Brand */}
      <div className="flex items-center space-x-4">
        <img
          src="https://cdn-icons-png.flaticon.com/512/1037/1037316.png"
          alt="FileXpress Logo"
          className="h-10 w-10 rounded"
        />
        <span className="text-2xl font-bold tracking-wide">FileXpress</span>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/features" className="hover:text-gray-300">Features</Link>
        <Link to="/pricing" className="hover:text-gray-300">Pricing</Link>
        <Link to="/blog" className="hover:text-gray-300">Blog</Link>
        <Link to="/contact" className="hover:text-gray-300">Contact</Link>
      </nav>

      {/* Auth Buttons */}
      <div className="flex space-x-3">
        <Link
          to="/login"
          className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-gray-200 transition"
        >
          Log In
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 bg-transparent border border-white text-white font-semibold rounded hover:bg-white hover:text-black transition"
        >
          Sign Up
        </Link>
      </div>
    </motion.header>
  );
}