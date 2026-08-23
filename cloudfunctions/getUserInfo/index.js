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
  const { openid } = event

  try {
    // 使用传入的openid或当前用户的openid
    const targetOpenid = openid || OPENID

    const result = await db.collection('users').where({
      _openid: targetOpenid
    }).get()

    if (result.data.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    return {
      success: true,
      data: result.data[0]
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
