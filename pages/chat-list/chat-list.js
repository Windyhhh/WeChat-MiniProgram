// pages/chat-list/chat-list.js
const app = getApp()
const API = require('../../utils/api.js')
const { formatRelativeTime, showToast } = require('../../utils/util.js')

Page({
  data: {
    chatList: [],
    filteredChatList: [],
    searchKeyword: '',
    loading: true
  },

  onLoad() {
    this.checkLoginAndLoad()
  },

  onShow() {
    // 每次显示页面时刷新聊天列表
    if (app.globalData.openid) {
      this.loadChatList()
    }
  },

  onPullDownRefresh() {
    this.loadChatList().then(() => {
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
        content: '需要登录后才能查看聊天记录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            })
          }
        }
      })
      return
    }

    await this.loadChatList()
  },

  /**
   * 加载聊天列表
   */
  async loadChatList() {
    this.setData({ loading: true })

    try {
      const result = await API.callFunction('getChatList', {}, false)
      
      if (result && result.success) {
        const chatList = result.data.map(chat => ({
          ...chat,
          lastMessageTime: formatRelativeTime(new Date(chat.lastMessageTime))
        }))
        
        this.setData({
          chatList,
          filteredChatList: chatList
        })
      }
    } catch (error) {
      console.error('加载聊天列表失败:', error)
      showToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.filterChatList(keyword)
  },

  /**
   * 搜索
   */
  onSearch(e) {
    const keyword = e.detail.value
    this.filterChatList(keyword)
  },

  /**
   * 清空搜索
   */
  onSearchClear() {
    this.setData({ 
      searchKeyword: '',
      filteredChatList: this.data.chatList
    })
  },

  /**
   * 过滤聊天列表
   */
  filterChatList(keyword) {
    if (!keyword.trim()) {
      this.setData({
        filteredChatList: this.data.chatList
      })
      return
    }

    const filtered = this.data.chatList.filter(chat => 
      chat.name.toLowerCase().includes(keyword.toLowerCase()) ||
      (chat.taskInfo && chat.taskInfo.title.toLowerCase().includes(keyword.toLowerCase()))
    )

    this.setData({
      filteredChatList: filtered
    })
  },

  /**
   * 跳转到聊天页面
   */
  goToChat(e) {
    const chat = e.currentTarget.dataset.chat
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${chat.targetId}&name=${chat.name}&avatar=${chat.avatar || ''}`
    })
  },

  /**
   * 跳转到任务列表
   */
  goToTaskList() {
    wx.switchTab({
      url: '/pages/task-list/task-list'
    })
  }
})
