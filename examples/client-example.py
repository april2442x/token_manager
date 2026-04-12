"""
Python Client Example: How to make authenticated requests to the API

This example shows how to:
1. Generate request signatures
2. Include API key
3. Make secure requests
"""

import hmac
import hashlib
import json
import time
import uuid
import requests

# Configuration
API_URL = "http://localhost:3000/api"
API_KEY = "test-api-key-12345"  # Get from your API provider
SIGNATURE_SECRET = "dev-signature-secret-key-67890"  # Get from your API provider


def generate_signature(timestamp, nonce, body, secret):
    """Generate HMAC-SHA256 signature for request"""
    payload = f"{timestamp}{nonce}{json.dumps(body, separators=(',', ':'))}"
    signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature


def make_signed_request(endpoint, body):
    """Make a signed request to the API"""
    timestamp = int(time.time() * 1000)  # milliseconds
    nonce = str(uuid.uuid4())
    signature = generate_signature(timestamp, nonce, body, SIGNATURE_SECRET)
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Signature': signature,
        'X-Timestamp': str(timestamp),
        'X-Nonce': nonce,
    }
    
    response = requests.post(
        f"{API_URL}{endpoint}",
        headers=headers,
        json=body
    )
    
    return response.json()


def activate_license(license_key, device_id):
    """Activate a license for a device"""
    try:
        result = make_signed_request('/activate', {
            'key': license_key,
            'device_id': device_id,
        })
        print('Activation result:', result)
        return result
    except Exception as e:
        print(f'Activation failed: {e}')
        raise


def validate_license(license_key, device_id):
    """Validate a license and device"""
    try:
        result = make_signed_request('/validate', {
            'key': license_key,
            'device_id': device_id,
        })
        print('Validation result:', result)
        return result
    except Exception as e:
        print(f'Validation failed: {e}')
        raise


def deactivate_device(license_key, device_id):
    """Deactivate a device from a license"""
    try:
        result = make_signed_request('/deactivate', {
            'key': license_key,
            'device_id': device_id,
        })
        print('Deactivation result:', result)
        return result
    except Exception as e:
        print(f'Deactivation failed: {e}')
        raise


def main():
    """Run examples"""
    print('=== License Key Validation API Client Example ===\n')
    
    # Replace with actual license key from seed
    license_key = 'YOUR_LICENSE_KEY_HERE'
    device_id = f'my-device-{int(time.time())}'
    
    try:
        # Example 1: Activate
        print('1. Activating license...')
        activate_license(license_key, device_id)
        print()
        
        # Example 2: Validate
        print('2. Validating license...')
        validate_license(license_key, device_id)
        print()
        
        # Example 3: Deactivate
        print('3. Deactivating device...')
        deactivate_device(license_key, device_id)
        print()
        
        print('✅ All examples completed successfully!')
    except Exception as e:
        print(f'❌ Error: {e}')


if __name__ == '__main__':
    main()
