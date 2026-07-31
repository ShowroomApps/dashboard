import useSWR from 'swr';
import { fetcher } from './api';

export function useMe() {
  const { data, error, isLoading, mutate } = useSWR('/auth/me', fetcher, {
    shouldRetryOnError: false,
  });
  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}

export function useOrganizations(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/organizations${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    organizations: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useCurrentOrg() {
  const { data, error, isLoading, mutate } = useSWR('/organizations/current', fetcher);
  return {
    organization: data,
    isLoading,
    error,
    mutate,
  };
}

export function useSubscriptions(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/subscriptions${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    subscriptions: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useSubscriptionStatus(orgId?: string) {
  const url = orgId ? `/organizations/${orgId}/subscription` : null;
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    shouldRetryOnError: false,
  });
  return {
    statusInfo: data,
    isLoading,
    error,
    mutate,
  };
}

export function useBranches() {
  const { data, error, isLoading, mutate } = useSWR('/branches', fetcher);
  return {
    branches: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useUsers(orgId?: string) {
  const url = orgId ? `/organizations/${orgId}/users` : '/organizations/users';
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    users: Array.isArray(data) ? data : [],
    isLoading,
    error,
    mutate,
  };
}

export function useVehicles(query?: { status?: string; q?: string; page?: number; includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.status) params.append('status', query.status);
  if (query?.q) params.append('q', query.q);
  if (query?.page) params.append('page', query.page.toString());
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);

  const url = `/vehicles?${params.toString()}`;
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    vehicles: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function usePurchases(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/purchases${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    purchases: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useSales(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/sales${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    sales: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function usePayments() {
  const { data, error, isLoading, mutate } = useSWR('/payments', fetcher);
  return {
    payments: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useExpenses(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/expenses${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    expenses: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useChartOfAccounts() {
  const { data, error, isLoading, mutate } = useSWR('/accounting/chart-of-accounts', fetcher);
  return {
    accounts: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useJournalEntries() {
  const { data, error, isLoading, mutate } = useSWR('/accounting/journal-entries', fetcher);
  return {
    entries: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useCustomers(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/customers${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    customers: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useSellers(query?: { includeDeleted?: string }) {
  const params = new URLSearchParams();
  if (query?.includeDeleted) params.append('includeDeleted', query.includeDeleted);
  const url = `/sellers${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    sellers: data || [],
    isLoading,
    error,
    mutate,
  };
}
