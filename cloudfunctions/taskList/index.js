// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const {
      filterType = 'all',
      sortType = 'time',
      page = 1,
      pageSize = 10
    } = event
    
    // 构建查询条件
    let whereCondition = {
      status: 'pending' // 只显示待接单的任务
    }
    
    // 任务类型筛选
    if (filterType !== 'all') {
      whereCondition.taskType = filterType
    }
    
    // 构建排序条件
    let orderBy = {}
    switch (sortType) {
      case 'time':
        orderBy = { createTime: 'desc' }
        break
      case 'price_asc':
        orderBy = { budget: 'asc' }
        break
      case 'price_desc':
        orderBy = { budget: 'desc' }
        break
      default:
        orderBy = { createTime: 'desc' }
    }
    
    // 计算跳过的记录数
    const skip = (page - 1) * pageSize
    
    // 查询任务列表
    const tasksResult = await db.collection('tasks')
      .where(whereCondition)
      .orderBy(Object.keys(orderBy)[0], Object.values(orderBy)[0])
      .skip(skip)
      .limit(pageSize + 1) // 多查询一条用于判断是否还有更多数据
      .get()
    
    const tasks = tasksResult.data
    const hasMore = tasks.length > pageSize
    
    // 如果有多余的数据，移除最后一条
    if (hasMore) {
      tasks.pop()
    }
    
    // 获取发布者信息
    const publisherIds = [...new Set(tasks.map(task => task.publisherId))]
    const publishersResult = await db.collection('users')
      .where({
        _openid: _.in(publisherIds)
      })
      .field({
        _openid: true,
        nickName: true,
        avatarUrl: true,
        school: true,
        isVerified: true
      })
      .get()
    
    const publishersMap = {}
    publishersResult.data.forEach(publisher => {
      publishersMap[publisher._openid] = publisher
    })
    
    // 组装任务数据
    const processedTasks = tasks.map(task => {
      const publisher = publishersMap[task.publisherId] || {}
      
      return {
        ...task,
        publisherName: publisher.nickName || '匿名用户',
        publisherAvatar: publisher.avatarUrl,
        publisherSchool: publisher.school,
        publisherVerified: publisher.isVerified || false
      }
    })
    
    return {
      success: true,
      data: {
        tasks: processedTasks,
        hasMore,
        total: tasks.length
      }
    }
    
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
