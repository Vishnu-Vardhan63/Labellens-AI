import type {
  UploadResponse,
  AnalysisResponse,
  ScanDetailResponse,
  ValidationResponse,
  EvidenceResponse,
  CopilotResponse,
  HealthResponse,
  ReadabilityResponse,
  DashboardStatsResponse,
  ScanHistoryResponse,
} from '../types';

function resolveApiBase(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envBaseUrl && envBaseUrl.trim() !== '' && !envBaseUrl.includes('VITE_API_BASE_URL')) {
    return envBaseUrl.trim().replace(/\/+$/, '');
  }
  // Check if running inside Capacitor native container on Android
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    // Android emulator host alias
    return 'http://10.0.2.2:8000';
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  // Production fallback to live FastAPI backend on Render
  return 'https://labellens-ai.onrender.com';
}

export const API_BASE = resolveApiBase();

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed.' }));
    throw new ApiError(res.status, errorData.detail || 'Upload failed.');
  }
  return res.json();
}

export async function analyzeScan(scanId: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Analysis failed.' }));
    throw new ApiError(res.status, errorData.detail || 'Package label analysis failed.');
  }
  return res.json();
}

export async function validateScan(scanId: string): Promise<ValidationResponse> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Validation failed.' }));
    throw new ApiError(res.status, errorData.detail || 'Compliance validation failed.');
  }
  return res.json();
}

export async function getScanDetail(scanId: string): Promise<ScanDetailResponse> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch scan.' }));
    throw new ApiError(res.status, errorData.detail || 'Failed to fetch scan record.');
  }
  return res.json();
}

export async function submitInspectorReview(
  scanId: string,
  payload: { decision: string; notes?: string }
): Promise<{ success: boolean; scan_id: string; inspector_decision: string; inspector_notes?: string; inspector_reviewed_at: string }> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to submit review.' }));
    throw new ApiError(res.status, errorData.detail || 'Failed to save inspector review.');
  }
  return res.json();
}

export async function getScanEvidence(scanId: string): Promise<EvidenceResponse> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/evidence`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch visual evidence.' }));
    throw new ApiError(res.status, errorData.detail || 'Failed to fetch visual evidence mapping.');
  }
  return res.json();
}

export async function queryCopilot(
  scanId: string,
  payload: { intent?: string; query?: string }
): Promise<CopilotResponse> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/copilot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Copilot query failed.' }));
    throw new ApiError(res.status, errorData.detail || 'AI Copilot query failed.');
  }
  return res.json();
}

export async function downloadReport(scanId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/report`);
  if (!res.ok) {
    throw new ApiError(res.status, "We couldn't generate the report. Please try again.");
  }
  return res.blob();
}

export function getScanReportUrl(scanId: string): string {
  return `${API_BASE}/api/scans/${scanId}/report`;
}

export function getScanImageUrl(scanId: string): string {
  return `${API_BASE}/api/scans/${scanId}/image`;
}

export async function getScanReadability(scanId: string): Promise<ReadabilityResponse> {
  const res = await fetch(`${API_BASE}/api/scans/${scanId}/readability`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch readability.' }));
    throw new ApiError(res.status, errorData.detail || 'Failed to fetch readability assessment.');
  }
  return res.json();
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch dashboard stats.' }));
    throw new ApiError(res.status, errorData.detail || 'Failed to fetch dashboard statistics.');
  }
  return res.json();
}

export async function getScanHistory(params?: {
  query?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ScanHistoryResponse> {
  const q = new URLSearchParams();
  if (params?.query) q.set('query', params.query);
  if (params?.status && params.status !== 'all') q.set('status', params.status);
  if (params?.limit) q.set('limit', params.limit.toString());
  if (params?.offset) q.set('offset', params.offset.toString());

  const url = `${API_BASE}/api/scans${q.toString() ? `?${q.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch scan history.' }));
    throw new ApiError(res.status, errorData.detail || 'Failed to fetch scan history.');
  }
  return res.json();
}


