import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from modelscope_api import ROOT, read_token


WORK = Path(__file__).resolve().parent
STATE = WORK / 'studio-state.json'
REMOTE = 'https://www.modelscope.cn/studios/lycshanshan/lantern-keeper.git'


def git(arguments, directory):
    launcher = WORK / 'git-askpass.cmd'
    launcher.write_text('@"' + sys.executable + '" "' + str(WORK / 'git_askpass.py') + '" %*\n',
                        encoding='utf-8')
    environment = {**os.environ, 'GIT_ASKPASS': str(launcher), 'GIT_TERMINAL_PROMPT': '0',
                   'GIT_TRACE': '0', 'GIT_TRACE_CURL': '0', 'MODELSCOPE_DEPLOY_TOKEN': read_token()}
    environment.pop('GIT_CURL_VERBOSE', None)
    result = subprocess.run(['git', '-c', 'credential.helper=', *arguments], cwd=directory,
                            env=environment, capture_output=True, encoding='utf-8', errors='replace')
    print(result.stdout, end='')
    print(result.stderr, end='', file=sys.stderr)
    result.check_returncode()


def prepare():
    staging = Path(tempfile.mkdtemp(prefix='lantern-keeper-studio-'))
    STATE.write_text(json.dumps({'staging': str(staging), 'remote': REMOTE}, indent=2), encoding='utf-8')
    git(['clone', REMOTE, str(staging)], ROOT)
    print(json.dumps({'staging': str(staging)}, ensure_ascii=False))


def sync():
    staging = Path(json.loads(STATE.read_text(encoding='utf-8'))['staging'])
    git(['pull', '--ff-only'], staging)
    shutil.copytree(ROOT / 'game', staging / 'game', dirs_exist_ok=True)
    shutil.copy2(ROOT / 'README.md', staging / 'README.md')
    for name in ['项目报告.md', '小红书文案.md', '模型资产.md']:
        destination = staging / 'docs' / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / 'docs' / name, destination)
    for folder in ['解谜改造验收', '解谜改造建模/交付']:
        source = ROOT / 'docs/ai/process' / folder
        shutil.copytree(source, staging / 'docs/ai/process' / folder, dirs_exist_ok=True)
    shutil.copy2(ROOT / 'docs/ai/process/解谜改造建模/参考图提示词.md',
                 staging / 'docs/ai/process/解谜改造建模/参考图提示词.md')
    shutil.copy2(ROOT / 'index.html', staging / 'index.html')
    shutil.copy2(ROOT / 'ms_deploy.json', staging / 'ms_deploy.json')
    shutil.copy2(ROOT / '.dockerignore', staging / '.dockerignore')
    files = [file for file in staging.rglob('*') if file.is_file() and '.git' not in file.parts]
    forbidden = [str(file.relative_to(staging)) for file in files
                 if file.name in {'.env', 'keys.json'} or file.suffix in {'.pem', '.key'}]
    if forbidden:
        raise RuntimeError('发布目录包含凭据文件：' + ', '.join(forbidden))
    git(['add', '--all'], staging)
    git(['-c', 'user.name=lycshanshan', '-c', 'user.email=lycshanshan@users.noreply.github.com',
         'commit', '-m', 'Publish Changning Baishipu'], staging)
    print(json.dumps({'files': len(files), 'bytes': sum(file.stat().st_size for file in files)}, ensure_ascii=False))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['prepare', 'sync', 'push', 'lfs'])
    args = parser.parse_args()
    if args.action == 'prepare':
        prepare()
    elif args.action == 'sync':
        sync()
    elif args.action == 'lfs':
        staging = Path(json.loads(STATE.read_text(encoding='utf-8'))['staging'])
        git(['lfs', 'install', '--local'], staging)
        large = ['game/assets/player.glb', 'docs/ai/process/解谜改造建模/交付/preview.html']
        git(['lfs', 'track', *large], staging)
        git(['add', '--renormalize', *large], staging)
        git(['add', '.gitattributes'], staging)
        git(['-c', 'user.name=lycshanshan', '-c', 'user.email=lycshanshan@users.noreply.github.com',
             'commit', '--amend', '--no-edit', '--quiet'], staging)
        git(['lfs', 'ls-files'], staging)
    else:
        staging = Path(json.loads(STATE.read_text(encoding='utf-8'))['staging'])
        git(['push', 'origin', 'HEAD:master'], staging)
