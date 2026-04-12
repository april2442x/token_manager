#!/bin/bash

# Test License Creation and Activation
# This creates a license via seed and tests it

echo "🔑 Creating test license keys..."
echo ""

# You need to run this on Railway:
# railway run npm run prisma:seed

echo "Or manually create via Railway dashboard:"
echo "1. Go to your Railway project"
echo "2. Click on your service"
echo "3. Go to 'Settings' tab"
echo "4. Under 'Deploy', add a one-time command:"
echo "   npm run license:create"
echo ""
echo "After creating, you'll get a license key like:"
echo "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6"
echo ""
echo "Then test with:"
echo ""
echo "curl -X POST https://tokenmanager-production.up.railway.app/api/activate \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"key\":\"YOUR_LICENSE_KEY\",\"device_id\":\"test-device-001\"}'"
