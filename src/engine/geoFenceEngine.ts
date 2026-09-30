/**
 * Geo-Fencing & Established ISP Zone Validation Engine
 * Calculates geodesic distance via Haversine formula and checks whether a session's
 * IP geocoordinates and autonomous system number (ASN) fall outside the household's
 * established residential ISP zone.
 */

import { GeoFenceZone, GeoFenceBreachEvent } from '../types/drm';

export const ESTABLISHED_HOME_ZONES: Record<string, GeoFenceZone> = {
  chennai_primary: {
    homeName: 'Primary Household (Living Room OTT)',
    establishedIsp: 'ACT Fibernet (Beam Telecom)',
    establishedAsn: 'AS133694',
    centerCoordinates: { lat: 13.0827, lng: 80.2707 }, // Chennai, India
    radiusKm: 45, // Residential metro radius
    city: 'Chennai',
    country: 'India',
  },
  london_student: {
    homeName: 'London Student Residence',
    establishedIsp: 'British Telecommunications (BT)',
    establishedAsn: 'AS2856',
    centerCoordinates: { lat: 51.5074, lng: -0.1278 }, // London, UK
    radiusKm: 35,
    city: 'London',
    country: 'United Kingdom',
  },
  dubai_commute: {
    homeName: 'Dubai Corporate Apartment',
    establishedIsp: 'Emirates Integrated Telecommunications (du)',
    establishedAsn: 'AS15802',
    centerCoordinates: { lat: 25.2048, lng: 55.2708 }, // Dubai, UAE
    radiusKm: 30,
    city: 'Dubai',
    country: 'United Arab Emirates',
  },
};

/**
 * Calculates geodesic distance in kilometers between two lat/lng coordinates.
 */
export function calculateHaversineDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Evaluates whether an incoming stream request breaks geofencing boundaries.
 */
export function evaluateGeoFenceAnomaly(
  sessionCoords: { lat: number; lng: number },
  sessionIsp: string,
  sessionAsn: string,
  sessionCity: string,
  sessionCountry: string,
  ipMasked: string,
  sessionId: string,
  userId: string = 'usr_8f3d01b',
  zoneKey: string = 'chennai_primary'
): { isBreached: boolean; breachEvent?: GeoFenceBreachEvent; distanceKm: number } {
  const homeZone = ESTABLISHED_HOME_ZONES[zoneKey] || ESTABLISHED_HOME_ZONES.chennai_primary;
  const distanceKm = calculateHaversineDistanceKm(homeZone.centerCoordinates, sessionCoords);

  const isOutsideRadius = distanceKm > homeZone.radiusKm;
  const isAsnMismatch = sessionAsn.trim().toUpperCase() !== homeZone.establishedAsn.trim().toUpperCase();

  if (isOutsideRadius) {
    const breachEvent: GeoFenceBreachEvent = {
      id: `geo_breach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      establishedZone: homeZone,
      detectedSession: {
        ipMasked,
        isp: sessionIsp,
        asn: sessionAsn,
        city: sessionCity,
        country: sessionCountry,
        coordinates: sessionCoords,
      },
      distanceKm,
      breachSeverity: distanceKm > 500 ? 'CRITICAL' : 'HIGH',
      suggestedAction: distanceKm > 500 ? 'RESTRICT_STREAM' : 'STEP_UP_MFA',
    };

    return {
      isBreached: true,
      breachEvent,
      distanceKm,
    };
  }

  return {
    isBreached: false,
    distanceKm,
  };
}

export interface BaselineUpdateResponse {
  success: boolean;
  updatedClusterId: string;
  newCentroid: {
    lat: number;
    lng: number;
    city: string;
    asn: string;
    isp: string;
  };
  historicalConsistencyRecalibrated: number;
  modelVersion: string;
  timestamp: string;
  message: string;
}

/**
 * Triggers an API call to the Anomaly Detection Engine to update the behavioral baseline,
 * incorporating the false positive session coordinates & ASN into the allowed cluster baseline.
 */
export async function updateAnomalyEngineBaseline(
  breachEvent: GeoFenceBreachEvent,
  operatorReason: string = 'Operator verified legitimate access'
): Promise<BaselineUpdateResponse> {
  // Simulate network roundtrip latency to the ML Anomaly Detection backend
  await new Promise(resolve => setTimeout(resolve, 550));

  // Add the newly validated zone into active recognized territories
  const newZoneKey = `travel_${breachEvent.detectedSession.city.toLowerCase().replace(/\s+/g, '_')}`;
  ESTABLISHED_HOME_ZONES[newZoneKey] = {
    homeName: `Authorized Roaming (${breachEvent.detectedSession.city})`,
    establishedIsp: breachEvent.detectedSession.isp,
    establishedAsn: breachEvent.detectedSession.asn,
    centerCoordinates: breachEvent.detectedSession.coordinates,
    radiusKm: 60,
    city: breachEvent.detectedSession.city,
    country: breachEvent.detectedSession.country,
  };

  return {
    success: true,
    updatedClusterId: `cluster_${newZoneKey}`,
    newCentroid: {
      lat: breachEvent.detectedSession.coordinates.lat,
      lng: breachEvent.detectedSession.coordinates.lng,
      city: breachEvent.detectedSession.city,
      asn: breachEvent.detectedSession.asn,
      isp: breachEvent.detectedSession.isp,
    },
    historicalConsistencyRecalibrated: 0.94,
    modelVersion: 'v2.4.1-baseline-recalibrated',
    timestamp: new Date().toISOString(),
    message: `Anomaly detection baseline recalibrated via API. Added ${breachEvent.detectedSession.city} (${breachEvent.detectedSession.coordinates.lat.toFixed(2)}°, ${breachEvent.detectedSession.coordinates.lng.toFixed(2)}°) and ASN ${breachEvent.detectedSession.asn} to behavioral clusters. Reason: ${operatorReason}.`,
  };
}
