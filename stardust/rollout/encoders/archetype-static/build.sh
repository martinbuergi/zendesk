#!/bin/sh
# archetype-static: regenerate content/<path>.html for one static-template page.
# Usage: sh build.sh <slug> <migrated path, e.g. company> <converted media dir>
#   media: node stardust/rollout/encoders/archetype-static/avif2png.mjs stardust/prototypes/assets/<slug> <dir>
#          (or the page's captured images), lowercase + '_'->'-' the names, then da-media-upload --scope <slug> --dir <dir>
# Chain: encode.py -> sanitise -> localize-links (on a temp copy of the tree, so other units' pages are untouched)
set -e
cd /workspace/3055ed88
SLUG=$1; P=$2; MEDIA=$3
OUT=content/$P.html
python3 -I stardust/rollout/encoders/archetype-static/encode.py --page stardust/migrated/$P/index.html \
  --meta stardust/migrated/$P/_meta.json --scope "$SLUG" --media-dir "$MEDIA" --out "$OUT"
node stardust/scripts/deploy/sanitise.js "$OUT" 2>/dev/null
T=stardust/.work/archetype-static/lc-$SLUG
rm -rf "$T" && mkdir -p "$T" && cp content/*.html "$T/"
mkdir -p "$(dirname "$T/$P.html")" && cp "$OUT" "$T/$P.html"
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content "$T" >/dev/null
cp "$T/$P.html" "$OUT"
echo "built $OUT"
