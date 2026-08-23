// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext
  
  try {
    const {
      status = '',
      page = 1,
      pageSize = 20
    } = event
    
    // 构建查询条件
    let whereCondition = {
      [_.or([
        { demanderId: OPENID },
        { tutorId: OPENID }
      ])]: true
    }
    
    // 状态筛选
    if (status) {
      whereCondition.status = status
    }
    
    // 计算跳过的记录数
    const skip = (page - 1) * pageSize
    
    // 查询订单列表
    const ordersResult = await db.collection('orders')
      .where(whereCondition)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
    
    const orders = ordersResult.data
    
    if (orders.length === 0) {
      return {
        success: true,
        data: []
      }
    }
    
    // 获取相关任务信息
    const taskIds = [...new Set(orders.map(order => order.taskId))]
    const tasksResult = await db.collection('tasks')
      .where({
        _id: _.in(taskIds)
      })
      .field({
        _id: true,
        title: true,
        course: true,
        tutorMode: true,
        publisherId: true
      })
      .get()
    
    const tasksMap = {}
    tasksResult.data.forEach(task => {
      tasksMap[task._id] = task
    })
    
    // 获取相关用户信息
    const userIds = [...new Set([
      ...orders.map(order => order.demanderId),
      ...orders.map(order => order.tutorId)
    ])]
    
    const usersResult = await db.collection('users')
      .where({
        _openid: _.in(userIds)
      })
      .field({
        _openid: true,
        nickname: true,
        avatar: true,
        isVerified: true
      })
      .get()
    
    const usersMap = {}
    usersResult.data.forEach(user => {
      usersMap[user._openid] = user
    })
    
    // 组装订单数据
    const processedOrders = orders.map(order => {
      const task = tasksMap[order.taskId] || {}
      const demander = usersMap[order.demanderId] || {}
      const tutor = usersMap[order.tutorId] || {}
      
      return {
        ...order,
        taskTitle: task.title || '未知任务',
        taskCourse: task.course || '',
        taskTutorMode: this.getTutorModeText(task.tutorMode),
        demanderInfo: {
          id: order.demanderId,
          name: demander.nickname || '匿名用户',
          avatar: demander.avatar,
          isVerified: demander.isVerified || false
        },
        tutorInfo: {
          id: order.tutorId,
          name: tutor.nickname || '匿名用户',
          avatar: tutor.avatar,
          isVerified: tutor.isVerified || false
        }
      }
    })
    
    return {
      success: true,
      data: processedOrders
    }
    
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}

// 获取辅导方式文本
function getTutorModeText(mode) {
  const modeMap = {
    'online': '线上辅导',
    'offline': '线下辅导',
    'both': '线上线下均可'
  }
  return modeMap[mode] || '未知'
}
