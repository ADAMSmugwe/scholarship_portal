#!/bin/bash
# Production deployment script for Scholarship Portal
# This script sets up the application for production with HTTPS support

set -e  # Exit on any error

echo "Scholarship Portal - Production Deployment"
echo "=========================================="

# Check if we're in the server directory
if [ ! -f "wsgi.py" ]; then
    echo "Error: wsgi.py not found. Please run this script from the server directory."
    exit 1
fi

# Set production environment variables
export FLASK_ENV=production
export FORCE_HTTPS=true

# Check for SSL certificates
if [ -z "$SSL_CERT_PATH" ] || [ -z "$SSL_KEY_PATH" ]; then
    echo "SSL_CERT_PATH and SSL_KEY_PATH environment variables not set."
    echo "Using default Let's Encrypt paths..."
    export SSL_CERT_PATH="/etc/letsencrypt/live/yourdomain.com/fullchain.pem"
    export SSL_KEY_PATH="/etc/letsencrypt/live/yourdomain.com/privkey.pem"
fi

# Check if certificates exist
if [ ! -f "$SSL_CERT_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
    echo "Warning: SSL certificates not found at $SSL_CERT_PATH and $SSL_KEY_PATH"
    echo "The application will start but HTTPS will not be available."
    echo "Please ensure SSL certificates are properly configured."
    SSL_AVAILABLE=false
else
    echo "SSL certificates found. HTTPS will be enabled."
    SSL_AVAILABLE=true
fi

# Install production dependencies if needed
echo "Checking for Gunicorn..."
if ! command -v gunicorn &> /dev/null; then
    echo "Installing Gunicorn for production WSGI server..."
    pip install gunicorn
fi

# Set default port
PORT=${PORT:-8000}

echo "Starting Scholarship Portal with Gunicorn..."
echo "Port: $PORT"
echo "SSL Enabled: $SSL_AVAILABLE"

# Start with Gunicorn
if [ "$SSL_AVAILABLE" = true ]; then
    # Start with HTTPS
    gunicorn \
        --bind 0.0.0.0:$PORT \
        --certfile=$SSL_CERT_PATH \
        --keyfile=$SSL_KEY_PATH \
        --workers=4 \
        --worker-class=gevent \
        --access-logfile - \
        --error-logfile - \
        wsgi:app
else
    # Start without HTTPS (for testing or behind reverse proxy)
    echo "Warning: Starting without HTTPS. Ensure your reverse proxy handles SSL termination."
    gunicorn \
        --bind 0.0.0.0:$PORT \
        --workers=4 \
        --worker-class=gevent \
        --access-logfile - \
        --error-logfile - \
        wsgi:app
fi
