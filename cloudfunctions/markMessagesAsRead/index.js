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
    const { targetId } = event
    
    if (!targetId) {
      return {
        success: false,
        message: '目标用户ID不能为空'
      }
    }
    
    // 标记来自目标用户的未读消息为已读
    await db.collection('messages')
      .where({
        fromId: targetId,
        toId: OPENID,
        isRead: false
      })
      .update({
        data: {
          isRead: true,
          readTime: new Date()
        }
      })
    
    return {
      success: true,
      message: '标记已读成功'
    }
    
  } catch (error) {
    console.error('标记消息已读失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}
