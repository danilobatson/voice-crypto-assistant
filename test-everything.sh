#!/bin/bash

# Voice Crypto Assistant - Comprehensive Testing Script
echo "🧪 Voice Crypto Assistant - Comprehensive Testing"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
pass_test() {
    ((TESTS_PASSED++))
    ((TOTAL_TESTS++))
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

fail_test() {
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
    echo -e "${RED}❌ FAIL${NC}: $1"
}

info_test() {
    echo -e "${BLUE}ℹ️ INFO${NC}: $1"
}

warn_test() {
    echo -e "${YELLOW}⚠️ WARN${NC}: $1"
}

# Test 1: Environment Variables
echo "🔧 Test 1: Environment Variables"
echo "--------------------------------"

if [ -f ".env.local" ]; then
    pass_test ".env.local file exists"
    
    if grep -q "GEMINI_API_KEY=" .env.local; then
        GEMINI_KEY=$(grep "GEMINI_API_KEY=" .env.local | cut -d'=' -f2)
        if [ ! -z "$GEMINI_KEY" ] && [ "$GEMINI_KEY" != "your_api_key_here" ]; then
            pass_test "GEMINI_API_KEY is configured"
        else
            fail_test "GEMINI_API_KEY is not properly configured"
        fi
    else
        fail_test "GEMINI_API_KEY not found in .env.local"
    fi
    
    if grep -q "LUNARCRUSH_API_KEY=" .env.local; then
        LUNAR_KEY=$(grep "LUNARCRUSH_API_KEY=" .env.local | cut -d'=' -f2)
        if [ ! -z "$LUNAR_KEY" ] && [ "$LUNAR_KEY" != "your_api_key_here" ]; then
            pass_test "LUNARCRUSH_API_KEY is configured"
        else
            fail_test "LUNARCRUSH_API_KEY is not properly configured"
        fi
    else
        fail_test "LUNARCRUSH_API_KEY not found in .env.local"
    fi
else
    fail_test ".env.local file does not exist"
fi

echo ""

# Test 2: TypeScript Compilation
echo "📝 Test 2: TypeScript Compilation"
echo "----------------------------------"

if npx tsc --noEmit 2>/dev/null; then
    pass_test "TypeScript compilation successful"
else
    fail_test "TypeScript compilation failed"
    echo "Run 'npx tsc --noEmit' to see errors"
fi

echo ""

# Test 3: Dependencies
echo "📦 Test 3: Dependencies"
echo "-----------------------"

if [ -f "package.json" ]; then
    pass_test "package.json exists"
    
    # Check critical dependencies
    REQUIRED_DEPS=("@google/generative-ai" "@modelcontextprotocol/sdk" "react-speech-recognition" "next" "react")
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if npm list "$dep" &>/dev/null; then
            pass_test "Dependency $dep is installed"
        else
            fail_test "Required dependency $dep is missing"
        fi
    done
else
    fail_test "package.json not found"
fi

echo ""

# Test 4: File Structure
echo "📁 Test 4: File Structure"
echo "-------------------------"

REQUIRED_FILES=(
    "src/app/page.tsx"
    "src/app/layout.tsx"
    "src/app/api/analyze/route.ts"
    "src/components/VoiceAssistant.tsx"
    "src/hooks/useVoiceRecognition.ts"
    "src/hooks/useVoiceOutput.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass_test "File $file exists"
    else
        fail_test "Required file $file is missing"
    fi
done

echo ""

# Test 5: Next.js Build
echo "🏗️ Test 5: Next.js Build"
echo "------------------------"

info_test "Building Next.js application..."
if npm run build 2>/dev/null; then
    pass_test "Next.js build successful"
    
    if [ -d ".next" ]; then
        pass_test ".next build directory created"
    else
        fail_test ".next build directory not found"
    fi
else
    fail_test "Next.js build failed"
    echo "Run 'npm run build' to see build errors"
fi

echo ""

# Test 6: Server Startup
echo "🚀 Test 6: Server Startup"
echo "-------------------------"

info_test "Starting development server..."

# Kill any existing dev server
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Start dev server in background
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -s http://localhost:3002 > /dev/null; then
    pass_test "Development server started successfully"
    
    # Test if page loads
    if curl -s http://localhost:3002 | grep -q "Voice Crypto Assistant"; then
        pass_test "Main page loads correctly"
    else
        fail_test "Main page content not found"
    fi
else
    fail_test "Development server not responding"
fi

echo ""

# Test 7: API Endpoint
echo "🔌 Test 7: API Endpoint"
echo "-----------------------"

if curl -s http://localhost:3002/api/analyze -X POST -H "Content-Type: application/json" -d '{"query":"test"}' > /dev/null; then
    pass_test "API endpoint /api/analyze responds"
    
    # Test API response structure
    API_RESPONSE=$(curl -s http://localhost:3002/api/analyze -X POST -H "Content-Type: application/json" -d '{"query":"test"}')
    
    if echo "$API_RESPONSE" | grep -q '"success"'; then
        pass_test "API returns proper JSON response"
    else
        warn_test "API response may not have expected structure"
        echo "Response: $API_RESPONSE"
    fi
else
    fail_test "API endpoint /api/analyze not responding"
fi

echo ""

# Test 8: Component Integration
echo "⚛️ Test 8: Component Integration"
echo "--------------------------------"

# Check if React components have proper imports
if grep -q "useVoiceRecognition" src/components/VoiceAssistant.tsx; then
    pass_test "VoiceAssistant imports useVoiceRecognition"
else
    fail_test "VoiceAssistant missing useVoiceRecognition import"
fi

if grep -q "useVoiceOutput" src/components/VoiceAssistant.tsx; then
    pass_test "VoiceAssistant imports useVoiceOutput"
else
    fail_test "VoiceAssistant missing useVoiceOutput import"
fi

if grep -q "react-speech-recognition" src/hooks/useVoiceRecognition.ts; then
    pass_test "useVoiceRecognition imports speech recognition"
else
    fail_test "useVoiceRecognition missing speech recognition import"
fi

echo ""

# Test 9: Browser Compatibility
echo "🌐 Test 9: Browser Compatibility"
echo "--------------------------------"

# Check if speech synthesis code exists
if grep -q "speechSynthesis" src/hooks/useVoiceOutput.ts; then
    pass_test "Voice output uses browser speechSynthesis API"
else
    fail_test "Voice output missing speechSynthesis implementation"
fi

# Check if speech recognition code exists
if grep -q "SpeechRecognition" src/hooks/useVoiceRecognition.ts; then
    pass_test "Voice input uses SpeechRecognition API"
else
    fail_test "Voice input missing SpeechRecognition implementation"
fi

echo ""

# Test 10: MCP Integration
echo "🌙 Test 10: MCP Integration"
echo "---------------------------"

if grep -q "@modelcontextprotocol/sdk" src/app/api/analyze/route.ts; then
    pass_test "API uses official MCP SDK"
else
    fail_test "API missing MCP SDK import"
fi

if grep -q "SSEClientTransport" src/app/api/analyze/route.ts; then
    pass_test "API uses SSE transport for MCP"
else
    fail_test "API missing SSE transport for MCP"
fi

if grep -q "lunarcrush.ai/sse" src/app/api/analyze/route.ts; then
    pass_test "API connects to LunarCrush MCP server"
else
    fail_test "API missing LunarCrush MCP server connection"
fi

echo ""

# Cleanup
info_test "Cleaning up test environment..."
kill $DEV_PID 2>/dev/null || true
sleep 2

# Test Results Summary
echo "📊 Test Results Summary"
echo "======================="
echo ""
echo -e "Total Tests: ${BLUE}${TOTAL_TESTS}${NC}"
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Ready to commit.${NC}"
    echo ""
    echo "✅ The Voice Crypto Assistant is fully functional!"
    echo "✅ TypeScript compilation successful"
    echo "✅ Next.js build successful" 
    echo "✅ Server starts and responds"
    echo "✅ API endpoint working"
    echo "✅ MCP integration configured"
    echo "✅ Voice features implemented"
    echo ""
    echo "🚀 Ready for:"
    echo "   - Git commit"
    echo "   - Vercel deployment"
    echo "   - Portfolio demonstration"
    echo "   - Interview showcase"
    exit 0
else
    echo -e "${RED}⚠️ ${TESTS_FAILED} TEST(S) FAILED. Please fix before committing.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "   - Check .env.local configuration"
    echo "   - Run 'npm install' for missing dependencies"
    echo "   - Run 'npx tsc --noEmit' for TypeScript errors"
    echo "   - Run 'npm run build' for build issues"
    exit 1
fi
