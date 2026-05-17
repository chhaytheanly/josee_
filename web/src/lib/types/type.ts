export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  image?: string;
  role: { id: number; name: string; description?: string };
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  status?: 'available' | 'occupied';
  tenant?: { id: number; name: string; email?: string; phone?: string };
  payment_status?: 'paid' | 'late' | 'pending' | 'no_invoice';
  updated_at?: string;
}

export interface Tenant {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  id_card?: string;
  is_active: boolean;
  check_in_date: string;
  room_id?: number;
}

export interface Invoice {
  id: number;
  room_id: number;
  tenant_id: number;
  month: number;
  year: number;
  amount: number;
  amount_paid: number;
  due_date: string;
  status: 'pending' | 'paid' | 'late' | 'no_invoice';
  created_at?: string;
  paid_at?: string;
  room?: { id: number; name: string; price: number };
  tenant?: { id: number; name: string; email?: string; phone?: string };
  payments?: { id: number; amount: number; status: string; paid_at: string }[];
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    summary?: Record<string, number>;
  };
}
