#!/bin/bash
# 🎮 小创客冒险之旅 - 快速启动脚本

echo "🎮 小创客冒险之旅"
echo "=================="
echo ""
echo "正在为你打开所有工具..."
echo ""

# 打开项目导航页面
open "$(dirname "$0")/index.html"
echo "✅ 已打开项目导航页面"

# 打开VS Code
code "$(dirname "$0")" 2>/dev/null
echo "✅ 已打开VS Code"

# 打开Scratch
open "https://scratch.mit.edu"
echo "✅ 已打开Scratch"

# 打开Claude Code提示
echo ""
echo "💡 提示："
echo "  - 在终端输入 'claude' 启动AI助手"
echo "  - 输入 'cd ~/kids-creator-hub' 进入项目目录"
echo "  - 查看 '关卡地图/README.md' 开始冒险"
echo ""
echo "🚀 准备就绪！开始你的冒险之旅吧！"
echo ""
echo "按任意键关闭此窗口..."
read -n 1
