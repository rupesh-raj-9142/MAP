import { GeocodingResult } from '../../../types/index.js';
import { GeocodingProvider } from './geocodingProvider.interface.js';

export class MockGeocodingProvider implements GeocodingProvider {
  private locations: GeocodingResult[] = [
    {
      latitude: 25.5941,
      longitude: 85.1376,
      formattedAddress: "Patna, Bihar, India",
      city: "Patna",
      state: "Bihar",
      country: "India"
    },
    {
      latitude: 25.6190,
      longitude: 85.1438,
      formattedAddress: "Golghar, Gandhi Maidan, Patna, Bihar 800001, India",
      city: "Patna",
      state: "Bihar",
      country: "India"
    },
    {
      latitude: 25.3176,
      longitude: 82.9739,
      formattedAddress: "Varanasi, Uttar Pradesh, India",
      city: "Varanasi",
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      latitude: 25.3109,
      longitude: 83.0107,
      formattedAddress: "Kashi Vishwanath Corridor, Varanasi, Uttar Pradesh 221001, India",
      city: "Varanasi",
      state: "Uttar Pradesh",
      country: "India"
    },
    {
      latitude: 26.9124,
      longitude: 75.7873,
      formattedAddress: "Jaipur, Rajasthan, India",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India"
    },
    {
      latitude: 26.9239,
      longitude: 75.8267,
      formattedAddress: "Hawa Mahal, Badi Choupad, Jaipur, Rajasthan 302002, India",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India"
    },
    {
      latitude: 28.6139,
      longitude: 77.2090,
      formattedAddress: "New Delhi, Delhi, India",
      city: "Delhi",
      state: "Delhi",
      country: "India"
    },
    {
      latitude: 28.6129,
      longitude: 77.2295,
      formattedAddress: "India Gate, Rajpath, New Delhi, Delhi 110001, India",
      city: "Delhi",
      state: "Delhi",
      country: "India"
    },
    {
      latitude: 18.9220,
      longitude: 72.8347,
      formattedAddress: "Gateway of India, Colaba, Mumbai, Maharashtra 400001, India",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India"
    },
    {
      latitude: 19.0760,
      longitude: 72.8777,
      formattedAddress: "Mumbai, Maharashtra, India",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India"
    },
    {
      latitude: 22.5726,
      longitude: 88.3639,
      formattedAddress: "Kolkata, West Bengal, India",
      city: "Kolkata",
      state: "West Bengal",
      country: "India"
    },
    {
      latitude: 22.5448,
      longitude: 88.3426,
      formattedAddress: "Victoria Memorial, Queens Way, Kolkata, West Bengal 700071, India",
      city: "Kolkata",
      state: "West Bengal",
      country: "India"
    }
  ];

  async searchLocation(query: string): Promise<GeocodingResult[]> {
    const q = query.toLowerCase().trim();
    const matches = this.locations.filter(loc =>
      loc.formattedAddress.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      (loc.state && loc.state.toLowerCase().includes(q))
    );

    if (matches.length > 0) return matches;

    // Fallback default: if user typed something arbitrary like "Patna Station", return Patna hub
    for (const loc of this.locations) {
      if (q.includes(loc.city.toLowerCase())) {
        return [loc];
      }
    }

    return [this.locations[0]]; // Return Patna as default hub
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    let nearest: GeocodingResult | null = null;
    let minDistance = Infinity;

    for (const loc of this.locations) {
      const d = Math.hypot(loc.latitude - latitude, loc.longitude - longitude);
      if (d < minDistance) {
        minDistance = d;
        nearest = loc;
      }
    }

    return nearest;
  }
}
