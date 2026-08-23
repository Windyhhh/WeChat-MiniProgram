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
    const { orderId } = event
    
    if (!orderId) {
      return {
        success: false,
        message: '订单ID不能为空'
      }
    }
    
    // 获取订单信息
    const orderResult = await db.collection('orders').doc(orderId).get()
    
    if (!orderResult.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const order = orderResult.data
    
    // 检查权限（只有需求方可以确认完成）
    if (order.demanderId !== OPENID) {
      return {
        success: false,
        message: '只有需求方可以确认完成'
      }
    }
    
    // 检查订单状态
    if (order.status !== 'in_progress' && order.status !== 'paid') {
      return {
        success: false,
        message: '订单状态不正确'
      }
    }
    
    // 开始事务处理
    const transaction = await db.startTransaction()
    
    try {
      // 更新订单状态
      await transaction.collection('orders').doc(orderId).update({
        data: {
          status: 'completed',
          completeTime: new Date(),
          updateTime: new Date()
        }
      })
      
      // 计算辅导者收入（订单金额 - 佣金）
      const tutorIncome = order.amount - order.commission
      
      // 更新辅导者余额
      await transaction.collection('users')
        .where({ _openid: order.tutorId })
        .update({
          data: {
            balance: db.command.inc(tutorIncome),
            totalEarnings: db.command.inc(tutorIncome),
            completedOrders: db.command.inc(1)
          }
        })
      
      // 更新任务状态
      await transaction.collection('tasks').doc(order.taskId).update({
        data: {
          status: 'completed',
          completeTime: new Date(),
          updateTime: new Date()
        }
      })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: '订单已完成，收入已结算给辅导者'
      }
      
    } catch (transactionError) {
      // 回滚事务
      await transaction.rollback()
      throw transactionError
    }
    
  } catch (error) {
    console.error('完成订单失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
