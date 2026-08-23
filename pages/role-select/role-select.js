// pages/role-select/role-select.js
const app = getApp()
const API = require('../../utils/api.js')
const { showToast } = require('../../utils/util.js')
const { USER_ROLES } = require('../../utils/config.js')

Page({
  data: {
    selectedRole: '', // 选中的身份
    confirmLoading: false
  },

  onLoad() {
    // 检查是否已登录
    if (!app.globalData.openid) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    // 如果已有身份，预选中
    if (app.globalData.userRole) {
      this.setData({
        selectedRole: app.globalData.userRole
      })
    }
  },

  /**
   * 选择身份
   */
  selectRole(e) {
    const role = e.currentTarget.dataset.role
    this.setData({
      selectedRole: role
    })

    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    })
  },

  /**
   * 确认选择身份
   */
  async confirmRole() {
    if (!this.data.selectedRole) {
      showToast('请选择一个身份')
      return
    }

    this.setData({ confirmLoading: true })

    try {
      const result = await API.updateUser({
        role: this.data.selectedRole
      })

      if (result && result.success) {
        // 更新全局数据
        app.globalData.userRole = this.data.selectedRole

        showToast('身份设置成功', 'success')

        // 根据身份跳转到不同页面
        if (this.data.selectedRole === USER_ROLES.DEMANDER) {
          // 需求方跳转到首页
          wx.switchTab({
            url: '/pages/index/index'
          })
        } else {
          // 辅导者建议先完成认证
          wx.showModal({
            title: '建议完成认证',
            content: '为了获得更多接单机会，建议您先完成校园认证',
            confirmText: '去认证',
            cancelText: '稍后再说',
            success: (res) => {
              if (res.confirm) {
                wx.redirectTo({
                  url: '/pages/verify/verify'
                })
              } else {
                wx.switchTab({
                  url: '/pages/index/index'
                })
              }
            }
          })
        }
      }
    } catch (error) {
      console.error('设置身份失败:', error)
      showToast('设置失败，请重试')
    } finally {
      this.setData({ confirmLoading: false })
    }
  },

  /**
   * 跳过选择
   */
  skipSelection() {
    wx.showModal({
      title: '确认跳过',
      content: '跳过身份选择将限制部分功能使用，您可以稍后在个人中心设置',
      confirmText: '确认跳过',
      cancelText: '重新选择',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }
    })
  }
})
