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
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      _openid: OPENID
    }).get()

    let userData = null

    if (userResult.data.length === 0) {
      // 用户不存在，创建新用户
      const createResult = await db.collection('users').add({
        data: {
          _openid: OPENID,
          role: '', // 身份：demander/tutor
          school: '',
          studentId: '',
          isVerified: false,
          tags: [], // 技能标签
          avatar: '',
          nickname: '',
          balance: 0, // 余额
          freeCommissions: 0, // 免佣次数
          inviteCode: '', // 邀请码
          invitedBy: '', // 邀请人
          createTime: new Date(),
          updateTime: new Date()
        }
      })

      userData = {
        _id: createResult._id,
        _openid: OPENID,
        role: '',
        isVerified: false,
        isNewUser: true
      }
    } else {
      // 用户已存在，返回用户信息
      userData = userResult.data[0]
      userData.isNewUser = false
    }

    return {
      success: true,
      openid: OPENID,
      data: userData
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
