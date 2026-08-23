// pages/search/search.js
const API = require('../../utils/api.js')
const { showToast, formatRelativeTime } = require('../../utils/util.js')

Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    searchHistory: [],
    hotKeywords: ['数学', '英语', '计算机', '物理', '化学', '论文指导'],
    
    // 搜索结果
    searchResults: [],
    searchType: 'task', // task, user
    
    // 状态
    searching: false,
    hasSearched: false,
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    
    // 筛选
    showFilter: false,
    filters: {
      taskType: '',
      tutorMode: '',
      priceRange: '',
      location: ''
    }
  },

  onLoad() {
    this.loadSearchHistory()
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({
      searchHistory: history.slice(0, 10) // 最多显示10条
    })
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory(keyword) {
    if (!keyword.trim()) return
    
    let history = wx.getStorageSync('searchHistory') || []
    
    // 移除重复项
    history = history.filter(item => item !== keyword)
    
    // 添加到开头
    history.unshift(keyword)
    
    // 限制数量
    history = history.slice(0, 20)
    
    wx.setStorageSync('searchHistory', history)
    this.setData({ searchHistory: history.slice(0, 10) })
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  /**
   * 搜索确认
   */
  onSearchConfirm(e) {
    const keyword = e.detail.value || this.data.searchKeyword
    this.performSearch(keyword)
  },

  /**
   * 点击搜索历史
   */
  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchKeyword: keyword })
    this.performSearch(keyword)
  },

  /**
   * 点击热门关键词
   */
  onHotKeywordTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchKeyword: keyword })
    this.performSearch(keyword)
  },

  /**
   * 执行搜索
   */
  async performSearch(keyword, isLoadMore = false) {
    if (!keyword.trim()) {
      showToast('请输入搜索关键词')
      return
    }

    if (!isLoadMore) {
      this.setData({
        searching: true,
        searchResults: [],
        page: 1,
        hasMore: true,
        hasSearched: false
      })
    }

    try {
      const result = await API.callFunction('searchTasks', {
        keyword: keyword.trim(),
        type: this.data.searchType,
        page: this.data.page,
        pageSize: this.data.pageSize,
        filters: this.data.filters
      })

      if (result && result.success) {
        const { data, hasMore } = result.data
        const processedData = data.map(item => this.processSearchResult(item))
        
        this.setData({
          searchResults: isLoadMore ? 
            [...this.data.searchResults, ...processedData] : 
            processedData,
          hasMore,
          page: this.data.page + 1,
          hasSearched: true
        })

        // 保存搜索历史
        if (!isLoadMore) {
          this.saveSearchHistory(keyword)
        }
      } else {
        showToast(result?.message || '搜索失败')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      showToast('搜索失败，请重试')
    } finally {
      this.setData({ searching: false })
    }
  },

  /**
   * 处理搜索结果
   */
  processSearchResult(item) {
    if (this.data.searchType === 'task') {
      return {
        ...item,
        createTimeText: formatRelativeTime(new Date(item.createTime)),
        typeText: this.getTaskTypeText(item.taskType),
        tutorModeText: this.getTutorModeText(item.tutorMode)
      }
    } else {
      return {
        ...item,
        tagsText: item.tags ? item.tags.join('、') : ''
      }
    }
  },

  /**
   * 获取任务类型文本
   */
  getTaskTypeText(type) {
    const typeMap = {
      homework: '作业辅导',
      thesis: '论文指导',
      review: '复习备考',
      project: '项目指导',
      other: '其他'
    }
    return typeMap[type] || '其他'
  },

  /**
   * 获取辅导方式文本
   */
  getTutorModeText(mode) {
    const modeMap = {
      online: '线上辅导',
      offline: '线下辅导',
      both: '线上线下均可'
    }
    return modeMap[mode] || '未知'
  },

  /**
   * 切换搜索类型
   */
  switchSearchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      searchType: type,
      searchResults: [],
      hasSearched: false
    })
    
    // 如果有搜索关键词，重新搜索
    if (this.data.searchKeyword) {
      this.performSearch(this.data.searchKeyword)
    }
  },

  /**
   * 显示筛选
   */
  showFilterPanel() {
    this.setData({ showFilter: true })
  },

  /**
   * 关闭筛选
   */
  closeFilter() {
    this.setData({ showFilter: false })
  },

  /**
   * 应用筛选
   */
  applyFilter() {
    this.setData({ showFilter: false })
    
    if (this.data.searchKeyword) {
      this.performSearch(this.data.searchKeyword)
    }
  },

  /**
   * 清空搜索历史
   */
  clearSearchHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory')
          this.setData({ searchHistory: [] })
          showToast('已清空', 'success')
        }
      }
    })
  },

  /**
   * 加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.searching && this.data.searchKeyword) {
      this.performSearch(this.data.searchKeyword, true)
    }
  },

  /**
   * 点击搜索结果
   */
  onResultTap(e) {
    const item = e.currentTarget.dataset.item
    
    if (this.data.searchType === 'task') {
      wx.navigateTo({
        url: `/pages/task-detail/task-detail?id=${item._id}`
      })
    } else {
      wx.navigateTo({
        url: `/pages/user-profile/user-profile?id=${item._openid}`
      })
    }
  }
})
