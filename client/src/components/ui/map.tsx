import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type Location = {
  lat: number;
  lng: number;
};

type Marker = Location & {
  id: string | number;
  title: string;
  popup?: string;
};

type MapProps = {
  center?: Location;
  zoom?: number;
  markers?: Marker[];
  height?: string;
  width?: string;
  onMarkerClick?: (id: string | number) => void;
  className?: string;
};

export function Map({
  center = { lat: 40.7128, lng: -74.006 }, // Default to NYC
  zoom = 13,
  markers = [],
  height = '400px',
  width = '100%',
  onMarkerClick,
  className = '',
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if it doesn't exist
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);
    } else {
      // Update center and zoom if map already exists
      leafletMap.current.setView([center.lat, center.lng], zoom);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Handle markers
  useEffect(() => {
    if (!leafletMap.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Add new markers
    markers.forEach(markerData => {
      const marker = L.marker([markerData.lat, markerData.lng])
        .addTo(leafletMap.current!);
      
      if (markerData.popup) {
        marker.bindPopup(markerData.popup);
      } else if (markerData.title) {
        marker.bindTooltip(markerData.title);
      }

      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(markerData.id);
        });
      }

      markersRef.current[markerData.id.toString()] = marker;
    });

    // Auto-fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (markers.length === 1) {
      leafletMap.current.setView([markers[0].lat, markers[0].lng], zoom);
    }
  }, [markers, onMarkerClick]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width }}
      className={`rounded-md border border-border shadow-sm ${className}`}
    />
  );
}
