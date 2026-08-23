// pages/index/index.js
const app = getApp()
const API = require('../../utils/api.js')
const { formatRelativeTime, showToast } = require('../../utils/util.js')

Page({
  data: {
    // 用户信息
    userInfo: null,
    roleText: '',
    // 轮播图数据
    banners: [
      {
        image: '/images/banner1.jpg',
        title: '连接校园，共享知识',
        subtitle: '找到最适合的学习伙伴'
      },
      {
        image: '/images/banner2.jpg',
        title: '专业辅导，高效学习',
        subtitle: '一对一个性化辅导服务'
      },
      {
        image: '/images/banner3.jpg',
        title: '分享知识，获得收益',
        subtitle: '成为辅导者，帮助他人成长'
      }
    ],
    // 平台统计数据
    stats: {
      totalTasks: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalAmount: '0万',
      todayTasks: 0,
      todayUsers: 0,
      todayOrders: 0,
      todayAmount: '0'
    },
    // 热门任务
    hotTasks: [],
    // 优秀辅导者
    excellentTutors: [],
    // 公告通知
    notice: null,
    // 登录弹窗
    showLoginPopup: false,
    loginLoading: false,
    // 页面状态
    loading: true,
    refreshing: false
  },

  onLoad() {
    this.initPage()
  },

  onShow() {
    // 每次显示页面时检查登录状态和刷新数据
    this.checkLoginStatus()
    this.loadUserInfo()
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadPageData().then(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    })
  },

  /**
   * 初始化页面
   */
  async initPage() {
    this.setData({ loading: true })
    await this.checkLoginStatus()
    await this.loadUserInfo()
    await this.loadPageData()
    this.setData({ loading: false })
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    const isLoggedIn = await app.checkLoginStatus()
    if (!isLoggedIn) {
      this.setData({
        showLoginPopup: true,
        userInfo: null,
        roleText: ''
      })
    }
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    if (!app.globalData.openid) return

    try {
      const result = await API.getUserInfo()
      if (result && result.success) {
        const userInfo = result.data
        const roleText = userInfo.role === 'demander' ? '需求方' :
                        userInfo.role === 'tutor' ? '辅导者' : '未选择'

        this.setData({
          userInfo,
          roleText
        })
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  /**
   * 加载页面数据
   */
  async loadPageData() {
    await Promise.all([
      this.loadStats(),
      this.loadHotTasks(),
      this.loadExcellentTutors(),
      this.loadNotice()
    ])
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const result = await API.callFunction('getStats', {}, false)
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
   * 加载热门任务
   */
  async loadHotTasks() {
    try {
      const result = await API.getTaskList({
        page: 1,
        pageSize: 5,
        sortBy: 'hot'
      })
      
      if (result && result.success) {
        const tasks = result.data.map(task => ({
          ...task,
          createTimeText: formatRelativeTime(new Date(task.createTime))
        }))
        
        this.setData({
          hotTasks: tasks
        })
      }
    } catch (error) {
      console.error('加载热门任务失败:', error)
    }
  },

  /**
   * 加载优秀辅导者
   */
  async loadExcellentTutors() {
    try {
      const result = await API.callFunction('getExcellentTutors', {}, false)
      if (result && result.success) {
        this.setData({
          excellentTutors: result.data
        })
      }
    } catch (error) {
      console.error('加载优秀辅导者失败:', error)
    }
  },

  /**
   * 加载公告通知
   */
  async loadNotice() {
    try {
      const result = await API.callFunction('getLatestNotice', {}, false)
      if (result && result.success && result.data) {
        this.setData({
          notice: result.data
        })
      }
    } catch (error) {
      console.error('加载公告失败:', error)
    }
  },

  /**
   * 处理登录
   */
  async handleLogin() {
    this.setData({ loginLoading: true })

    try {
      const result = await API.login()
      if (result && result.success) {
        app.globalData.openid = result.openid
        
        if (result.data.isNewUser || !result.data.role) {
          // 新用户或未选择身份，跳转到身份选择页
          wx.redirectTo({
            url: '/pages/role-select/role-select'
          })
        } else {
          // 已有用户，更新全局数据
          app.globalData.userRole = result.data.role
          app.globalData.isVerified = result.data.isVerified
          
          this.setData({
            showLoginPopup: false
          })
          
          showToast('登录成功', 'success')
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      this.setData({ loginLoading: false })
    }
  },

  /**
   * 跳转到发布任务页
   */
  goToPublish() {
    if (!this.checkUserLogin()) return
    
    if (app.globalData.userRole !== 'demander') {
      showToast('请切换到需求方身份')
      return
    }
    
    wx.navigateTo({
      url: '/pages/task-publish/task-publish'
    })
  },

  /**
   * 跳转到任务列表页
   */
  goToTaskList() {
    wx.switchTab({
      url: '/pages/task-list/task-list'
    })
  },

  /**
   * 跳转到消息页
   */
  goToChat() {
    if (!this.checkUserLogin()) return
    
    wx.switchTab({
      url: '/pages/chat-list/chat-list'
    })
  },

  /**
   * 跳转到推广页
   */
  goToPromotion() {
    if (!this.checkUserLogin()) return
    
    wx.navigateTo({
      url: '/pages/promotion/promotion'
    })
  },

  /**
   * 跳转到任务详情页
   */
  goToTaskDetail(e) {
    const taskId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?id=${taskId}`
    })
  },

  /**
   * 检查用户登录状态
   */
  checkUserLogin() {
    if (!app.globalData.openid) {
      this.setData({
        showLoginPopup: true
      })
      return false
    }
    return true
  },

  /**
   * 跳转到通知页面
   */
  goToNotifications() {
    if (!this.checkUserLogin()) return

    wx.navigateTo({
      url: '/pages/notifications/notifications'
    })
  },

  /**
   * 跳转到搜索页面
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  /**
   * 分享给朋友
   */
  onShareAppMessage() {
    const userInfo = this.data.userInfo
    const inviteCode = userInfo?.inviteCode || ''

    return {
      title: '校园辅导 - 连接校园，共享知识',
      path: `/pages/index/index${inviteCode ? '?inviteCode=' + inviteCode : ''}`,
      imageUrl: '/images/share-banner.jpg'
    }
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const userInfo = this.data.userInfo
    const inviteCode = userInfo?.inviteCode || ''

    return {
      title: '校园辅导 - 找到最适合的学习伙伴',
      query: inviteCode ? `inviteCode=${inviteCode}` : '',
      imageUrl: '/images/share-banner.jpg'
    }
  }
})
