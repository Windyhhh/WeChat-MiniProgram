// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'campus-tutor-env', // 云环境ID
        traceUser: true,
      })
    }

    // 获取用户信息
    this.globalData = {
      userInfo: null,
      openid: null,
      userRole: null, // 'demander' 或 'tutor'
      isVerified: false
    }
  },

  // 获取用户openid
  async getOpenid() {
    if (this.globalData.openid) {
      return this.globalData.openid
    }
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'login'
      })
      this.globalData.openid = res.result.openid
      return res.result.openid
    } catch (error) {
      console.error('获取openid失败', error)
      return null
    }
  },

  // 检查用户登录状态
  async checkLoginStatus() {
    const openid = await this.getOpenid()
    if (!openid) return false

    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo',
        data: { openid }
      })
      
      if (res.result.success && res.result.data) {
        const userData = res.result.data
        this.globalData.userRole = userData.role
        this.globalData.isVerified = userData.isVerified
        return true
      }
      return false
    } catch (error) {
      console.error('检查登录状态失败', error)
      return false
    }
  }
})
