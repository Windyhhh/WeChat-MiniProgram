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
    const { taskData } = event
    const {
      course,
      taskType,
      tutorMode,
      title,
      description,
      images = [],
      location,
      expectedTime,
      budget
    } = taskData
    
    // 数据验证
    if (!course || !taskType || !tutorMode || !title || !description || !expectedTime || !budget) {
      return {
        success: false,
        message: '请填写完整的任务信息'
      }
    }
    
    if (budget <= 0) {
      return {
        success: false,
        message: '预算金额必须大于0'
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
    
    if (user.role !== 'demander') {
      return {
        success: false,
        message: '只有需求方可以发布任务'
      }
    }
    
    // 创建任务
    const newTaskData = {
      publisherId: OPENID,
      publisherName: user.nickname || '匿名用户',
      publisherAvatar: user.avatar,
      publisherSchool: user.school,
      publisherVerified: user.isVerified,
      course,
      taskType,
      tutorMode,
      title,
      description,
      images,
      location: location || '',
      expectedTime,
      budget: parseFloat(budget),
      status: 'pending',
      applicants: [], // 申请者列表
      viewCount: 0, // 浏览次数
      createTime: new Date(),
      updateTime: new Date()
    }
    
    const result = await db.collection('tasks').add({
      data: newTaskData
    })
    
    return {
      success: true,
      data: {
        taskId: result._id
      },
      message: '任务发布成功'
    }
    
  } catch (error) {
    console.error('创建任务失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
