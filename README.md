<div align="center">

# 微信小程序合集 | WeChat-MiniProgram

### A collection of WeChat Mini Programs.

Multiple mini-program applications with cloud functions.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/JavaScript)
[![WeChat](https://img.shields.io/badge/WeChat-MiniProgram-07C160?logo=wechat&logoColor=white)](https://developers.weixin.qq.com/miniprogram/dev/framework/)

</div>

---

**WeChat-MiniProgram** is a collection of WeChat Mini Programs, including cloud functions (`cloudfunctions/`) for backend logic.

> [!NOTE]
> 中文项目：微信小程序合集——多个小程序应用集合，含云函数。

---

## Quickstart

```bash
git clone https://github.com/Windyhhh/WeChat-MiniProgram.git
cd WeChat-MiniProgram

# open in WeChat DevTools and configure the AppID
# cloud functions are under cloudfunctions/
```

---

## Features

- **Multiple apps** — a collection of mini programs.
- **Cloud functions** — `cloudfunctions/` for backend logic (orders, chat, etc.).

---

## Project Structure

```
WeChat-MiniProgram/
├── app.js / app.json / app.wxss   # app entry
├── cloudfunctions/                # cloud functions (completeOrder, createOrder, getChatHistory, ...)
├── ICON_SOLUTION.md
└── README.md
```

---

## 技术实现细节

### 架构概览

项目采用模块化设计，核心目录包括：**cloudfunctions, images, pages, scripts, utils**。

### 技术栈与依赖

### 实现要点

- 代码结构清晰，模块间低耦合，便于扩展和维护

---
## License

MIT — free to use, modify and distribute.
