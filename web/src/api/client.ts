import type { ApiError } from '../types';

const BASE = '/api';

export class ApiRequestError extends Error {
  errorCode: string;
  constructor(err: ApiError) {
    super(err.message);
    this.errorCode = err.errorCode;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let body: ApiError;
    try {
      body = await res.json();
    } catch {
      body = { errorCode: 'UNKNOWN', message: 'Something went wrong. Please try again.', timestamp: '' };
    }
    throw new ApiRequestError(body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  members: {
    list: () => request<import('../types').Member[]>('/members'),
    get: (id: number) => request<import('../types').Member>(`/members/${id}`),
    create: (data: Partial<import('../types').Member>) =>
      request<import('../types').Member>('/members', { method: 'POST', body: JSON.stringify(data) }),
  },
  terms: {
    get: (id: number) => request<import('../types').Term>(`/terms/${id}`),
    getActive: () => request<import('../types').Term>('/terms/active'),
    create: (data: Partial<import('../types').Term>) =>
      request<import('../types').Term>('/terms', { method: 'POST', body: JSON.stringify(data) }),
    pool: (id: number) => request<import('../types').PoolSummary>(`/terms/${id}/pool`),
  },
  loans: {
    apply: (data: { memberId: number; termId: number; amount: number }) =>
      request<import('../types').Loan>('/loans/apply', { method: 'POST', body: JSON.stringify(data) }),
    byTerm: (termId: number) => request<import('../types').Loan[]>(`/loans?termId=${termId}`),
    priorityQueue: (termId: number) =>
      request<import('../types').PriorityQueueEntry[]>(`/loans/priority-queue?termId=${termId}`),
    approve: (id: number, approvedBy: number) =>
      request<import('../types').Loan>(`/loans/${id}/approve?approvedBy=${approvedBy}`, { method: 'PUT' }),
    reject: (id: number, rejectedBy: number, reason: string) =>
      request<import('../types').Loan>(`/loans/${id}/reject?rejectedBy=${rejectedBy}`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    repay: (id: number, amount: number) =>
      request<import('../types').Loan>(`/loans/${id}/repay`, { method: 'POST', body: JSON.stringify({ amount }) }),
  },
  contributions: {
    byTerm: (termId: number, memberId?: number) =>
      request<import('../types').Contribution[]>(
        `/terms/${termId}/contributions${memberId ? `?memberId=${memberId}` : ''}`
      ),
    add: (termId: number, data: Partial<import('../types').Contribution> & { member?: { id: number }; term?: { id: number } }) =>
      request<import('../types').Contribution>(`/terms/${termId}/contributions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
