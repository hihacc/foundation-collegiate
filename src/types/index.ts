// TypeScript types for the entire application

export interface Student {
  id: string
  name: string
  father_name: string
  roll_number: string
  class_name: string
  section?: string
  phone?: string
  email?: string
  is_active: boolean
  created_at: string
}

export interface Teacher {
  id: string
  name: string
  subject: string
  qualification?: string
  experience_years: number
  bio?: string
  photo_url?: string
  is_active: boolean
  display_order: number
}

export interface SubjectResult {
  name: string
  total_marks: number
  marks: number
  grade?: string
}

export interface Result {
  id: string
  student_id?: string
  student_name: string
  father_name: string
  roll_number: string
  class_name: string
  exam_name: string
  exam_date?: string
  subjects: SubjectResult[]
  total_marks: number
  obtained_marks: number
  percentage: number
  grade: string
  position?: string
  remarks?: string
  is_active: boolean
  created_at: string
}

export interface Admission {
  id: string
  student_name: string
  father_name: string
  date_of_birth?: string
  gender?: string
  class_applied: string
  previous_school?: string
  previous_marks?: string
  parent_phone: string
  parent_email?: string
  address: string
  status: 'pending' | 'approved' | 'rejected' | 'interview' | 'scholarship' | 'completed'
  remarks?: string
  interview_date?: string
  created_at: string
}

export interface Message {
  id: string
  name: string
  email?: string
  phone: string
  subject?: string
  message: string
  is_read: boolean
  replied_at?: string
  created_at: string
}

export interface GalleryImage {
  id: string
  title?: string
  description?: string
  image_url: string
  category: string
  is_banner: boolean
  is_active: boolean
  display_order: number
  created_at: string
}

export interface Notice {
  id: string
  title: string
  content: string
  type: 'general' | 'important' | 'event' | 'result' | 'holiday'
  is_pinned: boolean
  is_active: boolean
  expires_at?: string
  created_at: string
}

export interface Course {
  id: string
  name: string
  description?: string
  level: string
  classes: string
  subjects: string[]
  duration?: string
  fee_per_month?: number
  icon?: string
  is_active: boolean
  display_order: number
}

export interface Download {
  id: string
  title: string
  description?: string
  file_url: string
  file_type?: string
  file_size?: string
  category: string
  download_count: number
  is_active: boolean
  created_at: string
}

export interface Testimonial {
  id: string
  student_name: string
  class_name?: string
  achievement?: string
  quote: string
  rating: number
  photo_url?: string
  is_active: boolean
  display_order: number
}

export interface Event {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  image_url?: string
  is_active: boolean
}

export interface Slider {
  id: string
  title: string
  subtitle?: string
  image_url?: string
  button_text?: string
  button_url?: string
  is_active: boolean
  display_order: number
}

export interface Setting {
  key: string
  value: string
  type: string
}

export interface ActivityLog {
  id: string
  admin_id?: string
  action: string
  table_name?: string
  record_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}
