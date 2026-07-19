import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Payment from "./pages/Payment";
import Admin from "./pages/Admin";

function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="screen center">A carregar...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      {/* HashRouter: funciona no GitHub Pages sem configuração de servidor */}
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/treino/:planId" element={<PrivateRoute><Workout /></PrivateRoute>} />
          <Route path="/pagamento" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
