# 🗡️ Python文字冒险游戏 — 完整教程

## 🎮 游戏介绍
你是一个勇敢的冒险者，要探索一个神秘的城堡！
- 你会遇到各种选择
- 每个选择都会影响结局
- 有多个结局，看看你能找到哪个！

## 🛠️ 实现步骤

### 第1步：创建文件
1. 打开VS Code
2. 创建新文件：`adventure.py`
3. 输入以下代码

### 第2步：基础版本

```python
import time

def slow_print(text, delay=0.03):
    """慢慢打印文字，增加氛围"""
    for char in text:
        print(char, end='', flush=True)
        time.sleep(delay)
    print()

def get_choice(options):
    """获取玩家选择"""
    while True:
        print("\n你的选择：")
        for i, option in enumerate(options, 1):
            print(f"  {i}. {option}")
        
        try:
            choice = int(input("\n请输入数字："))
            if 1 <= choice <= len(options):
                return choice
            else:
                print("请输入有效的数字！")
        except ValueError:
            print("请输入数字！")

# 游戏开始
slow_print("=" * 50)
slow_print("🏰 神秘城堡冒险")
slow_print("=" * 50)
slow_print("")
slow_print("你醒来发现自己站在一座古老的城堡前。")
slow_print("城堡的大门敞开着，里面传来奇怪的声音。")
slow_print("")

# 第一个选择
choice1 = get_choice(["走进城堡", "绕到后面看看", "离开这里"])

if choice1 == 1:
    slow_print("\n你勇敢地走进了城堡...")
    slow_print("大厅里有两条路：左边是楼梯，右边是走廊。")
    
    choice2 = get_choice(["上楼梯", "走走廊"])
    
    if choice2 == 1:
        slow_print("\n你走上楼梯...")
        slow_print("楼上有一个房间，门是开着的。")
        slow_print("你看到里面有一本发光的书！")
        
        choice3 = get_choice(["拿起书", "不拿，继续探索"])
        
        if choice3 == 1:
            slow_print("\n你拿起了书...")
            slow_print("突然，一道光芒包围了你！")
            slow_print("你学会了强大的魔法！")
            slow_print("")
            slow_print("🎉 结局A：你成为了强大的魔法师！")
        else:
            slow_print("\n你继续探索...")
            slow_print("在走廊尽头，你找到了一个宝箱！")
            slow_print("")
            slow_print("🎉 结局B：你获得了宝藏！")
    
    else:
        slow_print("\n你走进走廊...")
        slow_print("走廊尽头有一扇锁着的门。")
        slow_print("旁边有一个密码锁。")
        
        password = input("\n输入密码（提示：1234）：")
        
        if password == "1234":
            slow_print("\n门开了！")
            slow_print("里面是一个美丽的花园！")
            slow_print("")
            slow_print("🎉 结局C：你发现了秘密花园！")
        else:
            slow_print("\n密码错误！")
            slow_print("你触发了陷阱，被送回了起点。")
            slow_print("")
            slow_print("😢 结局D：你失败了...")

elif choice1 == 2:
    slow_print("\n你绕到城堡后面...")
    slow_print("你发现了一个隐藏的入口！")
    slow_print("里面是一个地下室。")
    
    choice2 = get_choice(["进入地下室", "返回前面"])
    
    if choice2 == 1:
        slow_print("\n你进入地下室...")
        slow_print("里面有一只沉睡的龙！")
        slow_print("龙的旁边有一把闪闪发光的剑。")
        
        choice3 = get_choice(["悄悄拿走剑", "叫醒龙", "离开"])
        
        if choice3 == 1:
            slow_print("\n你悄悄地...")
            slow_print("成功拿到了剑！")
            slow_print("龙没有醒！")
            slow_print("")
            slow_print("🎉 结局E：你获得了传说中的龙剑！")
        elif choice3 == 2:
            slow_print("\n你叫醒了龙...")
            slow_print("龙睁开眼睛，看着你...")
            slow_print("龙说：'勇敢的人类，这把剑送给你。'")
            slow_print("")
            slow_print("🎉 结局F：龙成为了你的朋友！")
        else:
            slow_print("\n你离开了地下室...")
            slow_print("安全地回到了家。")
            slow_print("")
            slow_print("🎉 结局G：你安全回家了。")
    else:
        slow_print("\n你返回前面...")
        slow_print("走进城堡，故事继续...")
        # 这里可以跳转到前面的代码

else:
    slow_print("\n你决定离开这里。")
    slow_print("也许以后再来探索吧。")
    slow_print("")
    slow_print("🎉 结局H：你选择了安全。")

slow_print("\n" + "=" * 50)
slow_print("游戏结束！")
slow_print("=" * 50)
```

### 第3步：运行游戏
1. 保存文件
2. 点击VS Code右上角的"运行"按钮
3. 按照提示做出你的选择

---

## 🎨 进阶改进

### 改进1：添加生命值系统
```python
health = 100

# 在危险的选择中减少生命值
if choice == "fight":
    health -= 30
    print(f"你受伤了！生命值：{health}")

# 在安全的选择中恢复生命值
if choice == "rest":
    health += 20
    print(f"你休息了一下。生命值：{health}")

# 检查是否死亡
if health <= 0:
    print("你的生命值为0，游戏结束！")
```

### 改进2：添加背包系统
```python
inventory = []

# 拾取物品
if choice == "pick_up":
    inventory.append("钥匙")
    print(f"你获得了钥匙！背包：{inventory}")

# 使用物品
if choice == "use_key" and "钥匙" in inventory:
    print("你用钥匙打开了门！")
    inventory.remove("钥匙")
else:
    print("你没有钥匙！")
```

### 改进3：添加战斗系统
```python
import random

def battle(enemy_name, enemy_health, player_attack):
    """简单的战斗系统"""
    print(f"\n⚔️ 你遇到了{enemy_name}！")
    
    while enemy_health > 0:
        print(f"\n{enemy_name}的生命值：{enemy_health}")
        print("你的选择：")
        print("  1. 攻击")
        print("  2. 防御")
        print("  3. 逃跑")
        
        choice = input("你的选择：")
        
        if choice == "1":
            damage = random.randint(1, player_attack)
            enemy_health -= damage
            print(f"你对{enemy_name}造成了{damage}点伤害！")
            
            if enemy_health <= 0:
                print(f"你击败了{enemy_name}！")
                return True
        elif choice == "2":
            print("你防御了攻击！")
        elif choice == "3":
            if random.random() < 0.5:
                print("你成功逃跑了！")
                return False
            else:
                print("逃跑失败！")
        
        # 敌人攻击
        enemy_damage = random.randint(5, 15)
        print(f"{enemy_name}对你造成了{enemy_damage}点伤害！")
    
    return False
```

### 改进4：保存游戏进度
```python
import json

def save_game(data):
    """保存游戏进度"""
    with open("save.json", "w") as f:
        json.dump(data, f)
    print("游戏已保存！")

def load_game():
    """加载游戏进度"""
    try:
        with open("save.json", "r") as f:
            data = json.load(f)
        print("游戏已加载！")
        return data
    except FileNotFoundError:
        print("没有找到存档。")
        return None
```

---

## 🧠 学到了什么

通过这个项目，你学会了：
1. **函数**：def定义函数
2. **字符串格式化**：f-string
3. **循环**：while循环
4. **条件判断**：if/elif/else
5. **列表**：存储物品
6. **文件操作**：保存和加载
7. **模块**：import time, random

---

## 💡 挑战任务

完成基础版本后，试试这些挑战：
1. 添加更多的故事分支和结局
2. 做一个"角色创建"系统（选择名字、职业）
3. 添加一个"地图"系统
4. 让游戏有"存档"和"读档"功能
5. 用turtle画一个游戏地图
