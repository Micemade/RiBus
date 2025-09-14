#!/bin/bash

# RiBus Development Automation Script
# This script starts Browser Tools MCP Server, MCP Server, and Expo development server

echo "🚀 Starting RiBus Development Environment..."
echo ""

# Cleanup function to stop background processes on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping background processes..."
    if [ ! -z "$BROWSER_TOOLS_PID" ]; then
        kill $BROWSER_TOOLS_PID 2>/dev/null
        echo "✅ Browser Tools Server stopped"
    fi
    if [ ! -z "$MCP_SERVER_PID" ]; then
        kill $MCP_SERVER_PID 2>/dev/null
        echo "✅ Browser Tools MCP Server stopped"
    fi
    echo "👋 Development environment stopped"
    exit 0
}

# Set up trap to cleanup on script exit (Ctrl+C)
trap cleanup SIGINT SIGTERM

# Start Browser Tools Server in background
echo "🔄 Starting Browser Tools Server (background)..."
npx @agentdeskai/browser-tools-server@latest > /tmp/browser-tools-server.log 2>&1 &
BROWSER_TOOLS_PID=$!
echo "✅ Started with PID: $BROWSER_TOOLS_PID (log: /tmp/browser-tools-server.log)"
sleep 2

# Start Browser Tools MCP Server in background
echo "🔄 Starting Browser Tools MCP Server (background)..."
npx @agentdeskai/browser-tools-mcp@latest > /tmp/browser-tools-mcp.log 2>&1 &
MCP_SERVER_PID=$!
echo "✅ Started with PID: $MCP_SERVER_PID (log: /tmp/browser-tools-mcp.log)"
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Background services started!"
echo ""
echo "📋 Background Process IDs:"
echo "   Browser Tools Server: $BROWSER_TOOLS_PID"
echo "   Browser Tools MCP Server: $MCP_SERVER_PID"
echo ""
echo "📄 Monitor background logs:"
echo "   tail -f /tmp/browser-tools-server.log"
echo "   tail -f /tmp/browser-tools-mcp.log"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Starting Expo Development Server..."
echo "   (Press Ctrl+C to stop all services)"
echo ""

# Start Expo development server in foreground
npx expo start

# If expo exits, cleanup background processes
cleanup
