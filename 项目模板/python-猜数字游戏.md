# 🐍 Python猜数字游戏 — 完整教程

## 🎮 游戏介绍
电脑想一个1-100之间的数字，你来猜！
- 电脑会告诉你猜大了还是猜小了
- 你有10次机会
- 尽可能用最少的次数猜对！

## 🛠️ 实现步骤

### 第1步：创建文件
1. 打开VS Code
2. 创建新文件：`guess_number.py`
3. 输入以下代码

### 第2步：基础版本

```python
import random

# 电脑想一个数字
secret_number = random.randint(1, 100)
guess = 0
attempts = 0

print("=" * 40)
print("🎯 猜数字游戏")
print("=" * 40)
print("我想了一个1到100之间的数字。")
print("你有10次机会猜猜看！")
print("=" * 40)

while guess != secret_number and attempts < 10:
    # 获取玩家的猜测
    try:
        guess = int(input(f"\n第{attempts + 1}次猜测："))
    except ValueError:
        print("请输入一个数字！")
        continue
    
    attempts += 1
    
    # 判断猜测结果
    if guess < secret_number:
        print("📈 太小了！再大一点。")
    elif guess > secret_number:
        print("📉 太大了！再小一点。")
    else:
        print(f"\n🎉 恭喜你猜对了！答案就是{secret_number}！")
        print(f"你用了{attempts}次猜对。")
        
        # 评价表现
        if attempts <= 3:
            print("🏆 太厉害了！你是猜数字大师！")
        elif attempts <= 6:
            print("👍 不错！你的猜测策略很好！")
        elif attempts <= 9:
            print("😊 还可以，继续加油！")
        else:
            print("😅 最后一次才猜对，好险啊！")

# 如果10次都没猜对
if attempts >= 10 and guess != secret_number:
    print(f"\n😢 很遗憾，你的10次机会用完了。")
    print(f"答案是{secret_number}。下次再试试吧！")

print("\n游戏结束！")
```

### 第3步：运行游戏
1. 保存文件
2. 点击VS Code右上角的"运行"按钮
3. 或者在终端输入：`python3 guess_number.py`

---

## 🎨 进阶改进

### 改进1：难度选择
```python
print("选择难度：")
print("1. 简单 (1-50, 15次机会)")
print("2. 中等 (1-100, 10次机会)")
print("3. 困难 (1-200, 7次机会)")

choice = input("你的选择 (1/2/3): ")

if choice == "1":
    max_number = 50
    max_attempts = 15
elif choice == "2":
    max_number = 100
    max_attempts = 10
elif choice == "3":
    max_number = 200
    max_attempts = 7
else:
    print("无效选择，使用默认难度")
    max_number = 100
    max_attempts = 10

secret_number = random.randint(1, max_number)
```

### 改进2：记录历史猜测
```python
guesses = []

while guess != secret_number and attempts < max_attempts:
    guess = int(input(f"\n第{attempts + 1}次猜测："))
    guesses.append(guess)
    attempts += 1
    
    print(f"你猜过的数字：{guesses}")
```

### 改进3：提示系统
```python
# 每3次猜测给一个提示
if attempts % 3 == 0:
    if secret_number % 2 == 0:
        print("💡 提示：答案是偶数")
    else:
        print("💡 提示：答案是奇数")
```

### 改进4：多轮游戏
```python
play_again = "y"

while play_again.lower() == "y":
    # 游戏代码...
    
    play_again = input("\n再玩一次？(y/n): ")

print("谢谢游玩！")
```

---

## 🧠 学到了什么

通过这个项目，你学会了：
1. **import**：导入模块（random）
2. **变量**：存储数据
3. **循环**：while循环
4. **条件判断**：if/elif/else
5. **输入输出**：input()和print()
6. **异常处理**：try/except
7. **列表**：存储多个值

---

## 💡 挑战任务

完成基础版本后，试试这些挑战：
1. 添加一个"猜测历史"显示功能
2. 让电脑根据你的猜测给出更精确的提示（比如"差很多"、"差一点"）
3. 添加一个"排行榜"功能，记录最佳成绩
4. 做一个"双人模式"，两个人轮流猜
5. 用turtle画一个猜测过程的图表
