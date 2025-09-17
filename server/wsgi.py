#!/usr/bin/env python3
"""
Production WSGI application for Scholarship Portal
This script configures the Flask application for production deployment with HTTPS support.
"""

import os
import sys
from pathlib import Path

# Add the server directory to the Python path
server_dir = Path(__file__).parent
sys.path.insert(0, str(server_dir))

from app import app
from config import ProductionConfig

# Configure for production
app.config.from_object(ProductionConfig)

# SSL context for HTTPS (if certificates are available)
ssl_context = None
if app.config.get('SSL_CERT_PATH') and app.config.get('SSL_KEY_PATH'):
    if os.path.exists(app.config['SSL_CERT_PATH']) and os.path.exists(app.config['SSL_KEY_PATH']):
        ssl_context = (app.config['SSL_CERT_PATH'], app.config['SSL_KEY_PATH'])
        print("SSL certificates found and loaded")
    else:
        print("SSL certificate files not found, running without HTTPS")

if __name__ == '__main__':
    # Development server with optional HTTPS
    print("Starting Scholarship Portal server...")
    if ssl_context:
        print("Running with HTTPS enabled")
        app.run(
            host='0.0.0.0',
            port=int(os.environ.get('PORT', 5002)),
            ssl_context=ssl_context,
            debug=False
        )
    else:
        print("Running without HTTPS (development mode)")
        app.run(
            host='0.0.0.0',
            port=int(os.environ.get('PORT', 5002)),
            debug=False
        )
