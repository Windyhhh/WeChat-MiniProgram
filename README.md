# 📱 微信小程序合集 | WeChat MiniProgram Collection

> **多款微信小程序应用集合——涵盖工具、生活、娱乐等场景，展示小程序开发全流程与最佳实践。**
>
> *A collection of WeChat MiniProgram applications — covering tools, life, entertainment scenarios, showcasing full-stack mini-program development and best practices.*

---

## ⭐ 核心卖点 | Why Star This

| 卖点 | Feature | 一句话 |
|------|---------|--------|
| 📱 **多应用合集** | Multi-Apps | 多款小程序应用，场景丰富 |
| 🎨 **原生开发** | Native Dev | WXML/WXSS/JS 原生小程序开发 |
| 🔌 **云开发** | Cloud Dev | 微信云开发后端方案 |
| 📦 **最佳实践** | Best Practices | 组件化、状态管理最佳实践 |
| 🚀 **开箱即用** | Ready to Use | 配置 AppID 即可运行 |

---

## 🚀 快速开始 | Quick Start

```bash
git clone https://github.com/Windyhhh/WeChat-MiniProgram.git
cd WeChat-MiniProgram

# 1. 使用微信开发者工具打开对应子项目

# 2. 配置 AppID
# 编辑 project.config.json 中的 appid

# 3. 云开发配置 (如用到)
# 开通云开发并修改 env

# 4. 编译运行
# 在微信开发者工具中点击编译
```

---

## 📂 项目结构 | Project Structure

```
WeChat-MiniProgram/
├── apps/                      # 各小程序应用
│   ├── todo-list/            # 待办事项
│   ├── weather-app/          # 天气查询
│   ├── calculator/           # 计算器
│   ├── countdown/            # 倒数日
│   └── ...
├── shared/                    # 公共组件
│   ├── components/           # 公共组件
│   └── utils/                # 工具函数
└── README.md
```

---

## 🔬 核心实现 | Core Implementation

### 小程序页面示例 | MiniProgram Page

```javascript
// 待办事项小程序核心逻辑
Page({
  data: {
    todos: [],
    input: '',
    filter: 'all'  // all/active/completed
  },
  
  onLoad() {
    // 从本地存储加载
    const todos = wx.getStorageSync('todos') || [];
    this.setData({ todos });
  },
  
  addTodo() {
    if (!this.data.input.trim()) return;
    const todo = {
      id: Date.now(),
      text: this.data.input,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const todos = [...this.data.todos, todo];
    this.setData({ todos, input: '' });
    wx.setStorageSync('todos', todos);
  },
  
  toggleTodo(e) {
    const id = e.currentTarget.dataset.id;
    const todos = this.data.todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    this.setData({ todos });
    wx.setStorageSync('todos', todos);
  }
});
```

---

## 🎯 应用场景 | Use Cases

- 📱 **小程序开发**：多场景小程序应用
- 🎓 **前端教学**：小程序开发入门
- 🏢 **业务应用**：企业微信小程序
- 🧩 **组件复用**：小程序组件库实践

---

## 📄 License

MIT License — 自由使用、修改和分发。

---

> 💡 **微信小程序合集，Star ⭐ 掌握小程序开发全流程！**
