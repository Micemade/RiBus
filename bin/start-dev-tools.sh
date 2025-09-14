#!/bin/bash

# Start Development Tools Script
# This script starts Browser Tools MCP Server and MCP in background
# Then runs npm start in the current terminal so you can see the build status

echo "🚀 Starting development tools..."
echo ""

# Cleanup function to stop background processes on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping background processes..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ Browser Tools MCP Server stopped"
    fi
    if [ ! -z "$MCP_PID" ]; then
        kill $MCP_PID 2>/dev/null
        echo "✅ Browser Tools MCP stopped"
    fi
    exit 0
}

# Set up trap to cleanup on script exit (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Start Browser Tools MCP Server in background
echo "🔄 Starting Browser Tools MCP Server (background)..."
npx @agentdeskai/browser-tools-server > /tmp/mcp-server.log 2>&1 &
SERVER_PID=$!
echo "✅ Started with PID: $SERVER_PID (log: /tmp/mcp-server.log)"

sleep 1

# Start Browser Tools MCP in background
echo "🔄 Starting Browser Tools MCP (background)..."
npx @agentdeskai/browser-tools-mcp > /tmp/mcp-tools.log 2>&1 &
MCP_PID=$!
echo "✅ Started with PID: $MCP_PID (log: /tmp/mcp-tools.log)"

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Background services started!"
echo ""
echo "📋 Background Process IDs:"
echo "   Browser Tools MCP Server: $SERVER_PID"
echo "   Browser Tools MCP: $MCP_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Monitor background logs:"
echo "   tail -f /tmp/mcp-server.log"
echo "   tail -f /tmp/mcp-tools.log"
echo ""
