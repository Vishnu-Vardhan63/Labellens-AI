import type {
  UploadResponse,
  AnalysisResponse,
  ScanDetailResponse,
  ValidationResponse,
  EvidenceResponse,
  CopilotResponse,
  HealthResponse,
} from '../types';

function resolveApiBase(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // Check if running inside Capacitor native container on Android
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    // Android emulator host alias
    return 'http://10.0.2.2:8000';
  }
  // Standard browser runtime: empty string uses relative URLs via Vite proxy or same-origin
  return '';
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


