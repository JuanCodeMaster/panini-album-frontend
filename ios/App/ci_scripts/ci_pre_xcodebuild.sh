#!/bin/sh
# Xcode Cloud — ci_pre_xcodebuild (ubicación: ios/App/ci_scripts/)
# Corre justo antes de xcodebuild. Si por algún motivo node_modules no
# existe (ej. ci_post_clone fue saltado), lo arregla acá.

set -e

echo "=========================================="
echo "==> ci_pre_xcodebuild.sh starting"
echo "=========================================="
echo "CI_PRIMARY_REPOSITORY_PATH = ${CI_PRIMARY_REPOSITORY_PATH:-NOT_SET}"
echo "CI_BUILD_NUMBER            = ${CI_BUILD_NUMBER:-NOT_SET}"
echo "pwd: $(pwd)"

cd "$CI_PRIMARY_REPOSITORY_PATH"

# ── Build number automático (cloud) ───────────────────────────────
# Xcode Cloud incrementa $CI_BUILD_NUMBER en cada build. Lo usamos como
# CFBundleVersion para que App Store Connect / TestFlight nunca rechace
# por "bundle version ya existe". No hay que tocar nada a mano nunca más.
if [ -n "$CI_BUILD_NUMBER" ]; then
  echo "==> Fijando CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER"
  sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9][0-9]*/CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER/g" \
    "$CI_PRIMARY_REPOSITORY_PATH/ios/App/App.xcodeproj/project.pbxproj"
  echo "    Valores tras el cambio:"
  grep "CURRENT_PROJECT_VERSION" "$CI_PRIMARY_REPOSITORY_PATH/ios/App/App.xcodeproj/project.pbxproj" | sed 's/^/    /'
else
  echo "==> CI_BUILD_NUMBER no definido (no estamos en Xcode Cloud), se deja el valor del repo"
fi

if [ -d "$CI_PRIMARY_REPOSITORY_PATH/node_modules/@capacitor" ]; then
  echo "==> node_modules/@capacitor ya está presente, skip resto"
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

echo "==> Resolviendo dependencias SPM (non-fatal)"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
xcodebuild -resolvePackageDependencies \
  -project App.xcodeproj \
  -scheme App \
  -clonedSourcePackagesDirPath "$CI_PRIMARY_REPOSITORY_PATH/SourcePackages" \
  2>&1 | sed 's/^/    /' || echo "    (resolve falló, se usa Package.resolved commiteado)"

echo "==> ci_pre_xcodebuild.sh DONE"
