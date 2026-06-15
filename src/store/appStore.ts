import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

  preFillConsultationPatientId: string | null;
  preFillHospitalizationPatientId: string | null;

  setActiveWindow: (window: ActiveWindow) => void;
  selectPatient: (patientId: string | null) => void;
  selectTemplate: (templateId: string | null) => void;
  setPatientSearchKeyword: (keyword: string) => void;
  setPatientRiskFilter: (level: RiskLevel | 'all') => void;
  setPreFillConsultationPatient: (patientId: string | null) => void;
  setPreFillHospitalizationPatient: (patientId: string | null) => void;

  updatePatientRiskLevel: (patientId: string, level: RiskLevel, reason: string) => void;
  updatePatientStatus: (patientId: string, status: Patient['currentStatus'], extra?: Partial<Patient>) => void;
  applyTemplateToPatient: (
    patientId: string,
    templateId: string,
    templateName: string,
    nextVisitDate: string,
    visitTypes: string[],
    visitItems: string[],
    note?: string
  ) => void;

  addConsultation: (consultation: Consultation) => void;
  updateConsultation: (consultationId: string, updates: Partial<Consultation>) => void;
  replyConsultation: (
    consultationId: string,
    status: Consultation['status'],
    opinion?: string,
    suggestions?: string[]
  ) => void;

  addHospitalizationAdvice: (advice: HospitalizationAdvice) => void;
  updateHospitalizationAdvice: (adviceId: string, updates: Partial<HospitalizationAdvice>) => void;
  updateHospitalizationStatus: (
    adviceId: string,
    status: HospitalizationAdvice['status'],
    extra?: { patientStatus?: Patient['currentStatus']; admissionDate?: string; dischargeDate?: string }
  ) => void;

  addDischargePlan: (plan: DischargePlan) => void;
  markKeyCase: (patientId: string, isKey: boolean) => void;
  updateFollowUpStatus: (planId: string, itemIndex: number, status: 'completed' | 'missed', note?: string) => void;

  addShiftRecord: (record: ShiftRecord) => void;

  addQCRecord: (record: QualityControlRecord) => void;
  updateQCRecord: (recordId: string, updates: Partial<QualityControlRecord>) => void;
  rectifyQCRecord: (
    recordId: string,
    rectificationNote: string,
    rectificationDoctor?: string
  ) => void;
}

const initialState = {
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

  activeWindow: 'patients' as ActiveWindow,
  selectedPatientId: null,
  selectedTemplateId: null,
  patientSearchKeyword: '',
  patientRiskFilter: 'all' as RiskLevel | 'all',
  preFillConsultationPatientId: null,
  preFillHospitalizationPatientId: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveWindow: (window) => set({ activeWindow: window }),
      selectPatient: (patientId) =>
        set({
          selectedPatientId: patientId,
          activeWindow: patientId ? 'detail' : 'patients',
          preFillConsultationPatientId: null,
          preFillHospitalizationPatientId: null,
        }),
      selectTemplate: (templateId) => set({ selectedTemplateId: templateId }),
      setPatientSearchKeyword: (keyword) => set({ patientSearchKeyword: keyword }),
      setPatientRiskFilter: (level) => set({ patientRiskFilter: level }),
      setPreFillConsultationPatient: (patientId) => set({ preFillConsultationPatientId: patientId }),
      setPreFillHospitalizationPatient: (patientId) => set({ preFillHospitalizationPatientId: patientId }),

      updatePatientRiskLevel: (patientId, level, reason) =>
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  riskLevel: level,
                  tags: [
                    ...p.tags.filter((t) => !t.startsWith('风险调整')),
                    `风险调整(${new Date().toLocaleDateString()}): ${reason}`,
                  ],
                  lastUpdateTime: new Date().toLocaleString('zh-CN'),
                }
              : p
          ),
        })),

      updatePatientStatus: (patientId, status, extra) =>
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? { ...p, currentStatus: status, lastUpdateTime: new Date().toLocaleString('zh-CN'), ...extra }
              : p
          ),
        })),

      applyTemplateToPatient: (patientId, templateId, templateName, nextVisitDate, visitTypes, visitItems, note) =>
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  nextVisitDate,
                  nextVisitTypes: visitTypes,
                  nextVisitItems: visitItems,
                  appliedTemplateId: templateId,
                  appliedTemplateName: templateName,
                  appliedTemplateTime: new Date().toLocaleString('zh-CN'),
                  tags: note
                    ? [...p.tags.filter((t) => !t.startsWith('处置计划')), `处置计划(${new Date().toLocaleDateString()}): ${note}`]
                    : p.tags,
                  lastUpdateTime: new Date().toLocaleString('zh-CN'),
                }
              : p
          ),
        })),

      addConsultation: (consultation) =>
        set((state) => ({
          consultations: [consultation, ...state.consultations],
          activeWindow: 'consultation',
          preFillConsultationPatientId: null,
        })),

      updateConsultation: (consultationId, updates) =>
        set((state) => ({
          consultations: state.consultations.map((c) => (c.id === consultationId ? { ...c, ...updates } : c)),
        })),

      replyConsultation: (consultationId, status, opinion, suggestions) =>
        set((state) => ({
          consultations: state.consultations.map((c) =>
            c.id === consultationId
              ? {
                  ...c,
                  status,
                  consultOpinion: opinion !== undefined ? opinion : c.consultOpinion,
                  suggestions: suggestions !== undefined ? suggestions : c.suggestions,
                  consultDate:
                    status === 'completed' || status === 'accepted'
                      ? new Date().toLocaleString('zh-CN')
                      : c.consultDate,
                }
              : c
          ),
        })),

      addHospitalizationAdvice: (advice) =>
        set((state) => ({
          hospitalizationAdvices: [advice, ...state.hospitalizationAdvices],
          activeWindow: 'consultation',
          preFillHospitalizationPatientId: null,
        })),

      updateHospitalizationAdvice: (adviceId, updates) =>
        set((state) => ({
          hospitalizationAdvices: state.hospitalizationAdvices.map((a) =>
            a.id === adviceId ? { ...a, ...updates } : a
          ),
        })),

      updateHospitalizationStatus: (adviceId, status, extra) =>
        set((state) => {
          const advice = state.hospitalizationAdvices.find((a) => a.id === adviceId);
          const patientUpdates: Partial<Patient> = {};
          if (extra?.patientStatus) patientUpdates.currentStatus = extra.patientStatus;
          if (extra?.admissionDate) patientUpdates.admissionDate = extra.admissionDate;
          if (extra?.dischargeDate) patientUpdates.dischargeDate = extra.dischargeDate;

          return {
            hospitalizationAdvices: state.hospitalizationAdvices.map((a) =>
              a.id === adviceId ? { ...a, status } : a
            ),
            patients:
              advice && Object.keys(patientUpdates).length > 0
                ? state.patients.map((p) =>
                    p.id === advice.patientId
                      ? { ...p, ...patientUpdates, lastUpdateTime: new Date().toLocaleString('zh-CN') }
                      : p
                  )
                : state.patients,
          };
        }),

      addDischargePlan: (plan) =>
        set((state) => ({ dischargePlans: [plan, ...state.dischargePlans] })),

      markKeyCase: (patientId, isKey) =>
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId ? { ...p, isKeyCase: isKey, lastUpdateTime: new Date().toLocaleString('zh-CN') } : p
          ),
        })),

      updateFollowUpStatus: (planId, itemIndex, status, note) =>
        set((state) => ({
          dischargePlans: state.dischargePlans.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  followUpItems: plan.followUpItems.map((item, idx) =>
                    idx === itemIndex
                      ? {
                          ...item,
                          status,
                          completedDate:
                            status === 'completed' ? new Date().toLocaleString('zh-CN') : item.completedDate,
                          note: note !== undefined ? note : item.note,
                        }
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

      updateQCRecord: (recordId, updates) =>
        set((state) => ({
          qualityControlRecords: state.qualityControlRecords.map((r) =>
            r.id === recordId ? { ...r, ...updates } : r
          ),
        })),

      rectifyQCRecord: (recordId, rectificationNote, rectificationDoctor) =>
        set((state) => ({
          qualityControlRecords: state.qualityControlRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: 'revised',
                  rectificationNote,
                  rectificationDate: new Date().toLocaleString('zh-CN'),
                  rectificationDoctor: rectificationDoctor || '张医生',
                }
              : r
          ),
        })),
    }),
    {
      name: 'obstetric-followup-store-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        patients: state.patients,
        consultations: state.consultations,
        hospitalizationAdvices: state.hospitalizationAdvices,
        dischargePlans: state.dischargePlans,
        shiftRecords: state.shiftRecords,
        qualityControlRecords: state.qualityControlRecords,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 重新合并模板、静态记录、统计数据（避免被旧缓存覆盖）
          state.vitalRecords = mockVitalRecords;
          state.ultrasoundRecords = mockUltrasoundRecords;
          state.labResults = mockLabResults;
          state.pregnancyHistories = mockPregnancyHistory;
          state.treatmentTemplates = mockTreatmentTemplates;
          state.statistics = mockStatistics;

          // UI 状态重置
          state.activeWindow = 'patients';
          state.selectedPatientId = null;
          state.selectedTemplateId = null;
          state.preFillConsultationPatientId = null;
          state.preFillHospitalizationPatientId = null;
        }
      },
    }
  )
);
