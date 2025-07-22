import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Maximize2, Lock, BarChart2, File } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import HeroHeader from '../components/HeroHeader';
import { useEffect } from 'react';
const features = [
  {
    title: 'Fast & Secure',
    description: 'Transfer your files with end‑to‑end encryption.',
    Icon: ShieldCheck,
  },
  {
    title: 'Real‑Time Updates',
    description: 'Watch your transfer progress in real time.',
    Icon: Activity,
  },
  {
    title: 'No Size Limits',
    description: 'Send files up to 10 MB instantly.',
    Icon: Maximize2,
  },
];

const stories = [
  {
    user: 'Aarav S.',
    tweet: 'Used FileXpress to send confidential reports to my team—fast and 100% encrypted! 🔐',
  },
  {
    user: 'Neha M.',
    tweet: 'Absolutely love the private transfer option. FileXpress made sharing big design files a breeze!',
  },
  {
    user: 'Siddharth V.',
    tweet: 'Real-time updates while uploading is a life saver. Beautiful UI and seamless experience 💻✨',
  },
];

export default function Home() {

  useEffect(() => {
    document.title = "FileXpress – Secure File Transfer"; // Customize as needed
  }, []);
  return (

    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 text-gray-800 scroll-smooth">
      <Navbar />

      <HeroHeader />

      {/* Features */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6 bg-white rounded-xl shadow-lg flex flex-col items-center text-center hover:scale-105 transition"
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 * i, duration: 0.6 }}
            >
              <f.Icon className="w-12 h-12 text-maroon-700 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-800">{f.title}</h3>
              <p className="text-gray-600">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>


      {/* Stories / Tweets */}
      <section className="py-16 bg-amber-300">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-maroon-700 mb-4">What People Are Saying</h2>
          <p className="text-gray-600">Real feedback from real users who love FileXpress</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {stories.map((s, i) => (
            <motion.div
              key={s.user}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl border-t-4 border-maroon-700"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 * i, duration: 0.6 }}
            >
              <p className="text-gray-700 italic">“{s.tweet}”</p>
              <div className="mt-4 text-right font-semibold text-maroon-700">— {s.user}</div>
            </motion.div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
