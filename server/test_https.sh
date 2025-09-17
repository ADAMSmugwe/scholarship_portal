#!/bin/bash
# Test script to verify HTTPS configuration

echo "Testing HTTPS Configuration"
echo "==========================="

# Set environment variables for SSL
export SSL_CERT_PATH="./ssl/server.crt"
export SSL_KEY_PATH="./ssl/server.key"
export FLASK_ENV=development
export FORCE_HTTPS=false  # Set to true for production

# Check if certificates exist
if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
    echo "❌ SSL certificates not found. Run ./generate_ssl.sh first."
    exit 1
fi

echo "✅ SSL certificates found"

# Test Flask app import
echo "Testing Flask app import..."
if python -c "from app import app; print('✅ Flask app imports successfully')"; then
    echo "✅ Flask app import test passed"
else
    echo "❌ Flask app import test failed"
    exit 1
fi

# Test WSGI app
echo "Testing WSGI app..."
if python -c "from wsgi import app; print('✅ WSGI app imports successfully')"; then
    echo "✅ WSGI app test passed"
else
    echo "❌ WSGI app test failed"
    exit 1
fi

echo ""
echo "HTTPS Configuration Test Complete!"
echo ""
echo "To start the server with HTTPS:"
echo "1. Development: python wsgi.py"
echo "2. Production: ./start_production.sh"
echo ""
echo "Note: Self-signed certificates will show security warnings in browsers."
echo "For production, use certificates from Let's Encrypt or a trusted CA."
