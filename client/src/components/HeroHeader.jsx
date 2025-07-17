import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart2, ShieldCheck, Users, Zap } from 'lucide-react';

const colorClasses = [
  'from-purple-800 to-pink-600',
  'from-indigo-700 to-blue-500',
  'from-rose-800 to-red-500',
  'from-emerald-700 to-lime-500',
];

export default function HeroHeader() {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colorClasses.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section
      className={`min-h-[90vh] flex flex-col justify-center items-center text-center px-6 py-16 text-white bg-gradient-to-br ${colorClasses[colorIndex]} transition-all duration-1000`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1
        className="text-5xl font-extrabold mb-4 drop-shadow-lg"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Welcome to <span className="text-yellow-300">FileXpress</span>
      </motion.h1>

      <motion.p
        className="text-lg max-w-2xl mb-8 text-white/90"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Transfer files securely and instantly — built for creators, professionals, and teams.
      </motion.p>

      {/* Stats section inside hero */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-8"
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <Stat icon={<BarChart2 className="w-8 h-8 text-white" />} label="Files Shared" value="10,000+" />
        <Stat icon={<ShieldCheck className="w-8 h-8 text-white" />} label="Secure Transfers" value="100%" />
        <Stat icon={<Users className="w-8 h-8 text-white" />} label="Active Users" value="2,500+" />
      </motion.div>
    </motion.section>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <h4 className="text-2xl font-bold mt-2">{value}</h4>
      <p className="text-sm text-white/80">{label}</p>
    </div>
  );
}
