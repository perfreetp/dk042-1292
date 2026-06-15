import { create } from 'zustand';
import type {
  Patient,
  VitalRecord,
  UltrasoundRecord,
  LabResult,
  PregnancyHistory,
  TreatmentTemplate,
  Consultation,
  HospitalizationAdvice,
  DischargePlan,
  ShiftRecord,
  QualityControlRecord,
  StatisticsData,
  RiskLevel,
} from '../types';
import {
  mockPatients,
  mockVitalRecords,
  mockUltrasoundRecords,
  mockLabResults,
  mockPregnancyHistory,
  mockTreatmentTemplates,
  mockConsultations,
  mockHospitalizationAdvices,
  mockDischargePlans,
  mockShiftRecords,
  mockQualityControlRecords,
  mockStatistics,
} from '../data/mockData';

type ActiveWindow = 'patients' | 'detail' | 'template' | 'consultation' | 'shift' | 'qc';

interface AppState {
  patients: Patient[];
  vitalRecords: VitalRecord[];
  ultrasoundRecords: UltrasoundRecord[];
  labResults: LabResult[];
  pregnancyHistories: PregnancyHistory[];
  treatmentTemplates: TreatmentTemplate[];
  consultations: Consultation[];
  hospitalizationAdvices: HospitalizationAdvice[];
  dischargePlans: DischargePlan[];
  shiftRecords: ShiftRecord[];
  qualityControlRecords: QualityControlRecord[];
  statistics: StatisticsData;

  activeWindow: ActiveWindow;
  selectedPatientId: string | null;
  selectedTemplateId: string | null;
  patientSearchKeyword: string;
  patientRiskFilter: RiskLevel | 'all';

  setActiveWindow: (window: ActiveWindow) => void;
  selectPatient: (patientId: string | null) => void;
  selectTemplate: (templateId: string | null) => void;
  setPatientSearchKeyword: (keyword: string) => void;
  setPatientRiskFilter: (level: RiskLevel | 'all') => void;
  updatePatientRiskLevel: (patientId: string, level: RiskLevel, reason: string) => void;
  addConsultation: (consultation: Consultation) => void;
  updateConsultationStatus: (consultationId: string, status: Consultation['status'], opinion?: string) => void;
  addHospitalizationAdvice: (advice: HospitalizationAdvice) => void;
  addDischargePlan: (plan: DischargePlan) => void;
  markKeyCase: (patientId: string, isKey: boolean) => void;
  updateFollowUpStatus: (planId: string, itemIndex: number, status: 'completed' | 'missed') => void;
  addShiftRecord: (record: ShiftRecord) => void;
  addQCRecord: (record: QualityControlRecord) => void;
}

export const useAppStore = create<AppState>((set) => ({
  patients: mockPatients,
  vitalRecords: mockVitalRecords,
  ultrasoundRecords: mockUltrasoundRecords,
  labResults: mockLabResults,
  pregnancyHistories: mockPregnancyHistory,
  treatmentTemplates: mockTreatmentTemplates,
  consultations: mockConsultations,
  hospitalizationAdvices: mockHospitalizationAdvices,
  dischargePlans: mockDischargePlans,
  shiftRecords: mockShiftRecords,
  qualityControlRecords: mockQualityControlRecords,
  statistics: mockStatistics,

  activeWindow: 'patients',
  selectedPatientId: null,
  selectedTemplateId: null,
  patientSearchKeyword: '',
  patientRiskFilter: 'all',

  setActiveWindow: (window) => set({ activeWindow: window }),
  selectPatient: (patientId) => set({ selectedPatientId: patientId, activeWindow: patientId ? 'detail' : 'patients' }),
  selectTemplate: (templateId) => set({ selectedTemplateId: templateId }),
  setPatientSearchKeyword: (keyword) => set({ patientSearchKeyword: keyword }),
  setPatientRiskFilter: (level) => set({ patientRiskFilter: level }),

  updatePatientRiskLevel: (patientId, level, reason) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId
          ? {
              ...p,
              riskLevel: level,
              tags: [...p.tags.filter((t) => !t.startsWith('风险调整')), `风险调整(${new Date().toLocaleDateString()}): ${reason}`],
              lastUpdateTime: new Date().toLocaleString('zh-CN'),
            }
          : p
      ),
    })),

  addConsultation: (consultation) =>
    set((state) => ({ consultations: [consultation, ...state.consultations] })),

  updateConsultationStatus: (consultationId, status, opinion) =>
    set((state) => ({
      consultations: state.consultations.map((c) =>
        c.id === consultationId
          ? { ...c, status, consultOpinion: opinion || c.consultOpinion, consultDate: status === 'completed' ? new Date().toLocaleString('zh-CN') : c.consultDate }
          : c
      ),
    })),

  addHospitalizationAdvice: (advice) =>
    set((state) => ({ hospitalizationAdvices: [advice, ...state.hospitalizationAdvices] })),

  addDischargePlan: (plan) =>
    set((state) => ({ dischargePlans: [plan, ...state.dischargePlans] })),

  markKeyCase: (patientId, isKey) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === patientId ? { ...p, isKeyCase: isKey, lastUpdateTime: new Date().toLocaleString('zh-CN') } : p
      ),
    })),

  updateFollowUpStatus: (planId, itemIndex, status) =>
    set((state) => ({
      dischargePlans: state.dischargePlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              followUpItems: plan.followUpItems.map((item, idx) =>
                idx === itemIndex
                  ? { ...item, status, completedDate: status === 'completed' ? new Date().toLocaleString('zh-CN') : item.completedDate }
                  : item
              ),
            }
          : plan
      ),
    })),

  addShiftRecord: (record) =>
    set((state) => ({ shiftRecords: [record, ...state.shiftRecords] })),

  addQCRecord: (record) =>
    set((state) => ({ qualityControlRecords: [record, ...state.qualityControlRecords] })),
}));
