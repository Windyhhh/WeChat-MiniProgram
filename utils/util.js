/**
 * 工具函数库
 */

// 格式化时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

// 格式化日期
const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('-')}`
}

// 相对时间格式化
const formatRelativeTime = date => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return formatDate(date)
  }
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 显示Toast
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

// 显示Loading
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏Loading
const hideLoading = () => {
  wx.hideLoading()
}

// 显示确认对话框
const showConfirm = (content, title = '提示') => {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 生成随机字符串
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 验证手机号
const validatePhone = (phone) => {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

// 验证学号
const validateStudentId = (studentId) => {
  const reg = /^\d{8,12}$/
  return reg.test(studentId)
}

// 格式化金额
const formatMoney = (amount) => {
  return (amount / 100).toFixed(2)
}

// 金额转分
const yuanToFen = (yuan) => {
  return Math.round(yuan * 100)
}

// 分转元
const fenToYuan = (fen) => {
  return fen / 100
}

// 获取任务状态文本
const getTaskStatusText = (status) => {
  const statusMap = {
    'pending': '待接单',
    'confirmed': '已确认',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 获取订单状态文本
const getOrderStatusText = (status) => {
  const statusMap = {
    'pending': '待支付',
    'paid': '已支付',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunded': '已退款'
  }
  return statusMap[status] || '未知状态'
}

// 节流函数
const throttle = (func, delay) => {
  let timer = null
  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        func.apply(this, args)
        timer = null
      }, delay)
    }
  }
}

// 防抖函数
const debounce = (func, delay) => {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

// 生成邀请码
const generateInviteCode = (openid) => {
  if (!openid) return ''

  // 基于openid生成6位邀请码
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  // 使用openid的hash值作为种子
  let hash = 0
  for (let i = 0; i < openid.length; i++) {
    const char = openid.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }

  // 生成6位邀请码
  for (let i = 0; i < 6; i++) {
    hash = Math.abs(hash)
    result += chars[hash % chars.length]
    hash = Math.floor(hash / chars.length)
  }

  return result
}

module.exports = {
  formatTime,
  formatDate,
  formatRelativeTime,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  generateRandomString,
  validatePhone,
  validateStudentId,
  formatMoney,
  yuanToFen,
  fenToYuan,
  getTaskStatusText,
  getOrderStatusText,
  throttle,
  debounce,
  generateInviteCode
}
