#!/bin/bash
# Fix corrupted node_modules by removing and reinstalling
set -e

echo "Removing corrupted node_modules..."
rm -rf /vercel/share/v0-project/node_modules
rm -rf /vercel/share/v0-project/.next

echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

echo "Reinstalling dependencies..."
cd /vercel/share/v0-project
npm install --legacy-peer-deps

echo "Starting dev server..."
npm run dev &
echo "Done! Dev server starting..."
