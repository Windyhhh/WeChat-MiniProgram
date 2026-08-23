// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { OPENID } = wxContext

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (userResult.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    const user = userResult.data[0]
    const stats = {
      orderCount: 0,
      rating: 5.0,
      totalEarnings: 0,
      taskCount: 0
    }

    // 获取订单统计
    const orderResult = await db.collection('orders').where({
      $or: [
        { demanderId: OPENID },
        { tutorId: OPENID }
      ]
    }).get()

    stats.orderCount = orderResult.data.length

    // 如果是辅导者，计算收入和评分
    if (user.role === 'tutor') {
      const tutorOrders = orderResult.data.filter(order => 
        order.tutorId === OPENID && order.status === 'completed'
      )
      
      // 计算总收入
      stats.totalEarnings = tutorOrders.reduce((total, order) => {
        const commission = order.isFree ? 0 : order.amount * 0.01
        return total + (order.amount - commission)
      }, 0) / 100 // 转换为元

      // 计算平均评分
      const ratedOrders = tutorOrders.filter(order => order.rating)
      if (ratedOrders.length > 0) {
        const totalRating = ratedOrders.reduce((sum, order) => sum + order.rating, 0)
        stats.rating = (totalRating / ratedOrders.length).toFixed(1)
      }
    }

    // 如果是需求方，获取发布的任务数
    if (user.role === 'demander') {
      const taskResult = await db.collection('tasks').where({
        publisherId: OPENID
      }).get()
      
      stats.taskCount = taskResult.data.length
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
