export interface Teacher {
  id: string;
  name: string;
  subject: string;
  qualification: string;
  experience_years: number;
  bio: string;
  is_active: boolean;
  display_order?: number;
  created_at?: string;
}

export interface Student {
  id: string;
  name: string;
  roll_number: string;
  class_name: string;
  father_name: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'graduated';
  created_at?: string;
}

export interface Result {
  id: string;
  student_id?: string;
  roll_number: string;
  pin: string;
  exam_name: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  position?: string;
  remarks?: string;
  created_at?: string;
}

export interface Admission {
  id: string;
  student_name: string;
  father_name: string;
  phone: string;
  email: string;
  class_applied: string;
  previous_school: string;
  marks_percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  created_at?: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  url: string;
  category: string;
  created_at?: string;
}
