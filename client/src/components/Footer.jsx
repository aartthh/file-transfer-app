import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 px-6 py-10 mt-10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="text-white font-semibold mb-4">About</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Company</Link></li>
            <li><Link to="/" className="hover:text-white">How it Works</Link></li>
            <li><Link to="/" className="hover:text-white">Pricing</Link></li>
            <li><Link to="/" className="hover:text-white">Careers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Support</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Help Center</Link></li>
            <li><Link to="/" className="hover:text-white">Safety Center</Link></li>
            <li><Link to="/" className="hover:text-white">Community Guidelines</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/" className="hover:text-white">Terms of Service</Link></li>
            <li><Link to="/" className="hover:text-white">Cookie Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Connect</h4>
          <ul className="space-y-2">
            <li><a href="mailto:support@filexpress.com" className="hover:text-white">Email Us</a></li>
            <li><Link to="/" className="hover:text-white">Twitter</Link></li>
            <li><Link to="/" className="hover:text-white">LinkedIn</Link></li>
            <li><Link to="/" className="hover:text-white">Instagram</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} FileXpress. All rights reserved.
      </div>
    </footer>
  );
}
