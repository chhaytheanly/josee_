import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface User {
  id: number; name: string; email: string; role_id: number; image?: string;
  role: { id: number; name: string; description?: string };
}

export interface Room {
  id: number; name: string; description?: string; price: number; is_available: boolean;
  status?: 'available' | 'occupied';
  tenant?: { id: number; name: string; email?: string; phone?: string };
  payment_status?: 'paid' | 'late' | 'pending' | 'no_invoice'; updated_at?: string;
}

export interface Tenant {
  id: number; name: string; email?: string; phone?: string; id_card?: string;
  is_active: boolean; check_in_date: string; room_id?: number;
}

export interface Invoice {
  id: number; room_id: number; tenant_id: number; month: number; year: number;
  amount: number; amount_paid: number; due_date: string;
  status: 'pending' | 'paid' | 'late' | 'no_invoice'; created_at?: string; paid_at?: string;
  room?: { id: number; name: string; price: number };
  tenant?: { id: number; name: string; email?: string; phone?: string };
  payments?: { id: number; amount: number; status: string; paid_at: string }[];
}

export interface ApiResponse<T> {
  data: T; meta?: { page: number; limit: number; total: number; summary?: Record<string, number> };
}

// USERS
export const useUsers = (params = {}) => useQuery({ queryKey: ['users', params], queryFn: async () => { const { data } = await api.get<ApiResponse<User[]>>('/user', { params }); return data; } });
export const useUser = (id: number) => useQuery({ queryKey: ['user', id], queryFn: async () => { const { data } = await api.get<User>(`/user/${id}`); return data; }, enabled: !!id });
export const useCreateUser = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (d: Partial<User>) => { const { data } = await api.post<User>('/user', d); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) }); };
export const useUpdateUser = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...d }: Partial<User> & { id: number }) => { const { data } = await api.put<User>(`/user/${id}`, d); return data; }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['users'] }); qc.invalidateQueries({ queryKey: ['user', v.id] }); } }); };
export const useDeleteUser = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: number) => { await api.delete(`/user/${id}`); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) }); };

// ROOMS
export const useRooms = (params = {}) => useQuery({ queryKey: ['rooms', params], queryFn: async () => { const { data } = await api.get<ApiResponse<Room[]>>('/room', { params }); return data; } });
export const useRoom = (id: number) => useQuery({ queryKey: ['room', id], queryFn: async () => { const { data } = await api.get<Room>(`/room/${id}`); return data; }, enabled: !!id });
export const useCreateRoom = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (d: Partial<Room>) => { const { data } = await api.post<Room>('/room', d); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }) }); };
export const useUpdateRoom = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...d }: Partial<Room> & { id: number }) => { const { data } = await api.put<Room>(`/room/${id}`, d); return data; }, onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ['rooms'] }); qc.invalidateQueries({ queryKey: ['room', v.id] }); } }); };
export const useDeleteRoom = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: number) => { await api.delete(`/room/${id}`); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }) }); };
export const useAssignTenantToRoom = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ roomId, tenantData }: { roomId: number; tenantData: Record<string, unknown> }) => { const { data } = await api.post(`/room/${roomId}/assign`, tenantData); return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms'] }); qc.invalidateQueries({ queryKey: ['tenants'] }); } }); };

// TENANTS
export const useTenants = (params = {}) => useQuery({ queryKey: ['tenants', params], queryFn: async () => { const { data } = await api.get<ApiResponse<Tenant[]>>('/tenant', { params }); return data; } });
export const useTenant = (id: number) => useQuery({ queryKey: ['tenant', id], queryFn: async () => { const { data } = await api.get<Tenant>(`/tenant/${id}`); return data; }, enabled: !!id });
export const useCreateTenant = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (d: Partial<Tenant>) => { const { data } = await api.post<Tenant>('/tenant', d); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }) }); };
export const useDeleteTenant = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: number) => { await api.delete(`/tenant/${id}`); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }) }); };

// INVOICES
export const useInvoices = (params = {}) => useQuery({ queryKey: ['invoices', params], queryFn: async () => { const { data } = await api.get<ApiResponse<Invoice[]>>('/invoice', { params }); return data; } });
export const useInvoice = (id: number) => useQuery({ queryKey: ['invoice', id], queryFn: async () => { const { data } = await api.get<Invoice>(`/invoice/${id}`); return data; }, enabled: !!id });
export const useGenerateInvoice = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (d: { tenant_id: number; room_id: number; for_date: string; is_first_invoice?: boolean; check_in_date?: string }) => { const { data } = await api.post<Invoice>('/invoice/generate', d); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) }); };
export const useGenerateAllInvoices = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (d?: { for_date?: string }) => { const res = await api.post('/invoice/generate-all', d); return res.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) }); };
export const useRecordPayment = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ invoiceId, paymentData }: { invoiceId: number; paymentData: { amount: number; image?: string } }) => { const { data } = await api.post(`/invoice/${invoiceId}/payments`, paymentData); return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) }); };
export const useApplyLateFees = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (d?: { grace_period_days: number }) => { const res = await api.post('/invoice/apply-late-fees', d); return res.data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }) }); };
export const useMonthlyReport = () => useQuery({ queryKey: ['invoice-reports', 'monthly'], queryFn: async () => { const { data } = await api.get('/invoice/reports/monthly'); return data; } });
export const useLatePayers = () => useQuery({ queryKey: ['invoice-late-payers'], queryFn: async () => { const { data } = await api.get('/invoice/late-payers'); return data; } });
export const useTenantPaymentStatus = (tenantId?: number) => useQuery({ queryKey: ['tenant-payment-status', tenantId], queryFn: async () => { const url = tenantId ? `/invoice/tenants/${tenantId}/payment-status` : '/invoice/tenants/payment-status'; const { data } = await api.get(url); return data; } });
