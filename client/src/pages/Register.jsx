import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext'; // Add this import

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useSession(); // Add this line

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('🚀 Attempting registration with:', { username: form.username });
      
      const response = await api.post('/auth/register', {
        username: form.username,
        password: form.password
      });
      
      console.log('✅ Registration response:', response.data);
      
      // Check if response has required fields
      if (!response.data.token) {
        throw new Error('No token received from server');
      }
      if (!response.data.user) {
        throw new Error('No user data received from server');
      }
      
      // Store token
      localStorage.setItem('token', response.data.token);
      console.log('💾 Token stored in localStorage');
      
      // Update session context (THIS WAS MISSING!)
      login(response.data.user);
      console.log('🔐 Session context updated');
      
      console.log('🧭 Navigating to dashboard...');
      navigate('/dashboard');
      
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('📄 Full error object:', err.response);
      
      let errorMessage = 'Registration failed';
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        // Check for user already exists error
        if (err.response.data?.msg?.toLowerCase().includes('user') && 
            (err.response.data.msg.toLowerCase().includes('exist') || 
             err.response.data.msg.toLowerCase().includes('taken') ||
             err.response.data.msg.toLowerCase().includes('already'))) {
          errorMessage = 'Username already exists. Please choose a different username.';
        } else if (err.response.data?.message?.toLowerCase().includes('user') && 
                   (err.response.data.message.toLowerCase().includes('exist') || 
                    err.response.data.message.toLowerCase().includes('taken') ||
                    err.response.data.message.toLowerCase().includes('already'))) {
          errorMessage = 'Username already exists. Please choose a different username.';
        } else {
          // Use server error message if available
          errorMessage = err.response.data?.msg || err.response.data?.message || 'Invalid registration data';
        }
      } else if (err.response?.status === 409) {
        // 409 Conflict - typically used for duplicate resources
        errorMessage = 'Username already exists. Please choose a different username.';
      } else if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join our file transfer platform</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}