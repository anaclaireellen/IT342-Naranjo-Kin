import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Landing from './features/auth/Landing';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Dashboard from './features/dashboard/Dashboard';
import BorrowHub from './features/borrowing/BorrowHub';
import RequestItem from './features/borrowing/RequestItem';
import ProfileSettings from './features/profile/ProfileSettings';

function App() {
  // Use localStorage to keep the user logged in even if they refresh the page
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuth") === "true"
  );

  // Update localStorage whenever auth state changes
  useEffect(() => {
    localStorage.setItem("isAuth", isAuthenticated);
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        {/* --- 1. Public Routes --- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />

        {/* --- 2. Protected Routes --- */}
        {/* We check isAuthenticated for all of these to keep the app secure */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard setAuth={setIsAuthenticated} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/borrow" 
          element={isAuthenticated ? <BorrowHub /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/request" 
          element={isAuthenticated ? <RequestItem /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/settings" 
          element={isAuthenticated ? <ProfileSettings /> : <Navigate to="/login" />} 
        />

        {/* --- 3. Catch-all (Redirects unknown URLs to Landing) --- */}
        {/* IMPORTANT: This must be the very last route in the list */}
        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </Router>
  );
}

export default App;
