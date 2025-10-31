#!/bin/sh
# Build script for Render

echo "🔨 Building Azuevento API..."

# Make gradlew executable
chmod +x ./eventos-comunitarios-api/gradlew

# Build the project
cd eventos-comunitarios-api
./gradlew clean build -x test

echo "✅ Build completed!"
