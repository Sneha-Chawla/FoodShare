import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Activity, Users, Package, CheckCircle, BrainCircuit } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [stats, setStats] = useState({ users: 0, donationsTotal: 0, donationsDelivered: 0, requests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          toast.error('Failed to load analytics');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user, token]);

  if (!user || user.role !== 'admin') return <div className="page-container"><h2>Access Denied. Admins only.</h2></div>;
  if (loading) return <div className="page-container">Loading analytics...</div>;

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity className="text-primary" size={32} /> Platform Analytics
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="card glass-container" style={{ textAlign: 'center' }}>
          <Users size={40} className="text-secondary" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Total Users</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{stats.users}</p>
        </div>
        
        <div className="card glass-container" style={{ textAlign: 'center' }}>
          <Package size={40} className="text-accent" style={{ margin: '0 auto 1rem auto' }} />
          <h3>Donations Posted</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{stats.donationsTotal}</p>
        </div>
        
        <div className="card glass-container" style={{ textAlign: 'center' }}>
          <CheckCircle size={40} style={{ color: 'var(--accent)', margin: '0 auto 1rem auto' }} />
          <h3>Meals Delivered</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{stats.donationsDelivered}</p>
        </div>

        <div className="card glass-container" style={{ textAlign: 'center' }}>
          <Activity size={40} className="text-secondary" style={{ margin: '0 auto 1rem auto' }} />
          <h3>NGO Requests</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{stats.requests}</p>
        </div>
      </div>

      <h3 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BrainCircuit className="text-accent" size={28} /> AI Demand Prediction (Mock)
      </h3>
      <div className="card glass-container" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <strong>Predicted High-Need Area</strong>
          <strong style={{ color: 'var(--danger)' }}>Urgency Level</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <span>Downtown Shelter District (Based on historical request volume)</span>
          <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>98% Critical</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <span>East Side Community Center</span>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>75% High</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <span>West End Orphanage</span>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>42% Moderate</span>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>* This AI model uses past request frequency, local weather APIs, and public holidays to predict impending food shortages.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
