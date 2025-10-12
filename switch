#!/bin/sh

# Exit if no argument is given
if [ -z "$1" ]; then
  echo "Error: No target specified. Usage: ./switch.sh [firefox|chrome]"
  exit 1
fi

TARGET_MANIFEST="manifest.$1.json"

# Check if the target manifest file exists
if [ ! -f "$TARGET_MANIFEST" ]; then
    echo "Error: Target manifest '$TARGET_MANIFEST' not found."
    exit 1
fi

# If a manifest.json already exists, back it up so you don't lose it
if [ -f "manifest.json" ]; then
  echo "Backing up current manifest.json to manifest.json.bak"
  mv manifest.json manifest.json.bak
fi

# Copy the target manifest to the main manifest.json
echo "Switching to $1 manifest..."
cp "$TARGET_MANIFEST" manifest.json

echo "Done. manifest.json is now set for $1."