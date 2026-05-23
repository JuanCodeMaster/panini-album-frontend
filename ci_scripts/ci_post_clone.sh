#!/bin/sh
# Xcode Cloud ejecuta este script justo después de clonar el repo,
# antes de compilar. Aquí instalamos Node, dependencias npm y
# generamos el bundle web + sync de Capacitor para que las rutas
# `../../../node_modules/@capacitor/*` del Package.swift existan.

set -e

echo "==> ci_post_clone starting"
echo "==> CI_PRIMARY_REPOSITORY_PATH = $CI_PRIMARY_REPOSITORY_PATH"
echo "==> CI_WORKSPACE = $CI_WORKSPACE"
echo "==> pwd: $(pwd)"

# Ir al root del repo (panini-album-frontend)
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Node no viene preinstalado en los runners de Xcode Cloud. Brew sí.
if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node via Homebrew"
  brew install node
fi

echo "==> Node:    $(node --version)"
echo "==> npm:     $(npm --version)"

# Instalar deps (npm ci si hay lockfile, npm install si no)
if [ -f package-lock.json ]; then
  echo "==> npm ci"
  npm ci
else
  echo "==> npm install"
  npm install
fi

# Bundle web de producción
echo "==> Angular production build"
npx ng build --configuration=production

# Sincronizar el bundle al proyecto iOS (copia www/ a ios/App/App/public/)
echo "==> Capacitor sync iOS"
npx cap sync ios

echo "==> ci_post_clone done"
