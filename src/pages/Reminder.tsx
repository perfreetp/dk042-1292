import React, { useMemo, useState } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Tag,
  Button,
  Space,
  Tabs,
  Badge,
  Empty,
  Typography,
  Divider,
} from 'antd';
import {
  CalendarOutlined,
  MessageOutlined,
  MedicineBoxOutlined,
  ToolOutlined,
  FileTextOutlined,
  BellOutlined,
  ArrowRightOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import type { WorkReminder, ReminderType } from '../types';

const { Title, Text } = Typography;

const typeConfig: Record<ReminderType, { label: string; icon: React.ReactNode; color: string }> = {
  visit: { label: '复诊提醒', icon: <CalendarOutlined />, color: '#1890ff' },
  consultation: { label: '会诊待办', icon: <MessageOutlined />, color: '#722ed1' },
  hospital: { label: '待入院', icon: <MedicineBoxOutlined />, color: '#f5222d' },
  qc: { label: '质控整改', icon: <ToolOutlined />, color: '#fa8c16' },
  shift: { label: '交班待办', icon: <FileTextOutlined />, color: '#13c2c2' },
};

const Reminder: React.FC = () => {
  const {
    getWorkReminders,
    selectPatient,
    setActiveWindow,
    setPreFillConsultationPatient,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<string>('all');

  const allReminders = useMemo(() => getWorkReminders(), [getWorkReminders]);

  const filteredReminders = useMemo(() => {
    if (activeTab === 'all') return allReminders;
    if (activeTab === 'high') return allReminders.filter((r) => r.urgency === 'high');
    return allReminders.filter((r) => r.type === activeTab);
  }, [allReminders, activeTab]);

  const stats = useMemo(() => {
    return {
      all: allReminders.length,
      high: allReminders.filter((r) => r.urgency === 'high').length,
      visit: allReminders.filter((r) => r.type === 'visit').length,
      consultation: allReminders.filter((r) => r.type === 'consultation').length,
      hospital: allReminders.filter((r) => r.type === 'hospital').length,
      qc: allReminders.filter((r) => r.type === 'qc').length,
      shift: allReminders.filter((r) => r.type === 'shift').length,
    };
  }, [allReminders]);

  const handleReminderClick = (reminder: WorkReminder) => {
    switch (reminder.type) {
      case 'visit':
        if (reminder.patientId) {
          selectPatient(reminder.patientId);
        }
        break;
      case 'consultation':
        setActiveWindow('consultation');
        break;
      case 'hospital':
        setActiveWindow('consultation');
        break;
      case 'qc':
        setActiveWindow('qc');
        break;
      case 'shift':
        setActiveWindow('shift');
        break;
    }
  };

  const renderReminderItem = (reminder: WorkReminder) => {
    const config = typeConfig[reminder.type];
    const urgencyColors = { high: '#f5222d', medium: '#fa8c16', low: '#52c41a' };
    const urgencyLabels = { high: '紧急', medium: '重要', low: '普通' };

    return (
      <List.Item
        key={reminder.id}
        onClick={() => handleReminderClick(reminder)}
        style={{
          cursor: 'pointer',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 8,
          border: '1px solid #f0f0f0',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = '#d9d9d9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#f0f0f0';
        }}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `${config.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: config.color,
              }}
            >
              {config.icon}
            </div>
          }
          title={
            <Space>
              <Text strong style={{ fontSize: 15, color: '#262626' }}>
                {reminder.title}
              </Text>
              <Tag
                color={urgencyColors[reminder.urgency]}
                style={{
                  margin: 0,
                  fontSize: 11,
                  padding: '0 6px',
                  height: 20,
                  lineHeight: '18px',
                }}
              >
                {urgencyLabels[reminder.urgency]}
              </Tag>
              {reminder.patientName && (
                <Tag icon={<UserOutlined />} style={{ margin: 0, fontSize: 11 }}>
                  {reminder.patientName}
                </Tag>
              )}
            </Space>
          }
          description={
            <div style={{ marginTop: 4 }}>
              <div style={{ color: '#595959', fontSize: 13, marginBottom: 4 }}>
                {reminder.subtitle}
              </div>
              {reminder.deadline && (
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {reminder.deadline}
                </div>
              )}
            </div>
          }
        />
        <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
      </List.Item>
    );
  };

  const tabItems = [
    { key: 'all', label: `全部 (${stats.all})` },
    { key: 'high', label: `紧急 (${stats.high})` },
    { key: 'visit', label: `复诊 (${stats.visit})` },
    { key: 'consultation', label: `会诊 (${stats.consultation})` },
    { key: 'hospital', label: `入院 (${stats.hospital})` },
    { key: 'qc', label: `质控 (${stats.qc})` },
    { key: 'shift', label: `交班 (${stats.shift})` },
  ];

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Space align="center">
          <BellOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            医生工作提醒
          </Title>
          {stats.high > 0 && (
            <Badge count={stats.high} size="small" style={{ marginLeft: 8 }} />
          )}
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          集中展示待处理事项，点击可跳转到对应详情
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #1890ff' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>
              {stats.visit}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              复诊提醒
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #722ed1' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>
              {stats.consultation}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              待回复会诊
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #f5222d' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f5222d' }}>
              {stats.hospital}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              待入院建议
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #fa8c16' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fa8c16' }}>
              {stats.qc}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              待整改质控
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #13c2c2' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#13c2c2' }}>
              {stats.shift}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              交班待办
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #f5222d' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f5222d' }}>
              {stats.high}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              紧急事项
            </div>
          </Card>
        </Col>
      </Row>

      <Card size="small">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="small"
        />
        <Divider style={{ margin: '8px 0 16px 0' }} />

        {filteredReminders.length > 0 ? (
          <List
            dataSource={filteredReminders}
            renderItem={renderReminderItem}
            split={false}
            style={{ padding: '0 8px' }}
          />
        ) : (
          <Empty description="暂无待办事项" style={{ padding: '40px 0' }} />
        )}
      </Card>
    </div>
  );
};

export default Reminder;
