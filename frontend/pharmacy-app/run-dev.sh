#!/usr/bin/env bash
# Boot the duplicated pharmacy-app dev server against the sandbox stores.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null 2>&1
cd "$(dirname "$0")"
export BROWSER=none
exec npx env-cmd -f .env.local npx react-scripts start
