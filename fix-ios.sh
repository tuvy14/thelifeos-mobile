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

echo "=== Step 4: Add pod to PATH permanently ==="
SHELL_RC="$HOME/.zshrc"
PATH_LINE='export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"'
if ! grep -qF '/usr/local/bin:/opt/homebrew/bin' "$SHELL_RC" 2>/dev/null; then
  echo "$PATH_LINE" >> "$SHELL_RC"
  echo "Added PATH export to $SHELL_RC"
fi
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "=== Step 5: pod install ==="
cd "$(dirname "$0")/ios"
pod install
cd ..

echo ""
echo "✅ Done. Now run:"
echo "   export PATH=\"/usr/local/bin:/opt/homebrew/bin:\$PATH\" && npx expo run:ios"
