import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ApiResponse, Room } from "../lib/types/type";

export const useRooms = (params = {}) => {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Room[]>>('/rooms', { params });
      return data;
    }
  });
};

export const useRoom = (id: number) => {
  return useQuery({
    queryKey: ['room', id],
    queryFn: async () => {
      const { data } = await api.get<Room>(`/rooms/${id}`);
      return data;
    },
    enabled: !!id
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomData: Partial<Room>) => {
      const { data } = await api.post<Room>('/rooms', roomData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...roomData }: Partial<Room> & { id: number }) => {
      const { data } = await api.put<Room>(`/rooms/${id}`, roomData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.id] });
    }
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/room/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });
};

export const useAssignTenantToRoom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, tenantData }: { roomId: number; tenantData: any }) => {
      const { data } = await api.post(`/room/${roomId}/assign`, tenantData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });
};