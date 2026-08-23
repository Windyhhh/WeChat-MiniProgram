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
    const { taskId } = event
    
    if (!taskId) {
      return {
        success: false,
        message: '任务ID不能为空'
      }
    }
    
    // 获取任务详情
    const taskResult = await db.collection('tasks').doc(taskId).get()
    
    if (!taskResult.data) {
      return {
        success: false,
        message: '任务不存在'
      }
    }
    
    const task = taskResult.data
    
    // 获取发布者信息
    const publisherResult = await db.collection('users')
      .where({ _openid: task.publisherId })
      .field({
        nickName: true,
        avatarUrl: true,
        school: true,
        isVerified: true
      })
      .get()
    
    if (publisherResult.data.length > 0) {
      const publisher = publisherResult.data[0]
      task.publisherName = publisher.nickName || '匿名用户'
      task.publisherAvatar = publisher.avatarUrl
      task.publisherSchool = publisher.school
      task.publisherVerified = publisher.isVerified || false
    }
    
    // 获取申请者列表（如果是发布者或任务已确认）
    let applicants = []
    if (OPENID === task.publisherId || task.status !== 'pending') {
      const applicationsResult = await db.collection('applications')
        .where({ taskId })
        .orderBy('createTime', 'desc')
        .get()
      
      if (applicationsResult.data.length > 0) {
        // 获取申请者信息
        const applicantIds = applicationsResult.data.map(app => app.applicantId)
        const applicantsResult = await db.collection('users')
          .where({
            _openid: db.command.in(applicantIds)
          })
          .field({
            _openid: true,
            nickName: true,
            avatarUrl: true,
            school: true,
            isVerified: true,
            tags: true
          })
          .get()
        
        const applicantsMap = {}
        applicantsResult.data.forEach(applicant => {
          applicantsMap[applicant._openid] = applicant
        })
        
        // 组装申请者数据
        applicants = applicationsResult.data.map(application => {
          const applicant = applicantsMap[application.applicantId] || {}
          
          return {
            ...application,
            name: applicant.nickName || '匿名用户',
            avatar: applicant.avatarUrl,
            school: applicant.school,
            isVerified: applicant.isVerified || false,
            tags: applicant.tags || []
          }
        })
      }
    }
    
    return {
      success: true,
      data: {
        task,
        applicants
      }
    }
    
  } catch (error) {
    console.error('获取任务详情失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
