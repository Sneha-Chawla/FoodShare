import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Clock, MapPin, CheckCircle, XCircle, Info, Send, QrCode, Star } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const Requests = () => {
  const { user, token } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [donations, setDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [donorRequests, setDonorRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableDonations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/donations');
      const data = await res.json();
      setDonations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNGORequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/requests/ngo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMyRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDonorRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/requests/donor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDonorRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchAvailableDonations();
      if (user && user.role === 'ngo') {
        await fetchNGORequests();
      }
      if (user && user.role === 'donor') {
        await fetchDonorRequests();
      }
      setLoading(false);
    };
    initData();
  }, [user, token]);

  // Real-time Socket Subscriptions
  useEffect(() => {
    if (!socket) return;

    const handleNewDonation = (newDonation) => {
      setDonations(prev => [newDonation, ...prev]);
    };

    const handleDonationTaken = ({ donation_id }) => {
      setDonations(prev => prev.filter(d => d.id !== donation_id));
    };

    const handleRequestAccepted = ({ request_id, donation_id }) => {
      setMyRequests(prev => prev.map(r => r.request_id === request_id ? { ...r, request_status: 'accepted' } : r));
      toast.success('Awesome! One of your food requests just got accepted!');
    };

    const handleRequestRejected = ({ request_id }) => {
      setMyRequests(prev => prev.map(r => r.request_id === request_id ? { ...r, request_status: 'rejected' } : r));
    };

    socket.on('new_donation', handleNewDonation);
    socket.on('donation_taken', handleDonationTaken);
    socket.on('request_accepted', handleRequestAccepted);
    socket.on('request_rejected', handleRequestRejected);

    return () => {
      socket.off('new_donation', handleNewDonation);
      socket.off('donation_taken', handleDonationTaken);
      socket.off('request_accepted', handleRequestAccepted);
      socket.off('request_rejected', handleRequestRejected);
    };
  }, [socket]);

  const requestDonation = async (donationId) => {
    try {
      const res = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ donation_id: donationId })
      });
      if (res.ok) {
        toast.success('Food request sent successfully!');
        fetchAvailableDonations();
        fetchNGORequests();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to request food');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Request ${status} successfully!`);
        fetchDonorRequests();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="page-container" style={{ textAlign: 'center' }}>Loading resources...</div>;

  const filteredDonations = donations.filter(d => 
    d.food_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.donor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* For Everyone (especially NGOs and Volunteers to see logic) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock className="text-primary" /> Live Food Dashboard
        </h2>
        
        <input 
          type="text" 
          placeholder="Search food, location or donor..." 
          className="input-field"
          style={{ maxWidth: '300px' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      {!user && <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Login as an NGO to request food.</p>}

      {/* Available Donations Section */}
      <div style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Currently Available Donations</h3>
        
        {donations.length > 0 && <MapComponent donations={filteredDonations} />}
        
        {filteredDonations.length === 0 ? (
          <div className="card glass-container" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No pending donations match your search. Check back later!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredDonations.map((d) => (
              <div key={d.id} className="card glass-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary)' }}>{d.food_type}</h4>
                  <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>{d.quantity}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <MapPin size={16} /> {d.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 500 }}>
                  <Clock size={16} /> Expiry: {new Date(d.expiry_time).toLocaleString()}
                </div>
                
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Donor:</strong> {d.donor_name}
                </div>

                {user?.role === 'ngo' && (
                  <button onClick={() => requestDonation(d.id)} className="btn btn-primary" style={{ marginTop: 'auto', padding: '0.7rem' }}>
                    <Send size={16} /> Request Food
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NGO View: My Requests */}
      {user?.role === 'ngo' && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>My Requests</h3>
          {myRequests.length === 0 ? (
            <p>You haven't requested anything yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {myRequests.map(r => (
                <div key={r.request_id} className="card glass-container" style={{ borderLeft: r.request_status === 'accepted' ? '4px solid var(--accent)' : 'min-content' }}>
                  <h4>{r.food_type}</h4>
                  <p>Status: <strong style={{ color: r.request_status === 'accepted' ? 'var(--accent)' : r.request_status === 'rejected' ? 'var(--danger)' : 'var(--text-primary)' }}>{r.request_status.toUpperCase()}</strong></p>
                  <p>Donor: {r.donor_name}</p>
                  
                  {r.request_status === 'accepted' && r.donation_status !== 'delivered' && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <QrCode size={16} /> Show this QR code to the Volunteer at delivery
                      </p>
                      <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: 'var(--radius-md)' }}>
                        <QRCodeSVG value={`pickup-verified-${r.request_id}`} size={120} />
                      </div>
                    </div>
                  )}

                  {r.donation_status === 'delivered' && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Donation Delivered! Rate {r.donor_name}:</p>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', color: '#f59e0b' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={24} style={{ cursor: 'pointer' }} onClick={() => toast.success('Rating submitted. Thank you!')} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Donor View: Inbound Requests */}
      {user?.role === 'donor' && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>Requests for your Donations</h3>
          {donorRequests.length === 0 ? (
            <p>No NGOs have requested your donations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {donorRequests.map(r => (
                <div key={r.request_id} className="card glass-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>NGO: {r.ngo_name} ({r.ngo_email})</h4>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>Requested: <strong style={{color: 'var(--text-primary)'}}>{r.quantity} of {r.food_type}</strong></p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Status: {r.request_status}</p>
                  </div>
                  
                  {r.request_status === 'requested' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={() => updateRequestStatus(r.request_id, 'accepted')} className="btn btn-outline" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                        <CheckCircle size={18} /> Accept
                      </button>
                      <button onClick={() => updateRequestStatus(r.request_id, 'rejected')} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        <XCircle size={18} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Requests;
