import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from run_deepseek import ALLOWED, ROOT, SKILL, WORK


REVIEWS = {
    'report': '''请修订原稿并返回完整 Markdown：
1. 试玩地址已取得：创空间主页 https://www.modelscope.cn/studios/lycshanshan/lantern-keeper ，游戏运行地址 https://lycshanshan-lantern-keeper.ms.show/game/ 。在开头增加实际试玩入口，不写“已验证/稳定运行”等尚未核验的断言。
2. 报告保存于 docs/项目报告.md，因此四张游戏截图正确路径是 ai/process/解谜改造验收/xxx.png，不要 ../ai/。参考图 ../game/assets/references/frame-body.png 与 frame-support.png 路径正确。
3. “几乎全部可见的三维形体”不准确：墙地、结构与部分装饰由程序搭建。改为准确描述核心角色、关键布景及可交互道具来自 Aholo。此处可讲程序场景与生成资产如何结合。
4. “三视角构图”错误。参考图大多是单张三分之四角度的产品参考图，不能写成三视图。
5. 面数目标无需防御性解释，更不能声称来源表有实测面数。只保留正确生成参数即可。
6. 不要写从已有相框拆分文件；本次主体与背撑是两次分别生成后程序接成铰链。木槽在柜台上，不要编造“木匣”。
7. 项目报告不写验收文件目录、调试记录、未来计划；结尾保留来源链接即可。
8. 对应场景有木屑/木料，精确表述以游戏素材为准。保留其余可靠的叙事、玩法和图注。''',
    'readme': '''请修订原稿并返回完整 Markdown：
1. 顶部增加实际试玩入口：创空间主页 https://www.modelscope.cn/studios/lycshanshan/lantern-keeper ，游戏运行地址 https://lycshanshan-lantern-keeper.ms.show/game/ 。移除“正式试玩地址确定后在此补充”。不写已经全程验证等承诺。
2. 必须逐字保留旧 README 里从“## 游戏文本规范”至“## 试玩《守灯人》”之前的整个规范段落，但只保留这一规范段落，旧“试玩《守灯人》”及其后旧正文不要重复追加。请读取 README.md 精确取得旧规范。相关资源可整理一次，保留旧有资源链接。
3. 部署采用 Static；发布目录保留 game/ 及必要的 docs/，根目录新增 index.html 跳转到 ./game/。由根页面进入 game/index.html，从而保持源码目录与文档资源链接。请让部署说明与此一致。无需写核验清单、测试或验收步骤。
4. 目录树里 ai/process/ 写成 docs/ai/process/，将其并入 docs 树；无需称其为验收材料。
5. 面数只写正确生成目标，不写“目标不等于实测”一类防御性解释。整体作品许可没有另行指定，不要擅自写成明确排除开源的声明，保留 Three.js MIT 与 CMU 来源信息即可。
6. 只保留一次简介、操作、运行和来源说明，避免大段重复。''',
    'xiaohongshu': '''请重新修订原稿，交付一个确定的标题、正文和话题标签版本：
1. 标题必须包含作品名“守灯人”，20 字以内。自然具体，避免空泛抒情。
2. 文案面向普通玩家，正文约 350 至 500 字。删掉 localStorage、GLB、ImageGen、API、铰链实现、任务编号等技术细节；Aholo Lux3D 简单提一句用于制作角色和物件。
3. 不要把谜题通关步骤和正确托座详细写出，保留拼旧照、摆凳留路、翻看木刨等有画面感的互动。主角故事从病房、回店到去留选择即可，不泄露具体结局。
4. “笔记本里可以直接做”容易误导：笔记本用于回看资料和查看物件，谜题在各家场景进行。更正事实，不必解释错误。
5. 用温和、具体的日常语言表达文化传承和告别，不假设创作者亲身丧亲经历，不写未来计划或工作记录。
6. 可在正文后列一行“试玩：”并附 https://www.modelscope.cn/studios/lycshanshan/lantern-keeper ，不宣称已经完成访问验证。
7. 保留 #Aholo黑客松，配少量相关标签。''',
}

ROUND = os.environ.get('DEEPSEEK_REVISION_ROUND', '2')
if ROUND == '3':
    REVIEWS = {
        'report': '请保持本轮原稿其他内容不变，仅将“玩家由此看到的是一间可以走进去的屋子，而不是一组摆件”改成直接描述玩家在房间中行动和交互的自然句子。文档禁止用否定对比的表达来说明方案。输出完整 Markdown，不解释修改。',
        'readme': '请保持原稿其他内容和游戏文本规范逐字不变，只修订“部署到魔搭创空间”第 2 步：不能写上传仓库根目录全部内容，这会包含 .env、keys.json 和内部工作文件。实际部署包按明确清单收集：根入口 index.html、ms_deploy.json、README.md、game/，以及项目报告、模型资产说明和它们引用的图片等必要 docs 文件。说明按清单准备发布目录并保留相对路径；禁止把整个 docs/ai 工作目录打包。表述清楚简洁即可，不写长风险提醒。目录树增加 ms_deploy.json。输出完整 Markdown。',
    }
elif ROUND == '4':
    REVIEWS = {
        'readme': '请保持第三稿其他内容和游戏文本规范逐字不变，仅在 Static 部署步骤补充一段当前已经遇到的平台要求：魔搭普通 Git 文件上限为 10 MiB。实际发布仓库已用 Git LFS 跟踪 game/assets/player.glb 和 docs/ai/process/解谜改造建模/交付/preview.html。说明在发布仓库启用 Git LFS，将超限文件纳入跟踪，提交 .gitattributes 后再推送。不要写操作失败历史、调试过程或工作记录，只写当前有效的部署方法。部署材料清单保留先前白名单。输出完整 README Markdown。',
    }


def revise(name):
    prompt = WORK / (name + '-revision-prompt-v' + ROUND + '.txt')
    previous = '-draft-v' + str(int(ROUND) - 1) + '.md' if int(ROUND) > 2 else '-draft.md'
    original = (WORK / (name + previous)).read_text(encoding='utf-8')
    common = (WORK / 'deepseek-common.txt').read_text(encoding='utf-8')
    prompt.write_text(common + '\n\n这是要修订的原稿：\n' + original + '\n\n本轮修改要求：\n' +
                      REVIEWS[name], encoding='utf-8')
    command = [sys.executable, str(SKILL), '--root', str(ROOT), '--prompt-file', str(prompt),
               '--json', '--max-tokens', '18000', '--timeout', '300']
    for file in ALLOWED:
        command.extend(['--allow-file', file])
    result = subprocess.run(command, cwd=ROOT, capture_output=True, encoding='utf-8',
                            env={**os.environ, 'PYTHONUTF8': '1'})
    (WORK / (name + '-response-v' + ROUND + '.json')).write_text(result.stdout, encoding='utf-8')
    if result.returncode:
        print(json.dumps({'task': name, 'error': result.stderr.strip()}, ensure_ascii=False), flush=True)
        return
    data = json.loads(result.stdout)
    (WORK / (name + '-draft-v' + ROUND + '.md')).write_text(data['content'], encoding='utf-8')
    print(json.dumps({'task': name, 'finish_reason': data['finish_reason'], 'files_read': data['files_read'],
                      'tool_errors': data['tool_errors'], 'characters': len(data['content'])}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(revise, sys.argv[1:] or list(REVIEWS)))
