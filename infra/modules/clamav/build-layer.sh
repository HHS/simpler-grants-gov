#!/usr/bin/env bash
# Build the ClamAV Lambda layer.
#
# Runs an Amazon Linux 2023 container, installs clamav + clamav-update + clamd,
# copies the binaries plus their shared-library dependencies, and zips them
# into layer.zip in the layout Lambda expects:
#
#   layer.zip
#   ├── bin/         (added to PATH automatically)
#   │   ├── clamscan
#   │   ├── clamdscan   (thin client the scanner uses to talk to clamd)
#   │   ├── clamd       (resident daemon that keeps the signature DB in RAM)
#   │   └── freshclam
#   └── lib/         (added to LD_LIBRARY_PATH automatically)
#       └── libclamav.so.* + transitive deps
#
# Re-run this whenever clamav itself needs a refresh (the signature DB is
# refreshed at runtime by the freshclam Lambda, not here).

set -euo pipefail

cd "$(dirname "$0")"

rm -rf build layer.zip
mkdir -p build/bin build/lib

docker run --rm --platform linux/amd64 \
  -v "$PWD/build:/out" \
  public.ecr.aws/amazonlinux/amazonlinux:2023 \
  bash -c '
    set -e
    dnf install -y --setopt=install_weak_deps=False clamav clamav-update clamd zip > /dev/null

    # clamd (the resident daemon) and clamdscan (its thin client) join clamscan
    # and freshclam. clamd lives in /usr/sbin, so resolve each path rather than
    # assuming /usr/bin.
    for tool in clamscan clamdscan clamd freshclam; do
      src="$(command -v "$tool" || true)"
      if [ -z "$src" ]; then
        echo "ERROR: $tool not found after install" >&2
        exit 1
      fi
      cp "$src" /out/bin/
    done

    # Copy each transitive shared-library dependency. Lambda already ships
    # glibc so duplicates here are harmless — its loader prefers /opt/lib.
    for bin in /out/bin/*; do
      ldd "$bin" | awk "{print \$3}" | grep -E "^/" | sort -u | while read -r lib; do
        cp -L "$lib" /out/lib/ 2>/dev/null || true
      done
    done

    chmod -R a+rX /out
  '

( cd build && zip -qr ../layer.zip bin lib )
rm -rf build

echo "Built $(pwd)/layer.zip ($(du -h layer.zip | awk '{print $1}'))"
