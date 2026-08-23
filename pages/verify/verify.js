// pages/verify/verify.js
const app = getApp()
const API = require('../../utils/api.js')
const { showToast, validateStudentId, generateRandomString } = require('../../utils/util.js')
const { SCHOOLS, VERIFY_STATUS } = require('../../utils/config.js')

Page({
  data: {
    // 表单数据
    formData: {
      school: '',
      studentId: ''
    },
    // 文件列表
    fileList: [],
    // 学校选择器
    showSchoolPicker: false,
    schoolColumns: [],
    // 提交状态
    submitLoading: false,
    canSubmit: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.openid) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.initSchoolColumns()
    this.loadUserInfo()
  },

  /**
   * 初始化学校选择器数据
   */
  initSchoolColumns() {
    this.setData({
      schoolColumns: SCHOOLS
    })
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      const result = await API.getUserInfo()
      if (result && result.success && result.data) {
        const userData = result.data
        
        // 如果已经认证，显示提示
        if (userData.isVerified === true) {
          wx.showModal({
            title: '已完成认证',
            content: '您已经完成校园认证，无需重复认证',
            showCancel: false,
            success: () => {
              wx.navigateBack()
            }
          })
          return
        }

        // 填充已有信息
        if (userData.school || userData.studentId) {
          this.setData({
            formData: {
              school: userData.school || '',
              studentId: userData.studentId || ''
            }
          })
          this.checkCanSubmit()
        }
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  },

  /**
   * 显示学校选择器
   */
  showSchoolPicker() {
    this.setData({
      showSchoolPicker: true
    })
  },

  /**
   * 关闭学校选择器
   */
  closeSchoolPicker() {
    this.setData({
      showSchoolPicker: false
    })
  },

  /**
   * 确认选择学校
   */
  onSchoolConfirm(e) {
    const school = e.detail.value
    this.setData({
      'formData.school': school,
      showSchoolPicker: false
    })
    this.checkCanSubmit()
  },

  /**
   * 学号输入
   */
  onStudentIdInput(e) {
    const studentId = e.detail.value
    this.setData({
      'formData.studentId': studentId
    })
    this.checkCanSubmit()
  },

  /**
   * 文件上传完成
   */
  async afterRead(e) {
    const { file } = e.detail
    
    try {
      showToast('上传中...', 'loading')
      
      // 生成云端文件路径
      const cloudPath = `verify/${app.globalData.openid}/${generateRandomString()}.${file.url.split('.').pop()}`
      
      // 上传到云存储
      const uploadResult = await API.uploadFile(file.url, cloudPath)
      
      if (uploadResult && uploadResult.fileID) {
        // 更新文件列表
        const fileList = [...this.data.fileList]
        fileList.push({
          ...file,
          url: uploadResult.fileID
        })
        
        this.setData({ fileList })
        this.checkCanSubmit()
        
        showToast('上传成功', 'success')
      } else {
        showToast('上传失败，请重试')
      }
    } catch (error) {
      console.error('上传文件失败:', error)
      showToast('上传失败，请重试')
    }
  },

  /**
   * 删除文件
   */
  deleteFile(e) {
    const { index } = e.detail
    const fileList = [...this.data.fileList]
    
    // 删除云存储文件
    if (fileList[index] && fileList[index].url) {
      API.deleteFile([fileList[index].url])
    }
    
    fileList.splice(index, 1)
    this.setData({ fileList })
    this.checkCanSubmit()
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    const { school, studentId } = this.data.formData
    const hasFile = this.data.fileList.length > 0
    const validStudentId = validateStudentId(studentId)
    
    const canSubmit = school && validStudentId && hasFile
    
    this.setData({ canSubmit })
  },

  /**
   * 提交认证
   */
  async submitVerification() {
    if (!this.data.canSubmit) {
      showToast('请完善认证信息')
      return
    }

    this.setData({ submitLoading: true })

    try {
      const { school, studentId } = this.data.formData
      const cardImage = this.data.fileList[0].url

      const result = await API.updateUser({
        school,
        studentId,
        cardImage,
        isVerified: VERIFY_STATUS.PENDING
      })

      if (result && result.success) {
        // 更新全局数据
        app.globalData.isVerified = VERIFY_STATUS.PENDING

        wx.showModal({
          title: '提交成功',
          content: '认证信息已提交，我们将在1-3个工作日内完成审核，请耐心等待',
          showCancel: false,
          success: () => {
            // 根据用户身份跳转
            if (app.globalData.userRole) {
              wx.switchTab({
                url: '/pages/index/index'
              })
            } else {
              wx.redirectTo({
                url: '/pages/role-select/role-select'
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('提交认证失败:', error)
      showToast('提交失败，请重试')
    } finally {
      this.setData({ submitLoading: false })
    }
  },

  /**
   * 跳过认证
   */
  skipVerification() {
    wx.showModal({
      title: '确认跳过',
      content: '跳过认证将无法享受认证用户的特权，建议您完成认证',
      confirmText: '确认跳过',
      cancelText: '继续认证',
      success: (res) => {
        if (res.confirm) {
          // 根据用户身份跳转
          if (app.globalData.userRole) {
            wx.switchTab({
              url: '/pages/index/index'
            })
          } else {
            wx.redirectTo({
              url: '/pages/role-select/role-select'
            })
          }
        }
      }
    })
  }
})
