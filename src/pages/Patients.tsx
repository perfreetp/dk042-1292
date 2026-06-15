import React, { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
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
  Tooltip,
  Alert,
  Checkbox,
} from 'antd';
import {
  TeamOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  SearchOutlined,
  PlusOutlined,
  ExportOutlined,
  EyeOutlined,
  SwapOutlined,
  TeamOutlined as TeamIcon,
  HomeOutlined,
  StarFilled,
  StarOutlined,
  ManOutlined,
  WomanOutlined,
  BulbOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import { useAppStore } from '../store/appStore';
import { riskLevelColors, riskLevelLabels } from '../data/mockData';
import type { Patient, RiskLevel } from '../types';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const statusLabels: Record<Patient['currentStatus'], string> = {
  antenatal: '门诊',
  hospitalized: '住院中',
  discharged: '已出院',
  postpartum: '产后',
};

const statusColors: Record<Patient['currentStatus'], string> = {
  antenatal: 'blue',
  hospitalized: 'red',
  discharged: 'default',
  postpartum: 'purple',
};

const Patients: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    selectPatient,
    patientSearchKeyword,
    setPatientSearchKeyword,
    patientRiskFilter,
    setPatientRiskFilter,
    updatePatientRiskLevel,
    markKeyCase,
    setActiveWindow,
    setPreFillConsultationPatient,
    setPreFillHospitalizationPatient,
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgentFilter, setUrgentFilter] = useState<boolean | null>(null);
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [currentRiskPatient, setCurrentRiskPatient] = useState<Patient | null>(null);
  const [newRiskLevel, setNewRiskLevel] = useState<RiskLevel>('green');
  const [riskAdjustReason, setRiskAdjustReason] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const riskCounts = useMemo(() => {
    const counts = { total: patients.length, green: 0, yellow: 0, orange: 0, red: 0 };
    patients.forEach((p) => {
      counts[p.riskLevel]++;
    });
    return counts;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (patientSearchKeyword) {
        const keyword = patientSearchKeyword.toLowerCase();
        const matchName = p.name.toLowerCase().includes(keyword);
        const matchId = p.id.toLowerCase().includes(keyword);
        const matchPhone = p.phone.includes(keyword);
        if (!matchName && !matchId && !matchPhone) return false;
      }
      if (patientRiskFilter !== 'all' && p.riskLevel !== patientRiskFilter) {
        return false;
      }
      if (statusFilter !== 'all' && p.currentStatus !== statusFilter) {
        return false;
      }
      if (urgentFilter !== null && p.isUrgent !== urgentFilter) {
        return false;
      }
      return true;
    });
  }, [patients, patientSearchKeyword, patientRiskFilter, statusFilter, urgentFilter]);

  const rowSelection: TableRowSelection<Patient> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const handlePatientClick = (patientId: string) => {
    selectPatient(patientId);
    setActiveWindow('detail');
  };

  const handleOpenRiskModal = (patient: Patient) => {
    setCurrentRiskPatient(patient);
    setNewRiskLevel(patient.riskLevel);
    setRiskAdjustReason('');
    form.resetFields();
    setRiskModalVisible(true);
  };

  const handleRiskAdjustSubmit = async () => {
    try {
      await form.validateFields();
      if (currentRiskPatient) {
        updatePatientRiskLevel(currentRiskPatient.id, newRiskLevel, riskAdjustReason);
        message.success('风险等级调整成功');
        setRiskModalVisible(false);
      }
    } catch {
      // validation error
    }
  };

  const handleToggleKeyCase = (patient: Patient) => {
    markKeyCase(patient.id, !patient.isKeyCase);
    message.success(patient.isKeyCase ? '已取消重点病例标记' : '已标记为重点病例');
  };

  const getRiskSuggestion = (patient: Patient | null, newLevel: RiskLevel): string => {
    if (!patient) return '';
    if (patient.riskLevel === newLevel) {
      return '当前风险级别无需调整，请确认是否有新的病情变化。';
    }
    const suggestions: Record<string, string> = {
      'green-yellow': '风险升级：建议加强监测频率，增加产检次数。',
      'green-orange': '风险升级至较高风险：建议尽快组织病例讨论，制定详细管理方案。',
      'green-red': '风险升级至高风险：建议立即住院评估，启动高危妊娠管理流程。',
      'yellow-green': '风险降级：需确认各项指标已恢复正常并持续稳定。',
      'yellow-orange': '风险升级：建议完善相关检查，考虑多学科会诊。',
      'yellow-red': '风险升级至高风险：建议紧急评估，必要时住院治疗。',
      'orange-green': '风险大幅降级：请谨慎评估，确保病情确实稳定。',
      'orange-yellow': '风险降级：需持续监测至少2周确认稳定。',
      'orange-red': '风险升级至高风险：建议立即住院，准备终止妊娠评估。',
      'red-green': '风险大幅降级：非常罕见，需组织多学科会诊确认。',
      'red-yellow': '风险降级：需在严密监护下逐步降低管理级别。',
      'red-orange': '风险降级：仍属较高风险，继续住院或密切门诊随访。',
    };
    return suggestions[`${patient.riskLevel}-${newLevel}`] || '请根据患者具体病情综合判断。';
  };

  const statCards = [
    {
      title: '在管患者数',
      value: riskCounts.total,
      icon: <TeamOutlined style={{ fontSize: 32 }} />,
      color: '#1890ff',
      bgColor: '#e6f7ff',
      borderColor: '#91d5ff',
      onClick: () => {
        setPatientRiskFilter('all');
      },
    },
    {
      title: '低风险（绿色）',
      value: riskCounts.green,
      icon: <SafetyCertificateOutlined style={{ fontSize: 32 }} />,
      color: riskLevelColors.green,
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
      onClick: () => {
        setPatientRiskFilter('green');
      },
    },
    {
      title: '一般风险（黄色）',
      value: riskCounts.yellow,
      icon: <WarningOutlined style={{ fontSize: 32 }} />,
      color: riskLevelColors.yellow,
      bgColor: '#fffbe6',
      borderColor: '#ffe58f',
      onClick: () => {
        setPatientRiskFilter('yellow');
      },
    },
    {
      title: '较高风险（橙色）',
      value: riskCounts.orange,
      icon: <ExclamationCircleOutlined style={{ fontSize: 32 }} />,
      color: riskLevelColors.orange,
      bgColor: '#fff7e6',
      borderColor: '#ffd591',
      onClick: () => {
        setPatientRiskFilter('orange');
      },
    },
    {
      title: '高风险（红色）',
      value: riskCounts.red,
      icon: <StopOutlined style={{ fontSize: 32 }} />,
      color: riskLevelColors.red,
      bgColor: '#fff1f0',
      borderColor: '#ffa39e',
      onClick: () => {
        setPatientRiskFilter('red');
      },
    },
  ];

  const columns: ColumnsType<Patient> = [
    {
      title: '患者编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      fixed: 'left',
      render: (text: string, record) => (
        <a onClick={() => handlePatientClick(record.id)} style={{ fontWeight: 600 }}>
          {text}
        </a>
      ),
    },
    {
      title: '姓名',
      key: 'name',
      width: 140,
      render: (_, record) => (
        <Space>
          {parseInt(record.idCard?.charAt(16) || '0', 10) % 2 === 0 ? (
            <WomanOutlined style={{ color: '#eb2f96' }} />
          ) : (
            <ManOutlined style={{ color: '#1890ff' }} />
          )}
          <span style={{ fontWeight: 500 }}>{record.name}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{record.age}岁</span>
        </Space>
      ),
    },
    {
      title: '孕周',
      key: 'gestational',
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 500 }}>
          {record.gestationalWeeks}+{record.gestationalDays}周
        </span>
      ),
    },
    {
      title: '预产期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
    },
    {
      title: '风险分级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 140,
      render: (level: RiskLevel) => {
        const isRed = level === 'red';
        return (
          <Tag
            color={level}
            style={{
              padding: '4px 12px',
              borderRadius: 10,
              fontWeight: 600,
              animation: isRed ? 'pulse-red 2s ease-in-out infinite' : undefined,
            }}
          >
            {riskLevelLabels[level].replace(/（.*?）/g, '')}
          </Tag>
        );
      },
    },
    {
      title: '高危因素',
      dataIndex: 'riskFactors',
      key: 'riskFactors',
      width: 240,
      render: (factors: string[]) => (
        <Space size={[4, 4]} wrap>
          {factors.length > 0 ? (
            factors.map((f, idx) => (
              <Tag
                key={idx}
                style={{
                  background: '#f0f5ff',
                  color: '#1d39c4',
                  border: '1px solid #d6e4ff',
                  borderRadius: 10,
                  margin: 0,
                }}
              >
                {f}
              </Tag>
            ))
          ) : (
            <span style={{ color: '#bbb' }}>-</span>
          )}
        </Space>
      ),
    },
    {
      title: '当前状态',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      width: 100,
      render: (status: Patient['currentStatus']) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '复诊安排',
      dataIndex: 'nextVisitDate',
      key: 'nextVisitDate',
      width: 220,
      render: (date: string, record) => {
        if (!date || record.currentStatus === 'hospitalized') {
          return <span style={{ color: '#bbb' }}>-</span>;
        }
        const isOverdue = dayjs(date).isBefore(dayjs(), 'day');
        const isSoon = dayjs(date).diff(dayjs(), 'day') <= 3 && !isOverdue;
        return (
          <div>
            <div
              style={{
                color: isOverdue ? '#f5222d' : isSoon ? '#fa8c16' : '#262626',
                fontWeight: isOverdue || isSoon ? 600 : 500,
                marginBottom: 4,
              }}
            >
              <CalendarOutlined style={{ marginRight: 4, fontSize: 12 }} />
              {date}
              {isOverdue && <span style={{ marginLeft: 4 }}>（已过期）</span>}
            </div>
            {record.nextVisitTypes && record.nextVisitTypes.length > 0 && (
              <div style={{ fontSize: 12, color: '#595959', marginBottom: 2 }}>
                <span style={{ color: '#8c8c8c' }}>类型：</span>
                {record.nextVisitTypes.join('、')}
              </div>
            )}
            {record.nextVisitItems && record.nextVisitItems.length > 0 && (
              <div style={{ fontSize: 12, color: '#595959' }}>
                <span style={{ color: '#8c8c8c' }}>项目：</span>
                {record.nextVisitItems.slice(0, 2).join('、')}
                {record.nextVisitItems.length > 2 && ` +${record.nextVisitItems.length - 2}项`}
              </div>
            )}
            {record.appliedTemplateName && (
              <Tag color="blue" style={{ marginTop: 4, padding: '0 6px', fontSize: 11 }}>
                模板：{record.appliedTemplateName}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: '主管医生',
      dataIndex: 'attendingDoctor',
      key: 'attendingDoctor',
      width: 100,
    },
    {
      title: '重点病例',
      key: 'isKeyCase',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={record.isKeyCase ? '取消重点病例' : '标记为重点病例'}>
          <Button
            type="text"
            icon={
              record.isKeyCase ? (
                <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
              ) : (
                <StarOutlined style={{ fontSize: 18, color: '#d9d9d9' }} />
              )
            }
            onClick={() => handleToggleKeyCase(record)}
            style={{ padding: 0 }}
          />
        </Tooltip>
      ),
    },
    {
      title: '紧急标识',
      key: 'isUrgent',
      width: 90,
      align: 'center',
      render: (_, record) =>
        record.isUrgent ? (
          <span className="urgent-badge">紧急</span>
        ) : (
          <span style={{ color: '#d9d9d9' }}>—</span>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePatientClick(record.id)}>
            查看详情
          </Button>
          <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleOpenRiskModal(record)}>
            调整风险
          </Button>
          <Tooltip title="申请会诊">
            <Button
              type="link"
              size="small"
              icon={<TeamIcon />}
              onClick={() => {
                setPreFillConsultationPatient(record.id);
                setActiveWindow('consultation');
              }}
            >
              申请会诊
            </Button>
          </Tooltip>
          <Tooltip title="安排住院">
            <Button
              type="link"
              size="small"
              icon={<HomeOutlined />}
              onClick={() => {
                setPreFillHospitalizationPatient(record.id);
                setActiveWindow('consultation');
              }}
            >
              安排住院
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        {statCards.map((card, idx) => (
          <Col xs={24} sm={12} md={8} lg={idx === 0 ? 8 : 4} key={idx}>
            <Card
              onClick={card.onClick}
              className="stat-card"
              style={{
                borderLeft: `4px solid ${card.color}`,
                background: card.bgColor,
                borderColor: card.borderColor,
              }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ color: card.color }}>{card.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="stat-card-value" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="stat-card-label" style={{ fontWeight: 500 }}>
                    {card.title}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        style={{ borderRadius: 8 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Space size={12} wrap>
              <Search
                placeholder="搜索姓名、编号、电话"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                style={{ width: 260 }}
                value={patientSearchKeyword}
                onChange={(e) => setPatientSearchKeyword(e.target.value)}
                onSearch={setPatientSearchKeyword}
              />
              <Select
                value={patientRiskFilter}
                onChange={setPatientRiskFilter}
                style={{ width: 150 }}
                placeholder="风险等级"
                allowClear
              >
                <Option value="all">全部风险</Option>
                <Option value="green">低风险（绿色）</Option>
                <Option value="yellow">一般风险（黄色）</Option>
                <Option value="orange">较高风险（橙色）</Option>
                <Option value="red">高风险（红色）</Option>
              </Select>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 130 }}
                placeholder="患者状态"
                allowClear
              >
                <Option value="all">全部状态</Option>
                <Option value="antenatal">门诊</Option>
                <Option value="hospitalized">住院中</Option>
                <Option value="discharged">已出院</Option>
                <Option value="postpartum">产后</Option>
              </Select>
              <Select
                value={urgentFilter === null ? undefined : urgentFilter}
                onChange={(val) => setUrgentFilter(val === undefined ? null : val)}
                style={{ width: 130 }}
                placeholder="紧急标识"
                allowClear
              >
                <Option value={true}>紧急</Option>
                <Option value={false}>非紧急</Option>
              </Select>
              {selectedRowKeys.length > 0 && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  已选 {selectedRowKeys.length} 人
                </Tag>
              )}
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" icon={<PlusOutlined />}>
                新增患者
              </Button>
              <Button icon={<ExportOutlined />}>导出</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8, padding: 0 }} bodyStyle={{ padding: 0 }}>
        <Table<Patient>
          rowKey="id"
          className="patient-list-table"
          columns={columns}
          dataSource={filteredPatients}
          rowSelection={rowSelection}
          rowClassName={(record) =>
            record.id === selectedPatientId ? 'selected-row' : ''
          }
          onRow={(record) => ({
            onClick: () => {
              selectPatient(record.id);
            },
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 1600 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSize: 10,
          }}
        />
      </Card>

      <Modal
        title="调整风险等级"
        open={riskModalVisible}
        onOk={handleRiskAdjustSubmit}
        onCancel={() => setRiskModalVisible(false)}
        okText="确认调整"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        {currentRiskPatient && (
          <Form form={form} layout="vertical">
            <Alert
              message={
                <Space>
                  <span>患者：</span>
                  <strong>{currentRiskPatient.name}</strong>
                  <span style={{ color: '#999' }}>({currentRiskPatient.id})</span>
                </Space>
              }
              description={
                <Space>
                  <span>当前风险级别：</span>
                  <Tag
                    color={currentRiskPatient.riskLevel}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    {riskLevelLabels[currentRiskPatient.riskLevel]}
                  </Tag>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Form.Item label="新风险级别" required style={{ marginBottom: 16 }}>
              <Radio.Group
                value={newRiskLevel}
                onChange={(e) => setNewRiskLevel(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {(['green', 'yellow', 'orange', 'red'] as RiskLevel[]).map((level) => (
                    <Radio
                      key={level}
                      value={level}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        border: `1px solid ${riskLevelColors[level]}40`,
                        borderRadius: 6,
                        background: level === newRiskLevel ? `${riskLevelColors[level]}10` : undefined,
                        marginRight: 0,
                        height: 'auto',
                      }}
                    >
                      <Space style={{ flex: 1 }}>
                        <Tag
                          color={level}
                          style={{
                            padding: '2px 10px',
                            borderRadius: 10,
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          {riskLevelLabels[level]}
                        </Tag>
                      </Space>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Alert
              message={
                <Space>
                  <BulbOutlined />
                  <strong>参考调整建议</strong>
                </Space>
              }
              description={getRiskSuggestion(currentRiskPatient, newRiskLevel)}
              type={newRiskLevel === 'red' ? 'error' : newRiskLevel === 'orange' ? 'warning' : 'info'}
              showIcon={false}
              style={{ marginBottom: 16 }}
            />

            <Form.Item
              name="reason"
              label="调整原因"
              rules={[{ required: true, message: '请填写调整原因' }]}
              style={{ marginBottom: 0 }}
            >
              <TextArea
                rows={4}
                placeholder="请详细说明调整风险等级的原因，包括病情变化、检查结果、治疗措施等..."
                value={riskAdjustReason}
                onChange={(e) => setRiskAdjustReason(e.target.value)}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <style>{`
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

export default Patients;
