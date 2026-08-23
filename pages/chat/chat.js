// pages/chat/chat.js
const app = getApp()
const API = require('../../utils/api.js')
const { formatTime, showToast, generateRandomString } = require('../../utils/util.js')

Page({
  data: {
    // 聊天对象信息
    targetId: '',
    targetName: '',
    targetAvatar: '',
    
    // 当前用户信息
    currentUserId: '',
    userAvatar: '',
    
    // 消息列表
    messageList: [],
    
    // 输入相关
    inputText: '',
    sending: false,
    
    // 滚动相关
    scrollTop: 0,
    scrollIntoView: '',
    
    // 加载更多
    loadingMore: false,
    hasMore: true,
    currentPage: 1,
    
    // 价格确认
    showPriceModal: false,
    confirmPrice: '',
    priceLoading: false,

    // 消息重发
    retryingMessages: new Set(),

    // 输入状态
    isTyping: false,
    typingTimer: null
  },

  onLoad(options) {
    const { targetId, name, avatar } = options
    
    if (!targetId) {
      showToast('参数错误')
      wx.navigateBack()
      return
    }

    this.setData({
      targetId,
      targetName: decodeURIComponent(name || ''),
      targetAvatar: decodeURIComponent(avatar || ''),
      currentUserId: app.globalData.openid,
      userAvatar: app.globalData.userInfo?.avatarUrl || ''
    })

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: this.data.targetName || '聊天'
    })

    this.loadChatHistory()
  },

  onShow() {
    // 标记消息为已读
    this.markMessagesAsRead()
  },

  /**
   * 加载聊天记录
   */
  async loadChatHistory(loadMore = false) {
    if (!loadMore) {
      this.setData({ currentPage: 1 })
    }

    if (loadMore) {
      this.setData({ loadingMore: true })
    }

    try {
      const result = await API.callFunction('getChatHistory', {
        targetId: this.data.targetId,
        page: this.data.currentPage,
        pageSize: 20
      }, false)

      if (result && result.success) {
        const newMessages = this.processMessages(result.data.messages)
        
        if (loadMore) {
          // 加载更多时，将新消息添加到列表前面
          this.setData({
            messageList: [...newMessages, ...this.data.messageList],
            hasMore: result.data.hasMore,
            currentPage: this.data.currentPage + 1
          })
        } else {
          // 首次加载时，直接设置消息列表
          this.setData({
            messageList: newMessages,
            hasMore: result.data.hasMore,
            currentPage: 2
          })
          
          // 滚动到底部
          this.scrollToBottom()
        }
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error)
      showToast('加载失败')
    } finally {
      if (loadMore) {
        this.setData({ loadingMore: false })
      }
    }
  },

  /**
   * 处理消息数据
   */
  processMessages(messages) {
    const processedMessages = []
    let lastTime = null

    messages.forEach((message, index) => {
      const messageTime = new Date(message.createTime)
      const timeText = formatTime(messageTime)
      
      // 判断是否显示时间分割线（间隔超过5分钟）
      const showTime = !lastTime || (messageTime - lastTime) > 5 * 60 * 1000
      
      processedMessages.push({
        ...message,
        timeText,
        showTime
      })
      
      if (showTime) {
        lastTime = messageTime
      }
    })

    return processedMessages
  },

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    if (this.data.messageList.length > 0) {
      const lastIndex = this.data.messageList.length - 1
      this.setData({
        scrollIntoView: `message-${lastIndex}`
      })
    }
  },

  /**
   * 加载更多消息
   */
  loadMoreMessages() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadChatHistory(true)
    }
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    })

    // 显示正在输入状态
    this.showTypingStatus()
  },

  /**
   * 显示正在输入状态
   */
  showTypingStatus() {
    if (!this.data.isTyping) {
      this.setData({ isTyping: true })
    }

    // 清除之前的定时器
    if (this.data.typingTimer) {
      clearTimeout(this.data.typingTimer)
    }

    // 2秒后隐藏输入状态
    const timer = setTimeout(() => {
      this.setData({ isTyping: false })
    }, 2000)

    this.setData({ typingTimer: timer })
  },

  /**
   * 发送消息
   */
  async sendMessage() {
    const content = this.data.inputText.trim()
    if (!content || this.data.sending) return

    this.setData({ 
      sending: true,
      inputText: ''
    })

    // 生成临时消息ID
    const tempId = generateRandomString()
    const tempMessage = {
      _id: tempId,
      fromId: this.data.currentUserId,
      toId: this.data.targetId,
      content,
      type: 'text',
      createTime: new Date(),
      status: 'sending',
      showTime: false
    }

    // 立即显示消息
    const newMessageList = [...this.data.messageList, tempMessage]
    this.setData({ messageList: newMessageList })
    this.scrollToBottom()

    try {
      const result = await API.callFunction('sendMessage', {
        targetId: this.data.targetId,
        content,
        type: 'text'
      })

      if (result && result.success) {
        // 更新消息状态为成功
        const updatedList = this.data.messageList.map(msg => 
          msg._id === tempId ? { ...msg, _id: result.data.messageId, status: 'sent' } : msg
        )
        this.setData({ messageList: updatedList })
      } else {
        // 更新消息状态为失败
        const updatedList = this.data.messageList.map(msg => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
        this.setData({ messageList: updatedList })
        showToast('发送失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      // 更新消息状态为失败
      const updatedList = this.data.messageList.map(msg => 
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      )
      this.setData({ messageList: updatedList })
      showToast('发送失败')
    } finally {
      this.setData({ sending: false })
    }
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.sendImageMessage(tempFilePath)
      }
    })
  },

  /**
   * 发送图片消息
   */
  async sendImageMessage(filePath) {
    this.setData({ sending: true })

    try {
      // 上传图片到云存储
      const cloudPath = `chat/${this.data.currentUserId}/${generateRandomString()}.jpg`
      const uploadResult = await API.uploadFile(filePath, cloudPath)

      if (uploadResult && uploadResult.fileID) {
        // 发送图片消息
        const result = await API.callFunction('sendMessage', {
          targetId: this.data.targetId,
          content: uploadResult.fileID,
          type: 'image'
        })

        if (result && result.success) {
          // 添加到消息列表
          const imageMessage = {
            _id: result.data.messageId,
            fromId: this.data.currentUserId,
            toId: this.data.targetId,
            content: uploadResult.fileID,
            type: 'image',
            createTime: new Date(),
            status: 'sent',
            showTime: false
          }

          const newMessageList = [...this.data.messageList, imageMessage]
          this.setData({ messageList: newMessageList })
          this.scrollToBottom()
        }
      }
    } catch (error) {
      console.error('发送图片失败:', error)
      showToast('发送失败')
    } finally {
      this.setData({ sending: false })
    }
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: [url]
    })
  },

  /**
   * 显示价格确认弹窗
   */
  showPriceConfirm() {
    this.setData({
      showPriceModal: true
    })
  },

  /**
   * 关闭价格确认弹窗
   */
  closePriceModal() {
    this.setData({
      showPriceModal: false,
      confirmPrice: ''
    })
  },

  /**
   * 价格输入
   */
  onPriceInput(e) {
    this.setData({
      confirmPrice: e.detail.value
    })
  },

  /**
   * 发送价格确认
   */
  async sendPriceConfirm() {
    const price = parseFloat(this.data.confirmPrice)
    if (!price || price <= 0) {
      showToast('请输入有效价格')
      return
    }

    this.setData({ priceLoading: true })

    try {
      const result = await API.callFunction('sendPriceConfirm', {
        targetId: this.data.targetId,
        price
      })

      if (result && result.success) {
        showToast('价格确认已发送', 'success')
        this.closePriceModal()
        
        // 刷新聊天记录
        this.loadChatHistory()
      }
    } catch (error) {
      console.error('发送价格确认失败:', error)
      showToast('发送失败')
    } finally {
      this.setData({ priceLoading: false })
    }
  },

  /**
   * 标记消息为已读
   */
  async markMessagesAsRead() {
    try {
      await API.callFunction('markMessagesAsRead', {
        targetId: this.data.targetId
      }, false)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  },

  /**
   * 重发消息
   */
  async retryMessage(e) {
    const messageId = e.currentTarget.dataset.id
    const message = this.data.messageList.find(msg => msg._id === messageId)

    if (!message || this.data.retryingMessages.has(messageId)) return

    // 添加到重发列表
    this.data.retryingMessages.add(messageId)

    // 更新消息状态为重发中
    const updatedList = this.data.messageList.map(msg =>
      msg._id === messageId ? { ...msg, status: 'retrying' } : msg
    )
    this.setData({ messageList: updatedList })

    try {
      const result = await API.callFunction('sendMessage', {
        targetId: this.data.targetId,
        content: message.content,
        type: message.type
      })

      if (result && result.success) {
        // 重发成功，更新消息ID和状态
        const finalList = this.data.messageList.map(msg =>
          msg._id === messageId ? {
            ...msg,
            _id: result.data.messageId,
            status: 'sent'
          } : msg
        )
        this.setData({ messageList: finalList })
      } else {
        // 重发失败，恢复失败状态
        const failedList = this.data.messageList.map(msg =>
          msg._id === messageId ? { ...msg, status: 'failed' } : msg
        )
        this.setData({ messageList: failedList })
        showToast('重发失败')
      }
    } catch (error) {
      console.error('重发消息失败:', error)
      const failedList = this.data.messageList.map(msg =>
        msg._id === messageId ? { ...msg, status: 'failed' } : msg
      )
      this.setData({ messageList: failedList })
      showToast('重发失败')
    } finally {
      // 从重发列表中移除
      this.data.retryingMessages.delete(messageId)
    }
  },

  /**
   * 长按消息
   */
  onMessageLongPress(e) {
    const message = e.currentTarget.dataset.message

    if (message.fromId !== this.data.currentUserId) return

    const actions = ['复制']
    if (message.status === 'failed') {
      actions.push('重发')
    }
    actions.push('删除')

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const action = actions[res.tapIndex]
        switch (action) {
          case '复制':
            this.copyMessage(message)
            break
          case '重发':
            this.retryMessage({ currentTarget: { dataset: { id: message._id } } })
            break
          case '删除':
            this.deleteMessage(message)
            break
        }
      }
    })
  },

  /**
   * 复制消息
   */
  copyMessage(message) {
    if (message.type === 'text') {
      wx.setClipboardData({
        data: message.content,
        success: () => {
          showToast('已复制', 'success')
        }
      })
    }
  },

  /**
   * 删除消息
   */
  deleteMessage(message) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条消息吗？',
      success: (res) => {
        if (res.confirm) {
          const updatedList = this.data.messageList.filter(msg => msg._id !== message._id)
          this.setData({ messageList: updatedList })
        }
      }
    })
  },

  /**
   * 显示价格提示
   */
  showPriceTips() {
    wx.showModal({
      title: '价格说明',
      content: '确认价格后，双方同意将自动生成订单。请确保价格准确无误。',
      showCancel: false
    })
  },

  /**
   * 页面卸载时清理定时器
   */
  onUnload() {
    if (this.data.typingTimer) {
      clearTimeout(this.data.typingTimer)
    }
  }
})
