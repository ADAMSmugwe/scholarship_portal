#!/bin/bash
# Script to generate self-signed SSL certificates for development

CERT_DIR="./ssl"
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"

# Create SSL directory if it doesn't exist
mkdir -p $CERT_DIR

echo "Generating self-signed SSL certificate for development..."
echo "This certificate will be valid for 365 days and should NOT be used in production."

# Generate private key
openssl genrsa -out $KEY_FILE 2048

# Generate certificate
openssl req -new -x509 -key $KEY_FILE -out $CERT_FILE -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "SSL certificates generated successfully!"
echo "Certificate: $CERT_FILE"
echo "Private Key: $KEY_FILE"
echo ""
echo "To use these certificates:"
echo "1. Set environment variables:"
echo "   export SSL_CERT_PATH=$CERT_FILE"
echo "   export SSL_KEY_PATH=$KEY_FILE"
echo "2. Run the application with HTTPS enabled"
echo ""
echo "WARNING: This is a self-signed certificate and will show security warnings in browsers."
echo "For production, use certificates from a trusted Certificate Authority like Let's Encrypt."
