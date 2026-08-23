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
    const { targetId, content, type = 'text' } = event
    
    if (!targetId || !content) {
      return {
        success: false,
        message: '参数不完整'
      }
    }
    
    // 验证消息类型
    if (!['text', 'image', 'system'].includes(type)) {
      return {
        success: false,
        message: '不支持的消息类型'
      }
    }
    
    // 检查目标用户是否存在
    const targetUserResult = await db.collection('users')
      .where({ _openid: targetId })
      .get()
    
    if (targetUserResult.data.length === 0) {
      return {
        success: false,
        message: '目标用户不存在'
      }
    }
    
    // 获取发送者信息
    const senderResult = await db.collection('users')
      .where({ _openid: OPENID })
      .get()
    
    if (senderResult.data.length === 0) {
      return {
        success: false,
        message: '发送者不存在'
      }
    }
    
    const sender = senderResult.data[0]
    
    // 创建消息记录
    const messageData = {
      fromId: OPENID,
      toId: targetId,
      content: content.trim(),
      type,
      isRead: false,
      createTime: new Date(),
      senderName: sender.nickname || '匿名用户',
      senderAvatar: sender.avatar
    }
    
    const result = await db.collection('messages').add({
      data: messageData
    })
    
    return {
      success: true,
      data: {
        messageId: result._id
      },
      message: '消息发送成功'
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
