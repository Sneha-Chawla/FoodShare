import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Truck, MapPin, CheckCircle, Navigation, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/volunteer/tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTasks(data);
    } catch (err) { console.error(err); }
  };

  const fetchMyTasks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/volunteer/my-tasks', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMyTasks(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user && user.role === 'volunteer') {
      fetchTasks();
      fetchMyTasks();
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for new accepted requests that volunteers can pick up
    const handleRequestAccepted = () => {
      fetchTasks();
    };

    socket.on('request_accepted', handleRequestAccepted);
    return () => socket.off('request_accepted', handleRequestAccepted);
  }, [socket]);

  const claimTask = async (donationId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/volunteer/tasks/${donationId}/pickup`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Task claimed! Proceed to pickup location.');
        fetchTasks();
        fetchMyTasks();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to claim task');
      }
    } catch (err) { console.error(err); }
  };

  const completeDelivery = async (donationId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/volunteer/tasks/${donationId}/deliver`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Delivery Completed! Great job!');
        fetchMyTasks();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to complete delivery');
      }
    } catch (err) { console.error(err); }
  };

  if (!user || user.role !== 'volunteer') return <div className="page-container"><h2>Access denied.</h2></div>;
  if (loading) return <div className="page-container">Loading tasks...</div>;

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Truck className="text-accent" /> Volunteer Delivery Dashboard
      </h2>

      {/* Active Assignments */}
      {myTasks.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>My Active Deliveries</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {myTasks.filter(t => t.status === 'picked').map(t => (
              <div key={t.donation_id} className="card glass-container" style={{ borderLeft: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{t.food_type}</h4>
                  <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent)', borderRadius: 'var(--radius-full)' }}>Picked Up</span>
                </div>
                <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>Quantity: {t.quantity}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <MapPin size={18} className="text-secondary" />
                    <div style={{ fontSize: '0.9rem' }}>
                      <strong>Deliver To {t.ngo_name}:</strong><br/>
                      {t.delivery_location}
                    </div>
                  </div>
                </div>
                <button onClick={() => completeDelivery(t.donation_id)} className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  <CheckCircle size={18} /> Mark as Delivered
                </button>
              </div>
            ))}
            {myTasks.filter(t => t.status === 'picked').length === 0 && <p>No active deliveries right now. Claim a task below!</p>}
          </div>

          <h3 style={{ margin: '2rem 0 1rem 0', color: 'var(--text-secondary)' }}>Completed History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {myTasks.filter(t => t.status === 'delivered').map(t => (
              <div key={t.donation_id} className="card glass-container" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', opacity: 0.8 }}>
                <span>{t.food_type} delivered to {t.ngo_name}</span>
                <strong style={{ color: 'var(--accent)' }}>Delivered</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Tasks */}
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>Ready for Pickup (Pending Assignment)</h3>
      {tasks.length === 0 ? (
        <div className="card glass-container" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Info size={24} style={{ margin: '0 auto 1rem auto' }} />
          No food awaits pickup right now. You'll be notified when donations are matched!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {tasks.map(t => (
            <div key={t.id} className="card glass-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>{t.food_type}</h4>
                <strong style={{ fontSize: '0.9rem' }}>{t.quantity}</strong>
              </div>
              
              <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <Navigation size={16} className="text-secondary" />
                  <span style={{ fontSize: '0.9rem' }}><strong>A (Pickup):</strong> {t.donor_name} - {t.pickup_location}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <MapPin size={16} className="text-accent" />
                  <span style={{ fontSize: '0.9rem' }}><strong>B (Dropoff):</strong> {t.ngo_name} - {t.delivery_location}</span>
                </div>
              </div>
              
              <button onClick={() => claimTask(t.id)} className="btn btn-primary" style={{ marginTop: 'auto' }}>
                Claim Pickup
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
