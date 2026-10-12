#!/bin/sh
set -eu
if [ -f "$SRCROOT/.xcode.env" ]; then . "$SRCROOT/.xcode.env"; fi
if [ -f "$SRCROOT/.xcode.env.local" ]; then . "$SRCROOT/.xcode.env.local"; fi
case "$CONFIGURATION" in
  Debug-Development) app_environment=development; release_flag= ;;
  Release-Development) app_environment=development; release_flag=--release ;;
  Debug-Production) app_environment=production; release_flag= ;;
  Release-Production) app_environment=production; release_flag=--release ;;
  *) echo "Unsupported RestoFlow build configuration" >&2; exit 1 ;;
esac
"${NODE_BINARY:-node}" "$SRCROOT/../scripts/validate-environment.mjs" "$app_environment" --ios $release_flag
