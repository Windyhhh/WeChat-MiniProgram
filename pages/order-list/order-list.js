// pages/order-list/order-list.js
const app = getApp()
const API = require('../../utils/api.js')
const { formatRelativeTime, showToast } = require('../../utils/util.js')
const { ORDER_STATUS, USER_ROLES } = require('../../utils/config.js')

Page({
  data: {
    currentTab: 'all',
    orderList: [],
    filteredOrderList: [],
    loading: true,
    userRole: '',

    // 统计数据
    orderStats: {
      all: 0,
      pending: 0,
      paid: 0,
      in_progress: 0,
      completed: 0
    },

    // 搜索
    searchKeyword: '',
    showSearch: false,

    // 操作状态
    operatingOrders: new Set()
  },

  onLoad() {
    this.setData({
      userRole: app.globalData.userRole || ''
    })
    this.loadOrderList()
  },

  onShow() {
    // 每次显示页面时刷新订单列表
    this.loadOrderList()
  },

  onPullDownRefresh() {
    this.loadOrderList().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 切换状态标签
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    const filteredList = this.filterOrders(this.data.orderList, tab)

    this.setData({
      currentTab: tab,
      filteredOrderList: filteredList
    })
  },

  /**
   * 计算订单统计
   */
  calculateOrderStats(orderList) {
    const stats = {
      all: orderList.length,
      pending: 0,
      paid: 0,
      in_progress: 0,
      completed: 0
    }

    orderList.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status]++
      }
    })

    return stats
  },

  /**
   * 过滤订单
   */
  filterOrders(orderList, status) {
    if (status === 'all') {
      return orderList
    }
    return orderList.filter(order => order.status === status)
  },

  /**
   * 搜索订单
   */
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.searchOrders(keyword)
  },

  /**
   * 执行搜索
   */
  searchOrders(keyword) {
    if (!keyword.trim()) {
      const filteredList = this.filterOrders(this.data.orderList, this.data.currentTab)
      this.setData({ filteredOrderList: filteredList })
      return
    }

    const searchResult = this.data.orderList.filter(order => {
      const searchText = `${order.taskTitle} ${order.otherUserName} ${order.taskCourse}`.toLowerCase()
      return searchText.includes(keyword.toLowerCase())
    })

    const filteredResult = this.filterOrders(searchResult, this.data.currentTab)
    this.setData({ filteredOrderList: filteredResult })
  },

  /**
   * 切换搜索显示
   */
  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchKeyword: ''
    })

    if (!this.data.showSearch) {
      // 关闭搜索时重置列表
      const filteredList = this.filterOrders(this.data.orderList, this.data.currentTab)
      this.setData({ filteredOrderList: filteredList })
    }
  },

  /**
   * 加载订单列表
   */
  async loadOrderList() {
    if (!app.globalData.openid) {
      wx.showModal({
        title: '请先登录',
        content: '需要登录后才能查看订单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }
        }
      })
      return
    }

    this.setData({ loading: true })

    try {
      const result = await API.callFunction('getOrderList', {
        status: this.data.currentTab === 'all' ? '' : this.data.currentTab,
        page: 1,
        pageSize: 50
      }, false)

      if (result && result.success) {
        const orderList = result.data.map(order => this.processOrderData(order))

        // 计算统计数据
        const stats = this.calculateOrderStats(orderList)

        // 过滤订单
        const filteredList = this.filterOrders(orderList, this.data.currentTab)

        this.setData({
          orderList,
          filteredOrderList: filteredList,
          orderStats: stats
        })
      }
    } catch (error) {
      console.error('加载订单列表失败:', error)
      showToast('加载失败，请重试')
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 处理订单数据
   */
  processOrderData(order) {
    const userRole = this.data.userRole
    const isCurrentUserDemander = userRole === USER_ROLES.DEMANDER
    
    // 确定对方用户信息
    const otherUser = isCurrentUserDemander ? order.tutorInfo : order.demanderInfo
    
    // 状态文本和类型映射
    const statusMap = {
      [ORDER_STATUS.PENDING]: { text: '待支付', type: 'warning' },
      [ORDER_STATUS.PAID]: { text: '待辅导', type: 'primary' },
      [ORDER_STATUS.IN_PROGRESS]: { text: '进行中', type: 'primary' },
      [ORDER_STATUS.COMPLETED]: { text: '已完成', type: 'success' },
      [ORDER_STATUS.CANCELLED]: { text: '已取消', type: 'default' },
      [ORDER_STATUS.REFUNDED]: { text: '已退款', type: 'default' }
    }

    const statusInfo = statusMap[order.status] || { text: '未知', type: 'default' }

    return {
      ...order,
      statusText: statusInfo.text,
      statusType: statusInfo.type,
      otherUserName: otherUser?.name || '未知用户',
      otherUserAvatar: otherUser?.avatar,
      otherUserVerified: otherUser?.isVerified || false,
      otherUserRole: isCurrentUserDemander ? '辅导者' : '需求方',
      payAmount: order.amount + (order.commission || 0),
      receiveAmount: order.amount - (order.commission || 0),
      createTimeText: formatRelativeTime(new Date(order.createTime))
    }
  },

  /**
   * 跳转到订单详情
   */
  goToOrderDetail(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${order._id}`
    })
  },

  /**
   * 取消订单
   */
  async cancelOrder(e) {
    const order = e.currentTarget.dataset.order

    // 防重复操作
    if (this.data.operatingOrders.has(order._id)) return

    const result = await wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？取消后无法恢复。'
    })

    if (!result.confirm) return

    // 添加到操作中列表
    this.data.operatingOrders.add(order._id)

    try {
      const apiResult = await API.callFunction('cancelOrder', {
        orderId: order._id
      })

      if (apiResult && apiResult.success) {
        showToast('订单已取消', 'success')

        // 更新本地订单状态
        this.updateLocalOrderStatus(order._id, 'cancelled')
      } else {
        showToast(apiResult?.message || '取消失败')
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      showToast('取消失败，请重试')
    } finally {
      // 从操作中列表移除
      this.data.operatingOrders.delete(order._id)
    }
  },

  /**
   * 支付订单
   */
  async payOrder(e) {
    const order = e.currentTarget.dataset.order
    
    try {
      const result = await API.callFunction('createPayment', {
        orderId: order._id
      })

      if (result && result.success) {
        // 调用微信支付
        await wx.requestPayment({
          timeStamp: result.data.timeStamp,
          nonceStr: result.data.nonceStr,
          package: result.data.package,
          signType: result.data.signType,
          paySign: result.data.paySign
        })

        showToast('支付成功', 'success')
        this.loadOrderList()
      }
    } catch (error) {
      console.error('支付失败:', error)
      if (error.errMsg && error.errMsg.includes('cancel')) {
        showToast('支付已取消')
      } else {
        showToast('支付失败，请重试')
      }
    }
  },

  /**
   * 开始辅导
   */
  async startTutoring(e) {
    const order = e.currentTarget.dataset.order
    
    try {
      const result = await API.callFunction('startTutoring', {
        orderId: order._id
      })

      if (result && result.success) {
        showToast('辅导已开始', 'success')
        this.loadOrderList()
      }
    } catch (error) {
      console.error('开始辅导失败:', error)
      showToast('操作失败，请重试')
    }
  },

  /**
   * 确认完成
   */
  async confirmComplete(e) {
    const order = e.currentTarget.dataset.order
    
    const result = await wx.showModal({
      title: '确认完成',
      content: '确认辅导已完成？完成后将自动结算给辅导者。'
    })

    if (!result.confirm) return

    try {
      const apiResult = await API.callFunction('completeOrder', {
        orderId: order._id
      })

      if (apiResult && apiResult.success) {
        showToast('订单已完成', 'success')
        this.loadOrderList()
      }
    } catch (error) {
      console.error('完成订单失败:', error)
      showToast('操作失败，请重试')
    }
  },

  /**
   * 联系对方
   */
  contactOther(e) {
    const order = e.currentTarget.dataset.order
    const userRole = this.data.userRole
    const isCurrentUserDemander = userRole === USER_ROLES.DEMANDER
    
    const targetUser = isCurrentUserDemander ? order.tutorInfo : order.demanderInfo
    
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${targetUser.id}&name=${encodeURIComponent(targetUser.name)}&avatar=${encodeURIComponent(targetUser.avatar || '')}`
    })
  },

  /**
   * 评价订单
   */
  rateOrder(e) {
    const order = e.currentTarget.dataset.order
    wx.navigateTo({
      url: `/pages/rate/rate?orderId=${order._id}`
    })
  },

  /**
   * 更新本地订单状态
   */
  updateLocalOrderStatus(orderId, newStatus) {
    const updatedOrderList = this.data.orderList.map(order => {
      if (order._id === orderId) {
        return {
          ...order,
          status: newStatus,
          statusText: this.getStatusText(newStatus),
          statusType: this.getStatusType(newStatus)
        }
      }
      return order
    })

    // 重新计算统计和过滤
    const stats = this.calculateOrderStats(updatedOrderList)
    const filteredList = this.filterOrders(updatedOrderList, this.data.currentTab)

    this.setData({
      orderList: updatedOrderList,
      filteredOrderList: filteredList,
      orderStats: stats
    })
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      pending: '待支付',
      paid: '待辅导',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取状态类型
   */
  getStatusType(status) {
    const typeMap = {
      pending: 'warning',
      paid: 'primary',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'default',
      refunded: 'default'
    }
    return typeMap[status] || 'default'
  },

  /**
   * 批量操作
   */
  batchOperation() {
    // 可以添加批量删除、批量导出等功能
    wx.showActionSheet({
      itemList: ['批量删除', '导出订单', '刷新数据'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.batchDelete()
            break
          case 1:
            this.exportOrders()
            break
          case 2:
            this.loadOrderList()
            break
        }
      }
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
