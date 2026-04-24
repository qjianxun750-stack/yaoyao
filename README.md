# 情绪骰子 v2.0

> 赛博求签的仪式感 - 8款主题骰子 + 2套组合玩法

## 📁 项目结构

```
emotion-dice-v2/
├── index.html                 # 主页面
├── css/
│   ├── variables.css          # CSS变量和色彩系统
│   ├── base.css               # 全局基础样式
│   ├── dice.css               # 3D骰子样式
│   ├── animations.css         # 所有动画关键帧
│   └── share.css              # 分享弹窗样式
├── js/
│   ├── config.js              # 骰子数据配置
│   ├── audio.js               # Web Audio API音效系统
│   ├── dice.js                # 3D骰子动画控制
│   ├── share.js               # Canvas分享图生成
│   ├── supabase-client.js     # Supabase数据统计
│   ├── analytics.js           # 本地统计增强
│   ├── global-stats.js        # 全局统计控制器
│   └── app.js                 # 主应用入口
└── assets/                    # 静态资源（可选）
```

## ✨ 核心特性

### 视觉系统
- **深底霓虹风格**：固定深宇宙紫背景，主题色只染骰子和交互控件
- **10个主题色**：8个单骰 + 2个组合玩法，每个独立主题色
- **噪点纹理 + 环境光背景**：增加质感和氛围
- **Google Fonts**：ZCOOL XiaoWei 艺术字体

### 3D骰子动画
- **真实物理效果**：多轴旋转 + 纵向位移模拟抛起
- **落地弹跳**：Q弹的压缩回弹效果
- **震颤定格**：骰子落地后的微颤动
- **粒子爆发**：18-24个粒子，三种形态（主粒子/星星/碎屑）

### 一卦模式
- **逐爻揭晓**：每次点击弹出一个骰子，仪式感拉满
- **三爻位卡片**：因态果 / 天人地，逐个填入结果
- **卦辞生成**：完整解读句，自动合成
- **完卦彩带**：50片confetti从天而降

### 音效系统
- **Web Audio API纯代码生成**：无需外部音频文件
- **摇骰音**：木质沙沙的碰撞颗粒感
- **揭晓音**：清脆的木鱼/铜铃单击（三个爻音高递增）
- **完卦音**：三音同时奏响，完整仪式感收尾

### 分享功能
- **Canvas绘制**：750×1000px竖版图，适配微信/小红书
- **社交货币设计**：大字结果 + 一句话解读 + 品牌回流
- **一卦专属**：三行爻位 + 完整卦辞，仪式感满分

## 🚀 快速开始

### 本地开发

直接用浏览器打开 `index.html` 即可，或使用本地服务器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8000
```

### 部署到Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd emotion-dice-v2
vercel
```

### 部署到GitHub Pages

```bash
# 推送到GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main

# 在GitHub仓库设置中启用Pages
# Settings → Pages → Source: main分支
```

## 📊 数据统计

### Umami Analytics
- 网站访问统计
- 页面浏览量
- 访客地理位置
- 设备类型分布

查看统计：https://cloud.umami.is/share/34118be7-d644-4577-a83d-3d8d001c2618

### Supabase统计
- **dice_rolls表**：记录每次摇骰子结果
- **shares表**：记录分享行为
- **visitors表**：记录独立访客

### 本地统计
- localStorage存储用户行为
- 支持导出JSON数据
- 与云端统计双保险

## 🎨 设计理念

> "给骰子舞台，让背景退场"

- 骰子是主角，占屏幕中心50%以上
- 背景永远是深色稳定，不抢戏
- 主题色只染骰子和交互控件
- 动画克制但有力量，不花哨

## 📝 待实现功能（按优先级）

### P0 - 核心体验 ✅
- [x] 3D骰子动效（单骰 + 一卦逐爻）
- [x] 音效系统重写（摇骰 + 揭晓 + 完卦）

### P1 - 完整体验 ✅
- [x] 结果强化效果（粒子 + 卡片弹入）
- [x] 分享图生成（Canvas绘制）
- [x] 数据统计（Supabase + Umami）

### P2 - 优化 🔄
- [ ] 一卦完卦彩带 confetti（代码已写，待测试）
- [ ] 主题切换动画平滑过渡
- [ ] 响应式细节优化

### P3 - 锦上添花
- [ ] Toast 提示优化
- [ ] localStorage 状态记忆完善
- [ ] 加载动画

## 🔧 技术栈

- **纯前端**：HTML + CSS + Vanilla JavaScript
- **3D动画**：CSS transform-style: preserve-3d
- **音效**：Web Audio API
- **分享图**：Canvas API
- **数据统计**：Supabase + Umami Analytics
- **部署**：Vercel / GitHub Pages

## 📄 License

MIT

## 🙏 致谢

设计灵感来源于年轻人的"赛博求签"文化，结合塔罗牌、玄学娱乐等元素，打造有仪式感的趣味小游戏。

---

**版本**：v2.0
**最后更新**：2026-04-24
