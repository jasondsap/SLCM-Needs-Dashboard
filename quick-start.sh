#!/bin/bash

# SLCM Dashboard - Quick Start Script
# This script helps you get the dashboard running in seconds!

echo "🎉 SLCM Donor Dashboard - Quick Start"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "📥 Please install Node.js from: https://nodejs.org/"
    echo "   (Download the LTS version)"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm is installed: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "   (This may take 2-3 minutes)"
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Installation failed. Please check the error above."
    exit 1
fi

echo ""
echo "✅ All dependencies installed!"
echo ""

# Offer to start the dev server
echo "🚀 Ready to launch!"
echo ""
echo "Would you like to start the development server now? (y/n)"
read -r answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ] || [ "$answer" = "yes" ]; then
    echo ""
    echo "🎯 Starting development server..."
    echo "📍 Dashboard will open at: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    sleep 2
    npm run dev
else
    echo ""
    echo "👍 No problem! Run this command when you're ready:"
    echo ""
    echo "   npm run dev"
    echo ""
    echo "📚 Next steps:"
    echo "   1. Read PROJECT_SUMMARY.md for overview"
    echo "   2. Read README.md for detailed setup"
    echo "   3. Check STAFF_GUIDE.md for updating needs"
    echo ""
fi
