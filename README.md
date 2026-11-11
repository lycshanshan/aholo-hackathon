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
- 物件、人物和对话的 ID 共用一套进度记录，需保持唯一。

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

## 第一幕 · 白事店

《守灯人》是基于 [261028 brainstorm](docs/261028-brainstorm.md) 的剧情游戏原型。玩家回到小镇白事店，和柜台左侧的奶奶交谈，查看纸扎莲花灯、账簿和手编花圈。账簿旁的来信为后续「进城 / 留镇」支线埋下伏笔。

在仓库根目录启动本地预览，再打开 [127.0.0.1:8765](http://127.0.0.1:8765/)。

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory game
```

- 用 **WASD** 或 **方向键**沿画面方向走动。触屏设备使用画面左下方的方向按钮。
- 靠近菱形标记后按 **E** 或点交互提示。查看物件时可拖动模型旋转，将指针放在模型上用滚轮缩放。按 **Esc** 或点右上角关闭。
- 靠近奶奶即可收录人物。交谈时按 **E** 或点「继续」逐句阅读，在最后一句点「结束对话」即可收录人物轶事。
- 查看莲花灯并完成对话后，解锁《留一张凳子》的第一段。看过账簿和花圈后，解锁第二段。
- 点顶部「笔记本」或按 **N** 回顾人物、故事和物件。记录保存在当前浏览器里，刷新页面或回到门口后仍可回顾。

浏览器需要支持 WebGL 2。Three.js r180 和模型随 `game/` 提供，游玩时可以离线运行。

### 白事店的建模分工

店面、柜台和货架按尺寸建模，正面留空，方便俯视店内和绕行。主角的转身和步行动画由移动距离驱动，墙壁、货架和柜台使用独立碰撞范围。纸扎莲花灯是场景中的独立道具，模型和剧情触发点分开定义。

纸扎莲花灯用 Lux3D 中国站的文生 3D 生成，标准版手绘风，目标 12,000 面，实际 GLB 为 6,600 个三角面，内嵌两张纹理。原始模型位于 [paper-lotus.glb](game/assets/paper-lotus.glb)，生成任务 ID 为 `5016215`。浏览器把 GLB 按尺寸摆到柜台，文件不可用时会保留本地纸灯。

奶奶使用 Lux3D 中国站文生 3D 生成的 [grandma.glb](game/assets/grandma.glb)，任务 ID 为 `5803439`。模型在柜台左侧，交谈范围由场景代码定义。

账簿和花圈使用 Lux3D 中国站图生 3D，任务 ID 分别为 `5814589` 和 `5814592`。参考图在 [game/assets/references](game/assets/references)，场景和笔记本使用同一份 [ledger.glb](game/assets/ledger.glb) 和 [wreath.glb](game/assets/wreath.glb)。

主角使用 Lux3D 中国站文生 3D 和自动绑骨，任务 ID 分别为 `5814583` 和 `5829505`。[player.glb](game/assets/player.glb) 的腿、手臂和脊柱关节由移动距离驱动。

在 `game/src/shop.js` 调整店内布局和观察点，在 `game/src/assets.js` 调整 GLB 挂载，在 `game/src/player.js` 调整人物。

# 相关资源

## 比赛信息

比赛网址：https://www.aholo3d.cn/hackathon

参赛选手手册：https://zhangqi.feishu.cn/docx/LQXOdudK5o4Mq9xsx83c5Doznof

Aholo Lux3D 模型资料包：https://lq9n5lvfn2i.feishu.cn/wiki/I5MOwqZLJixmP1k2Gcic6DMdnsc

## 开放工具

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

## 平台
魔搭社区：
- 官网：https://modelscope.cn
- 文档：https://modelscope.cn/docs/home
- 魔搭创空间：https://modelscope.cn/studios

奇绩创坛AI额度：
- 官网&文档：https://credits.openai-next.com/guide
