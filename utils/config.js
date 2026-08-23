/**
 * 配置常量
 */

// 学校列表
const SCHOOLS = [
  '北京大学',
  '清华大学',
  '中国人民大学',
  '北京师范大学',
  '北京理工大学',
  '北京航空航天大学',
  '中央财经大学',
  '对外经济贸易大学',
  '北京外国语大学',
  '中国传媒大学',
  '北京邮电大学',
  '北京科技大学',
  '北京化工大学',
  '北京林业大学',
  '中国农业大学',
  '北京中医药大学',
  '首都医科大学',
  '北京工业大学',
  '首都师范大学',
  '北京语言大学'
]

// 课程类型
const COURSE_TYPES = [
  '数学',
  '英语',
  '物理',
  '化学',
  '生物',
  '计算机',
  '经济学',
  '管理学',
  '法学',
  '文学',
  '历史',
  '哲学',
  '心理学',
  '教育学',
  '艺术',
  '体育',
  '其他'
]

// 任务类型
const TASK_TYPES = [
  {
    value: 'homework',
    label: '作业辅导'
  },
  {
    value: 'paper',
    label: '论文指导'
  },
  {
    value: 'review',
    label: '复习备考'
  },
  {
    value: 'project',
    label: '项目指导'
  },
  {
    value: 'other',
    label: '其他'
  }
]

// 辅导方式
const TUTOR_MODES = [
  {
    value: 'online',
    label: '线上辅导'
  },
  {
    value: 'offline',
    label: '线下辅导'
  },
  {
    value: 'both',
    label: '线上线下均可'
  }
]

// 任务状态
const TASK_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// 订单状态
const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

// 用户角色
const USER_ROLES = {
  DEMANDER: 'demander',
  TUTOR: 'tutor'
}

// 消息类型
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  SYSTEM: 'system'
}

// 认证状态
const VERIFY_STATUS = {
  UNVERIFIED: false,
  PENDING: 'pending',
  VERIFIED: true
}

// 佣金比例
const COMMISSION_RATE = 0.01

// 分页大小
const PAGE_SIZE = 20

// 文件上传限制
const UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif'],
  MAX_FILES: 9
}

// 技能标签
const SKILL_TAGS = [
  '数学建模',
  '编程开发',
  '英语翻译',
  '论文写作',
  '数据分析',
  '设计制作',
  '演讲表达',
  '项目管理',
  '市场营销',
  '财务分析',
  '法律咨询',
  '心理辅导',
  '语言教学',
  '音乐艺术',
  '体育健身',
  '摄影摄像',
  '新媒体运营',
  '创业指导',
  '考研辅导',
  '出国留学'
]

// 价格区间
const PRICE_RANGES = [
  {
    value: 'all',
    label: '不限'
  },
  {
    value: '0-50',
    label: '50元以下'
  },
  {
    value: '50-100',
    label: '50-100元'
  },
  {
    value: '100-200',
    label: '100-200元'
  },
  {
    value: '200-500',
    label: '200-500元'
  },
  {
    value: '500+',
    label: '500元以上'
  }
]

// 排序方式
const SORT_TYPES = [
  {
    value: 'time_desc',
    label: '最新发布'
  },
  {
    value: 'price_asc',
    label: '价格从低到高'
  },
  {
    value: 'price_desc',
    label: '价格从高到低'
  }
]

module.exports = {
  SCHOOLS,
  COURSE_TYPES,
  TASK_TYPES,
  TUTOR_MODES,
  TASK_STATUS,
  ORDER_STATUS,
  USER_ROLES,
  MESSAGE_TYPES,
  VERIFY_STATUS,
  COMMISSION_RATE,
  PAGE_SIZE,
  UPLOAD_LIMITS,
  SKILL_TAGS,
  PRICE_RANGES,
  SORT_TYPES
}
