import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Package, MapPin, Clock, Scale } from 'lucide-react';

const Donate = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    food_type: '',
    quantity: '',
    expiry_time: '',
    location: user?.location || ''
  });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  // Redirect if not eligible
  if (!user) {
    return <div className="page-container" style={{ textAlign: 'center' }}><h2>Please <a href="/login" className="text-gradient">login</a> to donate food.</h2></div>;
  }
  if (user.role !== 'donor' && user.role !== 'admin') {
    return <div className="page-container" style={{ textAlign: 'center' }}><h2>Only donor accounts can post food donations.</h2></div>;
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to post donation');

      setStatus({ loading: false, error: '', success: 'Donation posted successfully! NGOs will be notified.' });
      setFormData({ food_type: '', quantity: '', expiry_time: '', location: user.location });
      
      setTimeout(() => navigate('/requests'), 2000);
    } catch (err) {
      setStatus({ loading: false, error: err.message, success: '' });
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <div className="card glass-container" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package className="text-primary" /> Donate Surplus Food
        </h2>
        
        {status.error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>{status.error}</div>}
        {status.success && <div style={{ color: 'var(--accent)', marginBottom: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>{status.success}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>What kind of food are you donating?</label>
            <div style={{ position: 'relative' }}>
              <Package size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                name="food_type"
                className="input-field" 
                placeholder="e.g. 50 boxes of Rice & Curry, 10 Loaves of Bread" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.food_type}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Quantity Detail</label>
            <div style={{ position: 'relative' }}>
              <Scale size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                name="quantity"
                className="input-field" 
                placeholder="e.g. 50 kg, Feeds ~100 people" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Expiry Date & Time (Crucial)</label>
            <div style={{ position: 'relative' }}>
              <Clock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="datetime-local" 
                name="expiry_time"
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.expiry_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Pickup Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                name="location"
                className="input-field" 
                placeholder="Complete Pickup Address" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }} disabled={status.loading}>
            {status.loading ? 'Posting...' : 'Post Donation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Donate;
