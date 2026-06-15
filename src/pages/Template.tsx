import React, { useState, useMemo } from 'react';
import {
  Layout,
  Card,
  Input,
  Select,
  Tag,
  Collapse,
  Steps,
  Table,
  DatePicker,
  Checkbox,
  Modal,
  Button,
  Typography,
  List,
  Empty,
  Divider,
  message,
  Space,
  Row,
  Col,
  Alert,
  Form,
} from 'antd';
import {
  SearchOutlined,
  HeartOutlined,
  HeartFilled,
  PrinterOutlined,
  EditOutlined,
  SendOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { riskLevelLabels, riskLevelColors } from '../data/mockData';
import type { TreatmentTemplate, RiskLevel } from '../types';
import dayjs, { Dayjs } from 'dayjs';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CATEGORY_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '妊娠期高血压', label: '妊娠期高血压' },
  { value: '妊娠期糖尿病', label: 'GDM' },
  { value: '前置胎盘', label: '前置胎盘' },
  { value: '妊娠期肝内胆汁淤积症', label: 'ICP' },
  { value: '胎儿生长受限', label: 'FGR' },
  { value: '先兆流产', label: '先兆流产' },
];

const VISIT_TYPE_OPTIONS = [
  { label: '常规产检', value: '常规产检' },
  { label: '专项复查', value: '专项复查' },
  { label: '产前评估', value: '产前评估' },
  { label: '超声检查', value: '超声检查' },
  { label: '化验检查', value: '化验检查' },
  { label: '胎心监护', value: '胎心监护' },
];

const REVIEW_ITEM_OPTIONS = [
  { label: '血压监测', value: '血压监测' },
  { label: '体重/宫高/腹围', value: '体重/宫高/腹围' },
  { label: '血常规/尿常规', value: '血常规/尿常规' },
  { label: '肝肾功能/凝血', value: '肝肾功能/凝血' },
  { label: '超声检查', value: '超声检查' },
  { label: '胎心监护(NST)', value: '胎心监护(NST)' },
  { label: '脐血流监测', value: '脐血流监测' },
  { label: '血糖轮廓', value: '血糖轮廓' },
  { label: '胆汁酸', value: '胆汁酸' },
  { label: '其他实验室检查', value: '其他实验室检查' },
];

const riskLevelTextMap: Record<RiskLevel, string> = {
  green: '低',
  yellow: '一般',
  orange: '较高',
  red: '高',
};

const mockUsedCount: Record<string, number> = {
  T001: 156,
  T002: 132,
  T003: 89,
  T004: 67,
  T005: 54,
  T006: 98,
};

const Template: React.FC = () => {
  const {
    treatmentTemplates,
    patients,
    selectedTemplateId,
    selectTemplate,
    setActiveWindow,
    applyTemplateToPatient,
    selectPatient,
  } = useAppStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [editHintVisible, setEditHintVisible] = useState(false);
  const [applyForm] = Form.useForm();

  const filteredTemplates = useMemo(() => {
    return treatmentTemplates.filter((t) => {
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchSearch =
        searchKeyword === '' ||
        t.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        t.indication.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        t.category.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [treatmentTemplates, searchKeyword, categoryFilter]);

  const selectedTemplate = useMemo(
    () => treatmentTemplates.find((t) => t.id === selectedTemplateId) || null,
    [treatmentTemplates, selectedTemplateId]
  );

  const renderRiskTags = (levels: RiskLevel[]) => {
    return levels.map((level) => (
      <Tag
        key={level}
        color={riskLevelColors[level]}
        style={{
          color: '#fff',
          border: 'none',
          fontWeight: 500,
          margin: 0,
        }}
      >
        {riskLevelTextMap[level]}风险
      </Tag>
    ));
  };

  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
      message.info('已取消收藏');
    } else {
      newFavorites.add(templateId);
      message.success('已加入收藏');
    }
    setFavorites(newFavorites);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    applyForm.resetFields();
    setApplyModalVisible(true);
  };

  const handleConfirmApply = async (values: any) => {
    if (!selectedTemplate) return;
    applyTemplateToPatient(
      values.patientId,
      selectedTemplate.id,
      selectedTemplate.name,
      values.nextVisitDate.format('YYYY-MM-DD'),
      values.visitTypes || [],
      values.visitItems || [],
      values.remark
    );
    selectPatient(values.patientId);
    setActiveWindow('detail');
    message.success(`已应用模板「${selectedTemplate.name}」并安排复诊`);
    setApplyModalVisible(false);
  };

  const handlePrint = () => {
    message.info('正在准备打印模板...');
  };

  const handleEdit = () => {
    setEditHintVisible(true);
  };

  const medicationColumns = [
    {
      title: '药物名称',
      dataIndex: 'name',
      key: 'name',
      width: '22%',
      render: (text: string) => (
        <Text strong>
          <MedicineBoxOutlined style={{ marginRight: 6, color: '#1677ff' }} />
          {text}
        </Text>
      ),
    },
    {
      title: '剂量',
      dataIndex: 'dosage',
      key: 'dosage',
      width: '15%',
    },
    {
      title: '频次',
      dataIndex: 'frequency',
      key: 'frequency',
      width: '22%',
    },
    {
      title: '疗程',
      dataIndex: 'duration',
      key: 'duration',
      width: '18%',
    },
    {
      title: '注意事项',
      dataIndex: 'precautions',
      key: 'precautions',
      render: (text: string) => (
        <Text type="warning" style={{ fontSize: 13 }}>
          {text || '-'}
        </Text>
      ),
    },
  ];

  return (
    <Layout style={{ height: '100%', background: '#f0f2f5' }}>
      <Sider
        width="40%"
        style={{
          background: '#fff',
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 16px 0 16px', flex: 0 }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Input
              size="large"
              placeholder="搜索模板名称、适应症..."
              prefix={<SearchOutlined />}
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <Select
              size="large"
              placeholder="选择分类筛选"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: '100%' }}
              options={CATEGORY_OPTIONS}
            />
            <Row justify="space-between" align="middle">
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {filteredTemplates.length} 个模板
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                已收藏 {favorites.size} 个
              </Text>
            </Row>
          </Space>
          <Divider style={{ margin: '16px 0' }} />
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 16px 16px 16px',
          }}
        >
          {filteredTemplates.length === 0 ? (
            <Empty
              description="未找到匹配的模板"
              style={{ marginTop: 60 }}
            />
          ) : (
            <List
              grid={{ gutter: 12, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
              dataSource={filteredTemplates}
              renderItem={(template) => (
                <List.Item style={{ padding: 0 }}>
                  <Card
                    hoverable
                    onClick={() => selectTemplate(template.id)}
                    style={{
                      borderColor:
                        selectedTemplateId === template.id
                          ? '#1677ff'
                          : '#e8e8e8',
                      borderWidth: selectedTemplateId === template.id ? 2 : 1,
                      boxShadow:
                        selectedTemplateId === template.id
                          ? '0 2px 8px rgba(22,119,255,0.15)'
                          : 'none',
                      marginBottom: 0,
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, marginRight: 8 }}>
                        <Title
                          level={5}
                          style={{
                            marginBottom: 8,
                            marginTop: 0,
                            color:
                              selectedTemplateId === template.id
                                ? '#1677ff'
                                : 'inherit',
                          }}
                        >
                          {template.name}
                        </Title>
                        <Space wrap size={[6, 6]} style={{ marginBottom: 10 }}>
                          {renderRiskTags(template.riskLevel)}
                          <Tag color="blue" style={{ margin: 0 }}>
                            {template.category}
                          </Tag>
                        </Space>
                      </div>
                      <Button
                        type="text"
                        icon={
                          favorites.has(template.id) ? (
                            <HeartFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
                          ) : (
                            <HeartOutlined style={{ fontSize: 18 }} />
                          )
                        }
                        onClick={(e) => toggleFavorite(template.id, e)}
                        style={{ padding: 4 }}
                      />
                    </div>
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{
                        marginBottom: 12,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {template.indication}
                    </Paragraph>
                    <Row justify="space-between" align="middle">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <FileTextOutlined style={{ marginRight: 4 }} />
                        {template.steps.length} 个步骤 · {template.medications.length} 种用药
                      </Text>
                      <Tag color="default" style={{ margin: 0, fontSize: 12 }}>
                        已用 {mockUsedCount[template.id] || 0} 次
                      </Tag>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </Sider>

      <Content style={{ overflowY: 'auto', padding: 0, background: '#f5f7fa' }}>
        {selectedTemplate ? (
          <>
            <div
              style={{
                background: '#fff',
                padding: '20px 28px',
                borderBottom: '1px solid #e8e8e8',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <Row justify="space-between" align="top">
                <div style={{ flex: 1 }}>
                  <Title level={3} style={{ marginBottom: 10, marginTop: 0 }}>
                    <AuditOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                    {selectedTemplate.name}
                  </Title>
                  <Space wrap size={[10, 8]}>
                    <Text strong style={{ fontSize: 14 }}>
                      适用风险：
                    </Text>
                    <Space size={[6, 6]} wrap>
                      {renderRiskTags(selectedTemplate.riskLevel)}
                    </Space>
                    <Divider type="vertical" />
                    <Text style={{ fontSize: 13 }}>
                      <Text type="secondary">出处指南：</Text>
                      {selectedTemplate.references.join('、')}
                    </Text>
                  </Space>
                </div>
                <Space size={8}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    size="large"
                    onClick={handleApplyTemplate}
                  >
                    应用到患者
                  </Button>
                  <Button
                    icon={
                      favorites.has(selectedTemplate.id) ? (
                        <HeartFilled style={{ color: '#ff4d4f' }} />
                      ) : (
                        <HeartOutlined />
                      )
                    }
                    size="large"
                    onClick={(e) => toggleFavorite(selectedTemplate.id, e as React.MouseEvent)}
                  >
                    {favorites.has(selectedTemplate.id) ? '已收藏' : '加入收藏'}
                  </Button>
                  <Button
                    icon={<PrinterOutlined />}
                    size="large"
                    onClick={handlePrint}
                  >
                    打印模板
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    size="large"
                    onClick={handleEdit}
                  >
                    编辑模板
                  </Button>
                </Space>
              </Row>
            </div>

            <div style={{ padding: '20px 28px 40px 28px' }}>
              <Collapse
                defaultActiveKey={['1', '2', '3']}
                expandIconPosition="end"
                size="large"
                style={{ background: 'transparent' }}
                items={[
                  {
                    key: '1',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <FileTextOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                        适应症与诊断标准
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 8px' }}>
                        <Alert
                          message="适应症"
                          description={selectedTemplate.indication}
                          type="info"
                          showIcon
                          style={{ marginBottom: 16 }}
                        />
                        <Card
                          title={
                            <span>
                              <TeamOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                              适用人群
                            </span>
                          }
                          size="small"
                          style={{ marginBottom: 12 }}
                        >
                          <Paragraph style={{ margin: 0, lineHeight: 1.8 }}>
                            适用于具有以下高危因素的孕产妇：
                            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 24 }}>
                              {selectedTemplate.riskLevel.map((level) => (
                                <li key={level}>
                                  {riskLevelLabels[level]} 患者
                                </li>
                              ))}
                              <li>符合「{selectedTemplate.category}」相关诊断标准者</li>
                            </ul>
                          </Paragraph>
                        </Card>
                        <Card
                          title={
                            <span>
                              <WarningOutlined style={{ marginRight: 6, color: '#faad14' }} />
                              诊断要点
                            </span>
                          }
                          size="small"
                        >
                          <Paragraph style={{ margin: 0, lineHeight: 1.8 }}>
                            {selectedTemplate.indication}，需结合临床症状、体征及辅助检查综合判断，必要时请相关科室会诊协助诊断。
                          </Paragraph>
                        </Card>
                      </div>
                    ),
                  },
                  {
                    key: '2',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <ClockCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                        分步处置流程
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 32px' }}>
                        <Steps
                          direction="vertical"
                          size="default"
                          current={selectedTemplate.steps.length}
                          items={selectedTemplate.steps.map((step) => ({
                            title: (
                              <span style={{ fontSize: 14, fontWeight: 500 }}>
                                步骤 {step.order}
                                <Tag color="blue" style={{ marginLeft: 12, fontSize: 12 }}>
                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                  {step.timing}
                                </Tag>
                              </span>
                            ),
                            description: (
                              <div style={{ padding: '8px 0 16px 0' }}>
                                <Paragraph
                                  style={{
                                    marginBottom: 8,
                                    fontSize: 14,
                                    lineHeight: 1.8,
                                  }}
                                >
                                  {step.content}
                                </Paragraph>
                                {step.note && (
                                  <Alert
                                    type="warning"
                                    showIcon
                                    icon={<WarningOutlined />}
                                    message={
                                      <Text style={{ fontSize: 13 }}>
                                        <Text strong>备注：</Text>
                                        {step.note}
                                      </Text>
                                    }
                                    style={{ marginTop: 8 }}
                                  />
                                )}
                              </div>
                            ),
                          }))}
                        />
                      </div>
                    ),
                  },
                  {
                    key: '3',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <MedicineBoxOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                        用药方案
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 8px' }}>
                        <Table
                          dataSource={selectedTemplate.medications}
                          columns={medicationColumns}
                          pagination={false}
                          size="middle"
                          bordered
                          rowKey="name"
                        />
                        <Alert
                          type="warning"
                          showIcon
                          style={{ marginTop: 16 }}
                          message="用药注意事项"
                          description={
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                              <li>所有药物使用前需评估过敏史，严格掌握禁忌症</li>
                              <li>用药期间密切监测母胎情况，根据反应调整剂量</li>
                              <li>多药联合使用时注意药物相互作用</li>
                              <li>充分知情告知，签署用药知情同意书</li>
                            </ul>
                          }
                        />
                      </div>
                    ),
                  },
                  {
                    key: '4',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <AuditOutlined style={{ marginRight: 8, color: '#13c2c2' }} />
                        检查监测计划
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 8px' }}>
                        <Card size="small">
                          <List
                            dataSource={selectedTemplate.exams}
                            renderItem={(item, idx) => (
                              <List.Item>
                                <Row style={{ width: '100%' }} align="middle">
                                  <Col span={1}>
                                    <Tag color="cyan" style={{ margin: 0 }}>
                                      {idx + 1}
                                    </Tag>
                                  </Col>
                                  <Col span={23}>
                                    <Text style={{ fontSize: 14 }}>{item}</Text>
                                  </Col>
                                </Row>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </div>
                    ),
                  },
                  {
                    key: '5',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <CalendarOutlined style={{ marginRight: 8, color: '#eb2f96' }} />
                        随访方案
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 8px' }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Card
                              title={
                                <span>
                                  <ClockCircleOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                                  随访时间间隔
                                </span>
                              }
                              size="small"
                            >
                              <Text style={{ fontSize: 14, lineHeight: 1.8 }}>
                                {selectedTemplate.followUpPlan.interval}
                              </Text>
                            </Card>
                          </Col>
                          <Col span={16}>
                            <Card
                              title={
                                <span>
                                  <FileTextOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                                  监测项目
                                </span>
                              }
                              size="small"
                              style={{ marginBottom: 16 }}
                            >
                              <Space wrap size={[8, 8]}>
                                {selectedTemplate.followUpPlan.items.map((item, idx) => (
                                  <Tag key={idx} color="green" style={{ fontSize: 13, padding: '4px 10px' }}>
                                    {item}
                                  </Tag>
                                ))}
                              </Space>
                            </Card>
                            <Card
                              title={
                                <span>
                                  <WarningOutlined style={{ marginRight: 6, color: '#faad14' }} />
                                  监控要点
                                </span>
                              }
                              size="small"
                            >
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {selectedTemplate.followUpPlan.monitoringPoints.map((point, idx) => (
                                  <li key={idx} style={{ lineHeight: 2, fontSize: 14 }}>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: '6',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <ApartmentOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                        住院指征
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 8px' }}>
                        <Alert
                          type="warning"
                          showIcon
                          icon={<ApartmentOutlined />}
                          message={
                            <Text strong style={{ fontSize: 14 }}>
                              符合以下任一情况者，建议立即住院治疗
                            </Text>
                          }
                          description={
                            <Paragraph style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.8, fontSize: 14 }}>
                              {selectedTemplate.hospitalizationCriteria.split('；').map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                                  <Tag color="orange" style={{ flexShrink: 0, marginRight: 8 }}>
                                    {idx + 1}
                                  </Tag>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </Paragraph>
                          }
                        />
                      </div>
                    ),
                  },
                  {
                    key: '7',
                    label: (
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        <ThunderboltOutlined style={{ marginRight: 8, color: '#f5222d' }} />
                        急诊预警标准
                      </span>
                    ),
                    children: (
                      <div style={{ padding: '8px 8px 16px 8px' }}>
                        <Alert
                          type="error"
                          showIcon
                          icon={<ThunderboltOutlined />}
                          message={
                            <Text strong style={{ fontSize: 14 }}>
                              出现以下预警信号时，需紧急处理，必要时急诊就诊/抢救
                            </Text>
                          }
                          description={
                            <Paragraph style={{ marginTop: 12, marginBottom: 0, lineHeight: 1.8, fontSize: 14 }}>
                              {selectedTemplate.emergencyCriteria.split('；').map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                                  <Tag color="red" style={{ flexShrink: 0, marginRight: 8 }}>
                                    ⚠ 预警{idx + 1}
                                  </Tag>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </Paragraph>
                          }
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 600,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} type="secondary">
                    请从左侧选择一个处置模板查看详情
                  </Title>
                  <Paragraph type="secondary" style={{ marginTop: 8 }}>
                    支持按分类筛选和关键词搜索，快速定位所需的临床处置方案
                  </Paragraph>
                </div>
              }
            />
          </div>
        )}
      </Content>

      <Modal
        title={
          <span>
            <SendOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            应用模板并安排复诊
          </span>
        }
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        onOk={() => applyForm.submit()}
        width={640}
        okText="确认应用"
        cancelText="取消"
        okButtonProps={{ type: 'primary', size: 'large' }}
        cancelButtonProps={{ size: 'large' }}
        destroyOnClose
      >
        <Form
          form={applyForm}
          layout="vertical"
          onFinish={handleConfirmApply}
          initialValues={{
            nextVisitDate: dayjs().add(1, 'week'),
            visitTypes: ['常规产检'],
            visitItems: ['血压监测', '体重/宫高/腹围'],
            remark: '',
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={18}>
            <Form.Item
              name="patientId"
              label={
                <span>
                  <UserOutlined style={{ marginRight: 6 }} />
                  选择患者 <Text type="danger">*</Text>
                </span>
              }
              rules={[{ required: true, message: '请选择患者' }]}
            >
              <Select
                showSearch
                placeholder="搜索并选择患者（姓名/ID/电话）"
                optionFilterProp="label"
                size="large"
                style={{ width: '100%' }}
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.id}) - 孕${p.gestationalWeeks}+${p.gestationalDays}周 - ${riskLevelLabels[p.riskLevel]}`,
                }))}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.patientId !== curr.patientId}>
              {({ getFieldValue }) => {
                const patientId = getFieldValue('patientId');
                const patient = patients.find((p) => p.id === patientId);
                if (!patient) return null;
                return (
                  <Alert
                    type="success"
                    showIcon
                    message={
                      <Text>
                        已选择患者：<Text strong>{patient.name}</Text>
                      </Text>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          当前孕周：孕{patient.gestationalWeeks}+{patient.gestationalDays}周
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          预产期：{patient.dueDate}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          风险等级：{riskLevelLabels[patient.riskLevel]}
                        </Text>
                      </Space>
                    }
                    style={{ marginBottom: 0 }}
                  />
                );
              }}
            </Form.Item>

            <Form.Item
              name="nextVisitDate"
              label={
                <span>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  下次复诊日期 <Text type="danger">*</Text>
                </span>
              }
              rules={[{ required: true, message: '请选择下次复诊日期' }]}
            >
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                placeholder="请选择复诊日期"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                format="YYYY-MM-DD"
              />
            </Form.Item>

            <Form.Item
              name="visitTypes"
              label={
                <span>
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  复诊类型 <Text type="danger">*</Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12, fontWeight: 400 }}>
                    （多选）
                  </Text>
                </span>
              }
              rules={[{ required: true, message: '请至少选择一种复诊类型' }]}
            >
              <Checkbox.Group
                options={VISIT_TYPE_OPTIONS}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px 24px',
                }}
              />
            </Form.Item>

            <Form.Item
              name="visitItems"
              label={
                <span>
                  <AuditOutlined style={{ marginRight: 6 }} />
                  复查项目
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12, fontWeight: 400 }}>
                    （多选）
                  </Text>
                </span>
              }
            >
              <Checkbox.Group
                options={REVIEW_ITEM_OPTIONS}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px 24px',
                }}
              />
            </Form.Item>

            <Form.Item
              name="remark"
              label={
                <span>
                  <WarningOutlined style={{ marginRight: 6, color: '#faad14' }} />
                  重要提醒事项
                </span>
              }
            >
              <TextArea
                rows={3}
                placeholder="请填写需要特别提醒患者的注意事项，如饮食、用药、休息、异常情况处理等..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            {selectedTemplate && (
              <Alert
                type="info"
                showIcon
                message={
                  <Text>
                    即将应用模板：<Text strong>{selectedTemplate.name}</Text>
                  </Text>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    应用后将在患者病历中记录该处置方案，并在复诊计划中同步提醒
                  </Text>
                }
              />
            )}
          </Space>
        </Form>
      </Modal>

      <Modal
        title={
          <span>
            <EditOutlined style={{ marginRight: 8, color: '#faad14' }} />
            高级功能提示
          </span>
        }
        open={editHintVisible}
        onCancel={() => setEditHintVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setEditHintVisible(false)}>
            我知道了
          </Button>,
        ]}
        width={500}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="模板编辑为高级功能"
            description="编辑模板涉及临床指南内容的变更，需要经过以下流程："
          />
          <ol style={{ margin: 0, paddingLeft: 24, lineHeight: 2 }}>
            <li>提交模板修改申请至科室质控小组</li>
            <li>由至少2名副高以上职称医师审核</li>
            <li>更新依据的循证医学证据及参考文献</li>
            <li>经主任审批后在系统中发布更新</li>
          </ol>
          <Alert
            type="warning"
            showIcon
            message="如需临时调整"
            description="在「应用到患者」时可在病历中进行个体化调整，无需修改模板本身。"
          />
        </Space>
      </Modal>
    </Layout>
  );
};

export default Template;
