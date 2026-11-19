import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
WORK = Path(__file__).resolve().parent
SKILL = Path.home() / '.codex/skills/deepseek/scripts/deepseek.py'
ALLOWED = ['README.md', 'docs/模型资产.md', 'game/data/scenes.json',
           'game/src/chapters.js', 'game/src/progress.js', 'game/src/frame-rig.js']
TASKS = {
    'report': '撰写 docs/项目报告.md，约 2500 至 3500 个汉字，面向赛事评委。完整讲清作品主题、核心体验、剧情结构、具体玩法、Lux3D 的核心贡献、已有资产创作流程、关键模型接入及最终画面。结合提供的实际截图和参考图。以项目名称为一级标题，结构清晰，不写泛泛行业分析。无需包含完整剧本和谜底。',
    'readme': '完整改写项目根目录 README.md，使其适合项目首页，覆盖简介、核心玩法、本地运行、操作、魔搭 Static 部署步骤、目录结构、资产与技术来源、报告与相关资料链接。必须先读现有 README.md；从“## 游戏文本规范”开始至“## 试玩《守灯人》”之前的整段内容须逐字保留，包括所有示例 JSON、标点和空行，可整体放到新 README 后部。原有资源链接请保留为简洁资源区。项目介绍要与当前实现一致。项目报告链接 docs/项目报告.md，小红书文案链接 docs/小红书文案.md。不要编造正式试玩地址。',
    'xiaohongshu': '撰写 docs/小红书文案.md，只交付一个确定版本，包含一个 20 字以内小红书标题、约 350 至 550 字可直接粘贴的正文和话题标签。自然真诚，有具体游戏画面与玩法，让普通读者愿意了解；可以使用少量第一人称表达创作意图，但不虚构作者经历、耗时、团队情况、试玩反馈。开头有吸引力，围绕告别、日常物件、手艺传承和具体互动，不猎奇、不恐怖营销，不用“大厂震撼”“全网首个”等夸张词。轻量提及 Aholo Lux3D 制作角色/物件。必须含 #Aholo黑客松，可附少量贴题标签。不写镜头计划、发布教程、多个备选、待填链接或剧透结局。',
}


def run_task(name):
    prompt = WORK / (name + '-prompt.txt')
    prompt.write_text((WORK / 'deepseek-common.txt').read_text(encoding='utf-8') +
                      '\n\n本次任务：\n' + TASKS[name], encoding='utf-8')
    command = [sys.executable, str(SKILL), '--root', str(ROOT),
               '--prompt-file', str(prompt), '--json', '--max-tokens', '18000', '--timeout', '300']
    for path in ALLOWED:
        command.extend(['--allow-file', path])
    result = subprocess.run(command, cwd=ROOT, capture_output=True, encoding='utf-8',
                            env={**os.environ, 'PYTHONUTF8': '1'})
    (WORK / (name + '-response.json')).write_text(result.stdout, encoding='utf-8')
    if result.returncode:
        print(json.dumps({'task': name, 'error': result.stderr.strip()}, ensure_ascii=False), flush=True)
        return
    data = json.loads(result.stdout)
    (WORK / (name + '-draft.md')).write_text(data['content'], encoding='utf-8')
    print(json.dumps({'task': name, 'model': data['model'], 'finish_reason': data['finish_reason'],
                      'files_read': data['files_read'], 'tool_errors': data['tool_errors'],
                      'characters': len(data['content'])}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(run_task, sys.argv[1:] or list(TASKS)))
