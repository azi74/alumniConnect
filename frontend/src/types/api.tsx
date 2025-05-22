// api.tsx
export interface User {
  id: string;
  name: string;
  email: string;
  registrationNumber?: string;
  phone?: string;
  address?: string;
  program?: string;
  year?: string;
  section?: string;
  bio?: string;
  interests?: string[];
  profileComplete?: boolean;
  gpa?: string;
  achievements?: Achievement[];
  courses?: Course[];
  activities?: Activity[];
  mentors?: Mentor[];
  events?: Event[];
  socialLinks?: SocialLinks;
  role?: string;
  lastLogin?: string;
  completionPercentage?: number;
  profilePhoto?: string;
}

export interface SocialLinks {
  linkedin?: string;
  website?: string;
}

export interface Achievement {
  title: string;
  description?: string;
  date?: string;
  icon?: string;
}

export interface Course {
  code: string;
  name: string;
  professor?: string;
  schedule?: string;
  grade?: string;
  progress?: number;
}

export interface Activity {
  name: string;
  role?: string;
  date?: string;
  description?: string;
}

export interface Mentor {
  name: string;
  position: string;
  since: string;
  nextMeeting: string;
}

export interface Event {
  name: string;
  date: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AlumniProfile {
  graduationYear: string;
  degree: string;
  currentCompany: string;
  currentRole: string;
  location: string;
  workExperience: WorkExperience[];
  educationHistory: EducationHistory[];
}

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  description?: string;
}

export interface EducationHistory {
  institution: string;
  degree: string;
  year: string;
  description?: string;
}