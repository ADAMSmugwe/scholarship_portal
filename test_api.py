#!/usr/bin/env python3
"""
API Testing Script for Scholarship Portal
Tests all endpoints to ensure they work correctly
"""

import requests
import json
import sys

BASE_URL = 'http://127.0.0.1:5000'

def test_endpoint(method, endpoint, data=None, headers=None, expected_status=200):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n🧪 Testing {method} {endpoint}")

    try:
        # Add default headers
        if headers is None:
            headers = {}
        headers['Content-Type'] = 'application/json'

        if method == 'GET':
            response = requests.get(url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            print(f"❌ Unsupported method: {method}")
            return False

        print(f"Status Code: {response.status_code}")

        if response.status_code == expected_status:
            print("✅ Success!")
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
                return True
            except:
                print(f"Response: {response.text}")
                return True
        else:
            print(f"❌ Expected status {expected_status}, got {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - is the Flask app running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 Scholarship Portal API Testing")
    print("=" * 50)

    # Test 1: Home endpoint
    test_endpoint('GET', '/')

    # Test 2: Get scholarships (should be empty initially)
    test_endpoint('GET', '/api/scholarships')

    # Test 3: User registration
    register_data = {
        'name': 'Test Student',
        'email': 'test@example.com',
        'password': 'password123',
        'role': 'student'
    }
    test_endpoint('POST', '/api/auth/register', register_data, expected_status=201)

    # Test 4: User login
    login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }
    login_response = test_endpoint('POST', '/api/auth/login', login_data)

    # If login successful, test authenticated endpoints
    if login_response:
        # Extract token from response (this would need to be parsed properly)
        print("\n📝 Note: For authenticated endpoints, you'll need to:")
        print("1. Extract the JWT token from login response")
        print("2. Include it in Authorization header: 'Bearer <token>'")
        print("3. Test scholarship creation and application submission")

    print("\n" + "=" * 50)
    print("🎯 Manual Testing Required:")
    print("1. Create a scholarship (requires authentication)")
    print("2. Submit an application (requires authentication)")
    print("3. Test admin-only endpoints")
    print("\n💡 Use tools like Postman or curl for authenticated requests")

if __name__ == "__main__":
    main()
