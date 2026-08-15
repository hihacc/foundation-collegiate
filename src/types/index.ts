// TypeScript types for the entire application

export interface AcademicClass {
  id: string
  name: string
  short_name?: string
  description?: string
  level?: number
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface AcademicGroup {
  id: string
  class_id: string
  name: string
  description?: string
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
  academic_classes?: AcademicClass // for joins
}

export interface AcademicSubject {
  id: string
  group_id: string
  name: string
  code?: string
  is_compulsory: boolean
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
  academic_groups?: AcademicGroup // for joins
}

export interface Student {
  id: string
  name: string
  father_name: string
  roll_number: string
  class_name: string
  academic_class?: string | null
  diploma_program?: string | null
  section?: string | null
  phone?: string | null
  email?: string | null
  photo_url?: string | null
  gender?: string | null
  date_of_birth?: string | null
  address?: string | null
  cnic_number?: string | null
  cnic?: string | null
  religion?: string | null
  nationality?: string | null
  parent_phone?: string | null
  father_occupation?: string | null
  previous_school?: string | null
  admission_number?: string | null
  admission_date?: string | null
  is_active: boolean
  status?: string | null
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
  display_order?: number
  created_at?: string
}

export interface Achiever {
  id: string
  name: string
  position: string
  board: string
  percentage: string
  photo_url: string
  is_active: boolean
  display_order?: number
  created_at?: string
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
  month?: string
  exam_date?: string
  subjects: SubjectResult[]
  total_marks: number
  obtained_marks: number
  percentage: number
  grade: string
  position?: string | null
  remarks?: string | null
  is_active: boolean
  created_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  student_name: string
  roll_number: string
  class_name: string
  date: string
  month: string
  status: 'present' | 'absent' | 'late' | 'leave'
  remarks?: string
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
  parent_phone: string
  parent_email?: string
  address: string
  photo_url?: string
  status: 'pending' | 'approved' | 'rejected' | 'interview' | 'scholarship' | 'completed'
  notes?: string
  created_at: string
}

export interface Course {
  id: string
  name: string
  level: string
  classes: string
  description?: string
  subjects: string[]
  fee_per_month?: number
  icon?: string
  is_active: boolean
  display_order?: number
  created_at?: string
  type?: 'Course' | 'Diploma'
}

export interface Notice {
  id: string
  title: string
  content: string
  type: 'general' | 'important' | 'result' | 'event' | 'holiday'
  is_pinned: boolean
  is_active: boolean
  expires_at?: string
  created_at: string
}

export interface GalleryImage {
  id: string
  title: string
  category: string
  image_url: string
  description?: string
  is_banner?: boolean
  is_active: boolean
  display_order?: number
  source?: 'admin' | 'instagram' | 'facebook'
  source_post_id?: string
  post_date?: string
  created_at: string
  updated_at?: string
}

export interface Download {
  id: string
  title: string
  category: string
  file_url: string
  file_type?: string
  file_size?: string
  description?: string
  downloads_count?: number
  download_count?: number
  is_active: boolean
  created_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export type Message = ContactMessage;

export interface Testimonial {
  id: string
  name?: string
  student_name?: string
  role?: string
  class_name?: string
  content?: string
  quote?: string
  achievement?: string
  rating?: number
  photo_url?: string
  display_order?: number
  is_active: boolean
  created_at?: string
}

export interface Event {
  id: string
  title: string
  date: string
  location?: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface Slider {
  id: string
  title: string
  image_url: string
  link_url?: string
  is_active: boolean
}
export interface HeroData {
  admissions_year?: string;
  admissions_open?: string;
  site_tagline?: string;
}

export interface Setting {
  id?: string
  key: string
  value: string
}

export interface ActivityLog {
  id: string
  action: string
  details?: string
  created_at: string
}
