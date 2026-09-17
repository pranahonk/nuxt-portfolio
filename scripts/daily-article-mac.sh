#!/bin/bash
set -uo pipefail

ROOT=/Users/pranawijaya/nuxt-portfolio
. "$HOME/.nvm/nvm.sh"
cd "$ROOT" || exit 1
caffeinate -i npm run publish:daily
