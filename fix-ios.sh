#!/bin/bash
# Run this ONCE on your Mac to get npx expo run:ios working.
# Usage: bash fix-ios.sh
set -e

echo "=== Step 1: Accept Xcode licence ==="
sudo xcodebuild -license accept

echo "=== Step 2: Make sure Xcode CLI tools are selected ==="
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

echo "=== Step 3: Install CocoaPods ==="
# Try the -n flag so gem puts the binary in a SIP-free location
if ! sudo gem install cocoapods -n /usr/local/bin --no-document; then
  echo "System gem failed — installing Homebrew then trying brew install cocoapods..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon (M-series) Macs
  eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
  eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
  brew install cocoapods
fi

echo "=== Step 4: pod install ==="
cd "$(dirname "$0")/ios"
pod install
cd ..

echo ""
echo "✅ Done. Now run: npx expo run:ios"
