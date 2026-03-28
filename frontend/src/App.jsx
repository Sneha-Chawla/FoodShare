import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Heart, Activity, User, LogIn, LogOut, Menu, X, Moon, Sun, Truck } from 'lucide-react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Donate from './pages/Donate';
import Requests from './pages/Requests';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Certificate from './pages/Certificate';

// Components
const Navbar = ({ toggleTheme, theme }) => {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <nav className="glass-container" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <Heart className="text-secondary" />
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }} className="text-gradient">FoodShare</span>
      </Link>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>Home</Link>
        {(!user || user.role === 'donor') && <Link to="/donate" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>Donate</Link>}
        {user?.role === 'donor' && <Link to="/certificate" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>Certificates</Link>}
        {(!user || user.role !== 'volunteer') && <Link to="/requests" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500 }}>Requests</Link>}
        {user?.role === 'volunteer' && <Link to="/volunteer-dashboard" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems:'center', gap: '0.3rem' }}><Truck size={16}/> Deliveries</Link>}
        {user?.role === 'admin' && <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems:'center', gap: '0.3rem' }}><Activity size={16}/> Admin</Link>}
        
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{user.name}</span>
            <button className="btn btn-outline" onClick={logout} style={{ padding: '0.4rem 1rem' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <LogIn size={18} /> Login
          </Link>
        )}
      </div>
    </nav>
  );
};

// Basic Pages (To be expanded in later phases)
const Home = () => (
  <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
    <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
      Share Food, <span className="text-gradient">Spread Hope</span>
    </h1>
    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
      A modern platform connecting generous donors with NGOs that feed the community. Real-time tracking, seamless matching.
    </p>
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <Link to="/donate" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
        Start Donating
      </Link>
      <Link to="/requests" className="btn btn-outline" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', textDecoration: 'none' }}>
        Learn More
      </Link>
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '5rem', textAlign: 'left' }}>
      <div className="card glass-container">
        <Activity className="text-primary" size={32} style={{ marginBottom: '1rem' }} />
        <h3>Real-Time Tracking</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Watch your donation from pickup to delivery on live maps.</p>
      </div>
      <div className="card glass-container">
        <User className="text-secondary" size={32} style={{ marginBottom: '1rem' }} />
        <h3>Role Based Access</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Tailored dashboards for Donors, NGOs, and Volunteers.</p>
      </div>
    </div>
  </div>
);

const App = () => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <Router>
      <Toaster position="bottom-right" toastOptions={{ style: { background: 'var(--surface)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' } }} />
      <div style={{ minHeight: '100vh' }}>
        <Navbar toggleTheme={toggleTheme} theme={theme} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/certificate" element={<Certificate />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
