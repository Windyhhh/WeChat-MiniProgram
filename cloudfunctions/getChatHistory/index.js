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
    const { targetId, page = 1, pageSize = 20 } = event
    
    if (!targetId) {
      return {
        success: false,
        message: '目标用户ID不能为空'
      }
    }
    
    // 计算跳过的记录数
    const skip = (page - 1) * pageSize
    
    // 查询聊天记录
    const messagesResult = await db.collection('messages')
      .where(_.or([
        _.and([
          { fromId: OPENID },
          { toId: targetId }
        ]),
        _.and([
          { fromId: targetId },
          { toId: OPENID }
        ])
      ]))
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize + 1) // 多查询一条用于判断是否还有更多数据
      .get()
    
    const messages = messagesResult.data
    const hasMore = messages.length > pageSize
    
    // 如果有多余的数据，移除最后一条
    if (hasMore) {
      messages.pop()
    }
    
    // 反转消息顺序（最新的在后面）
    messages.reverse()
    
    return {
      success: true,
      data: {
        messages,
        hasMore
      }
    }
    
  } catch (error) {
    console.error('获取聊天记录失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
