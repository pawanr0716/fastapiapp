import json
import urllib.request

payload = {
    'email': 'pawanfresh5@example.com',
    'name': 'pawanfresh5',
    'password': 'rainbow',
    'role': 'admin',
}
data = json.dumps(payload).encode()
req = urllib.request.Request('http://127.0.0.1:8000/auth/register', data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=10) as resp:
    print(resp.status)
    print(resp.read().decode())
