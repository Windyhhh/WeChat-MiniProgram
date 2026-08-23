// pages/login/login.js
const app = getApp()
const API = require('../../utils/api.js')
const { showToast } = require('../../utils/util.js')

Page({
  data: {
    loginLoading: false,
    showAgreement: false,
    showPrivacy: false,
    userAgreementText: `欢迎使用校园辅导小程序！

1. 服务说明
校园辅导是一个连接校园学习需求方和辅导者的平台，致力于为用户提供优质的学习辅导服务。

2. 用户责任
- 用户应提供真实、准确的个人信息
- 禁止发布虚假、违法或不当内容
- 尊重他人知识产权和隐私权
- 遵守平台交易规则和支付条款

3. 平台责任
- 提供稳定的技术服务支持
- 保护用户隐私和数据安全
- 维护公平的交易环境
- 处理用户投诉和纠纷

4. 免责声明
平台仅提供信息撮合服务，不对交易结果承担责任。用户应自行判断服务质量和风险。

5. 协议修改
平台有权根据法律法规和业务需要修改本协议，修改后的协议将在平台内公布。

如有疑问，请联系客服。`,
    privacyPolicyText: `我们非常重视您的隐私保护，本政策说明我们如何收集、使用和保护您的个人信息。

1. 信息收集
我们可能收集以下信息：
- 微信授权的基本信息（昵称、头像）
- 您主动提供的学校、学号等信息
- 使用服务过程中产生的数据

2. 信息使用
收集的信息用于：
- 提供和改进服务
- 身份验证和安全保护
- 客户服务和技术支持
- 法律法规要求的其他用途

3. 信息保护
我们采取以下措施保护您的信息：
- 数据加密传输和存储
- 严格的访问权限控制
- 定期安全审计和更新
- 员工保密协议约束

4. 信息共享
除法律要求外，我们不会向第三方分享您的个人信息。

5. 您的权利
您有权：
- 查询和更正个人信息
- 删除个人信息
- 撤回授权同意
- 投诉和举报

6. 联系我们
如有隐私相关问题，请通过平台客服联系我们。`
  },

  onLoad() {
    // 检查是否已登录
    if (app.globalData.openid) {
      this.redirectToHome()
    }
  },

  /**
   * 处理微信登录
   */
  async handleLogin() {
    this.setData({ loginLoading: true })

    try {
      // 获取用户授权
      const userProfile = await this.getUserProfile()
      if (!userProfile) {
        this.setData({ loginLoading: false })
        return
      }

      // 调用登录云函数
      const result = await API.login()
      if (result && result.success) {
        // 保存用户信息到全局数据
        app.globalData.openid = result.openid
        app.globalData.userInfo = userProfile.userInfo

        // 更新用户基本信息
        await API.updateUser({
          nickname: userProfile.userInfo.nickName,
          avatar: userProfile.userInfo.avatarUrl
        })

        if (result.data.isNewUser || !result.data.role) {
          // 新用户或未选择身份，跳转到身份选择页
          wx.redirectTo({
            url: '/pages/role-select/role-select'
          })
        } else {
          // 已有用户，更新全局数据并跳转到首页
          app.globalData.userRole = result.data.role
          app.globalData.isVerified = result.data.isVerified
          this.redirectToHome()
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
      showToast('登录失败，请重试')
    } finally {
      this.setData({ loginLoading: false })
    }
  },

  /**
   * 获取用户授权信息
   */
  getUserProfile() {
    return new Promise((resolve) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res)
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err)
          showToast('需要授权才能使用完整功能')
          resolve(null)
        }
      })
    })
  },

  /**
   * 跳转到首页
   */
  redirectToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  /**
   * 显示用户协议
   */
  showUserAgreement() {
    this.setData({
      showAgreement: true
    })
  },

  /**
   * 关闭用户协议
   */
  closeAgreement() {
    this.setData({
      showAgreement: false
    })
  },

  /**
   * 显示隐私政策
   */
  showPrivacyPolicy() {
    this.setData({
      showPrivacy: true
    })
  },

  /**
   * 关闭隐私政策
   */
  closePrivacy() {
    this.setData({
      showPrivacy: false
    })
  }
})
