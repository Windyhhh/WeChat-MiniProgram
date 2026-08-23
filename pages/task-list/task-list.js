// pages/task-list/task-list.js
import Toast from '@vant/weapp/toast/toast';
const app = getApp();
const API = require('../../utils/api.js');
const { formatRelativeTime } = require('../../utils/util.js');

Page({
  data: {
    // 任务列表
    taskList: [],
    
    // 筛选和排序
    filterType: 'all',
    sortType: 'time',
    showSort: false,
    
    sortColumns: [
      { text: '最新发布', value: 'time' },
      { text: '价格从低到高', value: 'price_asc' },
      { text: '价格从高到低', value: 'price_desc' }
    ],
    
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    
    // 状态
    loading: false,
    refreshing: false
  },

  onLoad() {
    this.loadTaskList();
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.refreshTaskList();
  },

  onPullDownRefresh() {
    this.refreshTaskList();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreTasks();
    }
  },

  // 加载任务列表
  async loadTaskList(isRefresh = false) {
    if (this.data.loading) return;
    
    this.setData({ 
      loading: true,
      refreshing: isRefresh
    });

    try {
      const { filterType, sortType, page, pageSize } = this.data;

      const result = await API.getTaskList({
        filterType,
        sortType,
        page: isRefresh ? 1 : page,
        pageSize
      });

      if (result && result.success) {
        const { tasks, hasMore } = result.data;

        // 处理任务数据
        const processedTasks = tasks.map(task => this.processTaskData(task));

        this.setData({
          taskList: isRefresh ? processedTasks : [...this.data.taskList, ...processedTasks],
          hasMore,
          page: isRefresh ? 2 : this.data.page + 1
        });
      } else {
        Toast.fail(result?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载任务列表失败:', error);
      Toast.fail('加载失败，请重试');
    } finally {
      this.setData({ 
        loading: false,
        refreshing: false
      });
      
      if (this.data.refreshing) {
        wx.stopPullDownRefresh();
      }
    }
  },

  // 刷新任务列表
  refreshTaskList() {
    this.setData({
      page: 1,
      hasMore: true,
      taskList: []
    });
    this.loadTaskList(true);
  },

  // 加载更多任务
  loadMoreTasks() {
    this.loadTaskList();
  },

  // 处理任务数据
  processTaskData(task) {
    // 任务类型文本
    const typeMap = {
      homework: '作业辅导',
      thesis: '论文指导',
      review: '复习备考',
      project: '项目指导',
      other: '其他'
    };

    // 辅导方式文本
    const modeMap = {
      online: '线上辅导',
      offline: '线下辅导',
      both: '线上线下均可'
    };

    return {
      ...task,
      typeText: typeMap[task.taskType] || '其他',
      tutorModeText: modeMap[task.tutorMode] || '未知',
      createTimeText: formatRelativeTime(new Date(task.createTime)),
      description: task.description.length > 60 ?
                  task.description.substring(0, 60) + '...' :
                  task.description
    };
  },

  // 筛选
  setFilter(e) {
    const filterType = e.currentTarget.dataset.type;
    if (filterType === this.data.filterType) return;
    
    this.setData({ filterType });
    this.refreshTaskList();
  },

  // 排序
  showSortPicker() {
    this.setData({ showSort: true });
  },

  closeSortPicker() {
    this.setData({ showSort: false });
  },

  onSortConfirm(e) {
    const { value } = e.detail;
    this.setData({
      sortType: value.value,
      showSort: false
    });
    this.refreshTaskList();
  },

  // 跳转到任务详情
  goToTaskDetail(e) {
    const task = e.currentTarget.dataset.task;
    wx.navigateTo({
      url: `/pages/task-detail/task-detail?taskId=${task._id}`
    });
  },

  // 跳转到发布任务
  goToPublish() {
    // 检查用户登录状态
    if (!app.globalData.openid) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }

    // 检查用户身份
    if (app.globalData.userRole !== 'demander') {
      wx.showModal({
        title: '提示',
        content: '只有需求方可以发布任务，是否切换身份？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/role-select/role-select'
            });
          }
        }
      });
      return;
    }

    // 检查认证状态
    if (!app.globalData.isVerified) {
      wx.showModal({
        title: '提示',
        content: '发布任务需要先完成校园认证，是否前往认证？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/verify/verify'
            });
          }
        }
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/task-publish/task-publish'
    });
  },

  // 计算属性
  get sortText() {
    const { sortType } = this.data;
    const item = this.data.sortColumns.find(col => col.value === sortType);
    return item ? item.text : '最新发布';
  }
});
