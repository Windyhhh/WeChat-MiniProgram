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
    const { taskId, reason } = event
    
    if (!taskId || !reason) {
      return {
        success: false,
        message: '参数不完整'
      }
    }
    
    // 检查用户是否存在且已认证
    const userResult = await db.collection('users').where({
      _openid: OPENID
    }).get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    if (!user.isVerified) {
      return {
        success: false,
        message: '请先完成校园认证'
      }
    }
    
    if (user.role !== 'tutor') {
      return {
        success: false,
        message: '只有辅导者可以申请接单'
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
    if (task.status !== 'pending') {
      return {
        success: false,
        message: '任务已不可申请'
      }
    }
    
    if (task.publisherId === OPENID) {
      return {
        success: false,
        message: '不能申请自己发布的任务'
      }
    }
    
    // 检查是否已经申请过
    const existingApplication = await db.collection('applications')
      .where({
        taskId,
        applicantId: OPENID
      })
      .get()
    
    if (existingApplication.data.length > 0) {
      return {
        success: false,
        message: '您已经申请过这个任务'
      }
    }
    
    // 创建申请记录
    const applicationData = {
      taskId,
      applicantId: OPENID,
      applicantName: user.nickname || '匿名用户',
      applicantAvatar: user.avatar,
      applicantSchool: user.school,
      reason: reason.trim(),
      status: 'pending',
      createTime: new Date()
    }
    
    await db.collection('applications').add({
      data: applicationData
    })
    
    // 更新任务的申请者列表
    await db.collection('tasks').doc(taskId).update({
      data: {
        applicants: db.command.push([OPENID]),
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '申请提交成功'
    }
    
  } catch (error) {
    console.error('申请接单失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
