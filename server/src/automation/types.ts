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
}

export interface Label {
  id: string;
  courier: string;
  sender_profile_id?: number;
  order_ref?: string;
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
}

export interface AutomationContext {
  sender: SenderProfile;
  labels: Label[];
  onProgress: (labelId: string, status: 'processing' | 'done' | 'error', message?: string) => void;
  settings?: Record<string, string>;
}
