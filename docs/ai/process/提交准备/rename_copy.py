import hashlib
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from run_deepseek import ROOT, SKILL, WORK


FILES = {'report': 'docs/项目报告.md', 'readme': 'README.md', 'xiaohongshu': 'docs/小红书文案.md'}


def prepare(name):
    source = ROOT / FILES[name]
    data = source.read_bytes()
    text = data.decode('utf-8-sig')
    (WORK / (name + '-rename-base.md')).write_bytes(data)
    prompt = '''请修订下面这份项目文案，并输出完整 Markdown 原文，不用代码围栏包裹整份文件，不解释修改。
用户正式确定游戏名为《长宁白事铺》。请将旧名称“守灯人”统一替换为“长宁白事铺”，删除旧英文名 THE LANTERN KEEPER，不新造英文副标题。
保留当前文本所有已有的人工改动、删减和内容结构，禁止恢复上一版删除的图片、段落或参赛身份说明。只做名称统一和本任务明确指出的部署事实修订。不要新增占位内容，不要虚构事实，不要新增未来计划、验证清单或防御性解释。
所有现有试玩链接、项目仓库地址与文件路径继续保留，不要把 URL 里的 lantern-keeper 改成不存在的新地址。
若是小红书文案，标题控制在 20 字以内，并保留 #Aholo黑客松。
若是 README，游戏文本规范整节必须逐字保留；部署清单增加 .dockerignore，并说明它在平台构建时排除 .git、.env 和 keys.json。ms_deploy.json 当前包含 Static 类型、免费资源 platform/2v-cpu-16g-mem 和平台基础镜像。沿用 Git LFS 部署方法。资料按报告和模型资产说明所引用的文件收集，保留相对位置，docs/ai 的其余工作文件不整体上传；不要一边说排除全部参考图和预览一边又说上传预览。仅写有效部署方法，不记载问题发现与修复历史。
文案如下：
'''
    prompt_path = WORK / (name + '-rename-prompt.txt')
    prompt_path.write_text(prompt + text, encoding='utf-8')
    command = [sys.executable, str(SKILL), '--root', str(ROOT), '--prompt-file', str(prompt_path),
               '--json', '--max-tokens', '18000', '--timeout', '300']
    result = subprocess.run(command, cwd=ROOT, capture_output=True, encoding='utf-8',
                            env={**os.environ, 'PYTHONUTF8': '1'})
    (WORK / (name + '-rename-response.json')).write_text(result.stdout, encoding='utf-8')
    if result.returncode:
        print(json.dumps({'task': name, 'error': result.stderr.strip()}, ensure_ascii=False), flush=True)
        return
    response = json.loads(result.stdout)
    (WORK / (name + '-renamed.md')).write_text(response['content'], encoding='utf-8')
    print(json.dumps({'task': name, 'finish_reason': response['finish_reason'],
                      'tool_errors': response['tool_errors'], 'base_sha256': hashlib.sha256(data).hexdigest(),
                      'characters': len(response['content'])}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(prepare, sys.argv[1:] or list(FILES)))
