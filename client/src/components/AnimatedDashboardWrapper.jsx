import React from 'react';
import { motion } from 'framer-motion';
import Dashboard from './Dashboard';

export default function AnimatedDashboardWrapper() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen w-full overflow-y-auto bg-gradient-to-tr from-blue-100 via-white to-purple-100 px-6 py-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="max-w-[1600px] mx-auto">
        <Dashboard />
      </div>
    </motion.div>
  );
}