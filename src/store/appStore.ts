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
  HospitalizationStatusLog,
  DischargePlan,
  ShiftRecord,
  QualityControlRecord,
  StatisticsData,
  RiskLevel,
  TemplateApplicationRecord,
  WorkReminder,
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

type ActiveWindow = 'patients' | 'detail' | 'template' | 'consultation' | 'shift' | 'qc' | 'reminder';

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

  consultationSubTab: 'consultation' | 'hospitalization';
  openConsultationDetailId: string | null;
  openHospitalizationDetailId: string | null;
  openQCDetailId: string | null;
  detailActiveTabKey: string;

  setActiveWindow: (window: ActiveWindow) => void;
  selectPatient: (patientId: string | null, tabKey?: string) => void;
  selectTemplate: (templateId: string | null) => void;
  setPatientSearchKeyword: (keyword: string) => void;
  setPatientRiskFilter: (level: RiskLevel | 'all') => void;
  setPreFillConsultationPatient: (patientId: string | null) => void;
  setPreFillHospitalizationPatient: (patientId: string | null) => void;

  setConsultationSubTab: (tab: 'consultation' | 'hospitalization') => void;
  setOpenConsultationDetail: (id: string | null) => void;
  setOpenHospitalizationDetail: (id: string | null) => void;
  setOpenQCDetail: (id: string | null) => void;
  setDetailActiveTabKey: (key: string) => void;

  updatePatientRiskLevel: (patientId: string, level: RiskLevel, reason: string) => void;
  updatePatientStatus: (patientId: string, status: Patient['currentStatus'], extra?: Partial<Patient>) => void;
  applyTemplateToPatient: (
    patientId: string,
    templateId: string,
    templateName: string,
    nextVisitDate: string,
    visitTypes: string[],
    visitItems: string[],
    note?: string,
    doctor?: string
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
    options?: {
      patientStatus?: Patient['currentStatus'];
      admissionDate?: string;
      dischargeDate?: string;
      remark?: string;
      doctor?: string;
    }
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
  reviewQCRecord: (
    recordId: string,
    passed: boolean,
    reviewDoctor: string,
    rejectReason?: string
  ) => void;

  dischargeWithPlan: (adviceId: string, dischargePlanData: Partial<DischargePlan>) => DischargePlan;

  getWorkReminders: () => WorkReminder[];
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

  consultationSubTab: 'consultation' as 'consultation' | 'hospitalization',
  openConsultationDetailId: null,
  openHospitalizationDetailId: null,
  openQCDetailId: null,
  detailActiveTabKey: 'basic',
};

const genId = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const nowStr = () => new Date().toLocaleString('zh-CN');

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setActiveWindow: (window) => set({ activeWindow: window }),
      selectPatient: (patientId, tabKey) =>
        set({
          selectedPatientId: patientId,
          activeWindow: patientId ? 'detail' : 'patients',
          preFillConsultationPatientId: null,
          preFillHospitalizationPatientId: null,
          detailActiveTabKey: tabKey || 'basic',
        }),
      selectTemplate: (templateId) => set({ selectedTemplateId: templateId }),
      setPatientSearchKeyword: (keyword) => set({ patientSearchKeyword: keyword }),
      setPatientRiskFilter: (level) => set({ patientRiskFilter: level }),
      setPreFillConsultationPatient: (patientId) => set({ preFillConsultationPatientId: patientId }),
      setPreFillHospitalizationPatient: (patientId) => set({ preFillHospitalizationPatientId: patientId }),

      setConsultationSubTab: (tab) => set({ consultationSubTab: tab }),
      setOpenConsultationDetail: (id) => set({ openConsultationDetailId: id }),
      setOpenHospitalizationDetail: (id) => set({ openHospitalizationDetailId: id }),
      setOpenQCDetail: (id) => set({ openQCDetailId: id }),
      setDetailActiveTabKey: (key) => set({ detailActiveTabKey: key }),

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
                  lastUpdateTime: nowStr(),
                }
              : p
          ),
        })),

      updatePatientStatus: (patientId, status, extra) =>
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === patientId ? { ...p, currentStatus: status, lastUpdateTime: nowStr(), ...extra } : p
          ),
        })),

      applyTemplateToPatient: (patientId, templateId, templateName, nextVisitDate, visitTypes, visitItems, note, doctor) =>
        set((state) => {
          const historyRecord: TemplateApplicationRecord = {
            id: genId('TA'),
            templateId,
            templateName,
            applyTime: nowStr(),
            applyDoctor: doctor || '张医生',
            nextVisitDate,
            visitTypes,
            visitItems,
            remark: note,
          };
          return {
            patients: state.patients.map((p) =>
              p.id === patientId
                ? {
                    ...p,
                    nextVisitDate,
                    nextVisitTypes: visitTypes,
                    nextVisitItems: visitItems,
                    appliedTemplateId: templateId,
                    appliedTemplateName: templateName,
                    appliedTemplateTime: nowStr(),
                    templateApplicationHistory: [historyRecord, ...(p.templateApplicationHistory || [])],
                    tags: note
                      ? [...p.tags.filter((t) => !t.startsWith('处置计划')), `处置计划(${new Date().toLocaleDateString()}): ${note}`]
                      : p.tags,
                    lastUpdateTime: nowStr(),
                  }
                : p
            ),
          };
        }),

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
                    status === 'completed' || status === 'accepted' ? nowStr() : c.consultDate,
                }
              : c
          ),
        })),

      addHospitalizationAdvice: (advice) =>
        set((state) => {
          const newAdvice: HospitalizationAdvice = {
            ...advice,
            statusTimeline: advice.statusTimeline || [
              { status: advice.status, time: nowStr(), doctor: advice.createDoctor || '张医生' },
            ],
          };
          return {
            hospitalizationAdvices: [newAdvice, ...state.hospitalizationAdvices],
            activeWindow: 'consultation',
            preFillHospitalizationPatientId: null,
          };
        }),

      updateHospitalizationAdvice: (adviceId, updates) =>
        set((state) => ({
          hospitalizationAdvices: state.hospitalizationAdvices.map((a) =>
            a.id === adviceId ? { ...a, ...updates } : a
          ),
        })),

      updateHospitalizationStatus: (adviceId, status, options) =>
        set((state) => {
          const advice = state.hospitalizationAdvices.find((a) => a.id === adviceId);
          if (!advice) return state;

          const newLog: HospitalizationStatusLog = {
            status,
            time: nowStr(),
            doctor: options?.doctor || '张医生',
            remark: options?.remark,
          };

          const patientUpdates: Partial<Patient> = {};
          if (options?.patientStatus) patientUpdates.currentStatus = options.patientStatus;
          if (options?.admissionDate) patientUpdates.admissionDate = options.admissionDate;
          if (options?.dischargeDate) patientUpdates.dischargeDate = options.dischargeDate;

          return {
            hospitalizationAdvices: state.hospitalizationAdvices.map((a) =>
              a.id === adviceId
                ? {
                    ...a,
                    status,
                    admissionDate: status === 'admitted' ? options?.admissionDate || new Date().toISOString().split('T')[0] : a.admissionDate,
                    dischargeDate: status === 'discharged' ? options?.dischargeDate || new Date().toISOString().split('T')[0] : a.dischargeDate,
                    statusTimeline: [...(a.statusTimeline || []), newLog],
                  }
                : a
            ),
            patients:
              Object.keys(patientUpdates).length > 0
                ? state.patients.map((p) =>
                    p.id === advice.patientId
                      ? { ...p, ...patientUpdates, lastUpdateTime: nowStr() }
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
            p.id === patientId ? { ...p, isKeyCase: isKey, lastUpdateTime: nowStr() } : p
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
                          completedDate: status === 'completed' ? nowStr() : item.completedDate,
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
                  status: 'pending_review',
                  originalProblems: r.originalProblems || [...r.problems],
                  rectificationNote,
                  rectificationDate: nowStr(),
                  rectificationDoctor: rectificationDoctor || '张医生',
                }
              : r
          ),
        })),

      reviewQCRecord: (recordId, passed, reviewDoctor, rejectReason) =>
        set((state) => ({
          qualityControlRecords: state.qualityControlRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: passed ? 'revised' : 'revision_rejected',
                  reviewDate: nowStr(),
                  reviewDoctor,
                  reviewResult: passed ? 'passed' : 'rejected',
                  rejectReason: passed ? r.rejectReason : rejectReason,
                }
              : r
          ),
        })),

      dischargeWithPlan: (adviceId, dischargePlanData) => {
        const state = get();
        const advice = state.hospitalizationAdvices.find((a) => a.id === adviceId);
        if (!advice) return {} as DischargePlan;

        const newPlan: DischargePlan = {
          id: genId('DP'),
          patientId: advice.patientId,
          patientName: advice.patientName,
          hospitalizationAdviceId: adviceId,
          admissionDate: advice.admissionDate,
          dischargeDate: new Date().toISOString().split('T')[0],
          followUpItems: dischargePlanData.followUpItems || [],
          medications: dischargePlanData.medications || [],
          lifestyleAdvice: dischargePlanData.lifestyleAdvice || [],
          warningSigns: dischargePlanData.warningSigns || [],
          nextAppointment: dischargePlanData.nextAppointment || '',
          createDoctor: dischargePlanData.createDoctor || '张医生',
          createTime: nowStr(),
        };

        const dischargeDateStr = new Date().toISOString().split('T')[0];
        const newLog: HospitalizationStatusLog = {
          status: 'discharged',
          time: nowStr(),
          doctor: dischargePlanData.createDoctor || '张医生',
          remark: '已办理出院并生成随访计划',
        };

        set((s) => ({
          hospitalizationAdvices: s.hospitalizationAdvices.map((a) =>
            a.id === adviceId
              ? {
                  ...a,
                  status: 'discharged',
                  dischargeDate: dischargeDateStr,
                  statusTimeline: [...(a.statusTimeline || []), newLog],
                }
              : a
          ),
          patients: s.patients.map((p) =>
            p.id === advice.patientId
              ? {
                  ...p,
                  currentStatus: 'discharged',
                  dischargeDate: dischargeDateStr,
                  nextVisitDate: newPlan.nextAppointment,
                  lastUpdateTime: nowStr(),
                }
              : p
          ),
          dischargePlans: [newPlan, ...s.dischargePlans],
        }));

        return newPlan;
      },

      getWorkReminders: () => {
        const state = get();
        const reminders: WorkReminder[] = [];
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. 高危复诊到期/临期（7天内）
        state.patients
          .filter((p) => p.nextVisitDate && p.riskLevel !== 'green')
          .forEach((p) => {
            const visitDate = new Date(p.nextVisitDate);
            const diffDays = Math.ceil((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7 && diffDays >= -2) {
              let urgency: 'high' | 'medium' | 'low' = 'low';
              let title = '复诊提醒';
              let subtitle = `${p.name} · ${p.gestationalWeeks}+${p.gestationalDays}周 · ${p.nextVisitDate}复诊`;
              if (diffDays < 0) {
                urgency = 'high';
                title = '复诊已过期';
                subtitle = `${p.name} · ${Math.abs(diffDays)}天前应复诊 · ${p.nextVisitDate}`;
              } else if (diffDays <= 2) {
                urgency = 'medium';
                title = '近期复诊';
                subtitle = `${p.name} · 还剩${diffDays}天 · ${p.nextVisitDate}复诊`;
              }
              if (p.riskLevel === 'red') urgency = 'high';
              reminders.push({
                id: `V-${p.id}`,
                type: 'visit',
                title,
                subtitle,
                patientId: p.id,
                patientName: p.name,
                recordId: p.id,
                urgency,
                deadline: p.nextVisitDate,
              });
            }
          });

        // 2. 待回复会诊
        state.consultations
          .filter((c) => c.status === 'pending' || c.status === 'accepted')
          .forEach((c) => {
            const urgency = c.type === 'urgent' ? 'high' : 'medium';
            reminders.push({
              id: `C-${c.id}`,
              type: 'consultation',
              title: c.status === 'pending' ? '待处理会诊申请' : '待回复会诊',
              subtitle: `${c.patientName} · ${c.consultDepartment} · ${c.requestDate}`,
              patientId: c.patientId,
              patientName: c.patientName,
              recordId: c.id,
              urgency,
              deadline: c.requestDate,
              extra: { question: c.question },
            });
          });

        // 3. 待入院建议
        state.hospitalizationAdvices
          .filter((a) => a.status === 'suggested')
          .forEach((a) => {
            const urgency = a.urgency === 'emergency' ? 'high' : a.urgency === 'urgent' ? 'medium' : 'low';
            reminders.push({
              id: `H-${a.id}`,
              type: 'hospital',
              title: '待入院患者',
              subtitle: `${a.patientName} · ${a.department} · ${a.urgency === 'emergency' ? '急诊' : a.urgency === 'urgent' ? '加急' : '常规'}`,
              patientId: a.patientId,
              patientName: a.patientName,
              recordId: a.id,
              urgency,
              deadline: a.createDate,
              extra: { reason: a.reason },
            });
          });

        // 4. 质控待办（待审核/待整改/整改退回/待复核）
        state.qualityControlRecords
          .filter((r) =>
            r.status === 'pending' ||
            r.status === 'completed' ||
            r.status === 'revision_rejected' ||
            r.status === 'pending_review'
          )
          .forEach((r) => {
            const hasProblems = r.problems && r.problems.length > 0;
            let title = '质控待办';
            let urgency: 'high' | 'medium' | 'low' = 'low';
            switch (r.status) {
              case 'pending':
                title = '待审核质控';
                urgency = 'medium';
                break;
              case 'completed':
                title = '质控待整改';
                urgency = 'low';
                break;
              case 'revision_rejected':
                title = '质控整改被退回';
                urgency = 'high';
                break;
              case 'pending_review':
                title = '质控待复核';
                urgency = 'medium';
                break;
            }
            if (hasProblems) {
              reminders.push({
                id: `Q-${r.id}`,
                type: 'qc',
                title,
                subtitle: `${r.patientName} · ${r.auditDate} · ${r.problems.length}个问题`,
                patientId: r.patientId,
                patientName: r.patientName,
                recordId: r.id,
                urgency,
                deadline: r.auditDate,
                extra: { totalScore: r.totalScore, problems: r.problems, rejectReason: r.rejectReason },
              });
            }
          });

        // 5. 今日交班待办（最近一条交班记录）
        if (state.shiftRecords.length > 0) {
          const latestShift = state.shiftRecords[0];
          const shiftDate = latestShift.shiftDate;
          if (shiftDate === todayStr) {
            const pendingTasks = latestShift.patientsOnDuty.flatMap((p) => p.pendingTasks || []);
            const keyCases = latestShift.patientsOnDuty.filter((p) => p.isKeyCase);
            reminders.push({
              id: `S-${latestShift.id}`,
              type: 'shift',
              title: '今日交班待办',
              subtitle: `${latestShift.shiftType === 'morning' ? '早班' : latestShift.shiftType === 'afternoon' ? '中班' : '晚班'} · ${pendingTasks.length}项待办 · ${keyCases.length}例重点`,
              recordId: latestShift.id,
              urgency: 'medium',
              deadline: shiftDate,
              extra: { pendingTasks, keyCases: keyCases.length },
            });
          }
        }

        // 按紧急程度排序
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        reminders.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

        return reminders;
      },
    }),
    {
      name: 'obstetric-followup-store-v2',
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
          state.vitalRecords = mockVitalRecords;
          state.ultrasoundRecords = mockUltrasoundRecords;
          state.labResults = mockLabResults;
          state.pregnancyHistories = mockPregnancyHistory;
          state.treatmentTemplates = mockTreatmentTemplates;
          state.statistics = mockStatistics;

          state.activeWindow = 'patients';
          state.selectedPatientId = null;
          state.selectedTemplateId = null;
          state.preFillConsultationPatientId = null;
          state.preFillHospitalizationPatientId = null;
          state.patientSearchKeyword = '';
          state.patientRiskFilter = 'all';

          state.consultationSubTab = 'consultation';
          state.openConsultationDetailId = null;
          state.openHospitalizationDetailId = null;
          state.openQCDetailId = null;
          state.detailActiveTabKey = 'basic';
        }
      },
    }
  )
);
