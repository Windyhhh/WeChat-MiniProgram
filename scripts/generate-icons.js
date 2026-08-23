// 生成TabBar图标的脚本
// 这个脚本可以在Node.js环境中运行，生成简单的占位符图标

const fs = require('fs');
const path = require('path');

// 创建简单的SVG图标
const icons = {
  home: {
    inactive: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L8 28V56H24V40H40V56H56V28L32 8Z" stroke="#7A7E83" stroke-width="2" fill="none"/>
    </svg>`,
    active: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8L8 28V56H24V40H40V56H56V28L32 8Z" fill="#36D399"/>
    </svg>`
  },
  task: {
    inactive: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="40" height="48" rx="4" stroke="#7A7E83" stroke-width="2" fill="none"/>
      <line x1="20" y1="20" x2="44" y2="20" stroke="#7A7E83" stroke-width="2"/>
      <line x1="20" y1="28" x2="44" y2="28" stroke="#7A7E83" stroke-width="2"/>
      <line x1="20" y1="36" x2="36" y2="36" stroke="#7A7E83" stroke-width="2"/>
    </svg>`,
    active: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="40" height="48" rx="4" fill="#36D399"/>
      <line x1="20" y1="20" x2="44" y2="20" stroke="white" stroke-width="2"/>
      <line x1="20" y1="28" x2="44" y2="28" stroke="white" stroke-width="2"/>
      <line x1="20" y1="36" x2="36" y2="36" stroke="white" stroke-width="2"/>
    </svg>`
  },
  chat: {
    inactive: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 16C8 12 12 8 16 8H48C52 8 56 12 56 16V36C56 40 52 44 48 44H24L8 56V16Z" stroke="#7A7E83" stroke-width="2" fill="none"/>
      <circle cx="24" cy="26" r="2" fill="#7A7E83"/>
      <circle cx="32" cy="26" r="2" fill="#7A7E83"/>
      <circle cx="40" cy="26" r="2" fill="#7A7E83"/>
    </svg>`,
    active: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 16C8 12 12 8 16 8H48C52 8 56 12 56 16V36C56 40 52 44 48 44H24L8 56V16Z" fill="#36D399"/>
      <circle cx="24" cy="26" r="2" fill="white"/>
      <circle cx="32" cy="26" r="2" fill="white"/>
      <circle cx="40" cy="26" r="2" fill="white"/>
    </svg>`
  },
  profile: {
    inactive: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="20" r="8" stroke="#7A7E83" stroke-width="2" fill="none"/>
      <path d="M12 52C12 40 20 32 32 32C44 32 52 40 52 52" stroke="#7A7E83" stroke-width="2" fill="none"/>
    </svg>`,
    active: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="20" r="8" fill="#36D399"/>
      <path d="M12 52C12 40 20 32 32 32C44 32 52 40 52 52" fill="#36D399"/>
    </svg>`
  }
};

// 创建images目录（如果不存在）
const imagesDir = path.join(__dirname, '../images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 生成SVG文件
Object.keys(icons).forEach(iconName => {
  // 未选中状态
  const inactivePath = path.join(imagesDir, `${iconName}.svg`);
  fs.writeFileSync(inactivePath, icons[iconName].inactive);
  
  // 选中状态
  const activePath = path.join(imagesDir, `${iconName}-active.svg`);
  fs.writeFileSync(activePath, icons[iconName].active);
});

console.log('SVG图标生成完成！');
console.log('注意：微信小程序TabBar需要PNG格式图标，请将SVG转换为PNG格式。');
console.log('推荐使用在线转换工具：https://convertio.co/svg-png/');

// 生成转换说明
const conversionGuide = `
# SVG转PNG转换指南

## 在线转换工具
1. 访问 https://convertio.co/svg-png/
2. 上传生成的SVG文件
3. 设置输出尺寸为64x64px
4. 下载PNG文件

## 本地转换（需要安装ImageMagick）
\`\`\`bash
# 安装ImageMagick
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# 转换命令
convert home.svg -resize 64x64 home.png
convert home-active.svg -resize 64x64 home-active.png
convert task.svg -resize 64x64 task.png
convert task-active.svg -resize 64x64 task-active.png
convert chat.svg -resize 64x64 chat.png
convert chat-active.svg -resize 64x64 chat-active.png
convert profile.svg -resize 64x64 profile.png
convert profile-active.svg -resize 64x64 profile-active.png
\`\`\`

## 文件清单
生成完成后，images目录应包含以下文件：
- home.png
- home-active.png
- task.png
- task-active.png
- chat.png
- chat-active.png
- profile.png
- profile-active.png
`;

fs.writeFileSync(path.join(imagesDir, 'CONVERSION_GUIDE.md'), conversionGuide);

console.log('转换指南已生成：images/CONVERSION_GUIDE.md');
