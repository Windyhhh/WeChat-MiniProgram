// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 并行获取各项统计数据
    const [usersResult, tasksResult, ordersResult] = await Promise.all([
      db.collection('users').count(),
      db.collection('tasks').count(),
      db.collection('orders').where({
        status: 'completed'
      }).get()
    ])

    // 计算总交易金额
    const totalAmount = ordersResult.data.reduce((sum, order) => sum + order.amount, 0)
    const totalAmountText = totalAmount > 10000 ? 
      `${(totalAmount / 10000).toFixed(1)}万` : 
      `${(totalAmount / 100).toFixed(0)}`

    const stats = {
      totalUsers: usersResult.total || 0,
      totalTasks: tasksResult.total || 0,
      totalOrders: ordersResult.data.length || 0,
      totalAmount: totalAmountText
    }

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('获取平台统计失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
