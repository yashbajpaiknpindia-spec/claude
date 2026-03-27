'use client';

import useSWR from 'swr';
import { useApi } from './use-api';

export function useProjects() {
  const { get } = useApi();
  const { data, error, isLoading, mutate } = useSWR('/projects', get, {
    revalidateOnFocus: false,
  });

  return {
    projects: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useProject(id: string) {
  const { get } = useApi();
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/projects/${id}` : null,
    get,
    { revalidateOnFocus: false }
  );

  return {
    project: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

export { useProfile } from './use-profile';

export function useTemplates(type?: string) {
  const { get } = useApi();
  const path = type ? `/templates?type=${type}` : '/templates';
  const { data, isLoading } = useSWR(path, get);

  return {
    templates: data?.data || [],
    isLoading,
  };
}

export function useAnalytics(projectId: string, days = 30) {
  const { get } = useApi();
  const { data, isLoading } = useSWR(
    projectId ? `/projects/${projectId}/analytics?days=${days}` : null,
    get
  );

  return {
    analytics: data?.data || null,
    isLoading,
  };
}
