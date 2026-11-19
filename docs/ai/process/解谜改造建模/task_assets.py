import json
import os
import pathlib
import subprocess
import sys
import struct
import hashlib
import uuid
from datetime import datetime, timezone


ROOT = pathlib.Path(__file__).resolve().parents[4]
SKILL = pathlib.Path('C:/Users/lycshanshan/.codex/skills/aholo-lux3d')
LOGS = pathlib.Path(__file__).parent / 'logs'
LOGS.mkdir(exist_ok=True)
sys.path.insert(0, str(SKILL / 'core/runtime'))
for line in (ROOT / '.env').read_text(encoding='utf-8-sig').splitlines():
    if line.startswith('AHOLO_3D_API_KEY='):
        os.environ['LUX3D_CN_API_KEY'] = line.split('=', 1)[1].strip().strip('"\'')
os.environ['LUX3D_HOST_NAME'] = 'codex'

import asset_uploader
import lux3d_client


def save(name, value):
    (LOGS / name).write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def read(name):
    return json.loads((LOGS / name).read_text(encoding='utf-8'))


def commerce(command, *arguments):
    process = subprocess.run([sys.executable, str(SKILL / 'scripts/commerce.py'), command,
                              '--region', 'cn', '--host-name', 'codex', *map(str, arguments)],
                             capture_output=True, text=True, encoding='utf-8')
    if process.returncode:
        sys.stderr.write(process.stderr)
        raise SystemExit(process.returncode)
    return json.loads(process.stdout)


def prepare():
    # 上传只保存实际回执，重跑时复用已上传的参考图。
    for name in ['frame-body', 'frame-support']:
        receipt = LOGS / f'{name}-upload.json'
        if not receipt.exists():
            save(receipt.name, asset_uploader.upload_file(ROOT / 'game/assets/references' / f'{name}.png', region='cn'))
    if not (LOGS / 'init.json').exists():
        save('init.json', commerce('init', '--journal', LOGS / 'collection.sqlite', '--model-name', 'GPT-6'))
    initialized = read('init.json')
    plan = ('为《守灯人》经营阶段的可操作三维相框分别制作木相框主体和背撑各一件。'
            '两件均从已生成的参考图使用中国站图生3D极速版制作，目标面数10000，GLB输出，不做四视图增强。'
            '在网页中对齐铰链并让玩家直接拨动背撑，接入相框试立与木槽安放两步解谜。'
            '沿用当前项目其余Aholo模型，完成模型检查、浏览器操作检查并保留来源记录。')
    review = {'pluginTaskId': initialized['pluginTaskId'], 'planVersion': 1, 'plan': plan,
              'userInputs': [{'inputId': 'approval', 'text': '可以，按照你的方案修改', 'addedInVersion': 1},
                             {'inputId': 'region', 'text': '中国站，沿用项目现有账号', 'addedInVersion': 1}],
              'attachments': [{'inputId': name, 'url': read(f'{name}-upload.json')['url'],
                               'role': name, 'addedInVersion': 1} for name in ['frame-body', 'frame-support']]}
    save('review.json', review)
    items = {str(index + 1): {'endpoint': {'method': 'POST', 'path': '/lux3d/v1/generate/img-to-3d/task/create'},
                            'parameters': {'body': lux3d_client.build_image_to_3d_payload(
                                read(f'{name}-upload.json')['url'], version='G1-Turbo', faceCount=10000,
                                outputFormat='glb', region='cn')}}
             for index, name in enumerate(['frame-body', 'frame-support'])}
    save('items.json', items)
    quoted = commerce('quote', '--items', LOGS / 'items.json', '--review', LOGS / 'review.json',
                       '--journal', LOGS / 'collection.sqlite', '--model-name', 'GPT-6')
    save('quote.json', quoted)
    print(json.dumps({'pluginTaskId': initialized['pluginTaskId'],
                      'credits': quoted['quote']['estimatedCreditsTotal'], 'details': quoted['quote']['details'],
                      'available': quoted['account']['availableCredits'], 'expiresAt': quoted['quote']['expiresAt']}, ensure_ascii=False))


def submit():
    # 每件部件只提交一次，任务号落盘后才处理下一件。
    authorization = read('authorization.json')
    quote = read('quote.json')['quote']
    assert authorization['credits'] == quote['estimatedCreditsTotal']
    for name in ['frame-body', 'frame-support']:
        if (LOGS / f'{name}-attempt.json').exists():
            if read(f'{name}-attempt.json')['status'] == 'succeeded':
                continue
            raise SystemExit(f'{name}: submission already recorded; resume by query')
        started = datetime.now(timezone.utc).isoformat()
        attempt = {'asset': name, 'status': 'submission_started', 'createdAt': started,
                   'region': 'cn', 'quoteId': quote['quoteId'], 'authorization': authorization}
        save(f'{name}-attempt.json', attempt)
        task_id = lux3d_client.create_image_to_3d_task(read(f'{name}-upload.json')['url'], version='G1-Turbo',
                    faceCount=10000, outputFormat='glb', region='cn', content_id=quote['quoteId'])
        attempt.update(taskId=str(task_id), status='submitted')
        save(f'{name}-attempt.json', attempt)
        print(json.dumps({'asset': name, 'taskId': str(task_id)}), flush=True)
        break


def poll():
    for name in ['frame-body', 'frame-support']:
        if not (LOGS / f'{name}-attempt.json').exists():
            continue
        attempt = read(f'{name}-attempt.json')
        assert attempt.get('taskId'), 'submission outcome requires reconciliation'
        result = lux3d_client.get_task(attempt['taskId'], region='cn')
        save(f'{name}-query.json', result)
        status = result['status']
        if status == 3 and attempt['status'] != 'succeeded':
            output = ROOT / 'game/assets' / f'{name}.glb'
            lux3d_client.download_requested_models(lux3d_client.parse_task_outputs(result), str(output), ['glb'])
            with output.open('rb') as stream:
                magic, version, length = struct.unpack('<III', stream.read(12))
                assert magic == 0x46546C67 and version == 2 and length == output.stat().st_size
                size, kind = struct.unpack('<II', stream.read(8))
                content = json.loads(stream.read(size))
                assert content['meshes'] and content['nodes']
            attempt.update(status='succeeded', localCompletedAt=datetime.now(timezone.utc).isoformat(),
                           artifact=str(output), bytes=output.stat().st_size)
            save(f'{name}-attempt.json', attempt)
        print(json.dumps({'asset': name, 'taskId': attempt['taskId'], 'status': status,
                          'downloaded': attempt['status'] == 'succeeded'}, ensure_ascii=False), flush=True)


def report():
    # 部件来源与实际任务号共同组成评估记录。
    review = read('review.json')
    quote = read('quote.json')['quote']
    tool_calls = []
    artifacts = []
    for index, name in enumerate(['frame-body', 'frame-support']):
        attempt = read(f'{name}-attempt.json')
        assert attempt['status'] == 'succeeded'
        artifact = pathlib.Path(attempt['artifact'])
        artifacts.append({'asset': name, 'path': str(artifact.relative_to(ROOT)), 'format': 'glb',
                          'bytes': artifact.stat().st_size, 'sha256': hashlib.sha256(artifact.read_bytes()).hexdigest()})
        parameters = read('items.json')[str(index + 1)]['parameters']['body']
        parameters['contentId'] = quote['quoteId']
        tool_calls.append({'callId': str(uuid.uuid5(uuid.NAMESPACE_URL, 'lux3d-task-' + attempt['taskId'])),
                           'toolName': 'functions.exec', 'operation': 'image-to-3d', 'planStepId': name,
                           'planVersion': 1, 'quoteId': quote['quoteId'], 'providerTaskId': attempt['taskId'],
                           'startedAt': attempt['createdAt'], 'localCompletedAt': attempt['localCompletedAt'],
                           'requestParameters': parameters, 'status': 'SUCCEEDED',
                           'recording': 'backfill_from_preserved_attempt_and_query_records'})
    # 报告只收录本次建模计划、输入和已完成的项目检查。
    payload = {'pluginTaskId': review['pluginTaskId'], 'requestId': str(uuid.uuid4()), 'planVersion': 1,
               'reviewId': quote['review']['reviewId'], 'quoteIds': [quote['quoteId']],
               'plan': review['plan'] + '\n\n' + (ROOT / 'docs/ai/plan/经营阶段动手解谜方案.md').read_text(encoding='utf-8'),
               'userInputs': [{'inputId': 'original-task', 'addedInVersion': 1,
                               'text': '优化当前项目的解谜环节。解谜内容太单调了，全是选择题。设计几种需要玩家动手简单操作的解谜游戏，最好有至少一种可以结合Aholo的3D建模，然后发给我。我审核通过后，修改游戏中经营丧葬店的解谜环节，把这几种解谜替换游戏内现有的选择题。'},
                              *review['userInputs'], {'inputId': 'cost-approval', 'text': read('authorization.json')['text'], 'addedInVersion': 1}],
               'attachments': review['attachments'], 'toolCalls': tool_calls,
               'result': {'status': 'COMPLETED', 'artifacts': artifacts,
                          'checks': ['两件GLB通过官方结构检查', '七个动手解谜步骤在浏览器中完成',
                                     '角色行走触发、三维物件鼠标拖动、背撑拖动、触屏拼图、子步骤衔接、存档刷新及跳过通过',
                                     '390像素窄屏无横向溢出', '相框源模型离线预览加载、旋转和缩放通过'],
                          'integration': '相框主体与背撑在游戏中通过独立铰链组装，原有三家经营选择题已替换。'},
               'coverage': {'callRecords': 'partial', 'visualInspection': 'performed',
                            'notes': '调用记录依据持久化任务记录回填；未把脚本内部操作虚构为独立宿主工具调用。'},
               'context': {'imageGenerationPrompts': (pathlib.Path(__file__).parent / '参考图提示词.md').read_text(encoding='utf-8')}}
    save('report.json', payload)
    receipt = commerce('report', '--request', LOGS / 'report.json', '--journal', LOGS / 'collection.sqlite', '--model-name', 'GPT-6')
    save('report-receipt.json', receipt)
    print(json.dumps(receipt, ensure_ascii=False))


if __name__ == '__main__':
    {'prepare': prepare, 'submit': submit, 'poll': poll, 'report': report}[sys.argv[1]]()
