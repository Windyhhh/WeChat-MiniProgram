/**
 * API调用工具类
 */

const { showToast, showLoading, hideLoading } = require('./util.js')

class API {
  /**
   * 调用云函数
   * @param {string} name 云函数名称
   * @param {object} data 传递的数据
   * @param {boolean} showLoad 是否显示loading
   * @returns {Promise}
   */
  static async callFunction(name, data = {}, showLoad = true) {
    if (showLoad) {
      showLoading()
    }

    try {
      const result = await wx.cloud.callFunction({
        name,
        data
      })

      if (showLoad) {
        hideLoading()
      }

      if (result.result && result.result.success === false) {
        showToast(result.result.error || '操作失败')
        return null
      }

      return result.result
    } catch (error) {
      if (showLoad) {
        hideLoading()
      }
      console.error(`调用云函数${name}失败:`, error)
      showToast('网络错误，请重试')
      return null
    }
  }

  /**
   * 用户登录
   */
  static async login() {
    return await this.callFunction('login')
  }

  /**
   * 获取用户信息
   * @param {string} openid 用户openid
   */
  static async getUserInfo(openid = '') {
    return await this.callFunction('getUserInfo', { openid })
  }

  /**
   * 更新用户信息
   * @param {object} updateData 更新的数据
   */
  static async updateUser(updateData) {
    return await this.callFunction('updateUser', { updateData })
  }

  /**
   * 创建任务
   * @param {object} taskData 任务数据
   */
  static async createTask(taskData) {
    return await this.callFunction('taskCreate', { taskData })
  }

  /**
   * 获取任务列表
   * @param {object} params 查询参数
   */
  static async getTaskList(params = {}) {
    return await this.callFunction('taskList', params)
  }

  /**
   * 获取任务详情
   * @param {string} taskId 任务ID
   */
  static async getTaskDetail(taskId) {
    return await this.callFunction('taskDetail', { taskId })
  }

  /**
   * 接单
   * @param {string} taskId 任务ID
   * @param {string} reason 接单理由
   */
  static async acceptTask(taskId, reason) {
    return await this.callFunction('taskAccept', { taskId, reason })
  }

  /**
   * 确认接单
   * @param {string} taskId 任务ID
   * @param {string} tutorId 辅导者ID
   */
  static async confirmTask(taskId, tutorId) {
    return await this.callFunction('taskConfirm', { taskId, tutorId })
  }

  /**
   * 发送消息
   * @param {object} messageData 消息数据
   */
  static async sendMessage(messageData) {
    return await this.callFunction('messageSend', { messageData })
  }

  /**
   * 获取聊天列表
   */
  static async getChatList() {
    return await this.callFunction('chatList')
  }

  /**
   * 获取聊天记录
   * @param {string} targetId 对方ID
   * @param {number} page 页码
   */
  static async getChatHistory(targetId, page = 1) {
    return await this.callFunction('chatHistory', { targetId, page })
  }

  /**
   * 创建订单
   * @param {object} orderData 订单数据
   */
  static async createOrder(orderData) {
    return await this.callFunction('orderCreate', { orderData })
  }

  /**
   * 支付订单
   * @param {string} orderId 订单ID
   */
  static async payOrder(orderId) {
    return await this.callFunction('orderPay', { orderId })
  }

  /**
   * 获取订单列表
   * @param {object} params 查询参数
   */
  static async getOrderList(params = {}) {
    return await this.callFunction('orderList', params)
  }

  /**
   * 完成订单
   * @param {string} orderId 订单ID
   */
  static async completeOrder(orderId) {
    return await this.callFunction('orderComplete', { orderId })
  }

  /**
   * 上传文件
   * @param {string} filePath 文件路径
   * @param {string} cloudPath 云端路径
   */
  static async uploadFile(filePath, cloudPath) {
    showLoading('上传中...')
    
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
      
      hideLoading()
      return result
    } catch (error) {
      hideLoading()
      console.error('上传文件失败:', error)
      showToast('上传失败')
      return null
    }
  }

  /**
   * 删除文件
   * @param {array} fileList 文件ID列表
   */
  static async deleteFile(fileList) {
    try {
      const result = await wx.cloud.deleteFile({
        fileList
      })
      return result
    } catch (error) {
      console.error('删除文件失败:', error)
      return null
    }
  }
}

module.exports = API
