#!/bin/bash
# 部署到 GitHub Pages

echo "🚀 开始部署到 GitHub Pages..."

# 进入项目目录
cd "D:\我的AI世界\01知识库\精选知识库\04、我的实战\视频带货\骰子\emotion-dice-v2"

# 添加远程仓库（请替换下面的URL为你创建的仓库地址）
git remote add origin https://github.com/qjianxun750/emotion-dice-v2.git

# 推送代码到GitHub
git branch -M main
git push -u origin main

echo "✅ 代码已推送到GitHub！"
echo ""
echo "📝 下一步操作："
echo "1. 打开 https://github.com/qjianxun750/emotion-dice-v2"
echo "2. 点击 Settings 标签"
echo "3. 在左侧菜单找到 'Pages'"
echo "4. 在 'Source' 下选择 'Deploy from a branch'"
echo "5. Branch 选择 'main'，文件夹选择 '/ (root)'"
echo "6. 点击 Save"
echo ""
echo "⏳ 等待几分钟后，你的网站将在以下地址可用："
echo "https://qjianxun750.github.io/emotion-dice-v2/"
