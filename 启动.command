#!/bin/bash
# 🎮 小创客冒险之旅 - 一键启动

cd "$(dirname "$0")"

echo "🎮 小创客冒险之旅"
echo "=================="
echo ""

# 检查验证服务是否已运行
if curl -s 'http://localhost:18088/health' > /dev/null 2>&1; then
    echo "✅ 验证服务已在运行"
else
    echo "🔍 正在启动验证服务..."
    node verify.js serve &
    sleep 1
    echo "✅ 验证服务已启动"
fi

echo ""
echo "🌐 正在打开学习页面..."
open index.html

echo ""
echo "✅ 启动完成！"
echo ""
echo "💡 提示："
echo "  - 左侧选择关卡开始学习"
echo "  - 绿色勾号 = 系统自动验证通过"
echo "  - 蓝色勾号 = 人工确认完成"
echo "  - 点击'刷新验证'按钮重新检测"
echo ""
echo "🚀 开始冒险吧！"
echo ""
