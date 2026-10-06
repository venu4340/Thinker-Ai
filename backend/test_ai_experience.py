import urllib.request
import json
import re

# 1. Login demo user
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/demo-login', data=b'{}', headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    auth_data = json.loads(resp.read().decode('utf-8'))
token = auth_data['access_token']
print('Authenticated demo user.')

def test_msg(prompt):
    print(f'\n--- Sending: "{prompt}" ---')
    payload = json.dumps({'content': prompt, 'provider': 'gemini'}).encode('utf-8')
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/v1/chat/send',
        data=payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    full_resp = ''
    with urllib.request.urlopen(req) as resp:
        for line in resp:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                try:
                    p = json.loads(line[6:])
                    if p.get('type') == 'chunk':
                        full_resp += p.get('text', '')
                except:
                    pass
    print('Preview response (first 200 chars):')
    print(full_resp[:200] + ('...' if len(full_resp) > 200 else ''))
    if '<THINKFLOW_RESPONSE>' in full_resp:
        m = re.search(r'<THINKFLOW_RESPONSE>(.*?)</THINKFLOW_RESPONSE>', full_resp, re.DOTALL)
        if m:
            print('Structured block detected!')
            try:
                block = json.loads(m.group(1).strip())
                print('Intent:', block.get('intent'), '| Workspace:', block.get('workspace'), '| Title:', block.get('title'))
            except Exception as ex:
                print('JSON parse error:', ex)
    else:
        print('Clean conversational response (No unnecessary workspace - perfect!).')

test_msg('What is machine learning?')
test_msg('I want to become an AI engineer in 6 months')
test_msg('I want to learn Python and practice every day')
