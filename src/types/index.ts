export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface TemplateApplicationRecord {
  id: string;
  templateId: string;
  templateName: string;
  applyTime: string;
  applyDoctor: string;
  nextVisitDate: string;
  visitTypes: string[];
  visitItems: string[];
  remark?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  idCard: string;
  phone: string;
  address: string;
  gestationalWeeks: number;
  gestationalDays: number;
  dueDate: string;
  riskLevel: RiskLevel;
  riskFactors: string[];
  parity: number;
  gravidity: number;
  height: number;
  prepregnancyWeight: number;
  currentWeight: number;
  bloodType: string;
  rhFactor: string;
  allergicHistory: string;
  chronicDiseases: string[];
  geneticHistory: string;
  currentStatus: 'antenatal' | 'hospitalized' | 'discharged' | 'postpartum';
  admissionDate?: string;
  dischargeDate?: string;
  dischargeDiagnosis?: string;
  nextVisitDate: string;
  nextVisitTypes?: string[];
  nextVisitItems?: string[];
  appliedTemplateId?: string;
  appliedTemplateName?: string;
  appliedTemplateTime?: string;
  templateApplicationHistory?: TemplateApplicationRecord[];
  attendingDoctor: string;
  tags: string[];
  isKeyCase: boolean;
  isUrgent: boolean;
  lastUpdateTime: string;
}

export interface VitalRecord {
  id: string;
  patientId: string;
  recordDate: string;
  gestationalWeeks: number;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  temperature: number;
  weight: number;
  fundalHeight: number;
  abdominalCircumference: number;
  fetalHeartRate: number;
  edema: string;
  proteinuria: string;
  symptoms: string;
  note: string;
}

export interface UltrasoundRecord {
  id: string;
  patientId: string;
  examDate: string;
  gestationalWeeks: number;
  examType: string;
  bpd: number;
  hc: number;
  ac: number;
  fl: number;
  efw: number;
  amnioticFluidIndex: number;
  amnioticFluidMax: number;
  placentaLocation: string;
  placentaGrade: string;
  fetalPosition: string;
  fetalHeart: string;
  umbilicalArterySd: number;
  findings: string;
  impression: string;
  examiner: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  examDate: string;
  gestationalWeeks: number;
  category: string;
  items: LabItem[];
}

export interface LabItem {
  name: string;
  value: string;
  unit: string;
  reference: string;
  status: 'normal' | 'high' | 'low';
}

export interface PregnancyHistory {
  id: string;
  patientId: string;
  pregnancyOrder: number;
  endDate: string;
  gestationalWeeks: number;
  outcome: 'live_birth' | 'stillbirth' | 'abortion' | 'ectopic' | 'other';
  deliveryMode: 'natural' | 'cesarean' | 'forceps' | 'vacuum' | 'n/a';
  newbornWeight: number;
  newbornGender: 'male' | 'female' | 'n/a';
  complications: string;
  note: string;
}

export interface TreatmentTemplate {
  id: string;
  name: string;
  category: string;
  indication: string;
  riskLevel: RiskLevel[];
  steps: TreatmentStep[];
  medications: Medication[];
  exams: string[];
  followUpPlan: FollowUpPlan;
  hospitalizationCriteria: string;
  emergencyCriteria: string;
  references: string[];
}

export interface TreatmentStep {
  order: number;
  content: string;
  timing: string;
  note: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  precautions: string;
}

export interface FollowUpPlan {
  interval: string;
  items: string[];
  monitoringPoints: string[];
}

export interface Consultation {
  id: string;
  patientId: string;
  patientName: string;
  requestDate: string;
  requestDoctor: string;
  requestDepartment: string;
  consultDepartment: string;
  consultDoctor: string;
  type: 'urgent' | 'routine';
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  chiefComplaint: string;
  briefHistory: string;
  currentFindings: string;
  question: string;
  consultOpinion?: string;
  consultDate?: string;
  suggestions?: string[];
}

export interface HospitalizationStatusLog {
  status: 'suggested' | 'admitted' | 'discharged' | 'cancelled';
  time: string;
  doctor: string;
  remark?: string;
}

export interface HospitalizationAdvice {
  id: string;
  patientId: string;
  patientName: string;
  createDate: string;
  createDoctor: string;
  reason: string;
  urgency: 'emergency' | 'urgent' | 'routine';
  department: string;
  estimatedDays: number;
  examinations: string[];
  treatments: string[];
  notes: string;
  status: 'suggested' | 'admitted' | 'discharged' | 'cancelled';
  statusTimeline?: HospitalizationStatusLog[];
  admissionDate?: string;
  dischargeDate?: string;
}

export interface DischargePlan {
  id: string;
  patientId: string;
  patientName: string;
  dischargeDate: string;
  hospitalizationAdviceId?: string;
  admissionDate?: string;
  followUpItems: FollowUpItem[];
  medications: Medication[];
  lifestyleAdvice: string[];
  warningSigns: string[];
  nextAppointment: string;
  createDoctor: string;
  createTime?: string;
  nextVisitDate?: string;
  visitTypes?: string[];
  visitItems?: string[];
  remark?: string;
}

export interface FollowUpItem {
  date: string;
  type: 'phone' | 'outpatient' | 'home';
  content: string;
  status: 'pending' | 'completed' | 'missed';
  completedDate?: string;
  note?: string;
}

export interface ShiftRecord {
  id: string;
  shiftType: 'morning' | 'afternoon' | 'night';
  shiftDate: string;
  handoverDoctor: string;
  takeoverDoctor: string;
  patientsOnDuty: ShiftPatient[];
  keyReminders: string[];
  generalStatus: string;
  equipmentStatus: string;
  createTime: string;
}

export interface ShiftPatient {
  patientId: string;
  patientName: string;
  bedNumber: string;
  riskLevel: RiskLevel;
  diagnosis: string;
  keyPoints: string[];
  pendingTasks: string[];
  isKeyCase: boolean;
}

export interface QualityControlRecord {
  id: string;
  auditDate: string;
  auditor: string;
  patientId: string;
  patientName: string;
  auditType: 'random' | 'key' | 'complaint';
  auditItems: QCAuditItem[];
  totalScore: number;
  problems: string[];
  suggestions: string[];
  status: 'pending' | 'completed' | 'revised' | 'pending_review' | 'revision_rejected';
  originalProblems?: string[];
  rectificationNote?: string;
  rectificationDate?: string;
  rectificationDoctor?: string;
  reviewDate?: string;
  reviewDoctor?: string;
  reviewResult?: 'passed' | 'rejected';
  rejectReason?: string;
}

export interface QCAuditItem {
  category: string;
  name: string;
  score: number;
  maxScore: number;
  problem: string;
}

export interface StatisticsData {
  totalPatients: number;
  riskDistribution: { level: RiskLevel; count: number }[];
  monthlyVisits: { month: string; count: number }[];
  topComplications: { name: string; count: number }[];
  consultationStats: { department: string; count: number }[];
  qcTrend: { month: string; avgScore: number }[];
  dischargeFollowUpRate: number;
  readmissionRate: number;
  cesareanRate: number;
  avgHospitalStay: number;
  pendingQCRevision: number;
  completedQCRevision: number;
}

export type ReminderType = 'visit' | 'consultation' | 'hospital' | 'qc' | 'shift';

export interface WorkReminder {
  id: string;
  type: ReminderType;
  title: string;
  subtitle: string;
  patientId?: string;
  patientName?: string;
  recordId: string;
  urgency: 'high' | 'medium' | 'low';
  deadline?: string;
  extra?: Record<string, any>;
}
