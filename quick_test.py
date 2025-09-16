#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://127.0.0.1:5001'

def test_home():
    try:
        response = requests.get(f'{BASE_URL}/', timeout=10)
        print(f'Home endpoint - Status: {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            print('✅ Home endpoint working!')
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f'❌ Home endpoint failed: {response.text}')
            return False
    except Exception as e:
        print(f'❌ Error testing home endpoint: {e}')
        return False

def test_scholarships():
    try:
        response = requests.get(f'{BASE_URL}/api/scholarships', timeout=10)
        print(f'Scholarships endpoint - Status: {response.status_code}')
        if response.status_code == 200:
            data = response.json()
            print('✅ Scholarships endpoint working!')
            print(f'Found {len(data)} scholarships')
            return True
        else:
            print(f'❌ Scholarships endpoint failed: {response.text}')
            return False
    except Exception as e:
        print(f'❌ Error testing scholarships endpoint: {e}')
        return False

def test_register():
    try:
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'password123',
            'role': 'student'
        }
        response = requests.post(f'{BASE_URL}/api/auth/register', json=data, timeout=10)
        print(f'Register endpoint - Status: {response.status_code}')
        if response.status_code == 201:
            print('✅ User registration working!')
            return True
        else:
            print(f'❌ Register endpoint failed: {response.text}')
            return False
    except Exception as e:
        print(f'❌ Error testing register endpoint: {e}')
        return False

if __name__ == '__main__':
    print('🧪 Testing Scholarship Portal API Endpoints')
    print('=' * 50)

    # Test basic endpoints
    home_ok = test_home()
    scholarships_ok = test_scholarships()
    register_ok = test_register()

    print('\n' + '=' * 50)
    if home_ok and scholarships_ok and register_ok:
        print('🎉 All basic endpoints are working!')
    else:
        print('⚠️  Some endpoints need attention')

    print('\n📝 Next steps:')
    print('1. Test login endpoint')
    print('2. Test authenticated endpoints (need JWT token)')
    print('3. Test scholarship creation and application submission')
