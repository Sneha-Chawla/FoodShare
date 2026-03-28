import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not showing correctly in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ donations }) => {
  const [center, setCenter] = useState([40.7128, -74.0060]); // Fallback to NYC if location denied

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCenter([position.coords.latitude, position.coords.longitude]),
        (err) => console.log("Geolocation denied or unavailable:", err)
      );
    }
  }, []);

  // Helper to mock lat/lng from a string just to spread pins out for demo
  const getMockCoordinates = (str, index) => {
    // Generate a slight random offset from the center based on index
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    return [center[0] + latOffset, center[1] + lngOffset];
  };

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '2rem' }}>
      <MapContainer key={`${center[0]}-${center[1]}`} center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {donations.map((d, index) => (
          <Marker key={d.id} position={d.latLng || getMockCoordinates(d.location, index)}>
            <Popup>
              <strong>{d.food_type}</strong><br/>
              Quantity: {d.quantity}<br/>
              Location: {d.location}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
