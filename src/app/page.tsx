'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Heart, 
  GraduationCap,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="p-2 bg-gray-900 rounded-xl shadow-lg">
                  <Shield className="w-5 h-5 text-gray-100" />
                </div>
                <span className="text-xl font-bold text-gray-900">VeteranMeet</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                  suppressHydrationWarning={true}
                >
                  <span className="font-medium">Login</span>
                </motion.div>
              </Link>

              <Link href="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg"
                  suppressHydrationWarning={true}
                >
                  <span>Register</span>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium mb-8 shadow-sm"
          >
            <div className="p-1.5 bg-green-50 rounded-lg mr-3">
              <Star className="w-3.5 h-3.5 text-green-600" />
            </div>
            Trusted by 10,000+ Veterans
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Welcome to <span className="text-gray-900">VeteranMeet</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            A dedicated platform connecting veterans with resources, 
            community, and opportunities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-gray-900 px-8 py-3.5 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                Already have an account? Sign In
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How We Help Veterans
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "Community",
                description: "Connect with fellow veterans",
                color: "blue"
              },
              {
                icon: <Briefcase className="w-6 h-6" />,
                title: "Careers",
                description: "Find job opportunities",
                color: "purple"
              },
              {
                icon: <Heart className="w-6 h-6" />,
                title: "Health",
                description: "Access healthcare resources",
                color: "red"
              },
              {
                icon: <GraduationCap className="w-6 h-6" />,
                title: "Education",
                description: "Scholarships & training",
                color: "orange"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 bg-${feature.color}-50 rounded-xl flex items-center justify-center text-${feature.color}-600 mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-20 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2.5 bg-gray-900 rounded-xl">
                <TrendingUp className="w-6 h-6 text-gray-100" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Why Choose VeteranMeet?</h2>
            </div>
            <p className="text-gray-600">Designed specifically for veterans by veterans</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { text: "Free for all veterans", color: "green" },
              { text: "Secure & private platform", color: "blue" },
              { text: "24/7 support available", color: "purple" }
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className={`p-1.5 bg-${benefit.color}-50 rounded-lg`}>
                  <CheckCircle className={`w-5 h-5 text-${benefit.color}-600`} />
                </div>
                <span className="text-gray-900 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-white shadow-xl border border-gray-800">
            <div className="p-3 bg-gray-800 rounded-xl inline-flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-gray-100" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Join Our Community?</h2>
            <p className="mb-8 text-gray-400 max-w-lg mx-auto">
              Create your free account and start connecting today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-gray-900 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-100 transition-all shadow-lg"
                >
                  Create Account
                </motion.button>
              </Link>
              
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-transparent text-white px-8 py-3.5 rounded-xl font-medium border border-gray-700 hover:bg-gray-800 transition-all"
                >
                  Already Registered? Sign In
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-2 bg-gray-800 rounded-xl">
                <Shield className="w-5 h-5 text-gray-100" />
              </div>
              <span className="text-xl font-bold text-gray-100">VeteranMeet</span>
            </div>
            
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Empowering veterans through connection, resources, and support.
            </p>
            
            <div className="flex justify-center space-x-6 mb-8">
              <Link href="/login" className="text-gray-400 hover:text-white transition">
                Login
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-white transition">
                Register
              </Link>
              <a href="#" className="text-gray-400 hover:text-white transition">
                Contact
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                Privacy
              </a>
            </div>
            
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} VeteranMeet. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
