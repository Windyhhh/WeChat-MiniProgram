// pages/task-publish/task-publish.js
import Toast from '@vant/weapp/toast/toast';
const API = require('../../utils/api.js');
const { showToast, showLoading, hideLoading, generateRandomString } = require('../../utils/util.js');

Page({
  data: {
    // 步骤相关
    currentStep: 0,
    steps: [
      { text: '基础信息' },
      { text: '需求详情' },
      { text: '时间预算' }
    ],
    
    // 表单数据
    formData: {
      course: '',
      taskType: '',
      tutorMode: '',
      title: '',
      description: '',
      images: [],
      location: '',
      expectedTime: '',
      budget: ''
    },
    
    // 选择器相关
    showTaskType: false,
    showTutorMode: false,
    showDatePicker: false,
    
    taskTypeColumns: [
      { text: '作业辅导', value: 'homework' },
      { text: '论文指导', value: 'thesis' },
      { text: '复习备考', value: 'review' },
      { text: '其他', value: 'other' }
    ],
    
    tutorModeColumns: [
      { text: '线上辅导', value: 'online' },
      { text: '线下辅导', value: 'offline' },
      { text: '线上线下均可', value: 'both' }
    ],
    
    // 历史课程
    historyCourses: [],
    
    // 状态
    publishLoading: false,
    editMode: false,
    taskId: '',

    // 日期相关
    minDate: new Date().getTime(),
    expectedTime: new Date().getTime(),

    // 表单验证
    formErrors: {},

    // 草稿保存
    draftSaved: false
  },

  onLoad(options) {
    // 检查编辑模式
    if (options.mode === 'edit' && options.taskId) {
      this.setData({
        editMode: true,
        taskId: options.taskId
      })
      this.loadTaskForEdit(options.taskId)
    }

    this.loadHistoryCourses()
    this.checkUserPermission()
  },

  /**
   * 检查用户权限
   */
  async checkUserPermission() {
    const app = getApp()
    if (!app.globalData.openid) {
      wx.showModal({
        title: '请先登录',
        content: '需要登录后才能发布任务',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    if (app.globalData.userRole !== 'demander') {
      wx.showModal({
        title: '权限不足',
        content: '只有需求方可以发布任务，是否切换身份？',
        confirmText: '切换身份',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/role-select/role-select'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    if (!app.globalData.isVerified) {
      wx.showModal({
        title: '需要认证',
        content: '发布任务需要先完成校园认证，是否前往认证？',
        confirmText: '去认证',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/verify/verify'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
    }
  },

  // 加载历史课程
  loadHistoryCourses() {
    const courses = wx.getStorageSync('historyCourses') || [];
    this.setData({
      historyCourses: courses.slice(0, 5) // 最多显示5个
    });
  },

  /**
   * 加载任务数据用于编辑
   */
  async loadTaskForEdit(taskId) {
    try {
      const result = await API.getTaskDetail(taskId)
      if (result && result.success) {
        const task = result.data.task

        // 检查是否是任务发布者
        const app = getApp()
        if (task.publisherId !== app.globalData.openid) {
          wx.showModal({
            title: '权限不足',
            content: '只能编辑自己发布的任务',
            showCancel: false,
            success: () => {
              wx.navigateBack()
            }
          })
          return
        }

        // 填充表单数据
        this.setData({
          formData: {
            course: task.course,
            taskType: task.taskType,
            tutorMode: task.tutorMode,
            title: task.title,
            description: task.description,
            images: task.images || [],
            location: task.location || '',
            expectedTime: task.expectedTime,
            budget: task.budget.toString()
          }
        })

        // 更新计算属性
        this.updateComputedData()
      }
    } catch (error) {
      console.error('加载任务数据失败:', error)
      showToast('加载失败，请重试')
      wx.navigateBack()
    }
  },

  // 输入事件
  onCourseInput(e) {
    this.setData({
      'formData.course': e.detail.value
    });
    this.checkCanNext();
  },

  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
    this.checkCanNext();
  },

  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
    this.checkCanNext();
  },

  onLocationInput(e) {
    this.setData({
      'formData.location': e.detail.value
    });
    this.checkCanNext();
  },

  onBudgetInput(e) {
    this.setData({
      'formData.budget': e.detail.value
    });
    this.checkCanNext();
  },

  // 选择历史课程
  selectHistoryCourse(e) {
    const course = e.currentTarget.dataset.course;
    this.setData({
      'formData.course': course
    });
    this.checkCanNext();
  },

  // 任务类型选择
  showTaskTypePicker() {
    this.setData({ showTaskType: true });
  },

  closeTaskTypePicker() {
    this.setData({ showTaskType: false });
  },

  onTaskTypeConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'formData.taskType': value.value,
      showTaskType: false
    });
    this.checkCanNext();
  },

  // 辅导方式选择
  showTutorModePicker() {
    this.setData({ showTutorMode: true });
  },

  closeTutorModePicker() {
    this.setData({ showTutorMode: false });
  },

  onTutorModeConfirm(e) {
    const { value } = e.detail;
    this.setData({
      'formData.tutorMode': value.value,
      showTutorMode: false
    });
    this.checkCanNext();
  },

  // 日期选择
  showDatePicker() {
    this.setData({ showDatePicker: true });
  },

  closeDatePicker() {
    this.setData({ showDatePicker: false });
  },

  onDateConfirm(e) {
    const { value } = e.detail;
    this.setData({
      expectedTime: value,
      'formData.expectedTime': this.formatDate(new Date(value)),
      showDatePicker: false
    });
    this.checkCanNext();
  },

  // 图片上传
  async afterRead(e) {
    const { file } = e.detail;
    const { images } = this.data.formData;

    try {
      showLoading('上传中...');

      // 生成云端文件路径
      const app = getApp();
      const cloudPath = `tasks/${app.globalData.openid}/${generateRandomString()}.${file.url.split('.').pop()}`;

      // 上传到云存储
      const uploadResult = await API.uploadFile(file.url, cloudPath);

      if (uploadResult && uploadResult.fileID) {
        images.push({
          url: uploadResult.fileID,
          name: file.name
        });

        this.setData({
          'formData.images': images
        });

        hideLoading();
        showToast('上传成功', 'success');
      } else {
        hideLoading();
        showToast('上传失败，请重试');
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      hideLoading();
      showToast('上传失败，请重试');
    }
  },

  deleteImage(e) {
    const { index } = e.detail;
    const { images } = this.data.formData;

    // 删除云存储文件
    if (images[index] && images[index].url) {
      API.deleteFile([images[index].url]);
    }

    images.splice(index, 1);

    this.setData({
      'formData.images': images
    });
  },

  // 步骤控制
  nextStep() {
    if (!this.checkStepValid()) return;
    
    const nextStep = this.data.currentStep + 1;
    this.setData({
      currentStep: nextStep
    });
    this.checkCanNext();
  },

  prevStep() {
    const prevStep = this.data.currentStep - 1;
    this.setData({
      currentStep: prevStep
    });
    this.checkCanNext();
  },

  // 检查当前步骤是否有效
  checkStepValid() {
    const { currentStep, formData } = this.data;
    
    switch (currentStep) {
      case 0:
        if (!formData.course) {
          Toast('请输入课程名称');
          return false;
        }
        if (!formData.taskType) {
          Toast('请选择任务类型');
          return false;
        }
        if (!formData.tutorMode) {
          Toast('请选择辅导方式');
          return false;
        }
        break;
      case 1:
        if (!formData.title) {
          Toast('请输入任务标题');
          return false;
        }
        if (!formData.description) {
          Toast('请输入详细描述');
          return false;
        }
        if ((formData.tutorMode === 'offline') && !formData.location) {
          Toast('请输入辅导地点');
          return false;
        }
        break;
      case 2:
        if (!formData.expectedTime) {
          Toast('请选择期望完成时间');
          return false;
        }
        if (!formData.budget || formData.budget <= 0) {
          Toast('请输入有效的预算金额');
          return false;
        }
        break;
    }
    return true;
  },

  // 检查是否可以进入下一步
  checkCanNext() {
    const { currentStep, formData } = this.data;
    let canNext = false;
    let canPublish = false;
    
    switch (currentStep) {
      case 0:
        canNext = formData.course && formData.taskType && formData.tutorMode;
        break;
      case 1:
        canNext = formData.title && formData.description && 
                 (formData.tutorMode !== 'offline' || formData.location);
        break;
      case 2:
        canPublish = formData.expectedTime && formData.budget && formData.budget > 0;
        break;
    }
    
    this.setData({
      canNext,
      canPublish
    });
  },

  // 发布任务
  async publishTask() {
    if (!this.validateForm()) return;

    this.setData({ publishLoading: true });

    try {
      // 保存历史课程
      this.saveHistoryCourse();

      let result;
      if (this.data.editMode) {
        // 编辑模式：更新任务
        result = await API.callFunction('updateTask', {
          taskId: this.data.taskId,
          taskData: this.data.formData
        });
      } else {
        // 新建模式：创建任务
        result = await API.createTask(this.data.formData);
      }

      if (result && result.success) {
        Toast.success(this.data.editMode ? '任务更新成功' : '任务发布成功');

        // 清除草稿
        this.clearDraft();

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        Toast.fail(result?.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      Toast.fail('操作失败，请重试');
    } finally {
      this.setData({ publishLoading: false });
    }
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    const errors = {};

    // 基础信息验证
    if (!formData.course.trim()) {
      errors.course = '请输入课程名称';
    }
    if (!formData.taskType) {
      errors.taskType = '请选择任务类型';
    }
    if (!formData.tutorMode) {
      errors.tutorMode = '请选择辅导方式';
    }

    // 详情验证
    if (!formData.title.trim()) {
      errors.title = '请输入任务标题';
    }
    if (!formData.description.trim()) {
      errors.description = '请输入详细描述';
    }
    if (formData.tutorMode === 'offline' && !formData.location.trim()) {
      errors.location = '线下辅导请输入地点';
    }

    // 时间预算验证
    if (!formData.expectedTime) {
      errors.expectedTime = '请选择期望完成时间';
    }
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      errors.budget = '请输入有效的预算金额';
    }

    this.setData({ formErrors: errors });

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Toast.fail(firstError);
      return false;
    }

    return true;
  },

  // 保存历史课程
  saveHistoryCourse() {
    const { course } = this.data.formData;
    if (!course) return;
    
    let courses = wx.getStorageSync('historyCourses') || [];
    
    // 移除重复项
    courses = courses.filter(item => item !== course);
    
    // 添加到开头
    courses.unshift(course);
    
    // 最多保存10个
    courses = courses.slice(0, 10);
    
    wx.setStorageSync('historyCourses', courses);
  },

  // 显示预算提示
  showBudgetTips() {
    wx.showModal({
      title: '预算建议',
      content: '合理的预算能够吸引更多优质的辅导者。建议根据任务难度和时长来设定预算。',
      showCancel: false
    });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 保存草稿
   */
  saveDraft() {
    const draftKey = 'taskDraft';
    wx.setStorageSync(draftKey, {
      formData: this.data.formData,
      currentStep: this.data.currentStep,
      saveTime: new Date().getTime()
    });

    this.setData({ draftSaved: true });
    Toast.success('草稿已保存');
  },

  /**
   * 加载草稿
   */
  loadDraft() {
    const draftKey = 'taskDraft';
    const draft = wx.getStorageSync(draftKey);

    if (draft && draft.formData) {
      wx.showModal({
        title: '发现草稿',
        content: '检测到未完成的任务草稿，是否恢复？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              formData: draft.formData,
              currentStep: draft.currentStep || 0
            });
            this.updateComputedData();
            Toast.success('草稿已恢复');
          }
        }
      });
    }
  },

  /**
   * 清除草稿
   */
  clearDraft() {
    const draftKey = 'taskDraft';
    wx.removeStorageSync(draftKey);
    this.setData({ draftSaved: false });
  },

  /**
   * 页面卸载时自动保存草稿
   */
  onUnload() {
    if (!this.data.editMode && this.hasFormData()) {
      this.saveDraft();
    }
  },

  /**
   * 检查是否有表单数据
   */
  hasFormData() {
    const { formData } = this.data;
    return formData.course || formData.title || formData.description || formData.budget;
  },

  // 计算属性 - 使用观察者模式
  onShow() {
    this.updateComputedData();

    // 非编辑模式下尝试加载草稿
    if (!this.data.editMode) {
      setTimeout(() => {
        this.loadDraft();
      }, 500);
    }
  },

  updateComputedData() {
    const { taskType, tutorMode, expectedTime } = this.data.formData;

    const taskTypeItem = this.data.taskTypeColumns.find(col => col.value === taskType);
    const tutorModeItem = this.data.tutorModeColumns.find(col => col.value === tutorMode);

    this.setData({
      taskTypeText: taskTypeItem ? taskTypeItem.text : '请选择',
      tutorModeText: tutorModeItem ? tutorModeItem.text : '请选择',
      expectedTimeText: expectedTime || '请选择'
    });
  }
});
