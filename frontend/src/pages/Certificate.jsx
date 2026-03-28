import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Award, Printer, Ribbon } from 'lucide-react';
import toast from 'react-hot-toast';

const Certificate = () => {
  const { user, token } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalDelivered: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    // We can fetch the donor's requests that have status 'delivered'
    const fetchDonorStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/requests/donor', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Assuming 'delivered' maps to 'delivered' in the backend later, or just counting accepted ones
          // Based on backend logic: request status stays 'accepted', but donation status is 'delivered'.
          // To keep it simple, let's just count 'accepted' requests as successfully matched donations
          const matched = data.filter(r => r.request_status === 'accepted');
          setStats({ totalDelivered: matched.length });
        } else {
          toast.error("Failed to load certificate data");
        }
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'donor') {
      fetchDonorStats();
    }
  }, [user, token]);

  const handlePrint = () => {
    window.print();
  };

  if (!user || user.role !== 'donor') {
    return <div className="page-container"><h2>Certificates are only available for Donors.</h2></div>;
  }

  if (loading) return <div className="page-container">Generating Certificate...</div>;

  if (stats.totalDelivered === 0) {
    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>No matched donations yet.</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Your certificate will unlock after your first successful donation is accepted by an NGO!</p>
      </div>
    );
  }

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Print Instructions */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-print-area, #certificate-print-area * { visibility: visible; }
          #certificate-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '800px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award className="text-secondary" size={32} /> Your Hall of Fame
        </h2>
        <button onClick={handlePrint} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      <div id="certificate-print-area" ref={printRef} style={{ 
        width: '100%', maxWidth: '800px', 
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255,255,255,0.95) 100%)',
        border: '15px solid var(--primary)', borderRadius: '12px',
        padding: '4rem', textAlign: 'center', position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        
        <Ribbon size={64} style={{ position: 'absolute', top: '2rem', right: '3rem', color: 'var(--secondary)' }} />
        <Award size={64} style={{ position: 'absolute', top: '2rem', left: '3rem', color: 'var(--accent)' }} />
        
        <h1 style={{ fontSize: '3rem', fontFamily: 'serif', color: 'var(--primary)', marginBottom: '0.5rem' }}>CERTIFICATE</h1>
        <h2 style={{ fontSize: '1.5rem', fontFamily: 'serif', letterSpacing: '4px', color: 'var(--text-secondary)', marginBottom: '3rem' }}>OF APPRECIATION</h2>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>THIS DOCUMENT IS PROUDLY PRESENTED TO</p>
        
        <h3 style={{ fontSize: '2.5rem', color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', display: 'inline-block', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
          {user.name.toUpperCase()}
        </h3>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          For outstanding generosity and profound commitment to ending hunger. 
          Your contribution of <strong style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>{stats.totalDelivered} successful food donations</strong> has fed those in dire need and built a stronger, more compassionate community.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: '4rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid var(--text-primary)', width: '200px', marginBottom: '0.5rem' }}></div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System Administrator</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <strong style={{ fontSize: '1.2rem', display: 'block', marginBottom: '0.5rem', color: 'var(--primary)' }}>FoodShare Platform</strong>
            <span style={{ borderBottom: '1px solid var(--text-primary)', width: '150px', display: 'block', margin: '0 auto 0.5rem auto' }}>{date}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date Issued</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Certificate;
