// pages/task-detail/task-detail.js
import Toast from '@vant/weapp/toast/toast';
const app = getApp();
const API = require('../../utils/api.js');
const { formatRelativeTime } = require('../../utils/util.js');

Page({
  data: {
    taskId: '',
    task: null,
    applicants: [],
    
    // 用户状态
    currentUser: null,
    isPublisher: false,
    canApply: false,
    canContact: false,
    hasApplied: false,
    
    // 页面状态
    loading: true,
    
    // 申请相关
    showApplyModal: false,
    applyReason: '',
    applyLoading: false,
    submitLoading: false
  },

  onLoad(options) {
    const { taskId } = options;
    if (!taskId) {
      Toast.fail('任务ID不能为空');
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({ taskId });
    this.loadCurrentUser();
    this.loadTaskDetail();
  },

  // 加载当前用户信息
  loadCurrentUser() {
    this.setData({
      currentUser: {
        _openid: app.globalData.openid,
        role: app.globalData.userRole,
        isVerified: app.globalData.isVerified
      }
    });
  },

  // 加载任务详情
  async loadTaskDetail() {
    this.setData({ loading: true });

    try {
      const result = await API.getTaskDetail(this.data.taskId);

      if (result && result.success) {
        const { task, applicants } = result.data;

        // 处理任务数据
        const processedTask = this.processTaskData(task);

        // 判断用户状态
        this.checkUserStatus(processedTask, applicants);

        this.setData({
          task: processedTask,
          applicants: applicants || []
        });
      } else {
        Toast.fail(result?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
      Toast.fail('加载失败，请重试');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理任务数据
  processTaskData(task) {
    // 任务类型文本
    const typeMap = {
      homework: '作业辅导',
      thesis: '论文指导',
      review: '复习备考',
      other: '其他'
    };
    
    // 辅导方式文本
    const modeMap = {
      online: '线上辅导',
      offline: '线下辅导',
      both: '线上线下均可'
    };
    
    // 状态文本
    const statusMap = {
      pending: '招募中',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    };
    
    // 时间格式化
    const createTime = new Date(task.createTime);
    const createTimeText = createTime.toLocaleDateString() + ' ' + 
                          createTime.toLocaleTimeString().slice(0, 5);
    
    return {
      ...task,
      typeText: typeMap[task.taskType] || '其他',
      tutorModeText: modeMap[task.tutorMode] || '未知',
      statusText: statusMap[task.status] || '未知',
      createTimeText
    };
  },

  // 检查用户状态
  checkUserStatus(task, applicants) {
    const { currentUser } = this.data;
    
    if (!currentUser) {
      this.setData({
        isPublisher: false,
        canApply: false,
        canContact: false,
        hasApplied: false
      });
      return;
    }
    
    const isPublisher = task.publisherId === currentUser._openid;
    const hasApplied = applicants.some(app => app.applicantId === currentUser._openid);
    const canApply = !isPublisher && 
                    currentUser.role === 'tutor' && 
                    task.status === 'pending' && 
                    !hasApplied &&
                    currentUser.isVerified;
    const canContact = !isPublisher && currentUser.isVerified;
    
    this.setData({
      isPublisher,
      canApply,
      canContact,
      hasApplied
    });
  },

  // 预览图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset;
    const { images } = this.data.task;
    const urls = images.map(img => img.url);
    
    wx.previewImage({
      current: urls[index],
      urls
    });
  },

  // 联系发布者
  contactPublisher() {
    const { task } = this.data;
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${task.publisherId}&targetName=${task.publisherName}`
    });
  },

  // 联系申请者
  contactApplicant(e) {
    const applicant = e.currentTarget.dataset.applicant;
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${applicant.applicantId}&targetName=${applicant.name}`
    });
  },

  // 申请接单
  applyTask() {
    // 检查登录状态
    if (!this.data.currentUser) {
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }
    
    // 检查身份
    if (this.data.currentUser.role !== 'tutor') {
      wx.showModal({
        title: '提示',
        content: '只有辅导者可以接单，是否切换身份？',
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
    if (!this.data.currentUser.isVerified) {
      wx.showModal({
        title: '提示',
        content: '接单需要先完成校园认证，是否前往认证？',
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
    
    this.setData({ showApplyModal: true });
  },

  // 关闭申请弹窗
  closeApplyModal() {
    this.setData({ 
      showApplyModal: false,
      applyReason: ''
    });
  },

  // 输入申请理由
  onApplyReasonInput(e) {
    this.setData({
      applyReason: e.detail.value
    });
  },

  // 提交申请
  async submitApply() {
    const { applyReason, taskId } = this.data;

    if (!applyReason.trim()) {
      Toast.fail('请输入接单理由');
      return;
    }

    this.setData({ submitLoading: true });

    try {
      const result = await API.callFunction('taskApply', {
        taskId,
        reason: applyReason.trim()
      });

      if (result && result.success) {
        Toast.success('申请提交成功');
        this.setData({
          showApplyModal: false,
          applyReason: '',
          hasApplied: true,
          canApply: false
        });

        // 重新加载任务详情
        setTimeout(() => {
          this.loadTaskDetail();
        }, 1000);
      } else {
        Toast.fail(result?.message || '申请失败');
      }
    } catch (error) {
      console.error('提交申请失败:', error);
      Toast.fail('申请失败，请重试');
    } finally {
      this.setData({ submitLoading: false });
    }
  },

  // 确认申请者
  async confirmApplicant(e) {
    const applicant = e.currentTarget.dataset.applicant;

    wx.showModal({
      title: '确认选择',
      content: `确定选择 ${applicant.name} 作为辅导者吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await API.callFunction('taskConfirm', {
              taskId: this.data.taskId,
              tutorId: applicant.applicantId
            });

            if (result && result.success) {
              Toast.success('确认成功');
              setTimeout(() => {
                this.loadTaskDetail();
              }, 1000);
            } else {
              Toast.fail(result?.message || '确认失败');
            }
          } catch (error) {
            console.error('确认申请者失败:', error);
            Toast.fail('确认失败，请重试');
          }
        }
      }
    });
  },

  // 编辑任务
  editTask() {
    wx.navigateTo({
      url: `/pages/task-publish/task-publish?taskId=${this.data.taskId}&mode=edit`
    });
  },

  // 取消任务
  cancelTask() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个任务吗？取消后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'taskCancel',
              data: { taskId: this.data.taskId }
            });

            if (result.result.success) {
              Toast.success('任务已取消');
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              Toast.fail(result.result.message || '取消失败');
            }
          } catch (error) {
            console.error('取消任务失败:', error);
            Toast.fail('取消失败，请重试');
          }
        }
      }
    });
  }
});
