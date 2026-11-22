#!/bin/sh
# Listing-template page: images -> DA media, migrated/prototype HTML -> content/<path>.html (encode -> sanitise -> localize).
# Usage: sh build.sh <in.html> <live path, e.g. /blog/ai/> <media scope, e.g. blog-ai> <content/out.html> [--upload]
#   blog archetype: sh build.sh stardust/prototypes/blog-proposed.html /blog/ blog content/blog.html
#   (the prototype keeps the teaser CTA utm query the migrated page dropped; meta from stardust/migrated/blog/_meta.json)
# Siblings: sh build.sh stardust/migrated/<path>/index.html /<path>/ <scope> content/<path>.html --upload
set -e
cd /workspace/3055ed88
IN=$1; PAGE=$2; SCOPE=$3; OUT=$4
W=stardust/.work/archetype-listing/$SCOPE
ENC=stardust/rollout/encoders/archetype-listing
mkdir -p "$W"
# images referenced by the page (assets/<dir>/…) -> webp/png (avif does not survive the EDS media pipeline)
ASSETS=$(grep -o 'assets/[^/"]*/' "$IN" | sort | uniq -c | sort -rn | awk 'NR==1{print $2}')
SRC_DIR=stardust/prototypes/$ASSETS
[ -d "stardust/migrated/$ASSETS" ] && SRC_DIR=stardust/migrated/$ASSETS
[ -d "$W/media" ] || node stardust/rollout/encoders/archetype-program/avif2png.mjs "$SRC_DIR" "$W/media"
if [ "$5" = "--upload" ]; then
  node stardust/scripts/deploy/da-media-upload.mjs --org aemcoder --repo 3055ed88 --scope "$SCOPE" --dir "$W/media" \
    --token-file "$ADOBE_IMS_TOKEN_FILE" --ledger "stardust/deploy/media-ledger-$SCOPE.json"
fi
META=$(dirname "$IN")/_meta.json
[ -f "$META" ] || META=stardust/migrated/$(echo "$PAGE" | sed 's#^/##; s#/$##')/_meta.json
node $ENC/encode.mjs --in "$IN" --meta "$META" --page "$PAGE" --scope "$SCOPE" --media-dir "$W/media" --out "$OUT"
node stardust/scripts/deploy/sanitise.js "$OUT" 2>/dev/null
T=$W/lc
rm -rf "$T" && mkdir -p "$T" && cp -r content/. "$T/"
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content "$T" >/dev/null
cp "$T/${OUT#content/}" "$OUT"
