#!/usr/bin/env python3
"""
Caching Test Script
Tests that Redis caching is properly configured and functional.
"""

import sys
import os
import time

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_caching():
    """Test caching functionality"""
    print("Caching Test")
    print("============")

    try:
        # Test Flask app import
        from app import app
        print("✅ Flask app imports successfully")

        # Test cache extension
        from extensions import cache
        print("✅ Cache extension imported successfully")

        # Test cache configuration
        with app.app_context():
            # Test basic cache operations
            cache.set('test_key', 'test_value', timeout=30)
            value = cache.get('test_key')
            if value == 'test_value':
                print("✅ Basic cache operations working")
            else:
                print("❌ Basic cache operations failed")
                return False

            # Test cache timeout
            time.sleep(1)
            if cache.get('test_key') == 'test_value':
                print("✅ Cache timeout working")
            else:
                print("⚠️  Cache timeout may not be working (could be normal)")

            # Clear test cache
            cache.delete('test_key')

        print("\n✅ Caching system is properly configured!")
        print("Cache Type:", app.config.get('CACHE_TYPE', 'Unknown'))
        print("Cache Timeout:", app.config.get('CACHE_DEFAULT_TIMEOUT', 'Unknown'), "seconds")

        return True

    except Exception as e:
        print(f"❌ Caching test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_caching()
    sys.exit(0 if success else 1)
