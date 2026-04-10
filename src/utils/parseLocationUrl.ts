/**
 * Parses latitude and longitude from various map URL formats:
 * - geo:LAT,LNG
 * - https://maps.google.com/?q=LAT,LNG
 * - https://www.google.com/maps?q=LAT,LNG
 * - https://www.google.com/maps/@LAT,LNG,...
 * - https://www.google.com/maps/place/.../@LAT,LNG,...
 * - https://maps.app.goo.gl/... (resolved after redirect)
 * - https://goo.gl/maps/...
 * - Any URL with lat/lng or latitude/longitude query params
 */
export interface ParsedLocation {
  latitude: number;
  longitude: number;
}

export function parseLocationUrl(url: string): ParsedLocation | null {
  try {
    // geo:LAT,LNG or geo:LAT,LNG?q=LAT,LNG(label)
    if (url.startsWith('geo:')) {
      const geoPath = url.replace('geo:', '').split('?')[0];
      const [lat, lng] = geoPath.split(',').map(Number);
      if (isValidCoord(lat, lng)) {
        return {latitude: lat, longitude: lng};
      }
      // Try q= param: geo:0,0?q=LAT,LNG(label)
      const qMatch = url.match(/[?&]q=(-?[\d.]+),(-?[\d.]+)/);
      if (qMatch) {
        const qLat = Number(qMatch[1]);
        const qLng = Number(qMatch[2]);
        if (isValidCoord(qLat, qLng)) {
          return {latitude: qLat, longitude: qLng};
        }
      }
    }

    // Google Maps @LAT,LNG pattern (in path)
    const atMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
    if (atMatch) {
      const lat = Number(atMatch[1]);
      const lng = Number(atMatch[2]);
      if (isValidCoord(lat, lng)) {
        return {latitude: lat, longitude: lng};
      }
    }

    // ?q=LAT,LNG or &q=LAT,LNG
    const qMatch = url.match(/[?&]q=(-?[\d.]+),(-?[\d.]+)/);
    if (qMatch) {
      const lat = Number(qMatch[1]);
      const lng = Number(qMatch[2]);
      if (isValidCoord(lat, lng)) {
        return {latitude: lat, longitude: lng};
      }
    }

    // ?query=LAT,LNG
    const queryMatch = url.match(/[?&]query=(-?[\d.]+),(-?[\d.]+)/);
    if (queryMatch) {
      const lat = Number(queryMatch[1]);
      const lng = Number(queryMatch[2]);
      if (isValidCoord(lat, lng)) {
        return {latitude: lat, longitude: lng};
      }
    }

    // ?destination=LAT,LNG
    const destMatch = url.match(/[?&]destination=(-?[\d.]+),(-?[\d.]+)/);
    if (destMatch) {
      const lat = Number(destMatch[1]);
      const lng = Number(destMatch[2]);
      if (isValidCoord(lat, lng)) {
        return {latitude: lat, longitude: lng};
      }
    }

    // Generic lat/lng query params
    const parsed = new URL(url);
    const latParam =
      parsed.searchParams.get('lat') ?? parsed.searchParams.get('latitude');
    const lngParam =
      parsed.searchParams.get('lng') ??
      parsed.searchParams.get('lon') ??
      parsed.searchParams.get('longitude');
    if (latParam && lngParam) {
      const lat = Number(latParam);
      const lng = Number(lngParam);
      if (isValidCoord(lat, lng)) {
        return {latitude: lat, longitude: lng};
      }
    }
  } catch {
    // URL parsing failed, try regex fallback
  }

  // Last resort: find any pair of decimal numbers that look like coordinates
  const fallback = url.match(/(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})/);
  if (fallback) {
    const lat = Number(fallback[1]);
    const lng = Number(fallback[2]);
    if (isValidCoord(lat, lng)) {
      return {latitude: lat, longitude: lng};
    }
  }

  return null;
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    (lat !== 0 || lng !== 0) // ignore 0,0 placeholder
  );
}
