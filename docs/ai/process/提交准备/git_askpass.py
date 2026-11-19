import os
import sys


prompt = ' '.join(sys.argv[1:]).lower()
if 'modelscope.cn' not in prompt:
    sys.exit(1)
sys.stdout.write(os.environ['MODELSCOPE_DEPLOY_TOKEN'] if 'password' in prompt else 'oauth2')
