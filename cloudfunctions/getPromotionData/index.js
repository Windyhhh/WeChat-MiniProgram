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
    // 获取用户信息
    const userResult = await db.collection('users')
      .where({ _openid: OPENID })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 生成邀请码（基于openid）
    const inviteCode = generateInviteCode(OPENID)
    
    // 获取邀请统计
    const inviteResult = await db.collection('invites')
      .where({ inviterId: OPENID })
      .get()
    
    const inviteCount = inviteResult.data.length
    
    // 获取免佣记录
    const commissionResult = await db.collection('freeCommissions')
      .where({ userId: OPENID })
      .orderBy('createTime', 'desc')
      .limit(20)
      .get()
    
    // 计算统计数据
    const stats = {
      inviteCount,
      freeCommissions: user.freeCommissions || 0,
      totalReward: 0, // 总奖励金额
      usedCommissions: 0 // 已使用的免佣次数
    }
    
    // 计算已使用的免佣次数
    const usedCommissionResult = await db.collection('orders')
      .where({
        demanderId: OPENID,
        isFree: true
      })
      .get()
    
    stats.usedCommissions = usedCommissionResult.data.length
    
    return {
      success: true,
      data: {
        stats,
        inviteCode,
        commissionRecords: commissionResult.data
      }
    }
    
  } catch (error) {
    console.error('获取推广数据失败:', error)
    return {
      success: false,
      message: '服务器错误，请重试'
    }
  }
}

// 生成邀请码
function generateInviteCode(openid) {
  if (!openid) return ''
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // 使用openid的hash值作为种子
  let hash = 0
  for (let i = 0; i < openid.length; i++) {
    const char = openid.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  // 生成6位邀请码
  for (let i = 0; i < 6; i++) {
    hash = Math.abs(hash)
    result += chars[hash % chars.length]
    hash = Math.floor(hash / chars.length)
  }
  
  return result
}
