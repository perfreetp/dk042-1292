import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Space } from 'antd';
import {
  UserOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  SwapOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAppStore } from './store/appStore';
import Patients from './pages/Patients';
import Detail from './pages/Detail';
import Template from './pages/Template';
import Consultation from './pages/Consultation';
import Shift from './pages/Shift';
import QC from './pages/QC';
import Reminder from './pages/Reminder';

const { Header, Sider, Content } = Layout;

type ActiveWindow = 'patients' | 'detail' | 'template' | 'consultation' | 'shift' | 'qc' | 'reminder';

const App: React.FC = () => {
  const { activeWindow, setActiveWindow, consultations, patients, getWorkReminders } = useAppStore();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${weekDay} ${hours}:${minutes}:${seconds}`;
  };

  const pendingConsultations = consultations.filter((c) => c.status === 'pending').length;
  const highRiskPatients = patients.filter((p) => p.riskLevel === 'red' || p.riskLevel === 'orange').length;
  const allReminders = getWorkReminders();
  const highPriorityCount = allReminders.filter((r) => r.urgency === 'high').length;

  const menuItems = [
    {
      key: 'reminder',
      icon: <BellOutlined />,
      label: (
        <span>
          工作提醒
          {highPriorityCount > 0 && (
            <Badge
              count={highPriorityCount}
              size="small"
              style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
            />
          )}
        </span>
      ),
    },
    {
      key: 'patients',
      icon: <UsergroupAddOutlined />,
      label: (
        <span>
          患者列表
          {highRiskPatients > 0 && (
            <Badge
              count={highRiskPatients}
              size="small"
              style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }}
            />
          )}
        </span>
      ),
    },
    {
      key: 'detail',
      icon: <FileTextOutlined />,
      label: '病例详情',
    },
    {
      key: 'template',
      icon: <MedicineBoxOutlined />,
      label: '处置模板',
    },
    {
      key: 'consultation',
      icon: <TeamOutlined />,
      label: (
        <span>
          会诊中心
          {pendingConsultations > 0 && (
            <Badge
              count={pendingConsultations}
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </span>
      ),
    },
    {
      key: 'shift',
      icon: <SwapOutlined />,
      label: '交班看板',
    },
    {
      key: 'qc',
      icon: <BarChartOutlined />,
      label: '质控统计',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    setActiveWindow(key as ActiveWindow);
  };

  const doctorMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const renderContent = () => {
    switch (activeWindow) {
      case 'patients':
        return <Patients />;
      case 'detail':
        return <Detail />;
      case 'template':
        return <Template />;
      case 'consultation':
        return <Consultation />;
      case 'shift':
        return <Shift />;
      case 'qc':
        return <QC />;
      case 'reminder':
        return <Reminder />;
      default:
        return <Patients />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <MedicineBoxOutlined style={{ marginRight: 8, fontSize: 22, color: '#1890ff' }} />
          产科随访决策
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeWindow]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            height: 56,
            lineHeight: '56px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#001529' }}>
              县级医院产科医生桌面端随访决策工具
            </h2>
            <span style={{ color: '#666', fontSize: 14 }}>
              {formatDateTime(currentDateTime)}
            </span>
          </div>
          <Space size={24}>
            <Badge count={allReminders.length} size="small">
              <BellOutlined
                style={{ fontSize: 18, color: '#666', cursor: 'pointer' }}
                onClick={() => setActiveWindow('reminder')}
              />
            </Badge>
            <Dropdown menu={{ items: doctorMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                    张医生
                  </span>
                  <span style={{ fontSize: 12, color: '#999' }}>
                    产科 · 主治医师
                  </span>
                </Space>
                <DownOutlined style={{ fontSize: 10, color: '#999' }} />
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 56px - 32px)',
            borderRadius: 4,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
