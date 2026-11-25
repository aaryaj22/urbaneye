export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water_leakage';

export type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Reported' | 'Verified' | 'Dispatched' | 'Resolved';

export type ImageQuality = 'clear' | 'blurry' | 'unusable';

export interface SensitiveZone {
  id: string;
  name: string;
  type: 'School / College' | 'Hospital' | 'Highway / Arterial';
  lat: number;
  lng: number;
  bonusPoints: number;
}

export interface PriorityBreakdown {
  severityScore: number;
  locationBonus: number;
  duplicateBonus: number;
  nearbyZone: string | null;
  totalScore: number;
}

export interface MergeLogEntry {
  timestamp: string;
  note: string;
  distanceMeters: number;
}

export interface CivicIssue {
  id: string;
  title: string;
  category: IssueCategory;
  department: string;
  description: string;
  lat: number;
  lng: number;
  ward: string;
  addressLabel: string;
  severity: IssueSeverity;
  severityScore: number;
  priorityScore: number;
  priorityBreakdown: PriorityBreakdown;
  confidence: number;
  imageQuality: ImageQuality;
  privacyBlurred: boolean;
  status: IssueStatus;
  duplicateCount: number;
  mergeHistory: MergeLogEntry[];
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisionAnalysisResult {
  isValidCivicIssue: boolean;
  category: IssueCategory | 'other';
  title: string;
  summary: string;
  imageQuality: ImageQuality;
  confidence: number;
  severity: IssueSeverity;
  severityScore: number;
  facesDetected: boolean;
  platesDetected: boolean;
  recommendedAction: string;
}

export const CATEGORY_META: Record<
  IssueCategory,
  {
    label: string;
    department: string;
    colorHex: string;
    textColorClass: string;
    dotColorClass: string;
  }
> = {
  pothole: {
    label: 'Pothole',
    department: 'Roads & Highways Department',
    colorHex: '#DC2626',
    textColorClass: 'text-red-700',
    dotColorClass: 'bg-red-600',
  },
  garbage: {
    label: 'Uncollected Garbage',
    department: 'Sanitation & Solid Waste Dept.',
    colorHex: '#D97706',
    textColorClass: 'text-amber-700',
    dotColorClass: 'bg-amber-600',
  },
  streetlight: {
    label: 'Faulty Streetlight',
    department: 'Electrical & Street Lighting Dept.',
    colorHex: '#2563EB',
    textColorClass: 'text-blue-700',
    dotColorClass: 'bg-blue-600',
  },
  water_leakage: {
    label: 'Water Leakage',
    department: 'Water Supply & Jal Board',
    colorHex: '#0891B2',
    textColorClass: 'text-cyan-700',
    dotColorClass: 'bg-cyan-600',
  },
};

export const SENSITIVE_ZONES: SensitiveZone[] = [
  {
    id: 'zone-dtc',
    name: 'Delhi Technical Campus (Knowledge Park III)',
    type: 'School / College',
    lat: 28.4744,
    lng: 77.4848,
    bonusPoints: 20,
  },
  {
    id: 'zone-sharda',
    name: 'Sharda Hospital & Medical Corridor',
    type: 'Hospital',
    lat: 28.4728,
    lng: 77.4822,
    bonusPoints: 25,
  },
  {
    id: 'zone-expressway',
    name: 'Noida-Greater Noida Expressway',
    type: 'Highway / Arterial',
    lat: 28.4685,
    lng: 77.4935,
    bonusPoints: 18,
  },
  {
    id: 'zone-parichowk',
    name: 'Pari Chowk Arterial Junction',
    type: 'Highway / Arterial',
    lat: 28.4671,
    lng: 77.5112,
    bonusPoints: 18,
  },
  {
    id: 'zone-kailash',
    name: 'Kailash Hospital Greater Noida',
    type: 'Hospital',
    lat: 28.4776,
    lng: 77.5038,
    bonusPoints: 25,
  },
];

export const TEAM_MEMBERS = [
  { name: 'Aarya Jain', enrollment: '03918011625' },
  { name: 'Avantika Priya', enrollment: '03518011625' },
  { name: 'Satyapriya Sinha', enrollment: '01218011625' },
  { name: 'Pragati Diwedi', enrollment: '00718012725' },
  { name: 'Rishabh Sharma', enrollment: '02018011925' },
  { name: 'Rishabh Singh Rathore', enrollment: '03718011625' },
];
