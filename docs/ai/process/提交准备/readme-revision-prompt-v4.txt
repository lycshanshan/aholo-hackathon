请为网页游戏《守灯人》撰写可直接交付的简体中文文案。当前任务只允许使用已核实的项目事实，不需要网络搜索。

共同约束：
1. 输出指定文档的完整 Markdown 原文，不用代码围栏包裹整份文件，不要在文件外解释。
2. 使用清楚、自然、克制的中文，内容具体，不堆积术语；不夸张，不编造用户反馈、奖项、历史考据、完成时长、团队人数、作者经历或身份。
3. 禁止“不是……而是……”“是……但不是……”“不能认为/看作/理解为”等防御性表达。不保留备选内容、对比说明、淘汰方案或修改理由。
4. 不写 Codex/DeepSeek 之间的工作分工、代理思考、调试记录、验收、未来计划、风险和限制与取舍。项目报告可介绍已实际采用的资产创作流程，服务赛事评审。
5. 不出现密钥、Token、.env 内容、个人联系方式。不开空白占位项，不编造尚未取得的正式试玩 URL、视频 URL、团队资料。
6. 重要事实要与所附资料或允许读取的项目文件一致。最终内容将逐字保存；如需改稿会另行回传意见。

已核实事实：
- 项目名《守灯人》，英文名 THE LANTERN KEEPER，参加群核科技 Aholo 全球 3D AI 黑客松。
- 主题是传统丧葬文化的当代传承。阿舟在病床前听奶奶嘱托，回白事店备物并送别奶奶；秋天替林、王、杜三家处理托办；入冬面对小店进货与县城来信，选择进城或留村。两条路线各有两幕与尾声。宣传文案尽量少剧透。
- 斜俯视 3D 场景，角色走动、查看物件、与人物对话、完成动手操作后推进故事。笔记本分人物、故事、物件三栏，物件可旋转和缩放查看。
- 经营阶段为可选。林家：挪凳留路、端水试走、移灯合门并到门外观察；王家：拼合六块旧照、装框、拨动 3D 相框背撑、试立、木槽安放与门边观察；杜家：翻看刨底、对齐刨痕、选择合适托座安放刨子。
- 经营单、当前谜题、本场葬礼和整个经营阶段有相应跳过入口。笔记与分支进度、谜题完成姿态用 localStorage 存在同一浏览器，刷新继续。尾声可以从头开始。
- WASD/方向键移动；触屏有方向按钮；Shift 或底部按钮切换步行/奔跑；E 交互与继续对话；N 打开笔记本；Esc 关闭查看。谜题用拖动、转向按钮和方向键微调，按具体提示操作。
- 纯 HTML/CSS/JavaScript，Three.js r180，GLTFLoader 加载 GLB，本地提供 vendor 依赖，无需 npm 构建，无后端服务，不在游玩时调用生成 API。现代浏览器需要 WebGL 2；离线游玩以通过本地 HTTP 服务打开的方式进行，不能写成双击 index.html。
- 本地运行：在仓库根目录执行 python -m http.server 8765 --bind 127.0.0.1 --directory game，再打开 http://127.0.0.1:8765/。
- 源码仓库 https://github.com/lycshanshan/aholo-hackathon 。README、报告、文案在当前任务完成后保存到仓库内，源码网页可能稍后同步，不要写“已开源”或“最新版本已推送”。
- 部署采用魔搭创空间 Static。当前正在部署，还没取得实际运行 URL，因此首稿不写猜测的 URL。后续会给准确 URL 再由你修订。
- 核心角色、重要布景和互动道具来自 Aholo Lux3D。参考图用内置 ImageGen 生成，再经 Aholo Lux3D 图生 3D 导出 GLB，按游戏尺寸和纹理需要处理接入场景；游戏内交互对象与笔记本预览共用模型。
- 主角用 Lux3D 文生 3D 和自动绑骨；步行、奔跑动画来自 CMU 动捕 07_06、09_06，并已转到主角骨架。不要声称所有动画都由 Aholo 生成，或所有 NPC 都已绑骨。
- CMU 来源 https://mocap.cs.cmu.edu/search.php?subjectnumber=7 和 https://mocap.cs.cmu.edu/search.php?subjectnumber=9&trinum=6 ，数据库由 NSF EIA-0196217 资助。Three.js 采用 MIT 许可证，随项目保留 game/vendor/three/LICENSE。不得擅自给整个作品指定开源许可证。
- 王家的相框主体与背撑分别由 Lux3D 生成，任务号 8421206、8421495，游戏代码把两件模型接成可拨动铰链。此处是程序实现关节，不得写成调用了 Aholo 关节化 API。
- 病床奶奶使用 G1，目标 80000 面；多数新增道具和 NPC 采用 G1-Turbo，目标 10000 面。面数为生成目标，不等于最后文件实测面数。不必强行罗列资产数量，最终数量应按实际来源表核对。
- 目前已有制作素材和真实游戏截图，无需留“待补截图”：
  项目报告在 docs/项目报告.md，可使用下列相对图片路径，最多选四张并配简洁图注：
  ai/process/解谜改造验收/lin-light.png（灯与门缝）
  ai/process/解谜改造验收/wang-photo.png（照片拼合）
  ai/process/解谜改造验收/wang-support.png（相框背撑）
  ai/process/解谜改造验收/du-plane.png（刨口比对）
  生成参考图（报告路径）：../game/assets/references/frame-body.png 与 ../game/assets/references/frame-support.png。
  来源表链接：报告中用 模型资产.md；README 中用 docs/模型资产.md。
- 赛事官网 https://www.aholo.cn/hackathon 。报告要求交代项目与成果，含过程截图、资产迭代对比或关键效果截图。小红书必须包含 #Aholo黑客松 。

可读取白名单文件作补充，按任务需要读取；已有资料足够时直接写作。若发现来源与事实摘要冲突，采用实际代码和游戏数据。不要照抄旧计划中尚未实现的设想。


这是要修订的原稿：
# 守灯人 THE LANTERN KEEPER

《守灯人》是一款以传统丧葬文化的当代传承为主题的网页叙事游戏，参加群核科技 Aholo 全球 3D AI 黑客松。故事发生在临川村：阿舟在病床前听完奶奶的嘱托，回到白事店备物，送奶奶最后一程；入秋后替林、王、杜三家处理托办；入冬时，小店面临进货难题，他收到一封县城来信，需要决定进城还是留村。两条路线各有两幕与一段尾声。

游戏以斜俯视的 3D 场景呈现。玩家控制角色走动、查看物件、与人物交谈，完成动手操作后推进故事。笔记本分人物、故事、物件三栏，记录已经遇见的线索；物件可以在笔记本里旋转和缩放查看。

## 试玩入口

- 创空间主页：<https://www.modelscope.cn/studios/lycshanshan/lantern-keeper>
- 游戏运行地址：<https://lycshanshan-lantern-keeper.ms.show/game/>

## 核心玩法

- **探索与对话**：在病房、白事店、祠堂与三家客户的院落、店铺、木工房里走动，靠近菱形标记与人物、物件交互，逐句读完对话。
- **笔记本**：人物、故事、物件分栏收录。物件与故事按进度分段解锁，人物靠近即收录，对话读完一轮后记入进度。
- **经营与解谜（可选）**：打开经营单可进入三家。林家用窄凳留出一条路、端水试走、移灯合门，再到门外看灯光；王家拼合六块旧照、装框、拨动 3D 相框背撑、试立，把相框安放在木槽里并从门边观察；杜家翻看刨底、对齐刨痕、选合适托座安放刨子。
- **去留分支**：入冬后看过进货回条与县城来信，选择进城或留村。进城线为“旧街关门前”“纸扎间的第七号”，留村线为“另起一页”“开春的灯”，各自接一段尾声。
- **跳过入口**：当前谜题、本场葬礼、整个经营阶段都设有跳过入口，跳过同样记入进度。
- **存档**：当前场景、笔记与分支进度、谜题完成姿态保存在同一浏览器的 localStorage，刷新后可继续；尾声页面可以“从头开始”。

## 本地运行

仓库根目录执行：

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory game
```

再打开 <http://127.0.0.1:8765/>。游戏通过本地 HTTP 服务打开，直接双击 `index.html` 无法加载资源。

项目为纯 HTML/CSS/JavaScript，使用 Three.js r180，GLTFLoader 加载 GLB，vendor 依赖随 `game/` 提供，无需 npm 构建，也没有后端服务，游玩过程中不调用生成 API。浏览器需要支持 WebGL 2；离线游玩同样以上述本地 HTTP 服务方式打开。

## 操作

| 操作 | 键鼠 | 触屏 |
| --- | --- | --- |
| 移动 | WASD / 方向键（沿画面方向） | 画面左下方方向按钮 |
| 切换步行 / 奔跑 | Shift 或底部按钮 | 底部按钮 |
| 交互、继续对话 | E 或点交互提示 / 「继续」 | 点击提示 |
| 打开笔记本 | N 或顶部「笔记本」 | 点顶部「笔记本」 |
| 关闭查看 | Esc 或右上角关闭 | 点右上角关闭 |
| 查看物件 | 拖动旋转，指针悬停在模型上滚动滚轮缩放 | 拖动旋转 |

解谜按屏幕给出的具体提示操作：拖动物件调整位置，转向按钮改变朝向，方向键微调，试摆使用操作区按钮。

## 部署到魔搭创空间（Static）

1. 登录魔搭社区，进入创空间（<https://modelscope.cn/studios>），新建一个 **Static** 类型的创空间。
2. 按清单准备发布目录，只收集站点需要的文件：根目录的 `index.html`、`ms_deploy.json`、`README.md`，完整的 `game/` 目录，以及 `docs/` 下的项目报告 `docs/项目报告.md`、模型资产说明 `docs/模型资产.md` 和这两份文档引用的图片（`docs/ai/process/解谜改造验收/` 下的四张截图）。按原有相对位置放置，`index.html` 仍跳转到 `./game/`，`game/` 内 `index.html`、`data/`、`src/`、`assets/`、`vendor/` 的结构不变，文档中的相对链接保持有效。`docs/ai/` 作为工作目录不整体打包，其中的参考图、提示词与其余过程文件不进入发布目录。
3. 推送或上传这个发布目录，在创空间页面重新构建并打开运行页面。

根页面地址指向 <https://lycshanshan-lantern-keeper.ms.show/>，由它进入 `game/index.html`，源码目录与文档中的相对链接保持有效。

## 目录结构

```
README.md              项目首页
index.html             根页面，跳转到 ./game/
ms_deploy.json         创空间部署配置
docs/                  项目报告、模型资产来源表、文案
  ├─ 项目报告.md
  ├─ 模型资产.md
  └─ ai/process/       生成过程的参考图、提示词与过程截图
game/
  ├─ index.html        入口页面
  ├─ data/             文本数据（scenes / objects / characters / dialogs / stories / actions / puzzles）
  ├─ src/              场景流程、进度存档、解谜与渲染逻辑
  ├─ assets/           GLB 模型、相片与动作数据
  └─ vendor/           随项目提供的第三方依赖（含 three 的 LICENSE）
```

## 资产与技术来源

- **Aholo Lux3D**：核心角色、重要布景与互动道具由 Lux3D 生成 GLB。参考图用内置 ImageGen 生成，再经 Lux3D 图生 3D 导出，并按照游戏尺寸与纹理需要处理接入场景。病床奶奶使用 G1，目标 80,000 面；多数新增道具与 NPC 使用 G1-Turbo，目标 10,000 面。游戏内交互对象与笔记本预览共用同一模型。
- **主角**：使用 Lux3D 文生 3D 与自动绑骨；步行、奔跑动画取自卡内基梅隆大学图形实验室的动作捕捉 07_06 与 09_06，并已转到主角骨架。NPC 模型中部分为站姿与坐姿两版静态姿态。
- **王家相框**：相框主体与背撑分别由 Lux3D 生成（任务号 8421206、8421495），游戏代码把两件模型接成可拨动铰链，关节由程序实现。
- **王家相片**：三张相片纹理由内置 ImageGen 生成，柜台旧照拆成六块供玩家拼合。
- **技术**：Three.js r180（MIT 许可证，随项目保留 `game/vendor/three/LICENSE`）；CMU 动捕数据库由 NSF EIA-0196217 资助。

详细清单见 [docs/模型资产.md](docs/模型资产.md)；创作流程与关键截图见 [docs/项目报告.md](docs/项目报告.md)。

## 相关资料

- 项目报告：[docs/项目报告.md](docs/项目报告.md)
- 小红书文案：[docs/小红书文案.md](docs/小红书文案.md)
- 模型资产来源表：[docs/模型资产.md](docs/模型资产.md)
- 赛事官网：<https://www.aholo.cn/hackathon>
- 源码仓库：<https://github.com/lycshanshan/aholo-hackathon>
- 动作捕捉数据：[CMU Subject 7 · 07_06](https://mocap.cs.cmu.edu/search.php?subjectnumber=7) · [CMU Subject 9 · 09_06](https://mocap.cs.cmu.edu/search.php?subjectnumber=9&trinum=6)

### 比赛信息

- 比赛网址：<https://www.aholo3d.cn/hackathon>
- 参赛选手手册：<https://zhangqi.feishu.cn/docx/LQXOdudK5o4Mq9xsx83c5Doznof>
- Aholo Lux3D 模型资料包：<https://lq9n5lvfn2i.feishu.cn/wiki/I5MOwqZLJixmP1k2Gcic6DMdnsc>

### 开放工具

- Aholo Lux3D：官网 <https://lux3d.aholo3d.cn/lux3d/home> · 开发文档 <https://lux3d.aholo3d.cn/lux3d/doc?lang=zh_CN>
- Aholo 3D（Lux3D 的母平台）：网址 <https://www.aholo3d.cn/> · 工作台 <https://labs.aholo3d.cn/>
- Aholo 企业版：网站 <https://b.aholo3d.cn/aholo/enterprise/create> · 开发文档 <https://aholo.demo.baklib.vip/>
- Luxreal：<http://luxreal.com/create-video?createType=8>

### 平台

- 魔搭社区：官网 <https://modelscope.cn> · 文档 <https://modelscope.cn/docs/home> · 魔搭创空间 <https://modelscope.cn/studios>
- 奇绩创坛 AI 额度：<https://credits.openai-next.com/guide>

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

本轮修改要求：
请保持第三稿其他内容和游戏文本规范逐字不变，仅在 Static 部署步骤补充一段当前已经遇到的平台要求：魔搭普通 Git 文件上限为 10 MiB。实际发布仓库已用 Git LFS 跟踪 game/assets/player.glb 和 docs/ai/process/解谜改造建模/交付/preview.html。说明在发布仓库启用 Git LFS，将超限文件纳入跟踪，提交 .gitattributes 后再推送。不要写操作失败历史、调试过程或工作记录，只写当前有效的部署方法。部署材料清单保留先前白名单。输出完整 README Markdown。