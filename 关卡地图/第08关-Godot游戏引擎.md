# 第8关 🎮 Godot游戏引擎：真正的游戏

## 🎯 任务目标
用Godot做一个2D游戏！这是专业游戏开发者用的工具。

## ⏰ 预计时间
3-4个周末

---

## 📖 什么是Godot？

Godot是一个**游戏引擎**，就是专门用来做游戏的软件。用它做出来的游戏可以：
- 发布到手机、电脑、网页
- 有专业的画面和音效
- 支持2D和3D游戏
- 完全免费！

---

## 🛠️ 准备工作

### 打开Godot
1. 在启动台找到Godot，或者在终端输入 `godot`
2. 第一次打开会看到项目管理器
3. 点击"新建项目"
4. 项目名称：`我的第一个游戏`
5. 选择一个文件夹保存项目
6. 点击"创建并编辑"

---

## 📖 教程：做一个弹球游戏

### 第1步：认识Godot界面

打开Godot后，你会看到：
- **场景面板**（左上角）：管理游戏中的所有对象
- **检查器**（右侧）：修改选中对象的属性
- **时间线**（底部中间）：管理动画
- **文件系统**（左下角）：管理项目文件

### 第2步：创建游戏场景

#### 添加一个球
1. 点击场景面板的"+"号
2. 选择"CharacterBody2D"（角色体）
3. 给它改名为"Ball"
4. 在Ball下面添加一个"Sprite2D"（精灵）
5. 再添加一个"CollisionShape2D"（碰撞形状）

#### 给球添加图片
1. 从网上下载一个球的图片（或者用Godot自带的图标）
2. 把图片拖到文件系统
3. 把图片拖到Sprite2D的"Texture"属性上

#### 设置碰撞形状
1. 点击CollisionShape2D
2. 在检查器中，点击"Shape" → "新建CircleShape2D"
3. 调整圆形大小，让它包围球的图片

### 第3步：让球动起来

点击Ball，在检查器中找到"Script"（脚本），点击"新建"：

```gdscript
extends CharacterBody2D

# 速度
var speed = 200.0
# 方向
var direction = Vector2(1, 1).normalized()

func _physics_process(delta):
    # 移动球
    velocity = direction * speed
    
    # 碰到墙壁反弹
    var collision = move_and_collide(velocity * delta)
    if collision:
        direction = direction.bounce(collision.get_normal())
```

**AI帮你理解：**
```
我在用Godot做弹球游戏。
这段代码是什么意思？
特别是 move_and_collide 和 bounce 是干什么的？
请用简单的话解释。
```

### 第4步：添加挡板

1. 添加一个"StaticBody2D"（静态体）
2. 改名为"Paddle"
3. 在下面添加Sprite2D和CollisionShape2D
4. 给挡板一张图片
5. 设置碰撞形状为长方形

#### 让挡板跟随鼠标
给Paddle添加脚本：

```gdscript
extends StaticBody2D

func _process(delta):
    # 让挡板跟随鼠标
    position.x = get_global_mouse_position().x
```

### 第5步：添加砖块

1. 创建一个新场景，叫"Brick"
2. 添加StaticBody2D、Sprite2D、CollisionShape2D
3. 给砖块一张图片
4. 回到主场景，复制粘贴多个砖块

### 第6步：检测碰撞和得分

#### 球碰到砖块时，砖块消失
修改Ball的脚本：

```gdscript
extends CharacterBody2D

var speed = 200.0
var direction = Vector2(1, 1).normalized()
var score = 0

func _physics_process(delta):
    velocity = direction * speed
    var collision = move_and_collide(velocity * delta)
    if collision:
        direction = direction.bounce(collision.get_normal())
        
        # 如果碰到的是砖块
        if collision.get_collider().is_in_group("bricks"):
            collision.get_collider().queue_free()
            score += 1
            print("得分：" + str(score))
```

#### 给砖块添加到"bricks"组
1. 选择砖块节点
2. 在检查器中找到"Groups"（组）
3. 添加"bricks"组

### 第7步：添加游戏结束条件

#### 球掉到屏幕下方时游戏结束
修改Ball的脚本：

```gdscript
func _process(delta):
    # 如果球掉到屏幕下方
    if position.y > 600:
        print("游戏结束！你的得分是：" + str(score))
        get_tree().reload_current_scene()  # 重新开始
```

### 第8步：添加UI显示分数

1. 添加一个"Label"（标签）节点
2. 改名为"ScoreLabel"
3. 给Label添加脚本：

```gdscript
extends Label

func _process(delta):
    text = "得分：" + str(get_node("../Ball").score)
```

---

## 🎨 自定义你的游戏

### 换皮肤
- 替换球、挡板、砖块的图片
- 添加背景图片
- 改变颜色主题

### 加音效
1. 下载免费的音效（比如 freesound.org）
2. 把音效文件拖到项目中
3. 在代码中播放音效：

```gdscript
# 在碰撞时播放音效
$AudioStreamPlayer.play()
```

### 加粒子效果
1. 添加一个"GPUParticles2D"节点
2. 设置粒子的外观和行为
3. 在碰撞时触发粒子效果

---

## 🚀 导出游戏

### 导出为Mac应用
1. 点击"项目" → "导出"
2. 选择"macOS"
3. 点击"导出项目"
4. 选择保存位置
5. 等待导出完成

### 导出为网页游戏
1. 点击"项目" → "导出"
2. 选择"Web"
3. 点击"导出项目"
4. 会生成一个HTML文件，可以在浏览器中运行

---

## 🧠 思考题

1. `CharacterBody2D`和`StaticBody2D`有什么区别？
2. 为什么要用`move_and_collide`而不是直接改`position`？
3. `delta`参数是干什么的？
4. 怎么让游戏有多个关卡？

---

## 💡 学习建议

1. **先跑通再美化**：先让游戏能玩，再加特效
2. **多看官方文档**：docs.godotengine.org
3. **问AI**：Godot的问题AI很擅长回答
4. **保存项目**：经常保存，避免丢失进度

---

## ✅ 完成标准
- [ ] 有一个能玩的弹球游戏
- [ ] 球能反弹
- [ ] 挡板能控制
- [ ] 砖块能被击中消失
- [ ] 有分数显示
- [ ] 有游戏结束和重新开始
- [ ] （加分）导出了可运行的游戏文件

## 🏆 成就解锁
**🎮 游戏工程师** — 你用专业工具做出了真正的游戏！

## 📝 作品记录
- 游戏名称：__________
- 游戏类型：__________
- 有几个关卡：__________
- 最酷的功能：__________
- 导出格式：__________

---

## 🎮 下一关预告
**第9关：视频进阶** — 制作一个教学视频，成为知识UP主！
