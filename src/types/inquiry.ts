export type InquiryStatus = 'PENDING' | 'FOLLOW_UP' | 'CONFIRMED' | 'ADMITTED' | 'DROPPED';

export interface StudentInquiry {
  id: string;
  sr_no: string | number;
  date: string;
  name: string;
  class_name: string;
  contact: string;
  institute?: string | null;
  ref?: string | null;
  status: InquiryStatus;
  remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InquiryStats {
  total: number;
  today: number;
  pending: number;
  followUp: number;
  confirmed: number;
  conversionRate: number;
}
