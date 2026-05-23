#!/bin/sh
# Xcode Cloud — ci_pre_xcodebuild (ubicación: ios/App/ci_scripts/)
# Corre justo antes de xcodebuild. Si por algún motivo node_modules no
# existe (ej. ci_post_clone fue saltado), lo arregla acá.

set -e

echo "=========================================="
echo "==> ci_pre_xcodebuild.sh starting"
echo "=========================================="
echo "CI_PRIMARY_REPOSITORY_PATH = ${CI_PRIMARY_REPOSITORY_PATH:-NOT_SET}"
echo "pwd: $(pwd)"

cd "$CI_PRIMARY_REPOSITORY_PATH"

if [ -d "$CI_PRIMARY_REPOSITORY_PATH/node_modules/@capacitor" ]; then
  echo "==> node_modules/@capacitor ya está presente, skip"
  exit 0
fi

echo "==> node_modules/@capacitor falta — reinstalando"

if ! command -v node >/dev/null 2>&1; then
  echo "==> Installing Node via Homebrew"
  brew install node
fi

echo "==> Node: $(node --version) · npm: $(npm --version)"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Angular production build"
npx ng build --configuration=production

echo "==> Capacitor sync iOS"
npx cap sync ios

echo "==> Resolviendo dependencias SPM"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
xcodebuild -resolvePackageDependencies \
  -project App.xcodeproj \
  -scheme App \
  -clonedSourcePackagesDirPath "$CI_PRIMARY_REPOSITORY_PATH/SourcePackages" \
  || xcodebuild -resolvePackageDependencies -project App.xcodeproj

echo "==> ci_pre_xcodebuild.sh DONE"
