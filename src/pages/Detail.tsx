import React, { useMemo, useState } from 'react';
import {
  Card,
  Tabs,
  Tag,
  Button,
  Avatar,
  Space,
  Row,
  Col,
  Descriptions,
  Table,
  List,
  Timeline,
  Empty,
  Switch,
  Typography,
  Divider,
  Tooltip,
  Modal,
  Form,
  Select,
  Input,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  ApartmentOutlined,
  StarOutlined,
  StarFilled,
  ExportOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import type { RiskLevel, Patient, LabResult } from '../types';
import { riskLevelLabels, riskLevelColors } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusMap: Record<Patient['currentStatus'], { label: string; color: string }> = {
  antenatal: { label: '产检中', color: 'blue' },
  hospitalized: { label: '住院中', color: 'purple' },
  discharged: { label: '已出院', color: 'default' },
  postpartum: { label: '产后', color: 'green' },
};

const outcomeMap: Record<string, { label: string; color: string }> = {
  live_birth: { label: '活产', color: 'green' },
  stillbirth: { label: '死胎', color: 'red' },
  abortion: { label: '流产', color: 'orange' },
  ectopic: { label: '宫外孕', color: 'magenta' },
  other: { label: '其他', color: 'default' },
};

const deliveryModeMap: Record<string, string> = {
  natural: '顺产',
  cesarean: '剖宫产',
  forceps: '产钳',
  vacuum: '胎吸',
  'n/a': '-',
};

const followUpTypeMap: Record<string, { label: string; icon: React.ReactNode }> = {
  phone: { label: '电话随访', icon: <PhoneOutlined /> },
  outpatient: { label: '门诊复查', icon: <ApartmentOutlined /> },
  home: { label: '上门访视', icon: <EnvironmentOutlined /> },
};

const followUpStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待完成', color: 'default' },
  completed: { label: '已完成', color: 'green' },
  missed: { label: '已失访', color: 'red' },
};

const Detail: React.FC = () => {
  const {
    selectedPatientId,
    patients,
    vitalRecords,
    ultrasoundRecords,
    labResults,
    pregnancyHistories,
    dischargePlans,
    selectPatient,
    setActiveWindow,
    updateFollowUpStatus,
    markKeyCase,
    updatePatientRiskLevel,
    setPreFillConsultationPatient,
    setPreFillHospitalizationPatient,
  } = useAppStore();

  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [riskForm] = Form.useForm();

  const patient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const patientVitals = useMemo(
    () =>
      vitalRecords
        .filter((v) => v.patientId === selectedPatientId)
        .sort((a, b) => a.gestationalWeeks - b.gestationalWeeks),
    [vitalRecords, selectedPatientId]
  );

  const patientUltrasounds = useMemo(
    () =>
      ultrasoundRecords
        .filter((u) => u.patientId === selectedPatientId)
        .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()),
    [ultrasoundRecords, selectedPatientId]
  );

  const patientLabs = useMemo(
    () =>
      labResults
        .filter((l) => l.patientId === selectedPatientId)
        .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime()),
    [labResults, selectedPatientId]
  );

  const labsByCategory = useMemo(() => {
    const grouped: Record<string, LabResult[]> = {};
    patientLabs.forEach((lab) => {
      if (!grouped[lab.category]) grouped[lab.category] = [];
      grouped[lab.category].push(latestForCategory(grouped[lab.category], lab));
    });
    return grouped;

    function latestForCategory(existing: LabResult[], incoming: LabResult): LabResult {
      return incoming;
    }
  }, [patientLabs]);

  const patientPregnancyHistories = useMemo(
    () =>
      pregnancyHistories
        .filter((h) => h.patientId === selectedPatientId)
        .sort((a, b) => a.pregnancyOrder - b.pregnancyOrder),
    [pregnancyHistories, selectedPatientId]
  );

  const patientDischargePlan = useMemo(
    () => dischargePlans.find((d) => d.patientId === selectedPatientId) || null,
    [dischargePlans, selectedPatientId]
  );

  const handleBackToList = () => {
    selectPatient(null);
  };

  const handleMarkKeyCase = () => {
    if (patient) {
      markKeyCase(patient.id, !patient.isKeyCase);
      message.success(patient.isKeyCase ? '已取消重点标记' : '已标记为重点病例');
    }
  };

  const handleAdjustRisk = () => {
    if (patient) {
      riskForm.setFieldsValue({
        riskLevel: patient.riskLevel,
        reason: '',
      });
      setRiskModalVisible(true);
    }
  };

  const handleRiskSubmit = async () => {
    try {
      const values = await riskForm.validateFields();
      if (patient) {
        updatePatientRiskLevel(patient.id, values.riskLevel, values.reason);
        message.success('风险等级已调整');
        setRiskModalVisible(false);
      }
    } catch {
      // validation failed
    }
  };

  const handleExport = () => {
    message.info('正在导出病历文档...');
  };

  const handleFollowUpStatusChange = (itemIndex: number, status: 'completed' | 'missed') => {
    if (patientDischargePlan) {
      updateFollowUpStatus(patientDischargePlan.id, itemIndex, status);
    }
  };

  if (!selectedPatientId || !patient) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 500,
          padding: 48,
          background: '#fff',
          borderRadius: 8,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ textAlign: 'center' }}>
              <Title level={4} style={{ marginBottom: 8 }}>
                暂无选中患者
              </Title>
              <Paragraph type="secondary" style={{ fontSize: 14 }}>
                请先从「患者列表」中选择一位患者查看详情
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={<UserOutlined />}
                onClick={() => setActiveWindow('patients')}
                style={{ marginTop: 16 }}
              >
                前往患者列表
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const riskColor = riskLevelColors[patient.riskLevel];

  const renderEmptyState = (text: string) => (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">{text}</Text>} />
  );

  // ========= Tab 1: 基本信息与病程 =========
  const renderTabBasicInfo = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="个人信息" size="small">
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="姓名">{patient.name}</Descriptions.Item>
          <Descriptions.Item label="年龄">{patient.age} 岁</Descriptions.Item>
          <Descriptions.Item label="身份证号">{patient.idCard}</Descriptions.Item>
          <Descriptions.Item label="联系电话">
            <Space>
              <PhoneOutlined />
              {patient.phone}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="血型">
            {patient.bloodType}型 Rh{patient.rhFactor}
          </Descriptions.Item>
          <Descriptions.Item label="身高/孕前体重">
            {patient.height}cm / {patient.prepregnancyWeight}kg
          </Descriptions.Item>
          <Descriptions.Item label="当前体重">
            {patient.currentWeight}kg
            <Tag color="blue" style={{ marginLeft: 8 }}>
              BMI {((patient.currentWeight / (patient.height / 100) ** 2)).toFixed(1)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="体重增长">
            +{(patient.currentWeight - patient.prepregnancyWeight).toFixed(1)}kg
          </Descriptions.Item>
          <Descriptions.Item label="建档医生">{patient.attendingDoctor}</Descriptions.Item>
          <Descriptions.Item label="家庭住址" span={3}>
            <Space>
              <EnvironmentOutlined />
              {patient.address}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="产科基本信息" size="small">
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="孕次/产次">
            G{patient.gravidity} P{patient.parity}
          </Descriptions.Item>
          <Descriptions.Item label="当前孕周">
            <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
              {patient.gestationalWeeks}+{patient.gestationalDays} 周
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="预产期">
            <Text strong>{patient.dueDate}</Text>
            <Tag color="orange" style={{ marginLeft: 8 }}>
              剩余 {Math.ceil((new Date(patient.dueDate).getTime() - Date.now()) / 86400000)} 天
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="下次产检">
            {patient.nextVisitDate || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="入院日期">
            {patient.admissionDate || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="出院日期">
            {patient.dischargeDate || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card
            title={
              <Space>
                <AlertOutlined style={{ color: '#faad14' }} />
                过敏史
              </Space>
            }
            size="small"
          >
            <Paragraph style={{ margin: 0, minHeight: 60 }}>
              {patient.allergicHistory || '无'}
            </Paragraph>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <Space>
                <HeartOutlined style={{ color: '#f5222d' }} />
                慢性病史
              </Space>
            }
            size="small"
          >
            {patient.chronicDiseases.length > 0 ? (
              <Space wrap>
                {patient.chronicDiseases.map((d, i) => (
                  <Tag color="red" key={i}>
                    {d}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">无</Text>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                遗传史
              </Space>
            }
            size="small"
          >
            <Paragraph style={{ margin: 0, minHeight: 60 }}>
              {patient.geneticHistory || '无'}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: riskColor }} />
            风险评估
          </Space>
        }
        size="small"
      >
        <Row gutter={16} align="middle">
          <Col flex="120px">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: riskColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 24,
                  boxShadow: `0 0 0 8px ${riskColor}20`,
                }}
              >
                {patient.riskLevel.toUpperCase()}
              </div>
              <Text
                strong
                style={{ display: 'block', marginTop: 8, color: riskColor }}
              >
                {riskLevelLabels[patient.riskLevel]}
              </Text>
            </div>
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">高危因素：</Text>
                {patient.riskFactors.length > 0 ? (
                  <Space wrap style={{ marginTop: 4 }}>
                    {patient.riskFactors.map((f, i) => (
                      <Tag color={riskColor} key={i} icon={<ExclamationCircleOutlined />}>
                        {f}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Tag color="green">无高危因素</Tag>
                )}
              </div>
              <div>
                <Text type="secondary">备注标签：</Text>
                {patient.tags.length > 0 && (
                  <Space wrap style={{ marginTop: 4 }}>
                    {patient.tags.map((t, i) => (
                      <Tag key={i}>{t}</Tag>
                    ))}
                  </Space>
                )}
              </div>
              <div>
                <Text type="secondary">最后更新：{patient.lastUpdateTime}</Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  );

  // ========= Tab 2: 连续指标曲线 =========
  const chartData = patientVitals.map((v) => ({
    week: v.gestationalWeeks,
    label: `${v.gestationalWeeks}周`,
    systolic: v.systolicBP,
    diastolic: v.diastolicBP,
    weight: Number(v.weight.toFixed(1)),
    fundalHeight: v.fundalHeight || null,
    abdominalCircumference: v.abdominalCircumference || null,
    fetalHeart: v.fetalHeartRate || null,
  }));

  const renderChartCard = (title: string, children: React.ReactElement, height = 280) => (
    <Card title={title} size="small" style={{ height: '100%' }}>
      <div style={{ width: '100%', height }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        ) : (
          renderEmptyState('暂无数据')
        )}
      </div>
    </Card>
  );

  const renderTabCharts = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={12}>
          {renderChartCard(
            '血压趋势图 (mmHg)',
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis domain={[50, 200]} fontSize={12} />
              <ReTooltip />
              <Legend />
              <ReferenceLine y={140} stroke="#ff4d4f" strokeDasharray="5 5" label={<span style={{ fill: '#ff4d4f', fontSize: 11 }}>收缩压 140</span>} />
              <ReferenceLine y={90} stroke="#faad14" strokeDasharray="5 5" label={<span style={{ fill: '#faad14', fontSize: 11 }}>舒张压 90</span>} />
              <Line type="monotone" dataKey="systolic" stroke="#ff4d4f" name="收缩压" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="diastolic" stroke="#1890ff" name="舒张压" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          )}
        </Col>
        <Col span={12}>
          {renderChartCard(
            `体重增长曲线 (kg) — 孕前 ${patient.prepregnancyWeight}kg → 当前 ${patient.currentWeight}kg`,
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis domain={['dataMin - 5', 'dataMax + 2']} fontSize={12} />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#52c41a" name="体重(kg)" strokeWidth={2.5} dot={{ r: 4, fill: '#52c41a' }} activeDot={{ r: 6 }} />
            </LineChart>
          )}
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          {renderChartCard(
            '宫高 / 腹围曲线 (cm)',
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis domain={[0, 'auto']} fontSize={12} />
              <ReTooltip />
              <Legend />
              <Line type="monotone" dataKey="fundalHeight" stroke="#722ed1" name="宫高(cm)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="abdominalCircumference" stroke="#13c2c2" name="腹围(cm)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
            </LineChart>
          )}
        </Col>
        <Col span={12}>
          {renderChartCard(
            '胎心监护趋势 (次/分) — 正常范围 110-160',
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis domain={[100, 180]} fontSize={12} />
              <ReTooltip />
              <Legend />
              <ReferenceLine y={110} stroke="#faad14" strokeDasharray="5 5" />
              <ReferenceLine y={160} stroke="#faad14" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="fetalHeart" stroke="#eb2f96" name="胎心率(bpm)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
            </LineChart>
          )}
        </Col>
      </Row>

      <Card title="产检记录明细" size="small">
        {patientVitals.length > 0 ? (
          <Table
            size="small"
            dataSource={patientVitals}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: 1000 }}
          >
            <Table.Column title="日期" dataIndex="recordDate" width={110} />
            <Table.Column title="孕周" dataIndex="gestationalWeeks" width={80} render={(v) => `${v}周`} />
            <Table.Column
              title="血压"
              width={110}
              render={(_, r) => (
                <Text
                  type={r.systolicBP >= 140 || r.diastolicBP >= 90 ? 'danger' : undefined}
                  strong={r.systolicBP >= 140 || r.diastolicBP >= 90}
                >
                  {r.systolicBP}/{r.diastolicBP}
                </Text>
              )}
            />
            <Table.Column title="心率" dataIndex="heartRate" width={80} render={(v) => `${v}次/分`} />
            <Table.Column title="体温" dataIndex="temperature" width={80} render={(v) => `${v.toFixed(1)}℃`} />
            <Table.Column title="体重" dataIndex="weight" width={80} render={(v) => `${v.toFixed(1)}kg`} />
            <Table.Column title="宫高" dataIndex="fundalHeight" width={80} render={(v) => v ? `${v}cm` : '-'} />
            <Table.Column title="腹围" dataIndex="abdominalCircumference" width={80} render={(v) => v ? `${v}cm` : '-'} />
            <Table.Column title="胎心" dataIndex="fetalHeartRate" width={80} render={(v) => v ? `${v}次/分` : '-'} />
            <Table.Column title="水肿" dataIndex="edema" width={80} />
            <Table.Column title="尿蛋白" dataIndex="proteinuria" width={80} />
            <Table.Column title="备注" dataIndex="note" render={(v) => v || '-'} />
          </Table>
        ) : (
          renderEmptyState('暂无产检记录')
        )}
      </Card>
    </Space>
  );

  // ========= Tab 3: 超声与化验 =========
  const renderLabStatus = (status: string, value: string) => {
    if (status === 'high') {
      return <Text type="danger" strong>{value} ↑</Text>;
    }
    if (status === 'low') {
      return <Text strong style={{ color: '#1890ff' }}>{value} ↓</Text>;
    }
    return <Text>{value}</Text>;
  };

  const renderTabUltrasoundLab = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <MedicineBoxOutlined style={{ color: '#1890ff' }} />
            超声记录 ({patientUltrasounds.length}条)
          </Space>
        }
        size="small"
      >
        {patientUltrasounds.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
            dataSource={patientUltrasounds}
            renderItem={(u) => (
              <List.Item>
                <Card
                  size="small"
                  type="inner"
                  title={
                    <Space>
                      <Tag color="blue">{u.examType}</Tag>
                      <Text strong>{u.examDate}</Text>
                      <Tag>{u.gestationalWeeks}周</Tag>
                    </Space>
                  }
                  extra={<Text type="secondary">检查医师：{u.examiner}</Text>}
                >
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="BPD(双顶径)">{u.bpd}mm</Descriptions.Item>
                    <Descriptions.Item label="HC(头围)">{u.hc}mm</Descriptions.Item>
                    <Descriptions.Item label="AC(腹围)">{u.ac}mm</Descriptions.Item>
                    <Descriptions.Item label="FL(股骨长)">{u.fl}mm</Descriptions.Item>
                    <Descriptions.Item label="EFW(估重)">
                      <Text strong style={{ color: '#1890ff' }}>{u.efw}g</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="胎位">{u.fetalPosition}</Descriptions.Item>
                    <Descriptions.Item label="羊水指数/最大">
                      {u.amnioticFluidIndex}cm / {u.amnioticFluidMax}cm
                    </Descriptions.Item>
                    <Descriptions.Item label="脐动脉S/D">{u.umbilicalArterySd}</Descriptions.Item>
                    <Descriptions.Item label="胎盘位置/分级" span={2}>
                      {u.placentaLocation} · {u.placentaGrade}
                    </Descriptions.Item>
                    <Descriptions.Item label="胎心" span={2}>{u.fetalHeart}</Descriptions.Item>
                  </Descriptions>
                  <Divider style={{ margin: '12px 0' }} />
                  <div>
                    <Text type="secondary">超声所见：</Text>
                    <Paragraph style={{ margin: '4px 0 0' }}>{u.findings}</Paragraph>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">超声结论：</Text>
                    <Paragraph style={{ margin: '4px 0 0' }} type="warning">
                      <Text strong>{u.impression}</Text>
                    </Paragraph>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          renderEmptyState('暂无超声记录')
        )}
      </Card>

      <Card
        title={
          <Space>
            <HeartOutlined style={{ color: '#52c41a' }} />
            化验结果汇总（按类别分组，最新结果）
          </Space>
        }
        size="small"
      >
        {Object.keys(labsByCategory).length > 0 ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {Object.entries(labsByCategory).map(([category, labs]) => (
              <Card key={category} size="small" type="inner" title={
                <Space>
                  <Tag color="purple">{category}</Tag>
                  {labs.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      最新日期：{labs[labs.length - 1].examDate} · {labs[labs.length - 1].gestationalWeeks}周
                    </Text>
                  )}
                </Space>
              }>
                <Table
                  size="small"
                  dataSource={labs.flatMap((l) => l.items.map((it, idx) => ({ ...it, key: `${l.id}-${idx}`, examDate: l.examDate })))}
                  pagination={false}
                  rowClassName={(record) => record.status !== 'normal' ? 'bg-warning' : ''}
                >
                  <Table.Column title="项目名称" dataIndex="name" width={160} />
                  <Table.Column
                    title="结果"
                    dataIndex="value"
                    width={120}
                    render={(v, r) => renderLabStatus(r.status, v)}
                    align="right"
                  />
                  <Table.Column title="单位" dataIndex="unit" width={100} />
                  <Table.Column title="参考范围" dataIndex="reference" width={140} />
                  <Table.Column
                    title="状态"
                    dataIndex="status"
                    width={80}
                    render={(s) =>
                      s === 'normal' ? (
                        <Tag icon={<CheckCircleOutlined />} color="green">正常</Tag>
                      ) : s === 'high' ? (
                        <Tag icon={<ExclamationCircleOutlined />} color="red">偏高</Tag>
                      ) : (
                        <Tag icon={<ExclamationCircleOutlined />} color="blue">偏低</Tag>
                      )
                    }
                  />
                </Table>
              </Card>
            ))}
          </Space>
        ) : (
          renderEmptyState('暂无化验结果')
        )}
      </Card>
    </Space>
  );

  // ========= Tab 4: 既往妊娠史 =========
  const renderTabPregnancyHistory = () => (
    <Card
      title={
        <Space>
          <TeamOutlined style={{ color: '#722ed1' }} />
          既往妊娠史 ({patientPregnancyHistories.length}次)
        </Space>
      }
      size="small"
    >
      {patientPregnancyHistories.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
          dataSource={patientPregnancyHistories}
          renderItem={(h) => (
            <List.Item>
              <Card
                size="small"
                type="inner"
                title={
                  <Space>
                    <Tag color={outcomeMap[h.outcome]?.color || 'default'}>
                      第 {h.pregnancyOrder} 次妊娠 · {outcomeMap[h.outcome]?.label}
                    </Tag>
                  </Space>
                }
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="分娩/结束时间">{h.endDate}</Descriptions.Item>
                  <Descriptions.Item label="结束孕周">{h.gestationalWeeks}周</Descriptions.Item>
                  <Descriptions.Item label="分娩方式">{deliveryModeMap[h.deliveryMode]}</Descriptions.Item>
                  <Descriptions.Item label="新生儿体重">
                    {h.newbornWeight > 0 ? `${h.newbornWeight}g` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="新生儿性别">
                    {h.newbornGender === 'male' ? '男' : h.newbornGender === 'female' ? '女' : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="并发症">{h.complications || '-'}</Descriptions.Item>
                </Descriptions>
                {h.note && (
                  <>
                    <Divider style={{ margin: '10px 0' }} />
                    <div>
                      <Text type="secondary">备注：</Text>
                      <Text>{h.note}</Text>
                    </div>
                  </>
                )}
              </Card>
            </List.Item>
          )}
        />
      ) : (
        renderEmptyState('暂无既往妊娠史记录')
      )}
    </Card>
  );

  // ========= Tab 5: 出院后跟踪 =========
  const renderTabDischarge = () => {
    const isDischarged = patient.currentStatus === 'discharged' || patient.currentStatus === 'postpartum';

    if (!isDischarged) {
      return (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <AlertOutlined style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }} />
          <Title level={4}>当前患者未出院</Title>
          <Paragraph type="secondary">
            「出院后跟踪」模块仅对「已出院」或「产后」状态的患者可见。
            <br />
            当前状态：<Tag color={statusMap[patient.currentStatus].color}>{statusMap[patient.currentStatus].label}</Tag>
          </Paragraph>
        </div>
      );
    }

    if (!patientDischargePlan) {
      return (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <>
                <Title level={4}>尚未制定出院计划</Title>
                <Paragraph type="secondary">请先为该患者制定出院计划与随访方案</Paragraph>
              </>
            }
          />
        </div>
      );
    }

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          title={
            <Space>
              <ApartmentOutlined style={{ color: '#1890ff' }} />
              出院诊断
            </Space>
          }
          size="small"
          extra={<Tag color="default">出院日期：{patientDischargePlan.dischargeDate}</Tag>}
        >
          <Paragraph style={{ margin: 0, fontSize: 15, lineHeight: 1.8 }}>
            {patient.dischargeDiagnosis || patientDischargePlan.followUpItems[0]?.content || '-'}
          </Paragraph>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">下次预约：</Text>
            <Text strong style={{ color: '#1890ff' }}>{patientDischargePlan.nextAppointment}</Text>
          </div>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">主管医生：</Text>
            <Text>{patientDischargePlan.createDoctor}</Text>
          </div>
        </Card>

        <Card
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#722ed1' }} />
              随访时间轴
            </Space>
          }
          size="small"
        >
          <Timeline
            mode="left"
            items={patientDischargePlan.followUpItems.map((item, idx) => ({
              color:
                item.status === 'completed'
                  ? 'green'
                  : item.status === 'missed'
                  ? 'red'
                  : 'blue',
              dot:
                item.status === 'completed' ? (
                  <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} />
                ) : item.status === 'missed' ? (
                  <CloseCircleOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />
                ) : (
                  <ClockCircleOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                ),
              children: (
                <Card size="small" type="inner" style={{ marginBottom: idx < patientDischargePlan.followUpItems.length - 1 ? 12 : 0 }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Tag color="purple">
                          {followUpTypeMap[item.type]?.icon} {followUpTypeMap[item.type]?.label}
                        </Tag>
                        <Text strong>{item.date}</Text>
                        <Tag color={followUpStatusMap[item.status].color}>
                          {followUpStatusMap[item.status].label}
                        </Tag>
                      </Space>
                    </Col>
                    <Col>
                      {item.status === 'pending' && (
                        <Space size={4}>
                          <Tooltip title="标记已完成">
                            <Button
                              size="small"
                              type="link"
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleFollowUpStatusChange(idx, 'completed')}
                            >
                              完成
                            </Button>
                          </Tooltip>
                          <Tooltip title="标记失访">
                            <Button
                              size="small"
                              type="link"
                              danger
                              icon={<CloseCircleOutlined />}
                              onClick={() => handleFollowUpStatusChange(idx, 'missed')}
                            >
                              失访
                            </Button>
                          </Tooltip>
                        </Space>
                      )}
                    </Col>
                  </Row>
                  <Paragraph style={{ margin: '8px 0 0' }}>{item.content}</Paragraph>
                  {item.completedDate && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      完成时间：{item.completedDate}
                    </Text>
                  )}
                  {item.note && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        随访备注：{item.note}
                      </Text>
                    </div>
                  )}
                </Card>
              ),
            }))}
          />
        </Card>

        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              随访项目（可切换完成状态）
            </Space>
          }
          size="small"
        >
          <Table
            size="small"
            dataSource={patientDischargePlan.followUpItems.map((item, idx) => ({ ...item, key: idx, index: idx }))}
            pagination={false}
          >
            <Table.Column title="序号" dataIndex="index" width={60} render={(v) => v + 1} align="center" />
            <Table.Column title="随访日期" dataIndex="date" width={120} />
            <Table.Column
              title="随访方式"
              dataIndex="type"
              width={120}
              render={(t) => (
                <Space>
                  {followUpTypeMap[t]?.icon}
                  {followUpTypeMap[t]?.label}
                </Space>
              )}
            />
            <Table.Column title="随访内容" dataIndex="content" />
            <Table.Column
              title="完成状态"
              width={180}
              render={(_, r: any) => (
                <Space>
                  <Switch
                    checked={r.status === 'completed'}
                    checkedChildren="已完成"
                    unCheckedChildren="待完成"
                    onChange={(checked) =>
                      handleFollowUpStatusChange(r.index, checked ? 'completed' : 'missed')
                    }
                    disabled={r.status === 'missed'}
                  />
                  <Tag color={followUpStatusMap[r.status].color}>
                    {followUpStatusMap[r.status].label}
                  </Tag>
                </Space>
              )}
            />
          </Table>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card
              title={
                <Space>
                  <MedicineBoxOutlined style={{ color: '#1890ff' }} />
                  用药指导
                </Space>
              }
              size="small"
            >
              {patientDischargePlan.medications.length > 0 ? (
                <List
                  size="small"
                  dataSource={patientDischargePlan.medications}
                  renderItem={(med, idx) => (
                    <List.Item key={idx}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="small"
                            icon={<MedicineBoxOutlined />}
                            style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}
                          />
                        }
                        title={<Text strong>{med.name}</Text>}
                        description={
                          <div>
                            <Text>
                              {med.dosage} · {med.frequency}
                            </Text>
                            <br />
                            <Text type="secondary">疗程：{med.duration}</Text>
                            {med.precautions && (
                              <>
                                <br />
                                <Text type="warning" style={{ fontSize: 12 }}>
                                  ⚠ {med.precautions}
                                </Text>
                              </>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                renderEmptyState('无用药')
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={
                <Space>
                  <HeartOutlined style={{ color: '#52c41a' }} />
                  生活建议
                </Space>
              }
              size="small"
            >
              {patientDischargePlan.lifestyleAdvice.length > 0 ? (
                <List
                  size="small"
                  dataSource={patientDischargePlan.lifestyleAdvice}
                  renderItem={(item, idx) => (
                    <List.Item key={idx}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text>{item}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                renderEmptyState('无')
              )}
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              预警信号（出现以下情况请立即就医）
            </Space>
          }
          size="small"
          style={{ borderColor: '#ff4d4f40' }}
          bodyStyle={{ background: '#fff2f0' }}
        >
          {patientDischargePlan.warningSigns.length > 0 ? (
            <Row gutter={[12, 12]}>
              {patientDischargePlan.warningSigns.map((sign, idx) => (
                <Col span={12} key={idx}>
                  <Card size="small" style={{ borderColor: '#ffccc7' }}>
                    <Space>
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
                      <Text strong type="danger">
                        {sign}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            renderEmptyState('无')
          )}
        </Card>
      </Space>
    );
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <Space>
          <UserOutlined />
          基本信息与病程
        </Space>
      ),
      children: renderTabBasicInfo(),
    },
    {
      key: '2',
      label: (
        <Space>
          <HeartOutlined />
          连续指标曲线
        </Space>
      ),
      children: renderTabCharts(),
    },
    {
      key: '3',
      label: (
        <Space>
          <MedicineBoxOutlined />
          超声与化验
        </Space>
      ),
      children: renderTabUltrasoundLab(),
    },
    {
      key: '4',
      label: (
        <Space>
          <TeamOutlined />
          既往妊娠史
        </Space>
      ),
      children: renderTabPregnancyHistory(),
    },
    {
      key: '5',
      label: (
        <Space>
          <ApartmentOutlined />
          出院后跟踪
        </Space>
      ),
      children: renderTabDischarge(),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* ====== 顶部患者信息栏 ====== */}
      <Card
        size="small"
        styles={{ body: { padding: 16 } }}
        style={{
          borderLeft: `4px solid ${riskColor}`,
          borderRadius: 8,
        }}
      >
        <Row align="middle" justify="space-between" gutter={16} wrap>
          <Col flex="auto">
            <Row align="middle" gutter={16} wrap>
              <Col>
                <Avatar
                  size={72}
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: riskColor,
                    fontSize: 32,
                    boxShadow: `0 0 0 4px ${riskColor}20`,
                  }}
                />
              </Col>
              <Col flex="auto">
                <Space direction="vertical" size={4}>
                  <Space wrap>
                    <Title level={3} style={{ margin: 0 }}>
                      {patient.name}
                    </Title>
                    <Tag
                      color={riskColor}
                      icon={<ExclamationCircleOutlined />}
                      style={{ padding: '2px 12px', fontSize: 14 }}
                    >
                      {riskLevelLabels[patient.riskLevel]}
                    </Tag>
                    <Tag color={statusMap[patient.currentStatus].color}>
                      {statusMap[patient.currentStatus].label}
                    </Tag>
                    {patient.isKeyCase && (
                      <Tag icon={<StarFilled />} color="gold">
                        重点病例
                      </Tag>
                    )}
                    {patient.isUrgent && (
                      <Tag icon={<AlertOutlined />} color="red">
                        紧急
                      </Tag>
                    )}
                  </Space>
                  <Space wrap size={12}>
                    <Text>
                      <Text type="secondary">年龄</Text> {patient.age}岁
                    </Text>
                    <Text>
                      <Text type="secondary">孕周</Text>{' '}
                      <Text strong style={{ color: '#1890ff' }}>
                        {patient.gestationalWeeks}+{patient.gestationalDays}周
                      </Text>
                    </Text>
                    <Text>
                      <Text type="secondary">预产期</Text> {patient.dueDate}
                    </Text>
                    <Text>
                      <Text type="secondary">床位</Text> {patient.id}
                    </Text>
                    <Text>
                      <Text type="secondary">G{patient.gravidity}P{patient.parity}</Text>
                    </Text>
                  </Space>
                  {patient.riskFactors.length > 0 && (
                    <Space wrap size={6}>
                      <Text type="secondary">高危因素：</Text>
                      {patient.riskFactors.map((f, i) => (
                        <Tag color="red" key={i} style={{ margin: 0 }}>
                          {f}
                        </Tag>
                      ))}
                    </Space>
                  )}
                </Space>
              </Col>
            </Row>
          </Col>
          <Col>
            <Space wrap size={8} style={{ justifyContent: 'flex-end' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList}>
                返回列表
              </Button>
              <Button
                icon={<ExclamationCircleOutlined />}
                onClick={handleAdjustRisk}
                style={{ color: riskColor, borderColor: riskColor }}
              >
                调整风险
              </Button>
              <Button
                icon={<TeamOutlined />}
                type="default"
                onClick={() => {
                  setPreFillConsultationPatient(selectedPatientId);
                  setActiveWindow('consultation');
                }}
              >
                申请会诊
              </Button>
              <Button
                icon={<ApartmentOutlined />}
                type="default"
                onClick={() => {
                  setPreFillHospitalizationPatient(selectedPatientId);
                  setActiveWindow('consultation');
                }}
              >
                安排住院
              </Button>
              <Button
                icon={patient.isKeyCase ? <StarFilled /> : <StarOutlined />}
                type={patient.isKeyCase ? 'primary' : 'default'}
                onClick={handleMarkKeyCase}
                style={patient.isKeyCase ? { background: '#faad14', borderColor: '#faad14' } : { color: '#faad14', borderColor: '#faad14' }}
              >
                {patient.isKeyCase ? '取消重点' : '标记重点'}
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport} type="primary">
                导出病历
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* ====== Tabs ====== */}
      <Card
        size="small"
        styles={{ body: { padding: '16px 24px' } }}
        style={{ borderRadius: 8 }}
      >
        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          size="large"
        />
      </Card>

      {/* ====== 风险调整弹窗 ====== */}
      <Modal
        title="调整风险等级"
        open={riskModalVisible}
        onOk={handleRiskSubmit}
        onCancel={() => setRiskModalVisible(false)}
        okText="确认调整"
        cancelText="取消"
      >
        <Form form={riskForm} layout="vertical">
          <Form.Item
            label="当前患者"
          >
            <Text strong>{patient?.name}（{patient?.id}）</Text>
          </Form.Item>
          <Form.Item
            label="调整为风险等级"
            name="riskLevel"
            rules={[{ required: true, message: '请选择风险等级' }]}
          >
            <Select size="large">
              {(Object.keys(riskLevelLabels) as RiskLevel[]).map((level) => (
                <Option key={level} value={level}>
                  <Tag color={riskLevelColors[level]}>{riskLevelLabels[level]}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="调整理由"
            name="reason"
            rules={[{ required: true, message: '请填写调整理由' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明本次风险等级调整的原因，如病情变化、检查结果更新等..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default Detail;
