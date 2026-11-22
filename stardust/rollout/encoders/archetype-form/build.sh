#!/bin/sh
# archetype-form: regenerate content/<path>.html for one form-template page (contact, demo, free-trial,
# instapage-form-*). No editorial images on the archetype; a sibling with images: upload with
# da-media-upload --scope <slug> and author https://content.da.live/aemcoder/3055ed88/media/<slug>/<file>.
# Usage: sh build.sh <migrated path, e.g. contact> [--meta-row key=value ...]
# Per-sibling options (variants, on-load step, progress, icons, chrome rows): siblings.json keyed by the path.
# Chain: encode.py -> sanitise -> localize-links (on a temp copy of the tree, so other units' pages are untouched)
set -e
cd /workspace/3055ed88
P=$1; shift
OUT=content/$P.html
python3 -I stardust/rollout/encoders/archetype-form/encode.py --page stardust/migrated/$P/index.html \
  --meta stardust/migrated/$P/_meta.json --out "$OUT" \
  --config stardust/rollout/encoders/archetype-form/siblings.json --key "$P" "$@"
node stardust/scripts/deploy/sanitise.js "$OUT" 2>/dev/null
T=stardust/.work/archetype-form/lc-$(echo "$P" | tr / -)
rm -rf "$T" && mkdir -p "$T" && cp content/*.html "$T/"
# D5 (stardust/dynamic-features.md): /login/ and /register/ links stay absolute to www.zendesk.com even though
# the two pages are delivered — keep them out of the link map, and localize the page under a neutral name
rm -f "$T/login.html" "$T/register.html" "$T/$P.html"
cp "$OUT" "$T/zz-form-page.html"
node stardust/scripts/deploy/localize-links.mjs --source-host www.zendesk.com --content "$T" >/dev/null
cp "$T/zz-form-page.html" "$OUT"
echo "built $OUT"
