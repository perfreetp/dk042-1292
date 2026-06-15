import React, { useState, useMemo, useEffect } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Radio,
  Form,
  message,
  Drawer,
  Timeline,
  Checkbox,
  Badge,
  Divider,
  Tooltip,
  Alert,
  Descriptions,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  MessageOutlined,
  BellOutlined,
  ArrowRightOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table/interface';
import { useAppStore } from '../store/appStore';
import { riskLevelColors, riskLevelLabels } from '../data/mockData';
import type { Consultation, HospitalizationAdvice, RiskLevel, Patient } from '../types';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const consultationStatusLabels: Record<Consultation['status'], string> = {
  pending: '待处理',
  accepted: '已接受',
  completed: '已完成',
  rejected: '已拒绝',
};

const consultationStatusColors: Record<Consultation['status'], string> = {
  pending: 'gold',
  accepted: 'blue',
  completed: 'green',
  rejected: 'default',
};

const consultationTypeLabels: Record<Consultation['type'], string> = {
  urgent: '紧急',
  routine: '常规',
};

const consultationTypeColors: Record<Consultation['type'], string> = {
  urgent: 'red',
  routine: 'blue',
};

const hospitalizationStatusLabels: Record<HospitalizationAdvice['status'], string> = {
  suggested: '建议中',
  admitted: '已入院',
  discharged: '已出院',
  cancelled: '已取消',
};

const hospitalizationStatusColors: Record<HospitalizationAdvice['status'], string> = {
  suggested: 'blue',
  admitted: 'green',
  discharged: 'default',
  cancelled: 'default',
};

const urgencyLabels: Record<HospitalizationAdvice['urgency'], string> = {
  emergency: '急诊',
  urgent: '加急',
  routine: '常规',
};

const urgencyColors: Record<HospitalizationAdvice['urgency'], string> = {
  emergency: 'red',
  urgent: 'orange',
  routine: 'blue',
};

const consultDepartments = [
  '心内科',
  '内分泌科',
  '麻醉科',
  '新生儿科',
  '泌尿外科',
  '消化内科',
  '呼吸内科',
  '风湿免疫科',
  '神经内科',
  '血液科',
  '感染科',
  '影像科',
];

const treatmentOptions = [
  '卧床休息',
  '吸氧',
  '降压治疗',
  '降糖治疗',
  '解痉治疗（硫酸镁）',
  '促胎肺成熟',
  '抑制宫缩',
  '抗生素预防感染',
  '营养支持',
  '纠正贫血',
  '抗凝治疗',
  '利尿治疗',
];

const examinationOptions = [
  '血常规',
  '尿常规',
  '生化全套',
  '凝血功能',
  '胎心监护(NST)',
  '超声检查',
  '心电图',
  '心脏超声',
  'MRI检查',
  '24小时尿蛋白定量',
  '肝肾功能',
  '胆汁酸测定',
  '血型+交叉配血',
  '脐血流监测',
];

const suggestionOptions = [
  '加强监测频率',
  '增加产检次数',
  '住院治疗',
  '多学科会诊',
  '终止妊娠评估',
  '促宫颈成熟+引产',
  '剖宫产终止妊娠',
  '转上级医院',
  '新生儿科转诊准备',
  '术后监护',
  '预防血栓',
  '抗感染治疗',
];

const ConsultationPage: React.FC = () => {
  const {
    consultations,
    hospitalizationAdvices,
    patients,
    addConsultation,
    addHospitalizationAdvice,
    selectPatient,
    setActiveWindow,
    preFillConsultationPatientId,
    preFillHospitalizationPatientId,
    setPreFillConsultationPatient,
    setPreFillHospitalizationPatient,
    updateHospitalizationAdvice,
    updateHospitalizationStatus,
    replyConsultation,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('consultations');

  useEffect(() => {
    if (preFillConsultationPatientId && typeof preFillConsultationPatientId === 'string') {
      setActiveTab('consultations');
      setTimeout(() => {
        handleOpenCreateModal(preFillConsultationPatientId);
      }, 0);
    }
  }, [preFillConsultationPatientId]);

  useEffect(() => {
    if (preFillHospitalizationPatientId) {
      setActiveTab('hospital');
      setTimeout(() => {
        handleOpenHospCreate(preFillHospitalizationPatientId);
      }, 0);
    }
  }, [preFillHospitalizationPatientId]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [requestDeptFilter, setRequestDeptFilter] = useState<string>('all');
  const [consultDeptFilter, setConsultDeptFilter] = useState<string>('all');
  const [consultKeyword, setConsultKeyword] = useState('');

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [consultForm] = Form.useForm();

  const [replyOpinion, setReplyOpinion] = useState('');
  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);

  const [hospStatusFilter, setHospStatusFilter] = useState<string>('all');
  const [hospKeyword, setHospKeyword] = useState('');

  const [createHospModalVisible, setCreateHospModalVisible] = useState(false);
  const [editHospAdvice, setEditHospAdvice] = useState<HospitalizationAdvice | null>(null);
  const [hospDetailVisible, setHospDetailVisible] = useState(false);
  const [currentHospAdvice, setCurrentHospAdvice] = useState<HospitalizationAdvice | null>(null);
  const [hospForm] = Form.useForm();

  const getPatientById = (id: string): Patient | undefined => patients.find((p) => p.id === id);

  const filteredConsultations = useMemo(() => {
    return consultations.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (requestDeptFilter !== 'all' && c.requestDepartment !== requestDeptFilter) return false;
      if (consultDeptFilter !== 'all' && c.consultDepartment !== consultDeptFilter) return false;
      if (consultKeyword) {
        const kw = consultKeyword.toLowerCase();
        if (
          !c.patientName.toLowerCase().includes(kw) &&
          !c.question.toLowerCase().includes(kw) &&
          !c.chiefComplaint.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [consultations, statusFilter, typeFilter, requestDeptFilter, consultDeptFilter, consultKeyword]);

  const filteredHospAdvices = useMemo(() => {
    return hospitalizationAdvices.filter((h) => {
      if (hospStatusFilter !== 'all' && h.status !== hospStatusFilter) return false;
      if (hospKeyword) {
        const kw = hospKeyword.toLowerCase();
        if (
          !h.patientName.toLowerCase().includes(kw) &&
          !h.reason.toLowerCase().includes(kw) &&
          !h.department.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [hospitalizationAdvices, hospStatusFilter, hospKeyword]);

  const handlePatientClick = (patientId: string) => {
    selectPatient(patientId);
    setActiveWindow('detail');
  };

  const handleOpenCreateModal = (_e?: any, preFillPatientId?: string) => {
    consultForm.resetFields();
    const values: Record<string, any> = {
      type: 'routine',
      requestDepartment: '产科',
      timeLimit: '24h',
    };
    const patientId = typeof _e === 'string' ? _e : preFillPatientId;
    if (patientId) {
      values.patientId = patientId;
    }
    consultForm.setFieldsValue(values);
    setCreateModalVisible(true);
  };

  const handleCreateConsultation = async () => {
    try {
      const values = await consultForm.validateFields();
      const patient = patients.find((p) => p.id === values.patientId);
      if (!patient) {
        message.error('请选择有效的患者');
        return;
      }
      const newConsultation: Consultation = {
        id: `C${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        requestDate: new Date().toLocaleString('zh-CN'),
        requestDoctor: '当前医生',
        requestDepartment: values.requestDepartment,
        consultDepartment: values.consultDepartment,
        consultDoctor: values.consultDoctor || '',
        type: values.type,
        status: 'pending',
        chiefComplaint: values.chiefComplaint || '',
        briefHistory: values.briefHistory || '',
        currentFindings: values.currentFindings || '',
        question: values.question,
      };
      addConsultation(newConsultation);
      message.success('会诊申请已提交');
      setPreFillConsultationPatient(null);
      setCreateModalVisible(false);
    } catch {
      // validation error
    }
  };

  const handleOpenDetail = (consultation: Consultation, forReply = false) => {
    setCurrentConsultation(consultation);
    setReplyOpinion(consultation.consultOpinion || '');
    setReplySuggestions(consultation.suggestions || []);
    setDetailDrawerVisible(true);
  };

  const handleAcceptConsultation = () => {
    if (currentConsultation) {
      replyConsultation(currentConsultation.id, 'accepted', replyOpinion, replySuggestions);
      const updated = consultations.find((c) => c.id === currentConsultation.id);
      if (updated) setCurrentConsultation({ ...updated });
      message.success('已接受会诊');
    }
  };

  const handleRejectConsultation = () => {
    Modal.confirm({
      title: '确认拒绝会诊？',
      content: '请确认是否拒绝此会诊申请，拒绝后需要重新发起。',
      okText: '确认拒绝',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        if (currentConsultation) {
          replyConsultation(currentConsultation.id, 'rejected', replyOpinion);
          message.success('已拒绝会诊');
          setDetailDrawerVisible(false);
        }
      },
    });
  };

  const handleCompleteConsultation = () => {
    if (!replyOpinion.trim()) {
      message.error('请填写会诊意见');
      return;
    }
    if (currentConsultation) {
      replyConsultation(currentConsultation.id, 'completed', replyOpinion, replySuggestions);
      const updated = consultations.find((c) => c.id === currentConsultation.id);
      if (updated) setCurrentConsultation({ ...updated });
      message.success('会诊已完成');
      setDetailDrawerVisible(false);
    }
  };

  const handleRemind = (consultation: Consultation) => {
    message.info(`已向${consultation.consultDepartment}发送催办提醒`);
  };

  const handleOpenHospCreate = (_e?: any, preFillPatientId?: string) => {
    hospForm.resetFields();
    const values: Record<string, any> = {
      urgency: 'routine',
      department: '产科',
      estimatedDays: 5,
    };
    const patientId = typeof _e === 'string' ? _e : preFillPatientId;
    if (patientId) {
      values.patientId = patientId;
    }
    hospForm.setFieldsValue(values);
    setEditHospAdvice(null);
    setCreateHospModalVisible(true);
  };

  const handleOpenHospEdit = (advice: HospitalizationAdvice) => {
    setEditHospAdvice(advice);
    hospForm.setFieldsValue({
      patientId: advice.patientId,
      urgency: advice.urgency,
      department: advice.department,
      estimatedDays: advice.estimatedDays,
      reason: advice.reason,
      examinations: advice.examinations,
      treatments: advice.treatments,
      notes: advice.notes,
    });
    setCreateHospModalVisible(true);
  };

  const handleOpenHospDetail = (advice: HospitalizationAdvice) => {
    setCurrentHospAdvice(advice);
    setHospDetailVisible(true);
  };

  const handleSubmitHospAdvice = async () => {
    try {
      const values = await hospForm.validateFields();
      const patient = patients.find((p) => p.id === values.patientId);
      if (!patient) {
        message.error('请选择有效的患者');
        return;
      }
      if (editHospAdvice) {
        updateHospitalizationAdvice(editHospAdvice.id, {
          urgency: values.urgency,
          department: values.department,
          estimatedDays: values.estimatedDays,
          reason: values.reason,
          examinations: values.examinations || [],
          treatments: values.treatments || [],
          notes: values.notes || '',
        });
        message.success('住院建议已更新');
      } else {
        const newAdvice: HospitalizationAdvice = {
          id: `H${Date.now()}`,
          patientId: patient.id,
          patientName: patient.name,
          createDate: new Date().toLocaleDateString('zh-CN'),
          createDoctor: '当前医生',
          reason: values.reason,
          urgency: values.urgency,
          department: values.department,
          estimatedDays: values.estimatedDays,
          examinations: values.examinations || [],
          treatments: values.treatments || [],
          notes: values.notes || '',
          status: 'suggested',
        };
        addHospitalizationAdvice(newAdvice);
        message.success('住院建议已创建');
      }
      setPreFillHospitalizationPatient(null);
      setCreateHospModalVisible(false);
    } catch {
      // validation error
    }
  };

  const handleTransferToAdmission = (adviceId: string) => {
    const advice = hospitalizationAdvices.find((a) => a.id === adviceId);
    if (!advice) return;
    updateHospitalizationStatus(adviceId, 'admitted', {
      patientStatus: 'hospitalized',
      admissionDate: new Date().toLocaleDateString('zh-CN'),
    });
    message.success('住院登记成功！患者状态已更新为住院中');
  };

  const consultationColumns: ColumnsType<Consultation> = [
    {
      title: '标识',
      key: 'flag',
      width: 70,
      align: 'center',
      render: (_, record) =>
        record.type === 'urgent' ? (
          <Tag color="red" style={{ animation: 'urgent-blink 1s ease-in-out infinite' }}>
            紧急
          </Tag>
        ) : (
          <span style={{ color: '#d9d9d9' }}>—</span>
        ),
    },
    {
      title: '申请时间',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 150,
    },
    {
      title: '患者',
      key: 'patient',
      width: 180,
      render: (_, record) => {
        const patient = getPatientById(record.patientId);
        return (
          <Space direction="vertical" size={2}>
            <a
              onClick={() => handlePatientClick(record.patientId)}
              style={{ fontWeight: 600, fontSize: 14 }}
            >
              {record.patientName}
            </a>
            {patient && (
              <span style={{ color: '#888', fontSize: 12 }}>
                孕{patient.gestationalWeeks}+{patient.gestationalDays}周
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: '风险等级',
      key: 'riskLevel',
      width: 110,
      render: (_, record) => {
        const patient = getPatientById(record.patientId);
        if (!patient) return <span style={{ color: '#bbb' }}>-</span>;
        const isRed = patient.riskLevel === 'red';
        return (
          <Tag
            color={patient.riskLevel}
            style={{
              padding: '4px 12px',
              borderRadius: 10,
              fontWeight: 600,
              animation: isRed ? 'pulse-red 2s ease-in-out infinite' : undefined,
            }}
          >
            {riskLevelLabels[patient.riskLevel].replace(/（.*?）/g, '')}
          </Tag>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: Consultation['type']) => (
        <Tag color={consultationTypeColors[type]}>{consultationTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '科室流转',
      key: 'departments',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <span style={{ color: '#555' }}>{record.requestDepartment}</span>
          <ArrowRightOutlined style={{ color: '#bbb' }} />
          <Tag color="purple" style={{ margin: 0 }}>
            {record.consultDepartment}
          </Tag>
        </Space>
      ),
    },
    {
      title: '医生',
      key: 'doctors',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <UserOutlined style={{ color: '#888' }} />
            <span style={{ color: '#555', fontSize: 12 }}>{record.requestDoctor}</span>
          </Space>
          <Space size={4}>
            <ArrowRightOutlined style={{ color: '#bbb', fontSize: 12 }} />
            <span style={{ color: '#1890ff', fontSize: 12, fontWeight: 500 }}>
              {record.consultDoctor || '待分派'}
            </span>
          </Space>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: Consultation['status']) => (
        <Tag color={consultationStatusColors[status]} style={{ padding: '4px 10px' }}>
          {consultationStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '会诊问题',
      dataIndex: 'question',
      key: 'question',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ color: '#555' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)}>
            详情
          </Button>
          {(record.status === 'pending' || record.status === 'accepted') && (
            <Button
              type="link"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => handleOpenDetail(record, true)}
            >
              回复
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<BellOutlined />}
              onClick={() => handleRemind(record)}
            >
              催办
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderConsultationTimeline = (c: Consultation) => {
    const items = [
      {
        color: 'blue',
        dot: <CalendarOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 600 }}>会诊申请</div>
            <div style={{ color: '#888', fontSize: 12 }}>{c.requestDate}</div>
            <div style={{ marginTop: 4, color: '#555' }}>
              {c.requestDoctor}（{c.requestDepartment}）发起会诊
            </div>
          </div>
        ),
      },
    ];
    if (c.status !== 'pending') {
      items.push({
        color: c.status === 'rejected' ? 'red' : 'blue',
        dot: c.status === 'rejected' ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 600 }}>
              {c.status === 'rejected' ? '会诊拒绝' : '会诊接受'}
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>
              {c.status === 'rejected' ? '—' : c.consultDate || c.requestDate}
            </div>
            <div style={{ marginTop: 4, color: '#555' }}>
              {c.consultDoctor || c.consultDepartment}
              {c.status === 'rejected' ? ' 拒绝了会诊' : ' 接受了会诊'}
            </div>
          </div>
        ),
      });
    }
    if (c.status === 'completed') {
      items.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <div>
            <div style={{ fontWeight: 600 }}>会诊完成</div>
            <div style={{ color: '#888', fontSize: 12 }}>{c.consultDate}</div>
          </div>
        ),
      });
    }
    return <Timeline items={items} />;
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ borderRadius: 8, padding: 0 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'consultations',
              label: (
                <Space>
                  <TeamOutlined />
                  会诊记录
                  <Badge
                    count={consultations.filter((c) => c.status === 'pending').length}
                    size="small"
                    offset={[2, -2]}
                  />
                </Space>
              ),
              children: (
                <div style={{ padding: '0 24px 24px' }}>
                  <Card
                    style={{ marginBottom: 16, borderRadius: 8 }}
                    bodyStyle={{ padding: '16px 20px' }}
                  >
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                      <Col xs={24} md={18}>
                        <Space size={10} wrap>
                          <Search
                            placeholder="搜索患者姓名/会诊问题"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="middle"
                            style={{ width: 240 }}
                            value={consultKeyword}
                            onChange={(e) => setConsultKeyword(e.target.value)}
                            onSearch={setConsultKeyword}
                          />
                          <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: 130 }}
                            placeholder="状态"
                            allowClear
                          >
                            <Option value="all">全部状态</Option>
                            <Option value="pending">待处理</Option>
                            <Option value="accepted">已接受</Option>
                            <Option value="completed">已完成</Option>
                            <Option value="rejected">已拒绝</Option>
                          </Select>
                          <Select
                            value={typeFilter}
                            onChange={setTypeFilter}
                            style={{ width: 110 }}
                            placeholder="类型"
                            allowClear
                          >
                            <Option value="all">全部类型</Option>
                            <Option value="urgent">紧急</Option>
                            <Option value="routine">常规</Option>
                          </Select>
                          <Select
                            value={requestDeptFilter}
                            onChange={setRequestDeptFilter}
                            style={{ width: 130 }}
                            placeholder="申请科室"
                            allowClear
                          >
                            <Option value="all">全部申请科室</Option>
                            <Option value="产科">产科</Option>
                          </Select>
                          <Select
                            value={consultDeptFilter}
                            onChange={setConsultDeptFilter}
                            style={{ width: 130 }}
                            placeholder="会诊科室"
                            allowClear
                          >
                            <Option value="all">全部会诊科室</Option>
                            {consultDepartments.map((d) => (
                              <Option key={d} value={d}>
                                {d}
                              </Option>
                            ))}
                          </Select>
                        </Space>
                      </Col>
                      <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
                          发起会诊
                        </Button>
                      </Col>
                    </Row>
                  </Card>

                  <Table<Consultation>
                    rowKey="id"
                    columns={consultationColumns}
                    dataSource={filteredConsultations}
                    scroll={{ x: 1600 }}
                    pagination={{
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                      pageSize: 10,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'hospital',
              label: (
                <Space>
                  <HomeOutlined />
                  住院建议
                  <Badge
                    count={hospitalizationAdvices.filter((h) => h.status === 'suggested').length}
                    size="small"
                    offset={[2, -2]}
                  />
                </Space>
              ),
              children: (
                <div style={{ padding: '0 24px 24px' }}>
                  <Card
                    style={{ marginBottom: 16, borderRadius: 8 }}
                    bodyStyle={{ padding: '16px 20px' }}
                  >
                    <Row gutter={[16, 16]} align="middle" justify="space-between">
                      <Col xs={24} md={18}>
                        <Space size={10} wrap>
                          <Search
                            placeholder="搜索患者姓名/住院原因/科室"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="middle"
                            style={{ width: 260 }}
                            value={hospKeyword}
                            onChange={(e) => setHospKeyword(e.target.value)}
                            onSearch={setHospKeyword}
                          />
                          <Select
                            value={hospStatusFilter}
                            onChange={setHospStatusFilter}
                            style={{ width: 130 }}
                            placeholder="状态"
                            allowClear
                          >
                            <Option value="all">全部状态</Option>
                            <Option value="suggested">建议中</Option>
                            <Option value="admitted">已入院</Option>
                            <Option value="discharged">已出院</Option>
                            <Option value="cancelled">已取消</Option>
                          </Select>
                        </Space>
                      </Col>
                      <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenHospCreate}>
                          新建住院建议
                        </Button>
                      </Col>
                    </Row>
                  </Card>

                  <Row gutter={[16, 16]}>
                    {filteredHospAdvices.length === 0 ? (
                      <Col span={24}>
                        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
                          <EmptyTip title="暂无住院建议" />
                        </Card>
                      </Col>
                    ) : (
                      filteredHospAdvices.map((advice) => {
                        const patient = getPatientById(advice.patientId);
                        return (
                          <Col xs={24} md={12} lg={8} key={advice.id}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: 8,
                                borderTop: `4px solid ${urgencyColors[advice.urgency]}`,
                              }}
                              bodyStyle={{ padding: 16 }}
                            >
                              <div style={{ marginBottom: 12 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                  }}
                                >
                                  <Space>
                                    <a
                                      onClick={() => handlePatientClick(advice.patientId)}
                                      style={{ fontWeight: 600, fontSize: 16 }}
                                    >
                                      {advice.patientName}
                                    </a>
                                    {patient && (
                                      <span style={{ color: '#888', fontSize: 12 }}>
                                        孕{patient.gestationalWeeks}+{patient.gestationalDays}周
                                      </span>
                                    )}
                                  </Space>
                                  {patient && (
                                    <Tag
                                      color={patient.riskLevel}
                                      style={{
                                        padding: '2px 10px',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                        fontSize: 11,
                                      }}
                                    >
                                      {riskLevelLabels[patient.riskLevel].replace(/（.*?）/g, '')}
                                    </Tag>
                                  )}
                                </div>
                                <Space size={8}>
                                  <Tag color={urgencyColors[advice.urgency]}>
                                    {urgencyLabels[advice.urgency]}
                                  </Tag>
                                  <Tag color="purple" style={{ margin: 0 }}>
                                    {advice.department}
                                  </Tag>
                                </Space>
                              </div>

                              <Divider style={{ margin: '10px 0' }} />

                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                                  住院原因
                                </div>
                                <div
                                  style={{
                                    color: '#333',
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {advice.reason}
                                </div>
                              </div>

                              <Row gutter={8} style={{ marginBottom: 10 }}>
                                <Col span={12}>
                                  <div style={{ fontSize: 12, color: '#888' }}>建议住院天数</div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1890ff' }}>
                                    {advice.estimatedDays}天
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <div style={{ fontSize: 12, color: '#888' }}>创建日期</div>
                                  <div style={{ fontSize: 13, color: '#555' }}>{advice.createDate}</div>
                                </Col>
                              </Row>

                              {advice.examinations.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                                    建议检查
                                  </div>
                                  <Space size={[4, 4]} wrap>
                                    {advice.examinations.slice(0, 3).map((ex, idx) => (
                                      <Tag
                                        key={idx}
                                        style={{
                                          background: '#f0f9ff',
                                          color: '#0050b3',
                                          border: '1px solid #bae7ff',
                                          borderRadius: 8,
                                          margin: 0,
                                          fontSize: 11,
                                        }}
                                      >
                                        {ex}
                                      </Tag>
                                    ))}
                                    {advice.examinations.length > 3 && (
                                      <Tag
                                        style={{
                                          background: '#fafafa',
                                          color: '#888',
                                          borderRadius: 8,
                                          margin: 0,
                                          fontSize: 11,
                                        }}
                                      >
                                        +{advice.examinations.length - 3}
                                      </Tag>
                                    )}
                                  </Space>
                                </div>
                              )}

                              {advice.treatments.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                                    治疗建议
                                  </div>
                                  <Space size={[4, 4]} wrap>
                                    {advice.treatments.slice(0, 3).map((tr, idx) => (
                                      <Tag
                                        key={idx}
                                        style={{
                                          background: '#f6ffed',
                                          color: '#389e0d',
                                          border: '1px solid #b7eb8f',
                                          borderRadius: 8,
                                          margin: 0,
                                          fontSize: 11,
                                        }}
                                      >
                                        {tr}
                                      </Tag>
                                    ))}
                                    {advice.treatments.length > 3 && (
                                      <Tag
                                        style={{
                                          background: '#fafafa',
                                          color: '#888',
                                          borderRadius: 8,
                                          margin: 0,
                                          fontSize: 11,
                                        }}
                                      >
                                        +{advice.treatments.length - 3}
                                      </Tag>
                                    )}
                                  </Space>
                                </div>
                              )}

                              {advice.notes && (
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                                    备注
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#666',
                                      padding: '6px 10px',
                                      background: '#fffbe6',
                                      borderRadius: 6,
                                      border: '1px solid #ffe58f',
                                    }}
                                  >
                                    {advice.notes}
                                  </div>
                                </div>
                              )}

                              <Divider style={{ margin: '12px 0' }} />

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Tag
                                  color={hospitalizationStatusColors[advice.status]}
                                  style={{ margin: 0 }}
                                >
                                  {hospitalizationStatusLabels[advice.status]}
                                </Tag>
                                <Space size={4}>
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => handleOpenHospDetail(advice)}
                                  >
                                    详情
                                  </Button>
                                  {advice.status === 'suggested' && (
                                    <>
                                      <Button
                                        type="link"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => handleOpenHospEdit(advice)}
                                      >
                                        编辑
                                      </Button>
                                      <Popconfirm
                                        title="确认已为该患者办理住院？"
                                        description="确认后将更新患者状态为住院中"
                                        okText="确认办理"
                                        cancelText="取消"
                                        onConfirm={() => handleTransferToAdmission(advice.id)}
                                      >
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<SendOutlined />}
                                        >
                                          转住院登记
                                        </Button>
                                      </Popconfirm>
                                    </>
                                  )}
                                </Space>
                              </div>
                            </Card>
                          </Col>
                        );
                      })
                    )}
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={
          <Space>
            <TeamOutlined />
            <span>发起会诊申请</span>
          </Space>
        }
        open={createModalVisible}
        onOk={handleCreateConsultation}
        onCancel={() => {
          setPreFillConsultationPatient(null);
          setCreateModalVisible(false);
        }}
        okText="提交申请"
        cancelText="取消"
        width={720}
        destroyOnClose
      >
        {preFillConsultationPatientId && getPatientById(preFillConsultationPatientId) && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <Space size={16} wrap>
                <span>
                  <strong>姓名：</strong>
                  {getPatientById(preFillConsultationPatientId)!.name}
                </span>
                <span>
                  <strong>孕周：</strong>
                  孕{getPatientById(preFillConsultationPatientId)!.gestationalWeeks}+
                  {getPatientById(preFillConsultationPatientId)!.gestationalDays}周
                </span>
                <span>
                  <strong>风险等级：</strong>
                  <Tag
                    color={getPatientById(preFillConsultationPatientId)!.riskLevel}
                    style={{ margin: 0 }}
                  >
                    {riskLevelLabels[getPatientById(preFillConsultationPatientId)!.riskLevel].replace(/（.*?）/g, '')}
                  </Tag>
                </span>
              </Space>
            }
          />
        )}
        <Form form={consultForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="patientId"
                label="选择患者"
                rules={[{ required: true, message: '请选择患者' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索患者姓名/编号"
                  optionFilterProp="label"
                  filterOption={(input, option) => {
                    const label = String(option?.label || '').toLowerCase();
                    const val = String(option?.value || '').toLowerCase();
                    return label.includes(input.toLowerCase()) || val.includes(input.toLowerCase());
                  }}
                  options={patients.map((p) => ({
                    value: p.id,
                    label: (
                      <Space>
                        <span>{p.name}（{p.id}）孕{p.gestationalWeeks}+{p.gestationalDays}周</span>
                        <Tag
                          color={p.riskLevel}
                          style={{ marginLeft: 8, fontSize: 11, padding: '0 6px' }}
                        >
                          {riskLevelLabels[p.riskLevel].replace(/（.*?）/g, '')}
                        </Tag>
                      </Space>
                    ),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="会诊类型"
                rules={[{ required: true, message: '请选择会诊类型' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <Radio.Button value="urgent" style={{ width: '50%', textAlign: 'center' }}>
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                      紧急（2h内）
                    </Space>
                  </Radio.Button>
                  <Radio.Button value="routine" style={{ width: '50%', textAlign: 'center' }}>
                    <Space>
                      <ClockCircleOutlined style={{ color: '#1890ff' }} />
                      常规（24h内）
                    </Space>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requestDepartment"
                label="申请科室"
                rules={[{ required: true, message: '请输入申请科室' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="consultDepartment"
                label="会诊科室"
                rules={[{ required: true, message: '请选择会诊科室' }]}
              >
                <Select placeholder="请选择会诊科室">
                  {consultDepartments.map((d) => (
                    <Option key={d} value={d}>
                      {d}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="consultDoctor" label="会诊医生（可留空自动分派）">
            <Input placeholder="请输入会诊医生姓名，留空将由科室自动分派" />
          </Form.Item>

          <Form.Item
            name="chiefComplaint"
            label="主诉"
            rules={[{ required: false, max: 200, message: '请控制在200字以内' }]}
          >
            <Input placeholder="请简要描述患者主要症状或问题" />
          </Form.Item>

          <Form.Item
            name="briefHistory"
            label="现病史摘要"
            rules={[{ required: false, max: 500, message: '请控制在500字以内' }]}
          >
            <TextArea
              rows={3}
              placeholder="请简要描述现病史，包括发病时间、主要症状、诊治经过等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="currentFindings"
            label="目前检查发现"
            rules={[{ required: false, max: 500, message: '请控制在500字以内' }]}
          >
            <TextArea
              rows={3}
              placeholder="请描述关键的体格检查、实验室检查和辅助检查结果"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="question"
            label="需要会诊解决的问题"
            rules={[
              { required: true, message: '请填写需要会诊解决的问题' },
              { max: 500, message: '请控制在500字以内' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请详细说明需要会诊科室协助解决的具体问题"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item name="timeLimit" label="建议会诊时限">
            <Radio.Group>
              <Radio value="2h">紧急会诊（2小时内）</Radio>
              <Radio value="24h">常规会诊（24小时内）</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>会诊详情</span>
            {currentConsultation && (
              <Tag color={consultationStatusColors[currentConsultation.status]}>
                {consultationStatusLabels[currentConsultation.status]}
              </Tag>
            )}
          </Space>
        }
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={720}
        destroyOnClose
        extra={
          currentConsultation && (
            <Space>
              {currentConsultation.status === 'pending' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleAcceptConsultation}>
                  接受会诊
                </Button>
              )}
              {(currentConsultation.status === 'pending' || currentConsultation.status === 'accepted') && (
                <Button danger icon={<CloseCircleOutlined />} onClick={handleRejectConsultation}>
                  拒绝
                </Button>
              )}
              {currentConsultation.status === 'accepted' && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleCompleteConsultation}
                >
                  完成会诊
                </Button>
              )}
            </Space>
          )
        }
      >
        {currentConsultation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Alert
              type="info"
              showIcon
              message={
                <Space>
                  <UserOutlined />
                  <span>患者信息</span>
                </Space>
              }
              description={
                <Space size={20} wrap>
                  <span>
                    <strong>姓名：</strong>
                    <a onClick={() => handlePatientClick(currentConsultation.patientId)}>
                      {currentConsultation.patientName}
                    </a>
                  </span>
                  {getPatientById(currentConsultation.patientId) && (
                    <>
                      <span>
                        <strong>孕周：</strong>
                        孕{getPatientById(currentConsultation.patientId)!.gestationalWeeks}+
                        {getPatientById(currentConsultation.patientId)!.gestationalDays}周
                      </span>
                      <span>
                        <strong>风险：</strong>
                        <Tag
                          color={getPatientById(currentConsultation.patientId)!.riskLevel}
                          style={{ margin: 0 }}
                        >
                          {riskLevelLabels[getPatientById(currentConsultation.patientId)!.riskLevel]}
                        </Tag>
                      </span>
                    </>
                  )}
                  <span>
                    <strong>类型：</strong>
                    <Tag color={consultationTypeColors[currentConsultation.type]} style={{ margin: 0 }}>
                      {consultationTypeLabels[currentConsultation.type]}
                    </Tag>
                  </span>
                </Space>
              }
            />

            <Card
              size="small"
              title={
                <Space>
                  <ClockCircleOutlined />
                  会诊流程
                </Space>
              }
            >
              {renderConsultationTimeline(currentConsultation)}
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined />
                  会诊单详情
                </Space>
              }
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="申请科室→会诊科室">
                  {currentConsultation.requestDepartment}
                  <ArrowRightOutlined style={{ margin: '0 8px', color: '#bbb' }} />
                  <Tag color="purple" style={{ margin: 0 }}>
                    {currentConsultation.consultDepartment}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="申请医生→会诊医生">
                  {currentConsultation.requestDoctor}
                  <ArrowRightOutlined style={{ margin: '0 8px', color: '#bbb' }} />
                  <span style={{ color: '#1890ff', fontWeight: 500 }}>
                    {currentConsultation.consultDoctor || '待分派'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="申请时间">{currentConsultation.requestDate}</Descriptions.Item>
                <Descriptions.Item label="主诉">
                  {currentConsultation.chiefComplaint || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="现病史摘要">
                  {currentConsultation.briefHistory || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="目前检查发现">
                  {currentConsultation.currentFindings || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="会诊问题" labelStyle={{ fontWeight: 600, color: '#f5222d' }}>
                  <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                    {currentConsultation.question}
                  </div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {(currentConsultation.status === 'accepted' || currentConsultation.status === 'completed') && (
              <Card
                size="small"
                title={
                  <Space>
                    <MessageOutlined />
                    会诊意见
                    {currentConsultation.status === 'completed' && (
                      <Tag color="green" style={{ margin: 0 }}>
                        已回复
                      </Tag>
                    )}
                  </Space>
                }
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>会诊回复意见：</div>
                  <TextArea
                    rows={5}
                    placeholder="请填写详细的会诊意见和建议..."
                    value={replyOpinion}
                    onChange={(e) => setReplyOpinion(e.target.value)}
                    disabled={currentConsultation.status === 'completed'}
                    showCount
                    maxLength={1000}
                  />
                </div>

                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>处理建议：</div>
                  <Checkbox.Group
                    value={replySuggestions}
                    onChange={(vals) => setReplySuggestions(vals as string[])}
                    disabled={currentConsultation.status === 'completed'}
                    style={{ width: '100%' }}
                  >
                    <Space size={[8, 8]} wrap>
                      {suggestionOptions.map((opt) => (
                        <Checkbox
                          key={opt}
                          value={opt}
                          style={{
                            display: 'inline-flex',
                            padding: '4px 10px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 16,
                            margin: 0,
                            marginInlineEnd: 0,
                          }}
                        >
                          {opt}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </div>

                {currentConsultation.status === 'completed' && (
                  <Alert
                    style={{ marginTop: 16 }}
                    type="success"
                    showIcon
                    message={`会诊完成于 ${currentConsultation.consultDate}`}
                  />
                )}
              </Card>
            )}

            {currentConsultation.status === 'rejected' && (
              <Alert type="warning" showIcon message="此会诊申请已被拒绝" />
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <HomeOutlined />
            <span>{editHospAdvice ? '编辑住院建议' : '新建住院建议'}</span>
          </Space>
        }
        open={createHospModalVisible}
        onOk={handleSubmitHospAdvice}
        onCancel={() => {
          setPreFillHospitalizationPatient(null);
          setCreateHospModalVisible(false);
        }}
        okText={editHospAdvice ? '保存修改' : '提交建议'}
        cancelText="取消"
        width={720}
        destroyOnClose
      >
        {preFillHospitalizationPatientId && getPatientById(preFillHospitalizationPatientId) && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <Space size={16} wrap>
                <span>
                  <strong>姓名：</strong>
                  {getPatientById(preFillHospitalizationPatientId)!.name}
                </span>
                <span>
                  <strong>孕周：</strong>
                  孕{getPatientById(preFillHospitalizationPatientId)!.gestationalWeeks}+
                  {getPatientById(preFillHospitalizationPatientId)!.gestationalDays}周
                </span>
                <span>
                  <strong>风险等级：</strong>
                  <Tag
                    color={getPatientById(preFillHospitalizationPatientId)!.riskLevel}
                    style={{ margin: 0 }}
                  >
                    {riskLevelLabels[getPatientById(preFillHospitalizationPatientId)!.riskLevel].replace(/（.*?）/g, '')}
                  </Tag>
                </span>
              </Space>
            }
          />
        )}
        {editHospAdvice && getPatientById(editHospAdvice.patientId) && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <Space size={16} wrap>
                <span>
                  <strong>姓名：</strong>
                  {getPatientById(editHospAdvice.patientId)!.name}
                </span>
                <span>
                  <strong>孕周：</strong>
                  孕{getPatientById(editHospAdvice.patientId)!.gestationalWeeks}+
                  {getPatientById(editHospAdvice.patientId)!.gestationalDays}周
                </span>
                <span>
                  <strong>风险等级：</strong>
                  <Tag
                    color={getPatientById(editHospAdvice.patientId)!.riskLevel}
                    style={{ margin: 0 }}
                  >
                    {riskLevelLabels[getPatientById(editHospAdvice.patientId)!.riskLevel].replace(/（.*?）/g, '')}
                  </Tag>
                </span>
              </Space>
            }
          />
        )}
        <Form form={hospForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="patientId"
                label="选择患者"
                rules={[{ required: true, message: '请选择患者' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索患者姓名/编号"
                  optionFilterProp="label"
                  filterOption={(input, option) => {
                    const label = String(option?.label || '').toLowerCase();
                    const val = String(option?.value || '').toLowerCase();
                    return label.includes(input.toLowerCase()) || val.includes(input.toLowerCase());
                  }}
                  disabled={!!editHospAdvice}
                  options={patients.map((p) => ({
                    value: p.id,
                    label: (
                      <Space>
                        <span>{p.name}（{p.id}）孕{p.gestationalWeeks}+{p.gestationalDays}周</span>
                        <Tag
                          color={p.riskLevel}
                          style={{ marginLeft: 8, fontSize: 11, padding: '0 6px' }}
                        >
                          {riskLevelLabels[p.riskLevel].replace(/（.*?）/g, '')}
                        </Tag>
                      </Space>
                    ),
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="urgency"
                label="紧急程度"
                rules={[{ required: true, message: '请选择紧急程度' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <Radio.Button value="emergency" style={{ width: '33.33%', textAlign: 'center' }}>
                    <StopOutlined style={{ color: '#f5222d' }} /> 急诊
                  </Radio.Button>
                  <Radio.Button value="urgent" style={{ width: '33.33%', textAlign: 'center' }}>
                    <WarningOutlined style={{ color: '#fa8c16' }} /> 加急
                  </Radio.Button>
                  <Radio.Button value="routine" style={{ width: '33.34%', textAlign: 'center' }}>
                    <SafetyCertificateOutlined style={{ color: '#1890ff' }} /> 常规
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="住院科室"
                rules={[{ required: true, message: '请选择住院科室' }]}
              >
                <Select placeholder="请选择住院科室">
                  <Option value="产科">产科</Option>
                  <Option value="产科ICU">产科ICU</Option>
                  <Option value="产一科">产一科</Option>
                  <Option value="产二科">产二科</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimatedDays"
                label="建议住院天数"
                rules={[{ required: true, message: '请输入建议住院天数' }]}
              >
                <Input type="number" addonAfter="天" min={1} max={60} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="住院原因"
            rules={[
              { required: true, message: '请填写住院原因' },
              { max: 500, message: '请控制在500字以内' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请详细说明需要住院的原因，包括病情指征、诊断依据等"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item name="examinations" label="建议检查项目">
            <Checkbox.Group style={{ width: '100%' }}>
              <Space size={[8, 8]} wrap>
                {examinationOptions.map((opt) => (
                  <Checkbox
                    key={opt}
                    value={opt}
                    style={{
                      display: 'inline-flex',
                      padding: '4px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 16,
                      margin: 0,
                      marginInlineEnd: 0,
                    }}
                  >
                    {opt}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="treatments" label="治疗建议">
            <Checkbox.Group style={{ width: '100%' }}>
              <Space size={[8, 8]} wrap>
                {treatmentOptions.map((opt) => (
                  <Checkbox
                    key={opt}
                    value={opt}
                    style={{
                      display: 'inline-flex',
                      padding: '4px 12px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 16,
                      margin: 0,
                      marginInlineEnd: 0,
                    }}
                  >
                    {opt}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注说明"
            rules={[{ max: 300, message: '请控制在300字以内' }]}
          >
            <TextArea
              rows={2}
              placeholder="其他需要说明的事项，如特殊注意事项、知情告知情况等"
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>住院建议详情</span>
            {currentHospAdvice && (
              <Tag color={hospitalizationStatusColors[currentHospAdvice.status]}>
                {hospitalizationStatusLabels[currentHospAdvice.status]}
              </Tag>
            )}
          </Space>
        }
        open={hospDetailVisible}
        onClose={() => setHospDetailVisible(false)}
        width={600}
        destroyOnClose
        extra={
          currentHospAdvice && currentHospAdvice.status === 'suggested' ? (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => {
                setHospDetailVisible(false);
                handleOpenHospEdit(currentHospAdvice);
              }}>
                编辑
              </Button>
              <Popconfirm
                title="确认已为该患者办理住院？"
                description="确认后将更新患者状态为住院中"
                okText="确认办理"
                cancelText="取消"
                onConfirm={() => handleTransferToAdmission(currentHospAdvice.id)}
              >
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                >
                  转住院登记
                </Button>
              </Popconfirm>
            </Space>
          ) : null
        }
      >
        {currentHospAdvice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Alert
              type="info"
              showIcon
              message={
                <Space>
                  <UserOutlined />
                  <span>患者信息</span>
                </Space>
              }
              description={
                <Space size={20} wrap>
                  <span>
                    <strong>姓名：</strong>
                    <a onClick={() => handlePatientClick(currentHospAdvice.patientId)}>
                      {currentHospAdvice.patientName}
                    </a>
                  </span>
                  {getPatientById(currentHospAdvice.patientId) && (
                    <>
                      <span>
                        <strong>孕周：</strong>
                        孕{getPatientById(currentHospAdvice.patientId)!.gestationalWeeks}+
                        {getPatientById(currentHospAdvice.patientId)!.gestationalDays}周
                      </span>
                      <span>
                        <strong>风险：</strong>
                        <Tag
                          color={getPatientById(currentHospAdvice.patientId)!.riskLevel}
                          style={{ margin: 0 }}
                        >
                          {riskLevelLabels[getPatientById(currentHospAdvice.patientId)!.riskLevel]}
                        </Tag>
                      </span>
                    </>
                  )}
                </Space>
              }
            />

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="紧急程度">
                <Tag color={urgencyColors[currentHospAdvice.urgency]}>
                  {urgencyLabels[currentHospAdvice.urgency]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="住院科室">{currentHospAdvice.department}</Descriptions.Item>
              <Descriptions.Item label="建议住院天数">{currentHospAdvice.estimatedDays}天</Descriptions.Item>
              <Descriptions.Item label="创建日期">{currentHospAdvice.createDate}</Descriptions.Item>
              <Descriptions.Item label="创建医生">{currentHospAdvice.createDoctor}</Descriptions.Item>
              <Descriptions.Item label="住院原因" labelStyle={{ fontWeight: 600 }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{currentHospAdvice.reason}</div>
              </Descriptions.Item>
              <Descriptions.Item label="建议检查项目">
                {currentHospAdvice.examinations.length > 0 ? (
                  <Space size={[4, 4]} wrap>
                    {currentHospAdvice.examinations.map((ex, idx) => (
                      <Tag
                        key={idx}
                        style={{
                          background: '#f0f9ff',
                          color: '#0050b3',
                          border: '1px solid #bae7ff',
                          borderRadius: 8,
                          margin: 0,
                        }}
                      >
                        {ex}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <span style={{ color: '#bbb' }}>—</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="治疗建议">
                {currentHospAdvice.treatments.length > 0 ? (
                  <Space size={[4, 4]} wrap>
                    {currentHospAdvice.treatments.map((tr, idx) => (
                      <Tag
                        key={idx}
                        style={{
                          background: '#f6ffed',
                          color: '#389e0d',
                          border: '1px solid #b7eb8f',
                          borderRadius: 8,
                          margin: 0,
                        }}
                      >
                        {tr}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <span style={{ color: '#bbb' }}>—</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="备注说明">
                {currentHospAdvice.notes || <span style={{ color: '#bbb' }}>—</span>}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>

      <style>{`
        @keyframes urgent-blink {
          0%, 100% {
            opacity: 1;
            background-color: #ff7875;
          }
          50% {
            opacity: 0.6;
            background-color: #ff4d4f;
          }
        }
        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(245, 34, 45, 0.4);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(245, 34, 45, 0);
          }
        }
      `}</style>
    </div>
  );
};

const EmptyTip: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ textAlign: 'center', color: '#999' }}>
    <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }} />
    <div>{title}</div>
  </div>
);

export default ConsultationPage;
