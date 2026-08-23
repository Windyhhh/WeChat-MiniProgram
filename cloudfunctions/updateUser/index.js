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
  const { updateData } = event

  try {
    // 添加更新时间
    updateData.updateTime = new Date()

    const result = await db.collection('users').where({
      _openid: OPENID
    }).update({
      data: updateData
    })

    if (result.stats.updated === 0) {
      return {
        success: false,
        error: '用户不存在或更新失败'
      }
    }

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
