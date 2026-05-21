import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ApiResponse, Invoice } from "../lib/types/type";

export const useInvoices = (params = {}) => {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
      return data;
    }
  });
};

export const useInvoice = (id: number) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/invoices/${id}`);
      return data;
    },
    enabled: !!id
  });
};

export const useGenerateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceData: { tenant_id: number; room_id: number; for_date: string; is_first_invoice?: boolean; check_in_date?: string }) => {
      const { data } = await api.post<Invoice>('/invoices/generate', invoiceData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};

export const useGenerateAllInvoices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data?: { for_date?: string }) => {
      const res = await api.post('/invoices/generate-all', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, paymentData }: { invoiceId: number; paymentData: { amount: number; image?: string } }) => {
      const { data } = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};

export const useApplyLateFees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data?: { grace_period_days: number }) => {
      const res = await api.post('/invoices/apply-late-fees', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};

export const useMonthlyReport = () => {
  return useQuery({
    queryKey: ['invoice-reports', 'monthly'],
    queryFn: async () => {
      const { data } = await api.get('/invoices/reports/monthly');
      return data;
    }
  });
};

export const useLatePayers = () => {
  return useQuery({
    queryKey: ['invoice-late-payers'],
    queryFn: async () => {
      const { data } = await api.get('/invoices/late-payers');
      return data;
    }
  });
};

export const useTenantPaymentStatus = (tenantId?: number) => {
  return useQuery({
    queryKey: ['tenant-payment-status', tenantId],
    queryFn: async () => {
      const url = tenantId ? `/invoices/tenants/${tenantId}/payment-status` : '/invoices/tenants/payment-status';
      const { data } = await api.get(url);
      return data;
    }
  });
};

export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `invoice-${invoiceId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) filename = filenameMatch[1];
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  });
};
