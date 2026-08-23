// pages/promotion/promotion.js
const app = getApp()
const API = require('../../utils/api.js')
const { formatRelativeTime, showToast, generateInviteCode } = require('../../utils/util.js')

Page({
  data: {
    // 推广数据
    stats: {
      inviteCount: 0,
      freeCommissions: 0,
      totalReward: 0,
      usedCommissions: 0
    },
    
    // 邀请码
    inviteCode: '',
    
    // 推广任务
    promotionTasks: [
      {
        id: 'invite_1',
        title: '邀请1人注册',
        description: '邀请好友注册并完成认证',
        reward: '1次免佣机会',
        target: 1,
        current: 0,
        percentage: 0,
        icon: 'friends-o',
        color: '#36D399',
        status: 'in_progress'
      },
      {
        id: 'invite_3',
        title: '邀请3人注册',
        description: '邀请3位好友注册并完成认证',
        reward: '3次免佣机会 + 5元',
        target: 3,
        current: 0,
        percentage: 0,
        icon: 'gift-o',
        color: '#3B82F6',
        status: 'in_progress'
      },
      {
        id: 'invite_10',
        title: '邀请10人注册',
        description: '邀请10位好友注册并完成认证',
        reward: '10次免佣机会 + 20元',
        target: 10,
        current: 0,
        percentage: 0,
        icon: 'gold-coin-o',
        color: '#F59E0B',
        status: 'in_progress'
      }
    ],
    
    // 免佣记录
    commissionRecords: [],
    
    // 规则弹窗
    showRules: false
  },

  onLoad() {
    this.checkLoginAndLoad()
  },

  onShow() {
    if (app.globalData.openid) {
      this.loadPromotionData()
    }
  },

  onPullDownRefresh() {
    this.loadPromotionData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 检查登录状态并加载数据
   */
  async checkLoginAndLoad() {
    if (!app.globalData.openid) {
      wx.showModal({
        title: '请先登录',
        content: '需要登录后才能查看推广信息',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    await this.loadPromotionData()
  },

  /**
   * 加载推广数据
   */
  async loadPromotionData() {
    try {
      const result = await API.callFunction('getPromotionData', {}, false)
      
      if (result && result.success) {
        const data = result.data
        
        // 更新统计数据
        this.setData({
          stats: data.stats,
          inviteCode: data.inviteCode || this.generateUserInviteCode(),
          commissionRecords: data.commissionRecords.map(record => ({
            ...record,
            createTimeText: formatRelativeTime(new Date(record.createTime))
          }))
        })
        
        // 更新任务进度
        this.updateTaskProgress(data.stats.inviteCount)
      }
    } catch (error) {
      console.error('加载推广数据失败:', error)
      showToast('加载失败，请重试')
    }
  },

  /**
   * 生成用户邀请码
   */
  generateUserInviteCode() {
    const openid = app.globalData.openid
    if (!openid) return ''
    
    // 基于用户openid生成固定的邀请码
    return generateInviteCode(openid)
  },

  /**
   * 更新任务进度
   */
  updateTaskProgress(inviteCount) {
    const tasks = this.data.promotionTasks.map(task => {
      const current = Math.min(inviteCount, task.target)
      const percentage = Math.floor((current / task.target) * 100)
      
      let status = 'in_progress'
      if (current >= task.target) {
        // 检查是否已领取奖励
        status = this.checkTaskClaimed(task.id) ? 'claimed' : 'claimable'
      }
      
      return {
        ...task,
        current,
        percentage,
        status
      }
    })
    
    this.setData({ promotionTasks: tasks })
  },

  /**
   * 检查任务是否已领取
   */
  checkTaskClaimed(taskId) {
    // 这里应该从服务器获取已领取的任务列表
    // 暂时返回false
    return false
  },

  /**
   * 复制邀请码
   */
  copyInviteCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        showToast('邀请码已复制', 'success')
      }
    })
  },

  /**
   * 领取奖励
   */
  async claimReward(e) {
    const task = e.currentTarget.dataset.task
    
    try {
      const result = await API.callFunction('claimPromotionReward', {
        taskId: task.id
      })
      
      if (result && result.success) {
        showToast('奖励领取成功', 'success')
        this.loadPromotionData()
      }
    } catch (error) {
      console.error('领取奖励失败:', error)
      showToast('领取失败，请重试')
    }
  },

  /**
   * 分享邀请
   */
  shareInvite() {
    // 微信分享会自动触发 onShareAppMessage
    return {
      title: '校园辅导 - 连接校园，共享知识',
      path: `/pages/index/index?inviteCode=${this.data.inviteCode}`,
      imageUrl: '/images/share-image.jpg'
    }
  },

  /**
   * 显示规则说明
   */
  showRules() {
    this.setData({
      showRules: true
    })
  },

  /**
   * 关闭规则说明
   */
  closeRules() {
    this.setData({
      showRules: false
    })
  },

  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    return {
      title: `我在校园辅导找到了很多优质辅导，邀请码：${this.data.inviteCode}`,
      path: `/pages/index/index?inviteCode=${this.data.inviteCode}`,
      imageUrl: '/images/share-image.jpg'
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: `校园辅导 - 连接校园，共享知识，邀请码：${this.data.inviteCode}`,
      imageUrl: '/images/share-image.jpg'
    }
  }
})
