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
    // 获取用户参与的所有对话
    const messagesResult = await db.collection('messages')
      .where(_.or([
        { fromId: OPENID },
        { toId: OPENID }
      ]))
      .orderBy('createTime', 'desc')
      .get()
    
    if (messagesResult.data.length === 0) {
      return {
        success: true,
        data: []
      }
    }
    
    // 按对话分组，获取每个对话的最新消息
    const conversationMap = new Map()
    
    messagesResult.data.forEach(message => {
      const targetId = message.fromId === OPENID ? message.toId : message.fromId
      
      if (!conversationMap.has(targetId)) {
        conversationMap.set(targetId, {
          targetId,
          lastMessage: message,
          unreadCount: 0
        })
      }
      
      // 统计未读消息数量
      if (message.toId === OPENID && !message.isRead) {
        const conversation = conversationMap.get(targetId)
        conversation.unreadCount++
      }
    })
    
    // 获取对话对象的用户信息
    const targetIds = Array.from(conversationMap.keys())
    const usersResult = await db.collection('users')
      .where({
        _openid: _.in(targetIds)
      })
      .field({
        _openid: true,
        nickname: true,
        avatar: true,
        school: true,
        isVerified: true
      })
      .get()
    
    const usersMap = new Map()
    usersResult.data.forEach(user => {
      usersMap.set(user._openid, user)
    })
    
    // 组装聊天列表数据
    const chatList = []
    conversationMap.forEach((conversation, targetId) => {
      const user = usersMap.get(targetId)
      if (user) {
        chatList.push({
          targetId,
          name: user.nickname || '匿名用户',
          avatar: user.avatar,
          school: user.school,
          isVerified: user.isVerified || false,
          lastMessage: conversation.lastMessage.content,
          lastMessageType: conversation.lastMessage.type,
          lastMessageTime: conversation.lastMessage.createTime,
          unreadCount: conversation.unreadCount
        })
      }
    })
    
    // 按最后消息时间排序
    chatList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    
    return {
      success: true,
      data: chatList
    }
    
  } catch (error) {
    console.error('获取聊天列表失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
