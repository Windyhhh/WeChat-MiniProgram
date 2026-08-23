// pages/settings/settings.js
const app = getApp()
const API = require('../../utils/api.js')
const { showToast, showConfirm } = require('../../utils/util.js')

Page({
  data: {
    // 设置项
    settings: {
      notifications: {
        newMessage: true,
        newOrder: true,
        taskUpdate: true,
        systemNotice: true
      },
      privacy: {
        showPhone: false,
        showEmail: false,
        allowSearch: true
      },
      other: {
        autoLogin: true,
        savePassword: false,
        darkMode: false
      }
    },
    
    // 版本信息
    version: '1.0.0',
    
    // 缓存信息
    cacheSize: '0MB',
    
    // 加载状态
    loading: false
  },

  onLoad() {
    this.loadSettings()
    this.calculateCacheSize()
  },

  /**
   * 加载设置
   */
  loadSettings() {
    const savedSettings = wx.getStorageSync('userSettings')
    if (savedSettings) {
      this.setData({
        settings: {
          ...this.data.settings,
          ...savedSettings
        }
      })
    }
  },

  /**
   * 保存设置
   */
  saveSettings() {
    wx.setStorageSync('userSettings', this.data.settings)
    showToast('设置已保存', 'success')
  },

  /**
   * 通知设置变更
   */
  onNotificationChange(e) {
    const { type } = e.currentTarget.dataset
    const value = e.detail
    
    this.setData({
      [`settings.notifications.${type}`]: value
    })
    
    this.saveSettings()
  },

  /**
   * 隐私设置变更
   */
  onPrivacyChange(e) {
    const { type } = e.currentTarget.dataset
    const value = e.detail
    
    this.setData({
      [`settings.privacy.${type}`]: value
    })
    
    this.saveSettings()
  },

  /**
   * 其他设置变更
   */
  onOtherChange(e) {
    const { type } = e.currentTarget.dataset
    const value = e.detail
    
    this.setData({
      [`settings.other.${type}`]: value
    })
    
    this.saveSettings()
  },

  /**
   * 计算缓存大小
   */
  calculateCacheSize() {
    try {
      const info = wx.getStorageInfoSync()
      const sizeKB = info.currentSize
      const sizeMB = (sizeKB / 1024).toFixed(2)
      
      this.setData({
        cacheSize: `${sizeMB}MB`
      })
    } catch (error) {
      console.error('计算缓存大小失败:', error)
    }
  },

  /**
   * 清理缓存
   */
  async clearCache() {
    const result = await showConfirm('确认清理', '清理缓存会删除所有本地数据，确定继续吗？')
    
    if (result) {
      try {
        // 保留重要数据
        const importantData = {
          userSettings: wx.getStorageSync('userSettings'),
          userToken: wx.getStorageSync('userToken')
        }
        
        // 清理所有缓存
        wx.clearStorageSync()
        
        // 恢复重要数据
        Object.keys(importantData).forEach(key => {
          if (importantData[key]) {
            wx.setStorageSync(key, importantData[key])
          }
        })
        
        this.calculateCacheSize()
        showToast('缓存清理完成', 'success')
      } catch (error) {
        console.error('清理缓存失败:', error)
        showToast('清理失败，请重试')
      }
    }
  },

  /**
   * 检查更新
   */
  checkUpdate() {
    const updateManager = wx.getUpdateManager()
    
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        wx.showModal({
          title: '发现新版本',
          content: '发现新版本，是否立即更新？',
          success: (modalRes) => {
            if (modalRes.confirm) {
              updateManager.onUpdateReady(() => {
                updateManager.applyUpdate()
              })
              
              updateManager.onUpdateFailed(() => {
                showToast('更新失败，请删除小程序重新搜索')
              })
            }
          }
        })
      } else {
        showToast('已是最新版本', 'success')
      }
    })
  },

  /**
   * 意见反馈
   */
  feedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  /**
   * 关于我们
   */
  aboutUs() {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  /**
   * 用户协议
   */
  userAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=user'
    })
  },

  /**
   * 隐私政策
   */
  privacyPolicy() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=privacy'
    })
  },

  /**
   * 退出登录
   */
  async logout() {
    const result = await showConfirm('确认退出', '确定要退出登录吗？')
    
    if (result) {
      try {
        // 清理用户数据
        app.globalData.openid = ''
        app.globalData.userRole = ''
        app.globalData.isVerified = false
        
        // 清理本地存储
        wx.removeStorageSync('userToken')
        wx.removeStorageSync('userInfo')
        
        showToast('已退出登录', 'success')
        
        // 跳转到登录页
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }, 1500)
      } catch (error) {
        console.error('退出登录失败:', error)
        showToast('退出失败，请重试')
      }
    }
  },

  /**
   * 联系客服
   */
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    })
  }
})
