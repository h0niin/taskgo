// src/utils/geocoding.ts

/**
 * Geocodes an address using the Photon OSM API (open source).
 * Returns {lat, lng} or null on failure.
 * Includes User-Agent header as required by Photon.
 */
export const geocodeAddress = async (address: string): Promise<{lat: number; lng: number} | null> => {
  if (!address.trim()) return null;
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'TaskGo-App' } });
    if (!response.ok) return null;
    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature?.geometry?.coordinates) return null;
    const [lng, lat] = feature.geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
};

/**
 * Calculates the distance (in km) between two points using the Haversine formula.
 */
export const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // Earth's radius in km
};

/**
 * Computes the total route distance for a list of stops (addresses or lat/lng).
 * If a stop has lat/lng provided, uses those; otherwise attempts to geocode the address.
 * If geocoding fails for any stop, returns the fallback distance (Kozhikode ↔ NIT Calicut).
 */
export const computeRouteDistance = async (
  stops: { address?: string; lat?: number; lng?: number }[],
): Promise<number> => {
  const fallbackDist = haversineDistance(11.2588, 75.7804, 11.3196773, 75.9316848); // Kozhikode ↔ NIT Calicut

  const resolved: {lat: number; lng: number}[] = [];

  for (const s of stops) {
    if (s.lat && s.lng) {
      resolved.push({ lat: s.lat, lng: s.lng });
      continue;
    }
    if (s.address) {
      const geo = await geocodeAddress(s.address);
      if (geo) {
        resolved.push(geo);
        continue;
      }
    }
    // If we can't geocode this stop, we cannot compute a reliable route distance.
    // Return the fallback distance.
    return fallbackDist;
  }

  // Compute total distance summing each segment
  let total = 0;
  for (let i = 0; i < resolved.length - 1; i++) {
    const a = resolved[i];
    const b = resolved[i + 1];
    total += haversineDistance(a.lat, a.lng, b.lat, b.lng);
  }
  return total;
};