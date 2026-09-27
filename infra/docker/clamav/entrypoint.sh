#!/bin/sh
set -eu

sed -i \
  -e 's/^#StreamMaxLength .*/StreamMaxLength 100M/' \
  -e 's/^StreamMaxLength .*/StreamMaxLength 100M/' \
  /etc/clamav/clamd.conf

exec /init "$@"
