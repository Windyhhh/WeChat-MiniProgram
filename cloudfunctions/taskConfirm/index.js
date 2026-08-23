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
    const { taskId, tutorId } = event
    
    if (!taskId || !tutorId) {
      return {
        success: false,
        message: '参数不完整'
      }
    }
    
    // 检查任务是否存在
    const taskResult = await db.collection('tasks').doc(taskId).get()
    
    if (!taskResult.data) {
      return {
        success: false,
        message: '任务不存在'
      }
    }
    
    const task = taskResult.data
    
    // 检查是否是任务发布者
    if (task.publisherId !== OPENID) {
      return {
        success: false,
        message: '只有任务发布者可以确认申请'
      }
    }
    
    // 检查任务状态
    if (task.status !== 'pending') {
      return {
        success: false,
        message: '任务状态不正确'
      }
    }
    
    // 检查申请是否存在
    const applicationResult = await db.collection('applications')
      .where({
        taskId,
        applicantId: tutorId,
        status: 'pending'
      })
      .get()
    
    if (applicationResult.data.length === 0) {
      return {
        success: false,
        message: '申请不存在或已处理'
      }
    }
    
    // 获取辅导者信息
    const tutorResult = await db.collection('users')
      .where({ _openid: tutorId })
      .get()
    
    if (tutorResult.data.length === 0) {
      return {
        success: false,
        message: '辅导者不存在'
      }
    }
    
    const tutor = tutorResult.data[0]
    
    // 开始事务处理
    const transaction = await db.startTransaction()
    
    try {
      // 更新任务状态
      await transaction.collection('tasks').doc(taskId).update({
        data: {
          status: 'confirmed',
          tutorId,
          tutorName: tutor.nickname || '匿名用户',
          tutorAvatar: tutor.avatar,
          tutorSchool: tutor.school,
          confirmTime: new Date(),
          updateTime: new Date()
        }
      })
      
      // 更新确认的申请状态
      await transaction.collection('applications')
        .where({
          taskId,
          applicantId: tutorId
        })
        .update({
          data: {
            status: 'confirmed',
            confirmTime: new Date()
          }
        })
      
      // 拒绝其他申请
      await transaction.collection('applications')
        .where({
          taskId,
          applicantId: db.command.neq(tutorId),
          status: 'pending'
        })
        .update({
          data: {
            status: 'rejected',
            rejectTime: new Date()
          }
        })
      
      // 提交事务
      await transaction.commit()
      
      return {
        success: true,
        message: '确认成功'
      }
      
    } catch (transactionError) {
      // 回滚事务
      await transaction.rollback()
      throw transactionError
    }
    
  } catch (error) {
    console.error('确认申请失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
