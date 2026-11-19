import argparse
import json
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[4]
BASE = 'https://modelscope.cn/openapi/v1'


def read_token():
    for line in (ROOT / '.env').read_text(encoding='utf-8-sig').splitlines():
        key, separator, value = line.partition('=')
        if separator and key.strip() == 'MODELSCOPE_TOKEN':
            return value.strip().strip('\"\'')
    raise RuntimeError('.env 缺少 MODELSCOPE_TOKEN')


def request(path, method='GET', payload=None):
    body = None if payload is None else json.dumps(payload).encode('utf-8')
    call = Request(BASE + path, data=body, method=method,
                   headers={'Authorization': 'Bearer ' + read_token(), 'Content-Type': 'application/json'})
    try:
        with urlopen(call, timeout=45) as response:
            return json.load(response)
    except HTTPError as error:
        return {'http_status': error.code, 'body': error.read().decode('utf-8', errors='replace')[:3000]}


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['info', 'create', 'deploy', 'status', 'schema'])
    args = parser.parse_args()
    if args.action == 'info':
        result = request('/studios/lycshanshan/lantern-keeper')
    elif args.action == 'create':
        result = request('/studios', 'POST', {'owner': 'lycshanshan', 'repo_name': 'lantern-keeper',
                                             'sdk_type': 'static', 'visibility': 'public',
                                             'display_name': '长宁白事铺'})
    elif args.action == 'deploy':
        result = request('/studios/lycshanshan/lantern-keeper/deploy', 'POST')
    elif args.action == 'schema':
        with urlopen('https://modelscope.cn/api/v1/studios/deploy_schema.json', timeout=45) as response:
            result = json.load(response)
    else:
        result = request('/studios/lycshanshan/lantern-keeper')
    print(json.dumps(result, ensure_ascii=False, indent=2))
