// src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface CreateSnippetPayload {
  ciphertext: string;
  passwordProtected: boolean;
  expiresAt: string; // ISO 8601 format
  maxViews: number;
}

export interface CreateSnippetResponse {
  id: string;
  revocationToken: string;
}

export interface GetSnippetResponse {
  ciphertext: string;
  passwordProtected: boolean;
  expiresAt: string; // ISO 8601 format
  viewsRemaining: number;
}

export async function createSnippet(payload: CreateSnippetPayload): Promise<CreateSnippetResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/snippet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create snippet' }));
    throw new Error(errorData.error || 'An unexpected error occurred.');
  }
  return response.json();
}

export async function getSnippet(id: string): Promise<GetSnippetResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/snippet/${id}`);
    if (response.status === 410) {
        throw new Error('This snippet has expired, the view limit was reached, or it has been deleted.');
    }
    if (!response.ok) {
        throw new Error('Failed to retrieve snippet. It may not exist.');
    }
    return response.json();
}

export async function deleteSnippet(id: string, revocationToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/snippet/${id}?revocation_token=${revocationToken}`, {
        method: 'DELETE',
    });
    if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete snippet. The token may be invalid or the snippet is already gone.');
    }
}