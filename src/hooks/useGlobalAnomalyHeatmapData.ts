import { useState, useCallback, useMemo } from 'react';

export type AnomalyCategory = 'ALL' | 'DATACENTER_PROXY' | 'RESIDENTIAL_HIJACK' | 'COMMERCIAL_VPN' | 'MOBILE_ROAMING_LEAK';

export interface AnomalyClusterPoint {
  id: string;
  regionName: string;
  country: string;
  coordinates: { lat: number; lng: number };
  intensity: number; // 0.2 to 1.0 (determines radial bloom opacity & radius)
  breachCount: number;
  primaryIsp: string;
  primaryAsn: string;
  riskCategory: 'DATACENTER_PROXY' | 'RESIDENTIAL_HIJACK' | 'COMMERCIAL_VPN' | 'MOBILE_ROAMING_LEAK';
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
  trend: string;
  confidenceScore: number;
}

const INITIAL_ANOMALY_CLUSTERS: AnomalyClusterPoint[] = [
  {
    id: 'cluster_fra_eu',
    regionName: 'Frankfurt Transit Exchange',
    country: 'Germany',
    coordinates: { lat: 50.1109, lng: 8.6821 },
    intensity: 0.95,
    breachCount: 184,
    primaryIsp: 'Hetzner Online GmbH & DE-CIX',
    primaryAsn: 'AS24940',
    riskCategory: 'DATACENTER_PROXY',
    severity: 'CRITICAL',
    trend: '+24% last 6h',
    confidenceScore: 0.96,
  },
  {
    id: 'cluster_ams_nl',
    regionName: 'Amsterdam Cloud & VPN Hub',
    country: 'Netherlands',
    coordinates: { lat: 52.3676, lng: 4.9041 },
    intensity: 0.88,
    breachCount: 134,
    primaryIsp: 'Leaseweb Global / WireGuard Exit',
    primaryAsn: 'AS60781',
    riskCategory: 'COMMERCIAL_VPN',
    severity: 'CRITICAL',
    trend: '+16% last 24h',
    confidenceScore: 0.94,
  },
  {
    id: 'cluster_sfo_us',
    regionName: 'Silicon Valley Ingress',
    country: 'United States',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    intensity: 0.85,
    breachCount: 142,
    primaryIsp: 'Amazon AWS Cloud Infrastructure',
    primaryAsn: 'AS16509',
    riskCategory: 'DATACENTER_PROXY',
    severity: 'HIGH',
    trend: '+9% last 12h',
    confidenceScore: 0.91,
  },
  {
    id: 'cluster_lon_uk',
    regionName: 'London Docklands Exchange',
    country: 'United Kingdom',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    intensity: 0.78,
    breachCount: 96,
    primaryIsp: 'M247 Europe / DigitalOcean Ingress',
    primaryAsn: 'AS9009',
    riskCategory: 'COMMERCIAL_VPN',
    severity: 'HIGH',
    trend: '-3% stabilizing',
    confidenceScore: 0.89,
  },
  {
    id: 'cluster_dxb_ae',
    regionName: 'Dubai Internet City Gateway',
    country: 'United Arab Emirates',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    intensity: 0.72,
    breachCount: 78,
    primaryIsp: 'du Telecom Mobile Roaming Exit',
    primaryAsn: 'AS15802',
    riskCategory: 'MOBILE_ROAMING_LEAK',
    severity: 'ELEVATED',
    trend: '+31% peak hours',
    confidenceScore: 0.87,
  },
  {
    id: 'cluster_sin_sg',
    regionName: 'Singapore Equinix Node',
    country: 'Singapore',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    intensity: 0.82,
    breachCount: 112,
    primaryIsp: 'Singtel International / OVH SAS',
    primaryAsn: 'AS4657',
    riskCategory: 'RESIDENTIAL_HIJACK',
    severity: 'HIGH',
    trend: '+14% last 8h',
    confidenceScore: 0.92,
  },
  {
    id: 'cluster_tyo_jp',
    regionName: 'Tokyo Otemachi Core',
    country: 'Japan',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    intensity: 0.69,
    breachCount: 88,
    primaryIsp: 'SoftBank Telecom / Linode Proxy',
    primaryAsn: 'AS63949',
    riskCategory: 'DATACENTER_PROXY',
    severity: 'ELEVATED',
    trend: '+5% nominal',
    confidenceScore: 0.88,
  },
  {
    id: 'cluster_bom_in',
    regionName: 'Mumbai Subsea Gateway',
    country: 'India',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    intensity: 0.84,
    breachCount: 120,
    primaryIsp: 'Bharti Airtel / Reliance Cross-Zone',
    primaryAsn: 'AS9498',
    riskCategory: 'RESIDENTIAL_HIJACK',
    severity: 'HIGH',
    trend: '+22% evening peak',
    confidenceScore: 0.93,
  },
  {
    id: 'cluster_sao_br',
    regionName: 'São Paulo NAP do Brasil',
    country: 'Brazil',
    coordinates: { lat: -23.5505, lng: -46.6333 },
    intensity: 0.65,
    breachCount: 64,
    primaryIsp: 'Claro Brasil / Net Serviços',
    primaryAsn: 'AS28573',
    riskCategory: 'COMMERCIAL_VPN',
    severity: 'ELEVATED',
    trend: '+8% last 12h',
    confidenceScore: 0.85,
  },
  {
    id: 'cluster_syd_au',
    regionName: 'Sydney Global Switch Hub',
    country: 'Australia',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    intensity: 0.58,
    breachCount: 52,
    primaryIsp: 'Telstra Wholesale / ExpressVPN',
    primaryAsn: 'AS1221',
    riskCategory: 'COMMERCIAL_VPN',
    severity: 'ELEVATED',
    trend: '-2% stable',
    confidenceScore: 0.84,
  },
];

export interface HeatmapDataHookResult {
  isHeatmapActive: boolean;
  toggleHeatmap: () => void;
  setHeatmapActive: (active: boolean) => void;
  clusters: AnomalyClusterPoint[];
  selectedCluster: AnomalyClusterPoint | null;
  selectCluster: (cluster: AnomalyClusterPoint | null) => void;
  isRefreshing: boolean;
  refreshHeatmapData: () => void;
  lastUpdated: string;
  filterCategory: AnomalyCategory;
  setFilterCategory: (category: AnomalyCategory) => void;
  totalBreachCount: number;
  highestRiskCluster: AnomalyClusterPoint;
}

/**
 * Re-renderable map data hook that maintains the global anomaly breach clusters,
 * regional ISP risk patterns, interactive selection, and telemetry refresh capabilities.
 */
export function useGlobalAnomalyHeatmapData(initialActive = false): HeatmapDataHookResult {
  const [isHeatmapActive, setIsHeatmapActive] = useState<boolean>(initialActive);
  const [clusters, setClusters] = useState<AnomalyClusterPoint[]>(INITIAL_ANOMALY_CLUSTERS);
  const [selectedCluster, setSelectedCluster] = useState<AnomalyClusterPoint | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<AnomalyCategory>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string>('Live (10s buffer)');

  const toggleHeatmap = useCallback(() => {
    setIsHeatmapActive(prev => !prev);
  }, []);

  const selectCluster = useCallback((cluster: AnomalyClusterPoint | null) => {
    setSelectedCluster(cluster);
  }, []);

  // Re-renderable refresh function to simulate live telemetry ingestion & recalculation
  const refreshHeatmapData = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setClusters(prev =>
        prev.map(c => {
          // Micro-recalculation of breach weights based on live traffic
          const variance = Math.floor((Math.random() * 9) - 3);
          const newCount = Math.max(20, c.breachCount + variance);
          const newIntensity = Math.min(1.0, Math.max(0.4, Number((newCount / 190).toFixed(2))));
          return {
            ...c,
            breachCount: newCount,
            intensity: newIntensity,
          };
        })
      );
      setLastUpdated(new Date().toLocaleTimeString());
      setIsRefreshing(false);
    }, 450);
  }, []);

  const filteredClusters = useMemo(() => {
    if (filterCategory === 'ALL') return clusters;
    return clusters.filter(c => c.riskCategory === filterCategory);
  }, [clusters, filterCategory]);

  const totalBreachCount = useMemo(() => {
    return filteredClusters.reduce((acc, c) => acc + c.breachCount, 0);
  }, [filteredClusters]);

  const highestRiskCluster = useMemo(() => {
    return [...filteredClusters].sort((a, b) => b.breachCount - a.breachCount)[0] || INITIAL_ANOMALY_CLUSTERS[0];
  }, [filteredClusters]);

  return {
    isHeatmapActive,
    toggleHeatmap,
    setHeatmapActive: setIsHeatmapActive,
    clusters: filteredClusters,
    selectedCluster,
    selectCluster,
    isRefreshing,
    refreshHeatmapData,
    lastUpdated,
    filterCategory,
    setFilterCategory,
    totalBreachCount,
    highestRiskCluster,
  };
}
