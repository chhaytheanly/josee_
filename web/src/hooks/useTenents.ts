import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ApiResponse, Tenant } from "../lib/types/type";

export const useTenants = (params = {}) => {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Tenant[]>>('/tenants', { params });
      return data;
    }
  });
};

export const useTenant = (id: number) => {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data } = await api.get<Tenant>(`/tenants/${id}`);
      return data;
    },
    enabled: !!id
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tenantData: Partial<Tenant>) => {
      const { data } = await api.post<Tenant>('/tenants', tenantData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};