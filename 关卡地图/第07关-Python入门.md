# 第7关 🐍 Python入门：代码变魔术

## 🎯 任务目标
用Python画图和做简单游戏！

## ⏰ 预计时间
每周末2小时，持续3周

---

## 📖 什么是Python？

Python是一种编程语言，就像英语一样，有固定的语法。它是世界上最流行的编程语言之一，因为：
- 语法简单，容易学
- 功能强大，能做很多事
- 很多大公司都在用（Google、Netflix等）

---

## 🛠️ 准备工作

### 打开VS Code
1. 在终端输入 `code` 或在启动台找到VS Code
2. 创建一个新文件，保存为 `hello.py`
3. 文件名一定要以 `.py` 结尾，这是Python文件的标志

### 运行Python代码
在VS Code中：
1. 写好代码后
2. 点击右上角的"运行"按钮（三角形图标）
3. 或者在终端输入：`python3 hello.py`

---

## 📖 教程

### 第1周：Python基础

#### 1.1 第一行代码：打招呼
```python
print("你好，世界！")
print("我是小创客！")
```

**试试看：**
- 把"小创客"改成你的名字
- 加一行 `print("我今年11岁")`

**AI帮你理解：**
```
print是什么意思？为什么要加括号和引号？
用小学生能懂的话解释。
```

#### 1.2 变量：给东西取名字
```python
name = "小明"
age = 11
print("我叫" + name)
print("我今年" + str(age) + "岁")
```

**小知识：**
> 变量就像一个盒子，你可以把东西放进去。`name = "小明"`就是把"小明"放进叫"name"的盒子里。

#### 1.3 跟用户对话
```python
name = input("你叫什么名字？")
print("你好，" + name + "！很高兴认识你！")
```

**试试看：**
- 让程序问用户的年龄
- 让程序问用户喜欢什么颜色

#### 1.4 条件判断：如果...就...
```python
age = int(input("你几岁了？"))
if age >= 18:
    print("你是大人了！")
else:
    print("你还是小朋友！")
```

**小知识：**
> `if`就是"如果"，`else`就是"否则"。程序会根据条件决定做什么。

#### 1.5 循环：重复做事情
```python
# 方式1：for循环
for i in range(5):
    print("这是第" + str(i+1) + "次")

# 方式2：while循环
count = 0
while count < 5:
    print("数数：" + str(count))
    count = count + 1
```

**小知识：**
> 循环就像"重复做某件事"。`for`循环知道要重复几次，`while`循环只要条件满足就一直做。

---

### 第2周：用turtle画图

#### 2.1 什么是turtle？
turtle是Python自带的画图工具。你可以控制一只"小乌龟"在屏幕上爬行，它爬过的地方会留下痕迹，就像画画一样！

```python
import turtle

t = turtle.Turtle()
t.forward(100)    # 向前走100步
t.right(90)       # 向右转90度
t.forward(100)
t.right(90)
t.forward(100)
t.right(90)
t.forward(100)

turtle.done()
```

**试试看：**
- 画一个正方形
- 画一个三角形
- 改变线条颜色

#### 2.2 画彩色图案
```python
import turtle

t = turtle.Turtle()
t.speed(3)  # 设置速度

# 画一个彩色的圆
colors = ["red", "yellow", "blue", "green", "purple", "orange"]

for color in colors:
    t.color(color)
    t.circle(50)
    t.right(60)

turtle.done()
```

#### 2.3 画螺旋线
```python
import turtle

t = turtle.Turtle()
t.speed(0)  # 最快速度

for i in range(100):
    t.forward(i * 2)
    t.right(91)

turtle.done()
```

**跟AI对话：**
```
我想用Python的turtle画一个[星星/爱心/雪花...]。
请告诉我怎么写代码，并解释每一行的意思。
```

---

### 第3周：做小游戏

#### 3.1 猜数字游戏
```python
import random

# 电脑想一个数字
secret = random.randint(1, 100)
guess = 0
times = 0

print("我想了一个1到100之间的数字，你猜猜看！")

while guess != secret:
    guess = int(input("你的猜测："))
    times = times + 1
    
    if guess < secret:
        print("太小了！再大一点。")
    elif guess > secret:
        print("太大了！再小一点。")
    else:
        print("恭喜你猜对了！你用了" + str(times) + "次。")
```

#### 3.2 文字冒险游戏
```python
print("你醒来发现自己在一个黑暗的房间里。")
print("你看到两扇门：一扇红色的门和一扇蓝色的门。")

choice = input("你选择哪扇门？（红/蓝）")

if choice == "红":
    print("你打开了红色的门...")
    print("里面有一条龙！")
    action = input("你要怎么办？（跑/打）")
    if action == "跑":
        print("你成功逃跑了！游戏结束。")
    else:
        print("你勇敢地打败了龙！你赢了！")
elif choice == "蓝":
    print("你打开了蓝色的门...")
    print("里面有一个宝藏！")
    print("你获得了宝藏！你赢了！")
else:
    print("你犹豫太久，天黑了。游戏结束。")
```

**扩展挑战：**
- 加更多的分支和结局
- 加一个"生命值"系统
- 加一个"背包"系统

---

## 🧠 思考题

1. `print()`和`input()`有什么区别？
2. 为什么`if`后面要加冒号？
3. `for`循环和`while`循环有什么不同？
4. 怎么让程序"记住"用户的输入？

---

## 💡 学习建议

1. **自己敲代码**：不要复制粘贴，自己一行行敲
2. **看错误信息**：程序报错不要怕，错误信息会告诉你哪里错了
3. **多做实验**：改改数字、改改文字，看看会发生什么
4. **问AI**：不懂就问，AI会耐心解释

---

## ✅ 完成标准
- [ ] 能用`turtle`画出一个图案
- [ ] 能用`input()`跟用户对话
- [ ] 能用`if/else`做条件判断
- [ ] 能用`for`或`while`做循环
- [ ] 做了一个能玩的猜数字或文字冒险游戏

## 🏆 成就解锁
**🐍 代码魔法师** — 你学会了真正的编程语言！

## 📝 作品记录
- 画的图案：__________
- 做的游戏：__________
- 最有成就感的部分：__________
- 遇到的bug：__________（bug就是程序错误，程序员都这么叫）

---

## 🎮 下一关预告
**第8关：Godot游戏引擎** — 用专业工具做真正的游戏！
