#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  npm run migration:run
fi

node dist/src/server.js
