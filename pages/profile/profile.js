// pages/profile/profile.js
const app = getApp()
const API = require('../../utils/api.js')
const { showToast, showConfirm, generateRandomString } = require('../../utils/util.js')
const { SKILL_TAGS, USER_ROLES } = require('../../utils/config.js')

Page({
  data: {
    userInfo: {},
    stats: {
      orderCount: 0,
      rating: 5.0,
      totalEarnings: 0,
      taskCount: 0,
      balance: 0,
      freeCommissions: 0,
      completedTasks: 0
    },
    // 编辑资料
    showEditProfile: false,
    editForm: {
      nickname: ''
    },
    // 编辑技能
    showEditSkills: false,
    skillOptions: SKILL_TAGS,
    selectedSkills: [],
    // 加载状态
    saveLoading: false,
    loading: true,

    // 功能菜单
    menuItems: [
      {
        icon: 'orders-o',
        title: '我的订单',
        desc: '查看订单状态',
        url: '/pages/order-list/order-list',
        badge: 0
      },
      {
        icon: 'chat-o',
        title: '消息中心',
        desc: '查看聊天记录',
        url: '/pages/chat-list/chat-list',
        badge: 0
      },
      {
        icon: 'gold-coin-o',
        title: '我的钱包',
        desc: '余额和收益',
        url: '/pages/wallet/wallet'
      },
      {
        icon: 'certificate',
        title: '认证中心',
        desc: '完善认证信息',
        url: '/pages/verify/verify'
      },
      {
        icon: 'friends-o',
        title: '推广中心',
        desc: '邀请好友赚佣金',
        url: '/pages/promotion/promotion'
      },
      {
        icon: 'setting-o',
        title: '设置',
        desc: '个人设置',
        url: '/pages/settings/settings'
      }
    ]
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    this.loadUserData()
    this.updateMenuBadges()
  },

  onPullDownRefresh() {
    this.loadUserData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    if (!app.globalData.openid) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  /**
   * 加载用户数据
   */
  async loadUserData() {
    await Promise.all([
      this.loadUserInfo(),
      this.loadUserStats()
    ])
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      const result = await API.getUserInfo()
      if (result && result.success) {
        this.setData({
          userInfo: result.data
        })
        
        // 更新全局数据
        app.globalData.userRole = result.data.role
        app.globalData.isVerified = result.data.isVerified
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  /**
   * 加载用户统计数据
   */
  async loadUserStats() {
    try {
      const result = await API.callFunction('getUserStats', {}, false)
      if (result && result.success) {
        this.setData({
          stats: result.data
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  /**
   * 更新菜单徽章
   */
  async updateMenuBadges() {
    try {
      // 获取未读消息数
      const chatResult = await API.callFunction('getUnreadCount')
      const unreadCount = chatResult?.data?.count || 0

      // 获取待处理订单数
      const orderResult = await API.callFunction('getPendingOrderCount')
      const pendingOrderCount = orderResult?.data?.count || 0

      // 更新菜单徽章
      const updatedMenuItems = this.data.menuItems.map(item => {
        if (item.title === '消息中心') {
          return { ...item, badge: unreadCount }
        }
        if (item.title === '我的订单') {
          return { ...item, badge: pendingOrderCount }
        }
        return item
      })

      this.setData({ menuItems: updatedMenuItems })
    } catch (error) {
      console.error('更新徽章失败:', error)
    }
  },

  /**
   * 菜单点击
   */
  onMenuTap(e) {
    const item = e.currentTarget.dataset.item

    if (item.url) {
      if (item.url.startsWith('/pages/')) {
        wx.navigateTo({
          url: item.url
        })
      } else {
        wx.switchTab({
          url: item.url
        })
      }
    }
  },

  /**
   * 更换头像
   */
  async changeAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        showToast('上传中...', 'loading')
        
        const cloudPath = `avatars/${app.globalData.openid}/${generateRandomString()}.jpg`
        const uploadResult = await API.uploadFile(res.tempFilePaths[0], cloudPath)
        
        if (uploadResult && uploadResult.fileID) {
          // 删除旧头像
          if (this.data.userInfo.avatar) {
            API.deleteFile([this.data.userInfo.avatar])
          }
          
          // 更新头像
          const updateResult = await API.updateUser({
            avatar: uploadResult.fileID
          })
          
          if (updateResult && updateResult.success) {
            this.setData({
              'userInfo.avatar': uploadResult.fileID
            })
            showToast('头像更新成功', 'success')
          }
        }
      }
    } catch (error) {
      console.error('更换头像失败:', error)
      showToast('更换头像失败')
    }
  },

  /**
   * 编辑资料
   */
  editProfile() {
    this.setData({
      showEditProfile: true,
      'editForm.nickname': this.data.userInfo.nickname || ''
    })
  },

  /**
   * 关闭编辑资料弹窗
   */
  closeEditProfile() {
    this.setData({
      showEditProfile: false
    })
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e) {
    this.setData({
      'editForm.nickname': e.detail.value
    })
  },

  /**
   * 保存资料
   */
  async saveProfile() {
    const nickname = this.data.editForm.nickname.trim()
    if (!nickname) {
      showToast('请输入昵称')
      return
    }

    this.setData({ saveLoading: true })

    try {
      const result = await API.updateUser({
        nickname
      })

      if (result && result.success) {
        this.setData({
          'userInfo.nickname': nickname,
          showEditProfile: false
        })
        showToast('保存成功', 'success')
      }
    } catch (error) {
      console.error('保存资料失败:', error)
      showToast('保存失败')
    } finally {
      this.setData({ saveLoading: false })
    }
  },

  /**
   * 编辑技能
   */
  editSkills() {
    this.setData({
      showEditSkills: true,
      selectedSkills: [...(this.data.userInfo.tags || [])]
    })
  },

  /**
   * 关闭技能编辑弹窗
   */
  closeEditSkills() {
    this.setData({
      showEditSkills: false
    })
  },

  /**
   * 切换技能选择
   */
  toggleSkill(e) {
    const skill = e.currentTarget.dataset.skill
    const selectedSkills = [...this.data.selectedSkills]
    const index = selectedSkills.indexOf(skill)

    if (index > -1) {
      selectedSkills.splice(index, 1)
    } else {
      if (selectedSkills.length >= 5) {
        showToast('最多选择5个技能标签')
        return
      }
      selectedSkills.push(skill)
    }

    this.setData({ selectedSkills })
  },

  /**
   * 保存技能
   */
  async saveSkills() {
    this.setData({ saveLoading: true })

    try {
      const result = await API.updateUser({
        tags: this.data.selectedSkills
      })

      if (result && result.success) {
        this.setData({
          'userInfo.tags': this.data.selectedSkills,
          showEditSkills: false
        })
        showToast('保存成功', 'success')
      }
    } catch (error) {
      console.error('保存技能失败:', error)
      showToast('保存失败')
    } finally {
      this.setData({ saveLoading: false })
    }
  },

  /**
   * 跳转到认证页面
   */
  goToVerify() {
    wx.navigateTo({
      url: '/pages/verify/verify'
    })
  },

  /**
   * 跳转到订单列表
   */
  goToOrderList() {
    wx.navigateTo({
      url: '/pages/order-list/order-list'
    })
  },

  /**
   * 跳转到我的任务
   */
  goToMyTasks() {
    wx.navigateTo({
      url: '/pages/task-list/task-list?type=my'
    })
  },

  /**
   * 跳转到推广中心
   */
  goToPromotion() {
    wx.navigateTo({
      url: '/pages/promotion/promotion'
    })
  },

  /**
   * 跳转到钱包
   */
  goToWallet() {
    wx.navigateTo({
      url: '/pages/wallet/wallet'
    })
  },

  /**
   * 切换身份
   */
  async switchRole() {
    const currentRole = this.data.userInfo.role
    const targetRole = currentRole === USER_ROLES.DEMANDER ? USER_ROLES.TUTOR : USER_ROLES.DEMANDER
    const roleText = targetRole === USER_ROLES.DEMANDER ? '需求方' : '辅导者'

    const confirmed = await showConfirm(`确认切换到${roleText}身份吗？`)
    if (!confirmed) return

    try {
      const result = await API.updateUser({
        role: targetRole
      })

      if (result && result.success) {
        this.setData({
          'userInfo.role': targetRole
        })
        app.globalData.userRole = targetRole
        showToast('身份切换成功', 'success')
      }
    } catch (error) {
      console.error('切换身份失败:', error)
      showToast('切换失败')
    }
  },

  /**
   * 跳转到设置
   */
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '如有问题请添加客服微信：campus-tutor-service',
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'campus-tutor-service',
            success: () => {
              showToast('微信号已复制', 'success')
            }
          })
        }
      }
    })
  }
})
