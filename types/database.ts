export type SubscriptionPlan = "basic" | "pro"
export type BillingInterval = "weekly" | "monthly"
export type SubscriptionStatus =
  | "active"
  | "on_hold"
  | "cancelled"
  | "expired"
  | "past_due"
  | "pending"
  | "paused"

export type ApplicationStatus = "no_reply" | "rejected" | "hired"
export type ResumeTemplateId =
  | "modern-professional"
  | "minimal-ats"
  | "classic-professional"
export type OutreachMessageStatus = "draft" | "sent" | "failed"
export type UsageActionType = "application" | "cold_email" | "ai_tailor"

export type ResumeSectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"

export interface ResumePersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  headline: string
  summary: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
}

export interface ResumeEducationItem {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate: string
  grade: string
  description: string
}

export interface ResumeExperienceItem {
  id: string
  company: string
  jobTitle: string
  employmentType: string
  location: string
  startDate: string
  endDate: string
  currentlyWorking: boolean
  description: string
}

export interface ResumeSkillItem {
  id: string
  skillName: string
  proficiency: string
}

export interface ResumeProjectItem {
  id: string
  projectName: string
  description: string
  technologies: string[]
  projectUrl: string
  githubUrl: string
  startDate: string
  endDate: string
}

export interface ResumeContent {
  personalInfo: ResumePersonalInfo
  education: ResumeEducationItem[]
  experience: ResumeExperienceItem[]
  skills: ResumeSkillItem[]
  projects: ResumeProjectItem[]
  sectionOrder: ResumeSectionKey[]
}

export interface ProfileRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  headline: string | null
  professional_summary: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  dodo_customer_id: string | null
  dodo_subscription_id: string | null
  dodo_product_id: string | null
  plan: SubscriptionPlan | null
  billing_interval: BillingInterval | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentHistoryRow {
  id: string
  user_id: string
  dodo_payment_id: string
  dodo_subscription_id: string | null
  amount: number
  currency: string
  payment_status: string
  payment_type: string | null
  created_at: string
}

export interface DodoWebhookEventRow {
  id: string
  webhook_id: string
  event_type: string
  processed: boolean
  processed_at: string | null
  created_at: string
}

export interface EducationRow {
  id: string
  user_id: string
  institution: string
  degree: string
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  grade: string | null
  description: string | null
  created_at: string
}

export interface ExperienceRow {
  id: string
  user_id: string
  company: string
  job_title: string
  employment_type: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  currently_working: boolean
  description: string | null
  created_at: string
}

export interface SkillRow {
  id: string
  user_id: string
  skill_name: string
  proficiency: string | null
  created_at: string
}

export interface ProjectRow {
  id: string
  user_id: string
  project_name: string
  description: string | null
  technologies: string[]
  project_url: string | null
  github_url: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface ResumeRow {
  id: string
  user_id: string
  title: string
  template: ResumeTemplateId
  content: ResumeContent
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ResumeVersionRow {
  id: string
  user_id: string
  resume_id: string | null
  job_title: string | null
  company: string | null
  job_description: string
  content: ResumeContent
  created_at: string
}

export interface ApplicationRow {
  id: string
  user_id: string
  company: string
  job_title: string
  job_url: string | null
  location: string | null
  job_description: string | null
  resume_id: string | null
  resume_version_id: string | null
  application_date: string
  status: ApplicationStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLogRow {
  id: string
  user_id: string
  activity_type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface OutreachRecipientRow {
  id: string
  user_id: string
  name: string
  email: string
  company: string | null
  job_title: string | null
  linkedin_url: string | null
  notes: string | null
  do_not_contact: boolean
  created_at: string
  updated_at: string
}

export interface EmailTemplateRow {
  id: string
  user_id: string
  name: string
  subject: string
  body: string
  created_at: string
  updated_at: string
}

export interface OutreachMessageRow {
  id: string
  user_id: string
  recipient_id: string | null
  template_id: string | null
  recipient_name: string
  recipient_email: string
  subject: string
  body: string
  status: OutreachMessageStatus
  sent_at: string | null
  created_at: string
}

export interface FollowUpReminderRow {
  id: string
  user_id: string
  application_id: string
  due_date: string
  note: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface UsageEventRow {
  id: string
  user_id: string
  action_type: UsageActionType
  reference_id: string | null
  created_at: string
}
