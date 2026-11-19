# Aholo Hackathon

群核科技 Aholo 3D AI Hackathon 参赛作品

## 项目基本信息

本项目是 Aholo Hackathon参赛作品，使用Aholo 3D平台进行建模，制作的网页游戏。

## 游戏概述

- 游戏主题是传统丧葬文化的当代传承。
- 主流程用场景串联，玩家操作角色在场景中走动，探索场景中的物件、与场景中的人物对话，解锁故事；完成一个场景的探索后，解锁一段剧情，进入下一个场景。
- 玩家有一本笔记本，分成人物、故事和物件三个栏目，记录目前已经收集的内容。

## 游戏文本规范

- 涉及文本的游戏内容，使用`.json`文件存储在`game/data/`目录下。
- 每个文件包含一个大列表，每个项为一个字典，对应一个单位。
- 摆放位置等数据写在代码中，json文件只用于存储文本。
- 场景的标题、地点、时间、导语和探索提示存放在 `scenes.json`，以场景 ID 关联物件和对话。
- 物件、人物、对话和动作的 ID 共用一套进度记录，需保持唯一。

### 1. 场景
- 场景对应文件`scenes.json`。
- 每个场景包含`id`，`title`，`chapter`，`place`，`time`，`intro`，`guide`，`completeGuide`词条。

一个项的示例格式如下：
```json
{
  "id": "object-id",
  "title": "场景名",
  "chapter": "章节名",
  "place": "地点",
  "time": "描述时间的词",
  "intro": "1-2句话，场景介绍。",
  "guide": "场景目标指引。",
  "completeGuide": "完成场景全部任务后，指引信息变化。"
}
```

### 2. 场景物件

- 场景物件对应文件`objects.json`。
- 每个物件包含`id`，`scene`，`title`，`material`，`description`，`story.num`，`requirement.num`词条。
- 查看物件后收录到笔记本，详情按编号展示已编写的物件故事。

一个项的示例格式如下：
```json
{
  "id": "object-id",
  "scene": "scene-id",
  "title": "示例物品",
  "material": "物品材质/材料",
  "description": "一句话，描述物品。",
  "requirement.1": ["any-id"],
  "story.1": "随剧情推进，增加物品故事。可选，物品的第一段故事。",
  "requirement.2": ["any-id"],
  "story.2": "随剧情推进，增加物品故事。可选，物品的第二段故事。后续可依次类推增加。"
}
```

### 3. 人物

- 人物对应文件`characters.json`。
- 每个人物包含`id`，`title`，`identity`，`description`，`story.num`词条。
- 靠近人物即收录人物资料。人物故事的 `requirement.num` 与故事文件使用同一套解锁规则。

一个项的示例格式如下：
```json
{
  "id": "character-id",
  "title": "人物名",
  "identity": "人物身份",
  "description": "人物的信息介绍。",
  "requirement.1": ["any-id"],
  "story.1": "随剧情推进，解锁故事。可选，人物的第一段故事。",
  "requirement.2": ["any-id"],
  "story.2": "随剧情推进，解锁故事。可选，人物的第二段故事。后续可依次类推增加。"
}
```

### 4. 对话

- 对话对应文件`dialogs.json`。
- 对话文件的每一项对应一轮对话。
- 每轮对话包含`id`，`scene`，`trigger`，`index`，`loop`，`character-id.num`词条。
- 部分条目解释：
  - `trigger`：填一个角色的id，与该人物交互触发这段对话；
  - `index`：如果一个场景里一个人物有多段对话，按照`index`顺序触发；
  - `loop`：若设置为true，则在本场景该人物所有对话均触发过一次后，再次对话会重复触发这条对话。
  - 对话词条`character-id.num`：参见示例，按顺序编排对话和说话人，说话人可任意指定，不局限于trigger和me。
  - 读完一轮对话后记录进度。提前关闭时，下次交互从本轮第一句开始。

一个项的示例格式如下：
```json
{
  "id": "dialog-id",
  "scene": "scene-id",
  "trigger": "character-id",
  "index": 0,
  "loop": true,
  "character-id.1": "第1句话，character-id说。",
  "me.2": "第2句话，主角（玩家控制角色）说。",
  "character-id.3": "第3句话，character-id说。依次类推增加。"
}
```

### 5. 故事

- 故事对应文件`stories.json`。
- 每个故事包含`id`，`title`，`requirement.num`，`story.num`词条。
- `requirement.num`解释：每个requirement为一个列表，可以填入任意角色、物品、对话id，经历过全部列表中的角色(遇见过即可)、物品(查看过)、对话后，解锁这个故事的对应条目。
- 缺省或留空的 `requirement.num` 表示该段无前置条件。有任一段解锁的故事会出现在笔记本中。

一个项的示例格式如下：
```json
{
  "id": "story-id",
  "title": "故事标题",
  "requirement.1": ["any-id"],
  "story.1": "随剧情推进，解锁故事。第1段故事。",
  "requirement.2": ["any-id"],
  "story.2": "随剧情推进，解锁故事。第2段故事。后续可依次类推增加。"
}
```

### 6. 场景动作

- 确认动作、谜题、去留选择和尾声的文本存放在 `actions.json`。
- 每项包含 `id`、`title`、`description`。单个动作使用 `label` 和 `result` 分别填写按钮文字和操作结果。带选项的动作使用 `choices`，每个选项包含 `label` 和 `feedback`。
- 场景中的位置和动作触发条件在 `game/src/chapters.js` 配置，场景实体及操作后的摆放在 `game/src/scenery.js` 配置。
- 经营解谜的操作提示、按钮文字和帮助内容存放在 `puzzles.json`。空间范围与完成条件在 `game/src/puzzles/rules.js` 配置，各项操作在 `game/src/puzzles/` 下实现。

## 试玩《守灯人》

阿舟在病床前听奶奶说完最后的嘱托，回到白事店准备并主持她的葬礼。接下来的秋天有三户人托他帮忙。入冬后，阿舟带着账簿和县城来信决定去留，两条路线各有两幕与一段尾声。

在仓库根目录启动本地预览，再打开 [127.0.0.1:8765](http://127.0.0.1:8765/)。

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory game
```

- 用 **WASD** 或 **方向键**沿画面方向走动。触屏设备使用画面左下方的方向按钮。
- 点按 **Shift** 或底部的步行按钮，在步行和奔跑间切换。
- 靠近菱形标记后按 **E** 或点交互提示。查看物件时可拖动模型旋转，将指针放在模型上用滚轮缩放。按 **Esc** 或点右上角关闭。
- 交谈时按 **E** 或点「继续」逐句阅读。读完一轮后记录对话进度。
- 经营单可进入林、王、杜三家。查看线索后，可动手挪凳留路、移灯合门、拼合旧照、拨动相框背撑及比对刨口并安放刨子。拖动物件调整位置，方向键可微调；转向与试摆使用操作区按钮。点「跳过选项」可跳过当前谜题、本场葬礼或整个经营阶段。
- 点顶部「笔记本」或按 **N** 回顾人物、故事和物件。当前场景、笔记与分支进度保存在同一浏览器中，刷新后可以继续。尾声页面提供「从头开始」。

浏览器需要支持 WebGL 2。Three.js r180 和模型随 `game/` 提供，游玩时可以离线运行。

### 场景与资产

场景以斜俯视的剖面房间与院落呈现。三处经营场景共享墙地结构，各自配有门廊、卷帘柜台或木工台。角色、重要布景与互动道具使用 Aholo Lux3D 生成的 GLB。场景和笔记本的物件预览共用模型。详见 [模型资产](docs/模型资产.md)。

主角模型使用 Lux3D 文生 3D 和自动绑骨。[player-walk.json](game/assets/player-walk.json) 包含站姿、步行和奔跑动画。步行和奔跑分别取自卡内基梅隆大学图形实验室的 [动作捕捉数据 07_06](https://mocap.cs.cmu.edu/search.php?subjectnumber=7) 和 [09_06](https://mocap.cs.cmu.edu/search.php?subjectnumber=9&trinum=6)，数据库由 NSF EIA-0196217 资助。

## 相关资源

### 比赛信息

比赛网址：https://www.aholo3d.cn/hackathon

参赛选手手册：https://zhangqi.feishu.cn/docx/LQXOdudK5o4Mq9xsx83c5Doznof

Aholo Lux3D 模型资料包：https://lq9n5lvfn2i.feishu.cn/wiki/I5MOwqZLJixmP1k2Gcic6DMdnsc

### 开放工具

Aholo Lux3D：
- 官网：https://lux3d.aholo3d.cn/lux3d/home
- 开发文档：https://lux3d.aholo3d.cn/lux3d/doc?lang=zh_CN

Aholo 3D（Lux 3D的母平台）：
- 网址：https://www.aholo3d.cn/
- 工作台：https://labs.aholo3d.cn/

Aholo 企业版：
- 网站：https://b.aholo3d.cn/aholo/enterprise/create
- 开发文档：https://aholo.demo.baklib.vip/

Luxreal：
- http://luxreal.com/create-video?createType=8

### 平台
魔搭社区：
- 官网：https://modelscope.cn
- 文档：https://modelscope.cn/docs/home
- 魔搭创空间：https://modelscope.cn/studios

奇绩创坛AI额度：
- 官网&文档：https://credits.openai-next.com/guide
