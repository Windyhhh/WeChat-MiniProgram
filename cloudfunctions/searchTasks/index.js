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
      keyword, 
      type = 'task', 
      page = 1, 
      pageSize = 10,
      filters = {}
    } = event
    
    if (!keyword || !keyword.trim()) {
      return {
        success: false,
        message: '搜索关键词不能为空'
      }
    }
    
    const skip = (page - 1) * pageSize
    
    if (type === 'task') {
      return await searchTasks(keyword, skip, pageSize, filters)
    } else if (type === 'user') {
      return await searchUsers(keyword, skip, pageSize, filters)
    } else {
      return {
        success: false,
        message: '不支持的搜索类型'
      }
    }
    
  } catch (error) {
    console.error('搜索失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}

// 搜索任务
async function searchTasks(keyword, skip, pageSize, filters) {
  try {
    // 构建搜索条件
    const searchConditions = []
    
    // 关键词搜索（标题、描述、课程名称）
    const keywordRegex = new RegExp(keyword, 'i')
    searchConditions.push(_.or([
      { title: keywordRegex },
      { description: keywordRegex },
      { course: keywordRegex }
    ]))
    
    // 只搜索待接单的任务
    searchConditions.push({ status: 'pending' })
    
    // 应用筛选条件
    if (filters.taskType) {
      searchConditions.push({ taskType: filters.taskType })
    }
    if (filters.tutorMode) {
      searchConditions.push({ tutorMode: filters.tutorMode })
    }
    if (filters.location) {
      searchConditions.push({ location: new RegExp(filters.location, 'i') })
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      if (min !== undefined && max !== undefined) {
        searchConditions.push({ 
          budget: _.and([_.gte(min), _.lte(max)]) 
        })
      }
    }
    
    // 执行搜索
    const result = await db.collection('tasks')
      .where(_.and(searchConditions))
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize + 1) // 多查一条判断是否还有更多
      .get()
    
    const tasks = result.data
    const hasMore = tasks.length > pageSize
    
    if (hasMore) {
      tasks.pop() // 移除多查的那一条
    }
    
    // 获取发布者信息
    const publisherIds = [...new Set(tasks.map(task => task.publisherId))]
    const publishersResult = await db.collection('users')
      .where({
        _openid: _.in(publisherIds)
      })
      .field({
        _openid: true,
        nickname: true,
        avatar: true,
        school: true,
        isVerified: true
      })
      .get()
    
    const publishersMap = new Map()
    publishersResult.data.forEach(user => {
      publishersMap.set(user._openid, user)
    })
    
    // 组装任务数据
    const processedTasks = tasks.map(task => {
      const publisher = publishersMap.get(task.publisherId)
      return {
        ...task,
        publisherName: publisher?.nickname || '匿名用户',
        publisherAvatar: publisher?.avatar,
        publisherSchool: publisher?.school,
        publisherVerified: publisher?.isVerified || false
      }
    })
    
    return {
      success: true,
      data: {
        data: processedTasks,
        hasMore
      }
    }
    
  } catch (error) {
    console.error('搜索任务失败:', error)
    throw error
  }
}

// 搜索用户
async function searchUsers(keyword, skip, pageSize, filters) {
  try {
    // 构建搜索条件
    const searchConditions = []
    
    // 关键词搜索（昵称、学校、技能标签）
    const keywordRegex = new RegExp(keyword, 'i')
    searchConditions.push(_.or([
      { nickname: keywordRegex },
      { school: keywordRegex },
      { tags: keywordRegex }
    ]))
    
    // 只搜索已认证的用户
    searchConditions.push({ isVerified: true })
    
    // 只搜索允许被搜索的用户
    searchConditions.push({ 
      $or: [
        { allowSearch: true },
        { allowSearch: _.exists(false) } // 兼容旧数据
      ]
    })
    
    // 应用筛选条件
    if (filters.role) {
      searchConditions.push({ role: filters.role })
    }
    if (filters.school) {
      searchConditions.push({ school: new RegExp(filters.school, 'i') })
    }
    
    // 执行搜索
    const result = await db.collection('users')
      .where(_.and(searchConditions))
      .field({
        _openid: true,
        nickname: true,
        avatar: true,
        school: true,
        role: true,
        tags: true,
        rating: true,
        completedOrders: true,
        createTime: true
      })
      .orderBy('rating', 'desc')
      .skip(skip)
      .limit(pageSize + 1)
      .get()
    
    const users = result.data
    const hasMore = users.length > pageSize
    
    if (hasMore) {
      users.pop()
    }
    
    return {
      success: true,
      data: {
        data: users,
        hasMore
      }
    }
    
  } catch (error) {
    console.error('搜索用户失败:', error)
    throw error
  }
}
