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
    const { taskId, tutorId, amount, useFreeCommission = false } = event
    
    if (!taskId || !tutorId || !amount) {
      return {
        success: false,
        message: '参数不完整'
      }
    }
    
    // 检查任务是否存在且状态正确
    const taskResult = await db.collection('tasks').doc(taskId).get()
    
    if (!taskResult.data) {
      return {
        success: false,
        message: '任务不存在'
      }
    }
    
    const task = taskResult.data
    
    if (task.status !== 'confirmed') {
      return {
        success: false,
        message: '任务状态不正确'
      }
    }
    
    if (task.publisherId !== OPENID) {
      return {
        success: false,
        message: '只有任务发布者可以创建订单'
      }
    }
    
    if (task.tutorId !== tutorId) {
      return {
        success: false,
        message: '辅导者信息不匹配'
      }
    }
    
    // 检查是否已存在订单
    const existingOrderResult = await db.collection('orders')
      .where({
        taskId,
        status: db.command.neq('cancelled')
      })
      .get()
    
    if (existingOrderResult.data.length > 0) {
      return {
        success: false,
        message: '该任务已存在订单'
      }
    }
    
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 计算佣金
    const commissionRate = 0.01 // 1%
    let commission = 0
    let isFree = false
    
    if (useFreeCommission && user.freeCommissions > 0) {
      // 使用免佣机会
      isFree = true
      commission = 0
    } else {
      commission = Math.round(amount * commissionRate * 100) / 100 // 保留两位小数
    }
    
    // 创建订单
    const orderData = {
      taskId,
      demanderId: OPENID,
      tutorId,
      amount: parseFloat(amount),
      commission,
      isFree,
      status: 'pending',
      createTime: new Date(),
      updateTime: new Date()
    }
    
    const orderResult = await db.collection('orders').add({
      data: orderData
    })
    
    // 如果使用了免佣机会，扣减用户的免佣次数
    if (isFree) {
      await db.collection('users')
        .where({ _openid: OPENID })
        .update({
          data: {
            freeCommissions: db.command.inc(-1)
          }
        })
    }
    
    return {
      success: true,
      data: {
        orderId: orderResult._id,
        amount: orderData.amount,
        commission: orderData.commission,
        totalAmount: orderData.amount + orderData.commission
      },
      message: '订单创建成功'
    }
    
  } catch (error) {
    console.error('创建订单失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
