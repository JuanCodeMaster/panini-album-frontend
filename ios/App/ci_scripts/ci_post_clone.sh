#!/bin/sh
# Xcode Cloud — ci_post_clone (ubicación: ios/App/ci_scripts/)
# Duplicado del script de la raíz del repo para asegurar que Xcode Cloud lo
# encuentre sea cual sea la ubicación que use para buscar ci_scripts/.

set -e

echo "=========================================="
echo "==> ci_post_clone.sh starting (ios/App/ci_scripts/)"
echo "=========================================="
echo "CI_PRIMARY_REPOSITORY_PATH = ${CI_PRIMARY_REPOSITORY_PATH:-NOT_SET}"
echo "CI_WORKSPACE              = ${CI_WORKSPACE:-NOT_SET}"
echo "pwd: $(pwd)"
echo "---"
echo "Tree del repo:"
ls -la "$CI_PRIMARY_REPOSITORY_PATH" || true
echo "=========================================="

cd "$CI_PRIMARY_REPOSITORY_PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node via Homebrew"
  brew install node
else
  echo "==> Node ya instalado"
fi

echo "==> Node:    $(node --version)"
echo "==> npm:     $(npm --version)"

if [ -f package-lock.json ]; then
  echo "==> npm ci"
  npm ci
else
  echo "==> npm install"
  npm install
fi

echo "==> Verificando que node_modules/@capacitor existe"
ls -la "$CI_PRIMARY_REPOSITORY_PATH/node_modules/@capacitor" || {
  echo "ERROR: @capacitor packages no instalados"
  exit 1
}

echo "==> Angular production build"
npx ng build --configuration=production

echo "==> Capacitor sync iOS"
npx cap sync ios

echo "==> Resolviendo dependencias SPM (refresh del Package.resolved ya commiteado)"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
# Non-fatal: si Xcode Cloud rechaza -resolvePackageDependencies, el
# Package.resolved commiteado en el repo basta para que Archive funcione.
xcodebuild -resolvePackageDependencies \
  -project App.xcodeproj \
  -scheme App \
  -clonedSourcePackagesDirPath "$CI_PRIMARY_REPOSITORY_PATH/SourcePackages" \
  2>&1 | sed 's/^/    /' || echo "    (resolve falló, se usa Package.resolved commiteado)"

echo "==> Verificando Package.resolved"
ls -la "$CI_PRIMARY_REPOSITORY_PATH/ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/" || true

echo "==> ci_post_clone.sh DONE"
