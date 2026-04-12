#!/bin/bash

# Test script for License Key Validation API
# Usage: ./test-api.sh [API_URL]

API_URL="${1:-http://localhost:3000}"

echo "🧪 Testing License Key Validation API"
echo "API URL: $API_URL"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET $API_URL/api/health"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Activate License (you need to replace with actual license key from seed)
echo "Test 2: Activate License"
echo "POST $API_URL/api/activate"
LICENSE_KEY="REPLACE_WITH_ACTUAL_KEY_FROM_SEED"
DEVICE_ID="test-device-$(date +%s)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/activate" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"$LICENSE_KEY\",\"device_id\":\"$DEVICE_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Request: {\"key\":\"$LICENSE_KEY\",\"device_id\":\"$DEVICE_ID\"}"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
else
    echo -e "${YELLOW}⚠ EXPECTED${NC} - Status: $HTTP_CODE (Need valid license key)"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Validate License
echo "Test 3: Validate License"
echo "POST $API_URL/api/validate"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/validate" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"$LICENSE_KEY\",\"device_id\":\"$DEVICE_ID\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "Request: {\"key\":\"$LICENSE_KEY\",\"device_id\":\"$DEVICE_ID\"}"
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
else
    echo -e "${YELLOW}⚠ EXPECTED${NC} - Status: $HTTP_CODE (Need valid license key)"
    echo "Response: $BODY"
fi
echo ""

# Test 4: Missing Parameters
echo "Test 4: Missing Parameters (Should Fail)"
echo "POST $API_URL/api/activate"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/activate" \
  -H "Content-Type: application/json" \
  -d "{}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $HTTP_CODE (Correctly rejected)"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ FAILED${NC} - Status: $HTTP_CODE (Should be 400)"
    echo "Response: $BODY"
fi
echo ""

# Test 5: Invalid License Key
echo "Test 5: Invalid License Key (Should Fail)"
echo "POST $API_URL/api/activate"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/activate" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"INVALID_KEY_12345\",\"device_id\":\"test-device\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ PASSED${NC} - Status: $HTTP_CODE (Correctly rejected)"
    echo "Response: $BODY"
else
    echo -e "${YELLOW}⚠ CHECK${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

echo "=================================="
echo "🏁 Test suite completed!"
echo ""
echo "Note: To test with real license keys:"
echo "1. Run: npm run prisma:seed"
echo "2. Copy a license key from the output"
echo "3. Edit this script and replace LICENSE_KEY variable"
echo "4. Run: ./test-api.sh"
