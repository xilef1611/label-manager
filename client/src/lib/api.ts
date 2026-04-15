import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export type Courier = 'post-at' | 'dpd' | 'dhl' | 'ups';

export interface SenderProfile {
  id: number;
  name: string;
  company?: string;
  street: string;
  street_number: string;
  address_supplement?: string;
  postal_code: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  is_default: number;
}

export interface Label {
  id: string;
  courier: Courier;
  sender_profile_id?: number;
  sender_name?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  order_ref?: string;
  source: 'manual' | 'api' | 'woocommerce';
  recipient_company?: string;
  recipient_name: string;
  recipient_phone?: string;
  recipient_street: string;
  recipient_street_number: string;
  recipient_address_supplement?: string;
  recipient_postal_code: string;
  recipient_city: string;
  recipient_country: string;
  weight_kg?: number;
  notes?: string;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface ApiKey {
  id: number;
  key: string;
  label: string;
  shop_type: string;
  default_courier: Courier;
  default_sender_id?: number;
  created_at: string;
  last_used_at?: string;
}

// Senders
export const getSenders = () => api.get<SenderProfile[]>('/senders').then(r => r.data);
export const createSender = (data: Partial<SenderProfile>) => api.post<SenderProfile>('/senders', data).then(r => r.data);
export const updateSender = (id: number, data: Partial<SenderProfile>) => api.put<SenderProfile>(`/senders/${id}`, data).then(r => r.data);
export const deleteSender = (id: number) => api.delete(`/senders/${id}`);

// Labels
export const getLabels = (params?: { status?: string; courier?: string }) => api.get<Label[]>('/labels', { params }).then(r => r.data);
export const createLabel = (data: Partial<Label>) => api.post<Label>('/labels', data).then(r => r.data);
export const updateLabel = (id: string, data: Partial<Label>) => api.put<Label>(`/labels/${id}`, data).then(r => r.data);
export const deleteLabel = (id: string) => api.delete(`/labels/${id}`);
export const deleteLabels = (ids: string[]) => api.delete('/labels', { data: { ids } });

// API Keys
export const getApiKeys = () => api.get<ApiKey[]>('/apikeys').then(r => r.data);
export const createApiKey = (data: Partial<ApiKey> & { label: string }) => api.post<ApiKey>('/apikeys', data).then(r => r.data);
export const deleteApiKey = (id: number) => api.delete(`/apikeys/${id}`);

// Automation
export const startAutomation = (label_ids: string[], sender_id: number) =>
  api.post('/automation/start', { label_ids, sender_id }).then(r => r.data);
export const stopAutomation = () => api.post('/automation/stop').then(r => r.data);
export const getAutomationStatus = () => api.get('/automation/status').then(r => r.data);
