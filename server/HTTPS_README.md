# HTTPS Configuration Guide

This guide explains how to configure HTTPS for the Scholarship Portal application.

## Development Setup

### 1. Generate Self-Signed SSL Certificates

For development and testing, use the provided script to generate self-signed certificates:

```bash
cd server
./generate_ssl.sh
```

This creates:
- `ssl/server.crt` - SSL certificate
- `ssl/server.key` - Private key

### 2. Environment Variables

Set the following environment variables:

```bash
export SSL_CERT_PATH="./ssl/server.crt"
export SSL_KEY_PATH="./ssl/server.key"
export FLASK_ENV=development
export FORCE_HTTPS=false  # Set to true to force HTTPS redirects
```

### 3. Start Development Server

```bash
python wsgi.py
```

The server will start with HTTPS enabled on port 5002.

## Production Setup

### 1. Obtain SSL Certificates

For production, use certificates from a trusted Certificate Authority:

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in: /etc/letsencrypt/live/yourdomain.com/
```

#### Option B: Commercial SSL Certificate

Purchase from providers like:
- DigiCert
- GlobalSign
- Comodo

### 2. Environment Variables

```bash
export FLASK_ENV=production
export SSL_CERT_PATH="/etc/letsencrypt/live/yourdomain.com/fullchain.pem"
export SSL_KEY_PATH="/etc/letsencrypt/live/yourdomain.com/privkey.pem"
export FORCE_HTTPS=true
export CORS_ORIGINS="https://yourdomain.com"
```

### 3. Start Production Server

```bash
./start_production.sh
```

This uses Gunicorn with 4 workers and gevent for optimal performance.

## Security Features

The application includes the following security headers:

- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer control
- `Content-Security-Policy` - Basic CSP for XSS prevention

## HTTPS Redirection

When `FORCE_HTTPS=true`, all HTTP requests are automatically redirected to HTTPS.

## Testing

Run the HTTPS configuration test:

```bash
./test_https.sh
```

## Troubleshooting

### Certificate Errors

- Ensure certificate and key file paths are correct
- Check file permissions (key should be readable only by owner)
- Verify certificate is not expired

### Browser Warnings

Self-signed certificates will show security warnings. This is normal for development.

### Port Issues

- Default HTTPS port is 5002
- Ensure the port is not blocked by firewall
- For production, consider using port 443 (requires root)

## Deployment Checklist

- [ ] SSL certificates obtained and configured
- [ ] Environment variables set
- [ ] CORS origins configured for HTTPS
- [ ] FORCE_HTTPS enabled
- [ ] Security headers verified
- [ ] HTTPS redirection tested
- [ ] Production server (Gunicorn) configured
