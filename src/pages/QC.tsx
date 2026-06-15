import React, { useState, useMemo } from 'react';
import {
  Tabs,
  Row,
  Col,
  Card,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Drawer,
  message,
  Badge,
  Progress,
  List,
  InputNumber,
  Divider,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  EditOutlined,
  ToolOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  StopOutlined,
  HomeOutlined,
  TeamOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table/interface';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import { useAppStore } from '../store/appStore';
import { riskLevelColors } from '../data/mockData';
import type { QualityControlRecord, QCAuditItem, RiskLevel } from '../types';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const auditTypeLabels: Record<QualityControlRecord['auditType'], string> = {
  random: '随机抽查',
  key: '重点病例',
  complaint: '投诉病例',
};

const auditTypeColors: Record<QualityControlRecord['auditType'], string> = {
  random: 'blue',
  key: 'orange',
  complaint: 'red',
};

const statusLabels: Record<QualityControlRecord['status'], string> = {
  pending: '待审核',
  completed: '已完成',
  revised: '已整改',
};

const statusColors: Record<QualityControlRecord['status'], string> = {
  pending: 'gold',
  completed: 'green',
  revised: 'blue',
};

const getScoreColor = (score: number): string => {
  if (score < 70) return '#f5222d';
  if (score < 85) return '#faad14';
  return '#52c41a';
};

const defaultAuditCategories = [
  { category: '首诊负责', name: '首次产检记录完整性', maxScore: 20 },
  { category: '高危管理', name: '高危因素识别与标注', maxScore: 20 },
  { category: '高危管理', name: '风险分级动态调整', maxScore: 20 },
  { category: '检查检验', name: '辅助检查合理性和及时性', maxScore: 20 },
  { category: '处置规范', name: '处理措施符合指南规范', maxScore: 20 },
  { category: '随访管理', name: '随访计划可执行性', maxScore: 20 },
];

const QC: React.FC = () => {
  const {
    qualityControlRecords,
    statistics,
    patients,
    addQCRecord,
    selectPatient,
    setActiveWindow,
  } = useAppStore();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auditorFilter, setAuditorFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<QualityControlRecord | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [problemList, setProblemList] = useState<string[]>(['']);
  const [suggestionList, setSuggestionList] = useState<string[]>(['']);
  const [auditScores, setAuditScores] = useState<Record<string, number>>({});

  const auditors = useMemo(() => {
    const set = new Set(qualityControlRecords.map((r) => r.auditor));
    return Array.from(set);
  }, [qualityControlRecords]);

  const filteredRecords = useMemo(() => {
    return qualityControlRecords.filter((r) => {
      if (typeFilter !== 'all' && r.auditType !== typeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (auditorFilter !== 'all' && r.auditor !== auditorFilter) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const auditDate = dayjs(r.auditDate);
        if (auditDate.isBefore(dateRange[0], 'day') || auditDate.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }
      return true;
    });
  }, [qualityControlRecords, typeFilter, statusFilter, auditorFilter, dateRange]);

  const handlePatientClick = (patientId: string) => {
    selectPatient(patientId);
    setActiveWindow('detail');
  };

  const handleViewDetail = (record: QualityControlRecord) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleEdit = (record: QualityControlRecord) => {
    message.info('编辑功能开发中');
  };

  const handleRevise = (record: QualityControlRecord) => {
    message.success(`已标记「${record.id}」为整改中`);
  };

  const handleExport = () => {
    message.success('质控报告导出成功');
  };

  const handleOpenCreate = () => {
    createForm.resetFields();
    setProblemList(['']);
    setSuggestionList(['']);
    const scores: Record<string, number> = {};
    defaultAuditCategories.forEach((c) => {
      scores[`${c.category}-${c.name}`] = c.maxScore;
    });
    setAuditScores(scores);
    createForm.setFieldsValue({
      auditor: '张医生',
      auditDate: dayjs(),
    });
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const totalScore = Object.values(auditScores).reduce((a, b) => a + b, 0);
      const maxTotal = defaultAuditCategories.reduce((a, b) => a + b.maxScore, 0);
      const normalizedScore = Math.round((totalScore / maxTotal) * 100);

      const auditItems: QCAuditItem[] = defaultAuditCategories.map((c) => ({
        category: c.category,
        name: c.name,
        score: auditScores[`${c.category}-${c.name}`] || 0,
        maxScore: c.maxScore,
        problem: '',
      }));

      const patient = patients.find((p) => p.id === values.patientId);

      const newRecord: QualityControlRecord = {
        id: `QC${String(qualityControlRecords.length + 1).padStart(3, '0')}`,
        auditDate: values.auditDate.format('YYYY-MM-DD'),
        auditor: values.auditor,
        patientId: values.patientId,
        patientName: patient?.name || '',
        auditType: values.auditType,
        totalScore: normalizedScore,
        auditItems,
        problems: problemList.filter((p) => p.trim()),
        suggestions: suggestionList.filter((s) => s.trim()),
        status: 'pending',
      };

      addQCRecord(newRecord);
      message.success('质控抽查创建成功');
      setCreateModalVisible(false);
    } catch {
      // validation error
    }
  };

  const qcComparisonData = useMemo(() => {
    const months = statistics.monthlyVisits.map((m) => m.month);
    const highRiskRatio = statistics.riskDistribution
      .filter((r) => r.level === 'orange' || r.level === 'red')
      .reduce((a, b) => a + b.count, 0) / statistics.totalPatients * 100;

    return months.map((month, idx) => ({
      month,
      totalVisits: statistics.monthlyVisits[idx].count,
      highRiskRatio: (highRiskRatio + (Math.random() - 0.5) * 5).toFixed(1) + '%',
      avgHospitalStay: (statistics.avgHospitalStay + (Math.random() - 0.5) * 0.8).toFixed(1),
      cesareanRate: (statistics.cesareanRate + (Math.random() - 0.5) * 4).toFixed(1) + '%',
      followUpRate: (statistics.dischargeFollowUpRate + (Math.random() - 0.5) * 3).toFixed(1) + '%',
      readmissionRate: (statistics.readmissionRate + (Math.random() - 0.5) * 0.5).toFixed(2) + '%',
      qcAvgScore: statistics.qcTrend[idx]?.avgScore.toFixed(1) || '85.0',
    }));
  }, [statistics]);

  const pieData = useMemo(() => {
    const colorMap: Record<RiskLevel, string> = {
      green: riskLevelColors.green,
      yellow: riskLevelColors.yellow,
      orange: riskLevelColors.orange,
      red: riskLevelColors.red,
    };
    return statistics.riskDistribution.map((r) => ({
      name: { green: '低风险', yellow: '一般风险', orange: '较高风险', red: '高风险' }[r.level],
      value: r.count,
      color: colorMap[r.level],
    }));
  }, [statistics]);

  const complicationData = useMemo(() => {
    return [...statistics.topComplications]
      .sort((a, b) => a.count - b.count)
      .map((c) => ({ name: c.name, count: c.count }));
  }, [statistics]);

  const columns: ColumnsType<QualityControlRecord> = [
    {
      title: '抽查编号',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (text) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{text}</span>,
    },
    {
      title: '抽查日期',
      dataIndex: 'auditDate',
      key: 'auditDate',
      width: 120,
    },
    {
      title: '审核人',
      dataIndex: 'auditor',
      key: 'auditor',
      width: 130,
    },
    {
      title: '患者姓名',
      key: 'patientName',
      width: 120,
      render: (_, record) => (
        <a onClick={() => handlePatientClick(record.patientId)} style={{ fontWeight: 500 }}>
          {record.patientName}
        </a>
      ),
    },
    {
      title: '抽查类型',
      dataIndex: 'auditType',
      key: 'auditType',
      width: 110,
      render: (type: QualityControlRecord['auditType']) => (
        <Tag color={auditTypeColors[type]}>{auditTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 180,
      render: (score: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Progress
            percent={score}
            size="small"
            strokeColor={getScoreColor(score)}
            showInfo={false}
            style={{ flex: 1 }}
          />
          <span style={{ fontWeight: 700, color: getScoreColor(score), minWidth: 36 }}>
            {score}分
          </span>
        </div>
      ),
    },
    {
      title: '问题数量',
      key: 'problemCount',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const count = record.problems.length;
        if (count === 0) return <span style={{ color: '#999' }}>0</span>;
        return (
          <Badge
            count={count}
            style={{ backgroundColor: count > 3 ? '#f5222d' : count > 1 ? '#faad14' : '#1890ff' }}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: QualityControlRecord['status']) => (
        <Tag color={statusColors[status]} style={{ padding: '2px 10px', borderRadius: 10, fontWeight: 500 }}>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<ToolOutlined />} onClick={() => handleRevise(record)}>
              整改
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const auditItemColumns: ColumnsType<QCAuditItem & { key: string }> = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '得分/满分',
      key: 'score',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const ratio = record.score / record.maxScore;
        const color = ratio < 0.7 ? '#f5222d' : ratio < 0.85 ? '#faad14' : '#52c41a';
        return (
          <span style={{ fontWeight: 600, color }}>
            {record.score}/{record.maxScore}
          </span>
        );
      },
    },
    {
      title: '存在问题',
      dataIndex: 'problem',
      key: 'problem',
      render: (text) =>
        text ? <span style={{ color: '#f5222d', fontWeight: 500 }}>{text}</span> : <span style={{ color: '#999' }}>无</span>,
    },
  ];

  const renderAuditTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 24px' }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Space size={12} wrap>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: 140 }}
                placeholder="抽查类型"
                allowClear
              >
                <Option value="all">全部类型</Option>
                <Option value="random">随机抽查</Option>
                <Option value="key">重点病例</Option>
                <Option value="complaint">投诉病例</Option>
              </Select>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 130 }}
                placeholder="状态"
                allowClear
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待审核</Option>
                <Option value="completed">已完成</Option>
                <Option value="revised">已整改</Option>
              </Select>
              <Select
                value={auditorFilter}
                onChange={setAuditorFilter}
                style={{ width: 150 }}
                placeholder="审核医生"
                allowClear
              >
                <Option value="all">全部医生</Option>
                {auditors.map((a) => (
                  <Option key={a} value={a}>{a}</Option>
                ))}
              </Select>
              <RangePicker
                value={dateRange as any}
                onChange={(val) => setDateRange(val as any)}
                placeholder={['开始日期', '结束日期']}
                style={{ width: 260 }}
              />
              <Button icon={<SearchOutlined />} type="primary">
                查询
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                新建质控抽查
              </Button>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出质控报告
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, padding: 0 }} bodyStyle={{ padding: 0 }}>
        <Table<QualityControlRecord>
          rowKey="id"
          columns={columns}
          dataSource={filteredRecords}
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSize: 10,
          }}
        />
      </Card>
    </div>
  );

  const renderStatisticsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderTop: '4px solid #1890ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>本月随访完成率</div>
                <Statistic
                  value={statistics.dischargeFollowUpRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#1890ff', fontSize: 28, fontWeight: 700 }}
                />
              </div>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '完成', value: statistics.dischargeFollowUpRate },
                        { name: '未完成', value: 100 - statistics.dischargeFollowUpRate },
                      ]}
                      innerRadius={28}
                      outerRadius={38}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#1890ff" />
                      <Cell fill="#f0f0f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1890ff',
                  }}
                >
                  {statistics.dischargeFollowUpRate}%
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderTop: '4px solid #f5222d' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>2周内再入院率</div>
                <Statistic
                  value={statistics.readmissionRate}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#f5222d', fontSize: 28, fontWeight: 700 }}
                />
              </div>
              <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f5222d33' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderTop: '4px solid #722ed1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>剖宫产率</div>
                <Statistic
                  value={statistics.cesareanRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#722ed1', fontSize: 28, fontWeight: 700 }}
                />
              </div>
              <HomeOutlined style={{ fontSize: 40, color: '#722ed133' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8, borderTop: '4px solid #52c41a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>平均住院日</div>
                <Statistic
                  value={statistics.avgHospitalStay}
                  precision={1}
                  suffix="天"
                  valueStyle={{ color: '#52c41a', fontSize: 28, fontWeight: 700 }}
                />
              </div>
              <RiseOutlined style={{ fontSize: 40, color: '#52c41a33' }} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlinedIcon />
                <span>风险等级分布</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <div className="chart-container" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>月度产检量趋势</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <div className="chart-container" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={statistics.monthlyVisits}>
                  <defs>
                    <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="产检量"
                    stroke="#1890ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVisit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>质控评分月度趋势</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <div className="chart-container" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statistics.qcTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    name="平均得分"
                    stroke="#52c41a"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#52c41a' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                <span>常见并发症TOP10</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complicationData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="病例数" fill="#fa8c16" radius={[0, 4, 4, 0]} barSize={18}>
                    <LabelList dataKey="count" position="right" style={{ fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>会诊科室统计</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.consultationStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="会诊次数" fill="#1890ff" radius={[4, 4, 0, 0]} barSize={28}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>质控指标对比表</span>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        <Table
          rowKey="month"
          dataSource={qcComparisonData}
          pagination={false}
          bordered
          size="middle"
          columns={[
            { title: '月份', dataIndex: 'month', key: 'month', width: 100, fixed: 'left' },
            { title: '产检总数', dataIndex: 'totalVisits', key: 'totalVisits', align: 'center' },
            { title: '高危比例', dataIndex: 'highRiskRatio', key: 'highRiskRatio', align: 'center' },
            { title: '平均住院日', dataIndex: 'avgHospitalStay', key: 'avgHospitalStay', align: 'center' },
            { title: '剖宫产率', dataIndex: 'cesareanRate', key: 'cesareanRate', align: 'center' },
            { title: '随访率', dataIndex: 'followUpRate', key: 'followUpRate', align: 'center' },
            { title: '再入院率', dataIndex: 'readmissionRate', key: 'readmissionRate', align: 'center' },
            { title: '质控均分', dataIndex: 'qcAvgScore', key: 'qcAvgScore', align: 'center' },
          ]}
        />
      </Card>
    </div>
  );

  const PieChartOutlinedIcon = () => (
    <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" style={{ fontSize: 16 }}>
      <path d="M832 464h-68V240c0-26.5-21.5-48-48-48H224c-26.5 0-48 21.5-48 48v544c0 26.5 21.5 48 48 48h552c17.7 0 32-14.3 32-32V464zm-88 280H264V280h480v464zM513.1 712.1l56.6-56.6c3.1-3.1 3.1-8.2 0-11.3l-127-127c-.6-.6-1.3-1.1-2-1.5l-176.7-76.3a8.03 8.03 0 00-10.2 10.2l76.3 176.8c.4.7.8 1.4 1.5 2l127 127c3.1 3.1 8.2 3.1 11.3 0zm-231.8-199.4l126.7 126.7-75.2 75.2c-3.1 3.1-8.2 3.1-11.3 0l-83.1-83.1c-3.1-3.1-3.1-8.2 0-11.3l42.9-107.5z" />
    </svg>
  );

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card style={{ borderRadius: 8, padding: 0 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="audit"
          size="large"
          items={[
            {
              key: 'audit',
              label: (
                <Space>
                  <CheckCircleOutlined />
                  质控抽查
                </Space>
              ),
              children: renderAuditTab(),
            },
            {
              key: 'statistics',
              label: (
                <Space>
                  <BarChartOutlined />
                  统计分析
                </Space>
              ),
              children: renderStatisticsTab(),
            },
          ]}
          style={{ padding: '0 24px' }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            <span>质控抽查详情</span>
            {currentRecord && (
              <Tag color={statusColors[currentRecord.status]} style={{ marginLeft: 8 }}>
                {statusLabels[currentRecord.status]}
              </Tag>
            )}
          </Space>
        }
        width={760}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          <Space>
            {currentRecord?.status === 'pending' && (
              <Button type="primary" icon={<ToolOutlined />} onClick={() => handleRevise(currentRecord)}>
                标记整改
              </Button>
            )}
            <Button onClick={() => setDetailVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {currentRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card
              size="small"
              style={{ borderRadius: 8, background: '#fafafa' }}
              title="基本信息"
            >
              <Row gutter={[16, 12]}>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>抽查编号</div>
                  <div style={{ fontWeight: 600, color: '#1890ff' }}>{currentRecord.id}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>抽查日期</div>
                  <div style={{ fontWeight: 500 }}>{currentRecord.auditDate}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>审核医生</div>
                  <div style={{ fontWeight: 500 }}>{currentRecord.auditor}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>患者姓名</div>
                  <a onClick={() => handlePatientClick(currentRecord.patientId)} style={{ fontWeight: 500 }}>
                    {currentRecord.patientName}
                  </a>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>抽查类型</div>
                  <Tag color={auditTypeColors[currentRecord.auditType]}>
                    {auditTypeLabels[currentRecord.auditType]}
                  </Tag>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              style={{ borderRadius: 8 }}
              title="总分概览"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: `conic-gradient(${getScoreColor(currentRecord.totalScore)} ${currentRecord.totalScore * 3.6}deg, #f0f0f0 0deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <span style={{ fontSize: 28, fontWeight: 800, color: getScoreColor(currentRecord.totalScore) }}>
                      {currentRecord.totalScore}
                    </span>
                    <span style={{ fontSize: 11, color: '#999' }}>总分</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Progress
                    percent={currentRecord.totalScore}
                    strokeColor={getScoreColor(currentRecord.totalScore)}
                    strokeWidth={12}
                  />
                  <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                    <div>
                      <span style={{ color: '#999', fontSize: 12 }}>满分</span>
                      <div style={{ fontWeight: 600 }}>100</div>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 12 }}>问题数</span>
                      <div style={{ fontWeight: 600, color: '#f5222d' }}>{currentRecord.problems.length}</div>
                    </div>
                    <div>
                      <span style={{ color: '#999', fontSize: 12 }}>整改建议</span>
                      <div style={{ fontWeight: 600, color: '#1890ff' }}>{currentRecord.suggestions.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              size="small"
              style={{ borderRadius: 8 }}
              title="各分类评分明细"
            >
              <Table
                rowKey={(r) => `${r.category}-${r.name}`}
                dataSource={currentRecord.auditItems.map((item, idx) => ({ ...item, key: String(idx) }))}
                columns={auditItemColumns as any}
                pagination={false}
                size="small"
              />
            </Card>

            {currentRecord.problems.length > 0 && (
              <Card
                size="small"
                style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }}
                title={
                  <Space>
                    <StopOutlined style={{ color: '#f5222d' }} />
                    <span>发现问题汇总</span>
                  </Space>
                }
              >
                <List
                  dataSource={currentRecord.problems}
                  renderItem={(item, index) => (
                    <List.Item style={{ borderBottom: index < currentRecord.problems.length - 1 ? '1px solid #f0f0f0' : 'none', padding: '8px 0' }}>
                      <List.Item.Meta
                        avatar={
                          <Badge
                            count={index + 1}
                            style={{ backgroundColor: '#f5222d', minWidth: 22, height: 22, fontSize: 12 }}
                          />
                        }
                        description={<span style={{ color: '#333', fontSize: 13 }}>{item}</span>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {currentRecord.suggestions.length > 0 && (
              <Card
                size="small"
                style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }}
                title={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                    <span>整改建议</span>
                  </Space>
                }
              >
                <List
                  dataSource={currentRecord.suggestions}
                  renderItem={(item, index) => (
                    <List.Item style={{ borderBottom: index < currentRecord.suggestions.length - 1 ? '1px solid #f0f0f0' : 'none', padding: '8px 0' }}>
                      <List.Item.Meta
                        avatar={
                          <Badge
                            count={index + 1}
                            style={{ backgroundColor: '#1890ff', minWidth: 22, height: 22, fontSize: 12 }}
                          />
                        }
                        description={<span style={{ color: '#333', fontSize: 13 }}>{item}</span>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <PlusOutlined />
            <span>新建质控抽查</span>
          </Space>
        }
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalVisible(false)}
        okText="提交"
        cancelText="取消"
        width={720}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="patientId"
                label="选择患者"
                rules={[{ required: true, message: '请选择患者' }]}
              >
                <Select placeholder="请选择患者" showSearch optionFilterProp="children">
                  {patients.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.name} ({p.id}) - {p.gestationalWeeks}+{p.gestationalDays}周
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="auditType"
                label="抽查类型"
                rules={[{ required: true, message: '请选择抽查类型' }]}
              >
                <Select placeholder="请选择抽查类型">
                  <Option value="random">随机抽查</Option>
                  <Option value="key">重点病例</Option>
                  <Option value="complaint">投诉病例</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="auditor"
                label="审核人"
                rules={[{ required: true, message: '请填写审核人' }]}
              >
                <Input placeholder="请填写审核人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="auditDate"
                label="抽查日期"
                rules={[{ required: true, message: '请选择抽查日期' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>
            各分类评分
          </Divider>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {defaultAuditCategories.map((c, idx) => {
              const key = `${c.category}-${c.name}`;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: '#fafafa',
                    borderRadius: 6,
                  }}
                >
                  <Tag color="purple" style={{ minWidth: 80, textAlign: 'center' }}>
                    {c.category}
                  </Tag>
                  <div style={{ flex: 1, fontSize: 13, color: '#333' }}>{c.name}</div>
                  <InputNumber
                    min={0}
                    max={c.maxScore}
                    value={auditScores[key]}
                    onChange={(val) =>
                      setAuditScores({ ...auditScores, [key]: Number(val) || 0 })
                    }
                    addonAfter={`/ ${c.maxScore}`}
                    style={{ width: 130 }}
                  />
                </div>
              );
            })}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 16,
                padding: '12px',
                background: '#e6f7ff',
                borderRadius: 6,
                marginTop: 8,
              }}
            >
              <span style={{ color: '#666' }}>合计得分：</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#1890ff' }}>
                {Object.values(auditScores).reduce((a, b) => a + b, 0)}
              </span>
              <span style={{ color: '#999' }}>
                / {defaultAuditCategories.reduce((a, b) => a + b.maxScore, 0)}
              </span>
            </div>
          </div>

          <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>
            发现问题（可动态增减）
          </Divider>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {problemList.map((_, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#f5222d',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  {idx + 1}
                </span>
                <TextArea
                  value={problemList[idx]}
                  onChange={(e) => {
                    const newList = [...problemList];
                    newList[idx] = e.target.value;
                    setProblemList(newList);
                  }}
                  placeholder={`请输入第 ${idx + 1} 条问题描述`}
                  rows={2}
                  style={{ flex: 1 }}
                />
                {problemList.length > 1 && (
                  <Button
                    danger
                    type="text"
                    onClick={() => {
                      const newList = problemList.filter((_, i) => i !== idx);
                      setProblemList(newList);
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    删除
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => setProblemList([...problemList, ''])}
              icon={<PlusOutlined />}
              block
            >
              添加问题
            </Button>
          </div>

          <Divider orientation="left" plain style={{ margin: '8px 0 16px' }}>
            整改建议（可动态增减）
          </Divider>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestionList.map((_, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#1890ff',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  {idx + 1}
                </span>
                <TextArea
                  value={suggestionList[idx]}
                  onChange={(e) => {
                    const newList = [...suggestionList];
                    newList[idx] = e.target.value;
                    setSuggestionList(newList);
                  }}
                  placeholder={`请输入第 ${idx + 1} 条整改建议`}
                  rows={2}
                  style={{ flex: 1 }}
                />
                {suggestionList.length > 1 && (
                  <Button
                    danger
                    type="text"
                    onClick={() => {
                      const newList = suggestionList.filter((_, i) => i !== idx);
                      setSuggestionList(newList);
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    删除
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => setSuggestionList([...suggestionList, ''])}
              icon={<PlusOutlined />}
              block
            >
              添加建议
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default QC;
