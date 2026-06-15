import React, { useState, useMemo } from 'react';
import {
  Layout,
  Card,
  List,
  Timeline,
  Tag,
  Alert,
  Drawer,
  Modal,
  Form,
  DatePicker,
  Radio,
  Select,
  Checkbox,
  Segmented,
  Transfer,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Typography,
  Badge,
  Input,
  Tooltip,
  Empty,
  message,
  Avatar,
} from 'antd';
import {
  SwapOutlined,
  UserOutlined,
  TeamOutlined,
  WarningOutlined,
  StarFilled,
  StarOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
  FileTextOutlined,
  MinusCircleOutlined,
  EyeOutlined,
  UserAddOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useAppStore } from '../store/appStore';
import { riskLevelColors, riskLevelLabels } from '../data/mockData';
import type { ShiftRecord, ShiftPatient, Patient, RiskLevel } from '../types';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type ShiftType = 'morning' | 'afternoon' | 'night';

const shiftTypeLabels: Record<ShiftType, string> = {
  morning: '早班',
  afternoon: '中班',
  night: '晚班',
};

const shiftTypeColors: Record<ShiftType, string> = {
  morning: 'blue',
  afternoon: 'green',
  night: 'red',
};

const shiftTypeBgColors: Record<ShiftType, string> = {
  morning: '#e6f7ff',
  afternoon: '#f6ffed',
  night: '#fff1f0',
};

const shiftTypeBorderColors: Record<ShiftType, string> = {
  morning: '#91d5ff',
  afternoon: '#b7eb8f',
  night: '#ffa39e',
};

interface SelectedPatientWithNotes {
  patientId: string;
  keyPoints: string[];
  pendingTasks: string[];
  isKeyCase: boolean;
}

interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
}

const Shift: React.FC = () => {
  const {
    shiftRecords,
    patients,
    addShiftRecord,
    selectPatient,
    markKeyCase,
    setActiveWindow,
  } = useAppStore();

  const [shiftFilter, setShiftFilter] = useState<ShiftType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedPatients, setSelectedPatients] = useState<SelectedPatientWithNotes[]>([]);
  const [transferTargetKeys, setTransferTargetKeys] = useState<string[]>([]);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [todoInput, setTodoInput] = useState('');
  const [taskChecked, setTaskChecked] = useState<Record<string, boolean>>({});

  const today = dayjs().format('YYYY-MM-DD');

  const todayShiftCount = useMemo(() => {
    return shiftRecords.filter((s) => s.shiftDate === today).length;
  }, [shiftRecords, today]);

  const highRiskCount = useMemo(() => {
    return patients.filter((p) => p.riskLevel === 'orange' || p.riskLevel === 'red').length;
  }, [patients]);

  const keyCaseCount = useMemo(() => {
    return patients.filter((p) => p.isKeyCase).length;
  }, [patients]);

  const filteredShifts = useMemo(() => {
    return shiftRecords.filter((s) => {
      if (shiftFilter !== 'all' && s.shiftType !== shiftFilter) {
        return false;
      }
      if (dateFilter && s.shiftDate !== dateFilter.format('YYYY-MM-DD')) {
        return false;
      }
      return true;
    });
  }, [shiftRecords, shiftFilter, dateFilter]);

  const selectedShift = useMemo(() => {
    return shiftRecords.find((s) => s.id === selectedShiftId) || null;
  }, [shiftRecords, selectedShiftId]);

  const allKeyCases = useMemo(() => {
    return patients.filter((p) => p.isKeyCase);
  }, [patients]);

  const transferDataSource = useMemo(() => {
    return patients.map((p) => ({
      key: p.id,
      title: `${p.name}（${p.gestationalWeeks}+${p.gestationalDays}周）`,
      description: `${p.id} · ${riskLevelLabels[p.riskLevel].replace(/（.*?）/g, '')}`,
      riskLevel: p.riskLevel,
    }));
  }, [patients]);

  const handleShiftClick = (shiftId: string) => {
    setSelectedShiftId(shiftId);
  };

  const handlePatientClick = (patientId: string) => {
    selectPatient(patientId);
    setActiveWindow('detail');
  };

  const handleToggleKeyCase = (patientId: string, isKey: boolean) => {
    markKeyCase(patientId, isKey);
    message.success(isKey ? '已标记为重点病例' : '已取消重点病例标记');
  };

  const handleOpenCreateModal = () => {
    form.resetFields();
    setSelectedPatients([]);
    setTransferTargetKeys([]);
    setTodoList([]);
    setTodoInput('');
    form.setFieldsValue({
      shiftDate: dayjs(),
      shiftType: 'morning',
      handoverDoctor: '张医生',
    });
    setCreateModalVisible(true);
  };

  const handleTransferChange = (targetKeys: React.Key[]) => {
    const stringKeys = targetKeys.map(String);
    setTransferTargetKeys(stringKeys);
    const newSelected: SelectedPatientWithNotes[] = stringKeys.map((key) => {
      const existing = selectedPatients.find((sp) => sp.patientId === key);
      return (
        existing || {
          patientId: key,
          keyPoints: [],
          pendingTasks: [],
          isKeyCase: false,
        }
      );
    });
    setSelectedPatients(newSelected);
  };

  const handlePatientNoteChange = (
    patientId: string,
    field: 'keyPoints' | 'pendingTasks',
    value: string
  ) => {
    setSelectedPatients((prev) =>
      prev.map((sp) =>
        sp.patientId === patientId
          ? {
              ...sp,
              [field]: value.split('\n').filter((s) => s.trim()),
            }
          : sp
      )
    );
  };

  const handlePatientKeyCaseToggle = (patientId: string, isKey: boolean) => {
    setSelectedPatients((prev) =>
      prev.map((sp) => (sp.patientId === patientId ? { ...sp, isKeyCase: isKey } : sp))
    );
  };

  const handleAddTodo = () => {
    if (!todoInput.trim()) {
      return;
    }
    setTodoList((prev) => [
      ...prev,
      { id: `todo-${Date.now()}`, content: todoInput.trim(), completed: false },
    ]);
    setTodoInput('');
  };

  const handleRemoveTodo = (id: string) => {
    setTodoList((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedPatients.length === 0) {
        message.warning('请至少选择一位在管患者');
        return;
      }

      const patientsOnDuty: ShiftPatient[] = selectedPatients.map((sp) => {
        const patient = patients.find((p) => p.id === sp.patientId);
        return {
          patientId: sp.patientId,
          patientName: patient?.name || '',
          bedNumber: `${Math.floor(Math.random() * 20) + 1}床`,
          riskLevel: (patient?.riskLevel || 'green') as RiskLevel,
          diagnosis: patient?.riskFactors.join('，') || '',
          keyPoints: sp.keyPoints,
          pendingTasks: sp.pendingTasks,
          isKeyCase: sp.isKeyCase,
        };
      });

      const newShift: ShiftRecord = {
        id: `S${Date.now()}`,
        shiftType: values.shiftType,
        shiftDate: values.shiftDate.format('YYYY-MM-DD'),
        handoverDoctor: values.handoverDoctor || '张医生',
        takeoverDoctor: values.takeoverDoctor,
        patientsOnDuty,
        keyReminders: todoList.map((t) => t.content),
        generalStatus: values.generalStatus || '',
        equipmentStatus: values.equipmentStatus || '',
        createTime: new Date().toLocaleString('zh-CN'),
      };

      addShiftRecord(newShift);
      message.success('交班记录创建成功');
      setCreateModalVisible(false);
      setSelectedShiftId(newShift.id);
    } catch {
      // validation error
    }
  };

  const handleToggleTask = (taskKey: string) => {
    setTaskChecked((prev) => ({ ...prev, [taskKey]: !prev[taskKey] }));
  };

  const getPatientById = (patientId: string): Patient | undefined => {
    return patients.find((p) => p.id === patientId);
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    color: string,
    bgColor: string,
    borderColor: string
  ) => (
    <Card
      className="stat-card"
      style={{
        borderLeft: `4px solid ${color}`,
        background: bgColor,
        borderColor,
        padding: '8px 12px',
      }}
      bodyStyle={{ padding: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color, fontSize: 28 }}>{icon}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div className="stat-card-value stat-number" style={{ color, fontSize: 24 }}>
            {value}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', fontWeight: 500 }}>{title}</div>
        </div>
      </div>
    </Card>
  );

  const renderShiftCard = (shift: ShiftRecord) => {
    const isSelected = shift.id === selectedShiftId;
    const keyCaseNum = shift.patientsOnDuty.filter((p) => p.isKeyCase).length;

    return (
      <Card
        key={shift.id}
        onClick={() => handleShiftClick(shift.id)}
        hoverable
        style={{
          marginBottom: 12,
          border: isSelected ? `2px solid #1890ff` : `2px solid transparent`,
          background: isSelected ? '#e6f7ff' : '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderRadius: 8,
        }}
        bodyStyle={{ padding: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <Space>
            <Tag
              color={shiftTypeColors[shift.shiftType]}
              style={{
                padding: '4px 12px',
                borderRadius: 10,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {shiftTypeLabels[shift.shiftType]}
            </Tag>
            {keyCaseNum > 0 && (
              <Badge count={`重点${keyCaseNum}`} style={{ backgroundColor: '#f5222d' }} />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {shift.createTime.split(' ')[1]?.substring(0, 5) || shift.createTime}
          </Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 13 }}>
            <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {shift.shiftDate}
          </Text>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
            padding: '8px 12px',
            background: shiftTypeBgColors[shift.shiftType],
            borderRadius: 6,
            borderLeft: `3px solid ${shiftTypeBorderColors[shift.shiftType]}`,
          }}
        >
          <Space size={4}>
            <Avatar size={22} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <Text strong style={{ fontSize: 13 }}>{shift.handoverDoctor}</Text>
          </Space>
          <ArrowRightOutlined style={{ color: '#999', fontSize: 12 }} />
          <Space size={4}>
            <Avatar size={22} icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
            <Text strong style={{ fontSize: 13 }}>{shift.takeoverDoctor}</Text>
          </Space>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <Space>
            <Tag color="blue" style={{ margin: 0 }}>
              <TeamOutlined style={{ marginRight: 4 }} />
              {shift.patientsOnDuty.length}人
            </Tag>
          </Space>
          {shift.keyReminders.length > 0 && (
            <Text type="warning" style={{ fontSize: 12 }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              {shift.keyReminders.length}条提醒
            </Text>
          )}
        </div>
      </Card>
    );
  };

  const renderPatientCard = (sp: ShiftPatient) => {
    const patient = getPatientById(sp.patientId);
    const riskColor = riskLevelColors[sp.riskLevel];

    return (
      <Card
        key={sp.patientId}
        size="small"
        style={{
          marginBottom: 10,
          borderRadius: 8,
          borderLeft: `4px solid ${riskColor}`,
        }}
        bodyStyle={{ padding: 12 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            cursor: 'pointer',
          }}
          onClick={() => handlePatientClick(sp.patientId)}
        >
          <Space>
            <Text strong style={{ fontSize: 14 }}>
              {sp.bedNumber} · {sp.patientName}
            </Text>
            {patient && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {patient.gestationalWeeks}+{patient.gestationalDays}周
              </Text>
            )}
            <Tooltip title={sp.isKeyCase ? '重点病例' : ''}>
              {sp.isKeyCase ? (
                <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
              ) : (
                <StarOutlined style={{ color: '#d9d9d9', fontSize: 16 }} />
              )}
            </Tooltip>
          </Space>
          <Space size={8}>
            <Tag
              color={sp.riskLevel}
              style={{
                padding: '2px 8px',
                borderRadius: 8,
                fontWeight: 600,
                margin: 0,
                fontSize: 11,
              }}
            >
              {riskLevelLabels[sp.riskLevel].replace(/（.*?）/g, '')}
            </Tag>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handlePatientClick(sp.patientId);
              }}
            />
          </Space>
        </div>

        <Paragraph
          type="secondary"
          style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}
          ellipsis={{ rows: 1 }}
        >
          {sp.diagnosis || '暂无诊断信息'}
        </Paragraph>

        {sp.keyPoints.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
              <FileTextOutlined style={{ marginRight: 4 }} />
              关键要点：
            </Text>
            <Space size={[4, 4]} wrap style={{ marginTop: 4, marginLeft: 4 }}>
              {sp.keyPoints.slice(0, 3).map((kp, idx) => (
                <Tag
                  key={idx}
                  style={{
                    background: '#f0f5ff',
                    color: '#1d39c4',
                    border: '1px solid #d6e4ff',
                    borderRadius: 8,
                    fontSize: 11,
                    padding: '1px 8px',
                    margin: 0,
                  }}
                >
                  {kp.length > 20 ? kp.substring(0, 20) + '...' : kp}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {sp.pendingTasks.length > 0 && (
          <div
            style={{
              background: '#fffbe6',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #ffe58f',
            }}
          >
            <Text type="warning" style={{ fontSize: 11, fontWeight: 600 }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              待完成（{sp.pendingTasks.length}）：
            </Text>
            <div style={{ marginTop: 4 }}>
              {sp.pendingTasks.slice(0, 2).map((task, idx) => {
                const taskKey = `${sp.patientId}-${idx}`;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '2px 0',
                    }}
                  >
                    <Checkbox
                      checked={!!taskChecked[taskKey]}
                      onChange={() => handleToggleTask(taskKey)}
                      style={{ fontSize: 11 }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: taskChecked[taskKey] ? '#bbb' : '#666',
                          textDecoration: taskChecked[taskKey] ? 'line-through' : 'none',
                        }}
                      >
                        {task.length > 30 ? task.substring(0, 30) + '...' : task}
                      </span>
                    </Checkbox>
                  </div>
                );
              })}
              {sp.pendingTasks.length > 2 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  ...还有 {sp.pendingTasks.length - 2} 项
                </Text>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderKeyCaseCard = (patient: Patient) => {
    const riskColor = riskLevelColors[patient.riskLevel];

    return (
      <Tooltip
        key={patient.id}
        title={
          <div style={{ maxWidth: 300 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{patient.name} 摘要</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              <div>孕周：{patient.gestationalWeeks}+{patient.gestationalDays}周</div>
              <div>预产期：{patient.dueDate}</div>
              <div>高危因素：{patient.riskFactors.join('、') || '无'}</div>
              <div>主管医生：{patient.attendingDoctor}</div>
            </div>
          </div>
        }
      >
        <Card
          size="small"
          style={{
            marginBottom: 8,
            borderRadius: 8,
            cursor: 'pointer',
            border: `1px solid ${riskColor}60`,
            background: `${riskColor}08`,
          }}
          bodyStyle={{ padding: 10 }}
          onClick={() => handlePatientClick(patient.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <StarFilled style={{ color: '#faad14' }} />
              <Text strong style={{ fontSize: 13 }}>{patient.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {patient.gestationalWeeks}+{patient.gestationalDays}周
              </Text>
              <Tag
                color={patient.riskLevel}
                style={{
                  padding: '1px 8px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 11,
                  margin: 0,
                }}
              >
                {riskLevelLabels[patient.riskLevel].replace(/（.*?）/g, '')}
              </Tag>
            </Space>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#666' }}>
            <Text type="secondary">重点原因：</Text>
            {patient.riskFactors.slice(0, 2).join('、') || '待评估'}
            {patient.riskFactors.length > 2 && ` 等${patient.riskFactors.length}项`}
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
            主治：{patient.attendingDoctor}
          </div>
        </Card>
      </Tooltip>
    );
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
        <div
          style={{
            width: '40%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 0,
          }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={8}>
              {renderStatCard(
                '今日交班次数',
                todayShiftCount,
                <SwapOutlined />,
                '#1890ff',
                '#e6f7ff',
                '#91d5ff'
              )}
            </Col>
            <Col xs={8}>
              {renderStatCard(
                '在管高危患者',
                highRiskCount,
                <WarningOutlined />,
                '#f5222d',
                '#fff1f0',
                '#ffa39e'
              )}
            </Col>
            <Col xs={8}>
              {renderStatCard(
                '今日重点病例',
                keyCaseCount,
                <StarFilled />,
                '#faad14',
                '#fffbe6',
                '#ffe58f'
              )}
            </Col>
          </Row>

          <Card
            style={{ borderRadius: 8 }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Row gutter={[12, 12]} align="middle" justify="space-between">
              <Col xs={24} md={14}>
                <Space size={12} wrap>
                  <Segmented
                    value={shiftFilter}
                    onChange={(val) => setShiftFilter(val as ShiftType | 'all')}
                    options={[
                      { label: '全部', value: 'all' },
                      { label: '早班', value: 'morning' },
                      { label: '中班', value: 'afternoon' },
                      { label: '晚班', value: 'night' },
                    ]}
                  />
                  <DatePicker
                    value={dateFilter}
                    onChange={(date) => setDateFilter(date)}
                    placeholder="选择日期"
                    allowClear
                  />
                </Space>
              </Col>
              <Col xs={24} md={10} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenCreateModal}
                  size="middle"
                >
                  创建交班记录
                </Button>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <SwapOutlined style={{ color: '#1890ff' }} />
                <span>交班记录列表</span>
                <Tag color="blue" style={{ marginLeft: 8 }}>{filteredShifts.length}</Tag>
              </Space>
            }
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 8 }}
            bodyStyle={{ padding: 12, flex: 1, overflowY: 'auto' }}
            extra={
              <Button
                type="text"
                size="small"
                onClick={() => {
                  setShiftFilter('all');
                  setDateFilter(null);
                }}
              >
                重置筛选
              </Button>
            }
          >
            {filteredShifts.length > 0 ? (
              filteredShifts.map(renderShiftCard)
            ) : (
              <Empty
                description="暂无交班记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '40px 0' }}
              />
            )}
          </Card>
        </div>

        <div
          style={{
            width: '60%',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 0,
          }}
        >
          {selectedShift ? (
            <Card
              title={
                <Space>
                  <Tag
                    color={shiftTypeColors[selectedShift.shiftType]}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 10,
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {shiftTypeLabels[selectedShift.shiftType]}
                  </Tag>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>交班详情</span>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {selectedShift.shiftDate}
                  </Text>
                </Space>
              }
              style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 8 }}
              bodyStyle={{ padding: 0, flex: 1, overflowY: 'auto' }}
              extra={
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    创建时间：{selectedShift.createTime}
                  </Text>
                </Space>
              }
            >
              <div style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    padding: '12px 16px',
                    background: shiftTypeBgColors[selectedShift.shiftType],
                    borderRadius: 8,
                    marginBottom: 16,
                    border: `1px solid ${shiftTypeBorderColors[selectedShift.shiftType]}`,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <Avatar size={44} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginBottom: 4 }} />
                    <div>
                      <Text strong>{selectedShift.handoverDoctor}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>交班医生</Text>
                  </div>
                  <div style={{ color: '#999', fontSize: 20, padding: '0 12px' }}>
                    <ArrowRightOutlined />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar size={44} icon={<UserAddOutlined />} style={{ backgroundColor: '#52c41a', marginBottom: 4 }} />
                    <div>
                      <Text strong>{selectedShift.takeoverDoctor}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>接班医生</Text>
                  </div>
                  <Divider type="vertical" style={{ height: 50 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>交班日期</Text>
                        <div style={{ fontWeight: 600 }}>{selectedShift.shiftDate}</div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>在管患者</Text>
                        <div style={{ fontWeight: 600, color: '#1890ff' }}>
                          {selectedShift.patientsOnDuty.length} 人
                        </div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>重点病例</Text>
                        <div style={{ fontWeight: 600, color: '#f5222d' }}>
                          {selectedShift.patientsOnDuty.filter((p) => p.isKeyCase).length} 人
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section" style={{ marginBottom: 16 }}>
                  <div className="detail-section-header">
                    <div className="detail-section-title">
                      <TeamOutlined style={{ color: '#1890ff' }} />
                      在管患者清单
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {selectedShift.patientsOnDuty.length} 位
                      </Tag>
                    </div>
                  </div>
                  {selectedShift.patientsOnDuty.length > 0 ? (
                    selectedShift.patientsOnDuty.map(renderPatientCard)
                  ) : (
                    <Empty
                      description="暂无在管患者"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>

                {selectedShift.keyReminders.length > 0 && (
                  <div className="detail-section" style={{ marginBottom: 16 }}>
                    <div className="detail-section-header">
                      <div className="detail-section-title">
                        <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
                        重点病例提醒
                      </div>
                    </div>
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      {selectedShift.keyReminders.map((reminder, idx) => (
                        <Alert
                          key={idx}
                          message={reminder}
                          type="error"
                          showIcon
                          style={{ borderRadius: 6 }}
                        />
                      ))}
                    </Space>
                  </div>
                )}

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} md={12}>
                    <Card
                      size="small"
                      title={
                        <Space size={6}>
                          <SafetyOutlined style={{ color: '#52c41a' }} />
                          <span style={{ fontSize: 14 }}>科室整体情况</span>
                        </Space>
                      }
                      style={{ borderRadius: 8 }}
                    >
                      <TextArea
                        value={selectedShift.generalStatus}
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        readOnly
                        style={{ background: '#fafafa', border: 'none', resize: 'none' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card
                      size="small"
                      title={
                        <Space size={6}>
                          <MedicineBoxOutlined style={{ color: '#722ed1' }} />
                          <span style={{ fontSize: 14 }}>设备药品状态</span>
                        </Space>
                      }
                      style={{ borderRadius: 8 }}
                    >
                      <TextArea
                        value={selectedShift.equipmentStatus}
                        autoSize={{ minRows: 4, maxRows: 6 }}
                        readOnly
                        style={{ background: '#fafafa', border: 'none', resize: 'none' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <div className="detail-section" style={{ marginBottom: 16 }}>
                  <div className="detail-section-header">
                    <div className="detail-section-title">
                      <SettingOutlined style={{ color: '#fa8c16' }} />
                      遗留问题与待办
                    </div>
                  </div>
                  <Timeline
                    items={[
                      {
                        color: 'blue',
                        dot: <ClockCircleOutlined />,
                        children: (
                          <div>
                            <Text strong>继续跟进事项</Text>
                            <div style={{ marginTop: 6 }}>
                              {selectedShift.patientsOnDuty
                                .filter((p) => p.pendingTasks.length > 0)
                                .slice(0, 3)
                                .map((p) => (
                                  <div key={p.patientId} style={{ padding: '4px 0' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      [{p.patientName}]
                                    </Text>{' '}
                                    <span style={{ fontSize: 12 }}>
                                      {p.pendingTasks[0]}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ),
                      },
                      {
                        color: 'orange',
                        dot: <ExclamationCircleOutlined />,
                        children: (
                          <div>
                            <Text strong>需关注的重点</Text>
                            <div style={{ marginTop: 6 }}>
                              <span style={{ fontSize: 12, color: '#666' }}>
                                共 {selectedShift.patientsOnDuty.filter((p) => p.isKeyCase).length} 位重点病例
                                需要接班后优先查看
                              </span>
                            </div>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        dot: <CheckCircleOutlined />,
                        children: (
                          <div>
                            <Text strong>已完成事项</Text>
                            <div style={{ marginTop: 6 }}>
                              <span style={{ fontSize: 12, color: '#666' }}>
                                本班次交班记录已完整记录
                              </span>
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <Card
              style={{ flex: 1, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              bodyStyle={{ flex: 1 }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                      选择左侧交班记录查看详情
                    </div>
                    <div style={{ fontSize: 13, color: '#999' }}>
                      或点击「创建交班记录」开始新的交接班
                    </div>
                  </div>
                }
              />
            </Card>
          )}

          <Card
            title={
              <Space>
                <StarFilled style={{ color: '#faad14' }} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>重点病例提醒</span>
                <Badge
                  count={allKeyCases.length}
                  style={{ backgroundColor: '#f5222d', marginLeft: 8 }}
                  showZero
                />
              </Space>
            }
            size="small"
            style={{ borderRadius: 8, maxHeight: 240 }}
            bodyStyle={{ padding: 12, maxHeight: 180, overflowY: 'auto' }}
            extra={
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setActiveWindow('patients')}
              >
                查看全部
              </Button>
            }
          >
            {allKeyCases.length > 0 ? (
              <Row gutter={[12, 12]}>
                {allKeyCases.map((patient) => (
                  <Col xs={24} md={12} key={patient.id}>
                    {renderKeyCaseCard(patient)}
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty
                description="暂无重点病例"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '12px 0' }}
              />
            )}
          </Card>
        </div>
      </div>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontSize: 16 }}>创建交班记录</span>
          </Space>
        }
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalVisible(false)}
        okText="提交交班记录"
        cancelText="取消"
        width={960}
        destroyOnClose
        okButtonProps={{ size: 'large' }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={6}>
              <Form.Item
                name="shiftType"
                label="班次类型"
                rules={[{ required: true, message: '请选择班次类型' }]}
              >
                <Radio.Group style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {(['morning', 'afternoon', 'night'] as ShiftType[]).map((type) => (
                      <Radio
                        key={type}
                        value={type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          border: `1px solid ${shiftTypeBorderColors[type]}`,
                          borderRadius: 6,
                          background: shiftTypeBgColors[type],
                          marginRight: 0,
                          height: 'auto',
                        }}
                      >
                        <Tag color={shiftTypeColors[type]} style={{ margin: 0 }}>
                          {shiftTypeLabels[type]}
                        </Tag>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="shiftDate"
                label="交班日期"
                rules={[{ required: true, message: '请选择交班日期' }]}
              >
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
              <Form.Item
                name="handoverDoctor"
                label="交班医生"
                initialValue="张医生"
              >
                <Select size="large" placeholder="请选择交班医生">
                  <Option value="张医生">张医生</Option>
                  <Option value="李主任">李主任</Option>
                  <Option value="陈医生">陈医生</Option>
                  <Option value="王医生">王医生</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="takeoverDoctor"
                label="接班医生"
                rules={[{ required: true, message: '请选择接班医生' }]}
              >
                <Select
                  size="large"
                  placeholder="请选择接班医生"
                  style={{ width: '100%' }}
                >
                  <Option value="李主任">李主任</Option>
                  <Option value="陈医生">陈医生</Option>
                  <Option value="王医生">王医生</Option>
                  <Option value="张医生">张医生</Option>
                  <Option value="刘医生">刘医生</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>
            <Space>
              <TeamOutlined style={{ color: '#1890ff' }} />
              在管患者选择
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                （已选 {selectedPatients.length} 人）
              </Text>
            </Space>
          </Divider>

          <Row gutter={[16, 0]}>
            <Col xs={24}>
              <Form.Item label="选择在管患者" required style={{ marginBottom: 12 }}>
                <Transfer
                  dataSource={transferDataSource}
                  targetKeys={transferTargetKeys}
                  onChange={handleTransferChange}
                  render={(item) => {
                    const rl = (item as { riskLevel: RiskLevel }).riskLevel;
                    return `${riskLevelLabels[rl].replace(/（.*?）/g, '')} | ${item.title}`;
                  }}
                  listStyle={{ width: '100%', height: 200 }}
                  titles={['可选患者', '已选患者']}
                  oneWay
                  showSearch
                  filterOption={(inputValue, item) =>
                    item.title.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                    item.description.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedPatients.length > 0 && (
            <div
              style={{
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ marginBottom: 12, fontWeight: 600 }}>
                已选患者详情录入：
              </div>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {selectedPatients.map((sp, idx) => {
                  const patient = getPatientById(sp.patientId);
                  return (
                    <div
                      key={sp.patientId}
                      style={{
                        background: '#fff',
                        border: `1px solid ${riskLevelColors[(patient?.riskLevel || 'green') as RiskLevel]}60`,
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <Space>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {idx + 1}. {patient?.name || sp.patientId}
                          </span>
                          {patient && (
                            <Tag
                              color={patient.riskLevel}
                              style={{ margin: 0 }}
                            >
                              {patient.gestationalWeeks}+{patient.gestationalDays}周
                            </Tag>
                          )}
                        </Space>
                        <Checkbox
                          checked={sp.isKeyCase}
                          onChange={(e) =>
                            handlePatientKeyCaseToggle(sp.patientId, e.target.checked)
                          }
                        >
                          <StarFilled style={{ color: '#faad14', marginRight: 4 }} />
                          标记为重点病例
                        </Checkbox>
                      </div>
                      <Row gutter={[12, 0]}>
                        <Col xs={24} md={12}>
                          <div style={{ marginBottom: 6 }}>
                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                              关键要点（每行一条）：
                            </Text>
                          </div>
                          <TextArea
                            rows={3}
                            placeholder={'例如：\n明日上午剖宫产\n备血8U\n胎心监护Q8h'}
                            value={sp.keyPoints.join('\n')}
                            onChange={(e) =>
                              handlePatientNoteChange(sp.patientId, 'keyPoints', e.target.value)
                            }
                            style={{ fontSize: 12 }}
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <div style={{ marginBottom: 6 }}>
                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>
                              待完成任务（每行一条）：
                            </Text>
                          </div>
                          <TextArea
                            rows={3}
                            placeholder={'例如：\n抽血查肝肾功能\n8:30 NST\n心内科会诊'}
                            value={sp.pendingTasks.join('\n')}
                            onChange={(e) =>
                              handlePatientNoteChange(sp.patientId, 'pendingTasks', e.target.value)
                            }
                            style={{ fontSize: 12 }}
                          />
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </Space>
            </div>
          )}

          <Divider orientation="left" orientationMargin={0}>
            <Space>
              <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
              待办事项与重点提醒
            </Space>
          </Divider>

          <div style={{ marginBottom: 16 }}>
            <Space.Compact style={{ width: '100%', marginBottom: 10 }}>
              <Input
                placeholder="添加待办事项或重点提醒..."
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                onPressEnter={handleAddTodo}
                size="large"
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTodo} size="large">
                添加
              </Button>
            </Space.Compact>

            {todoList.length > 0 && (
              <List
                size="small"
                bordered
                dataSource={todoList}
                renderItem={(item, idx) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => handleRemoveTodo(item.id)}
                      />,
                    ]}
                  >
                    <Space>
                      <Tag color="orange" style={{ margin: 0 }}>
                        提醒{idx + 1}
                      </Tag>
                      <span>{item.content}</span>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </div>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="generalStatus"
                label={
                  <Space>
                    <SafetyOutlined style={{ color: '#52c41a' }} />
                    科室整体情况备注
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="请描述科室整体情况：如在院人数、手术安排、夜间情况等..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="equipmentStatus"
                label={
                  <Space>
                    <MedicineBoxOutlined style={{ color: '#722ed1' }} />
                    设备药品情况
                  </Space>
                }
              >
                <TextArea
                  rows={4}
                  placeholder="请描述设备药品状态：如监护仪、抢救药品、新生儿设备等..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Shift;
