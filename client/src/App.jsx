import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { useSession } from './context/SessionContext';

export default function App() {
  const { user } = useSession();
  const isAuth = !!user;

  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<Home />} />

      {/* Auth routes */}
      <Route
        path="/login"
        element={!isAuth ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/register"
        element={!isAuth ? <Register /> : <Navigate to="/dashboard" replace />}
      />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={isAuth ? <Dashboard /> : <Navigate to="/login" replace />}
      />

      {/* Catch‑all */}
      <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}
