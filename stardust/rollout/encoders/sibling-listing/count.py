#!/usr/bin/env python3
"""sibling-listing content-count + encoder-coverage check.

Usage (from the project root):
  python3 -I stardust/rollout/encoders/sibling-listing/count.py <slug>… [--enc-dir stardust/.work/render/listing/enc]

Per slug: role-classified counts (build.py counts_main rules) of the capture main
(stardust/current/pages/<slug>.json's hydrated twin <slug>.html, UTF-8) vs the MIGRATED page's content sections
(stardust/migrated/<path>/index.html, every top-level section.za-section — canon chrome and bl-subnav excluded),
the word-multiset diff, and — when <enc-dir>/<slug>.html exists (archetype-listing encode.mjs output) — the words
of the migrated content the archetype encoder does NOT carry (encoder gaps the delivery unit must close).
Prints one JSON object per slug. Exit 1 when any slug has a count drop or missing words.
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lxml import html as LH  # noqa: E402

import build  # noqa: E402


def migrated_path(slug):
    st = json.load(open('stardust/state.json', encoding='utf-8'))
    page = next(p for p in st['pages'] if p['slug'] == slug)
    path = page['url'].split('://', 1)[1].split('/', 1)[1]
    return os.path.join('stardust/migrated', path, 'index.html')


def content_of(doc):
    secs = doc.xpath('//main//section[contains(concat(" ", normalize-space(@class), " "), " za-section ")]'
                     '[not(ancestor::section[contains(concat(" ", normalize-space(@class), " "), " za-section ")])]')
    wrap = LH.fromstring('<div></div>')
    for s in secs:
        wrap.append(LH.fromstring(LH.tostring(s, encoding='unicode')))
    return wrap


def main():
    args = sys.argv[1:]
    enc_dir = 'stardust/.work/render/listing/enc'
    if '--enc-dir' in args:
        i = args.index('--enc-dir')
        enc_dir = args[i + 1]
        del args[i:i + 2]
    bad = 0
    for slug in args:
        cap = LH.document_fromstring(open(f'stardust/current/pages/{slug}.html', 'rb').read().decode('utf-8'))
        mig_file = migrated_path(slug)
        mig = LH.document_fromstring(open(mig_file, 'rb').read().decode('utf-8'))
        src, dst = cap.xpath('//main')[0], content_of(mig)
        cs, cd = build.counts_main(src), build.counts_main(dst)
        ws, wd = build.words(src), build.words(dst)
        rep = {'slug': slug, 'migrated': mig_file, 'source': cs, 'render': cd,
               'drops': {k: cs[k] - cd[k] for k in cs if k != 'words' and cd[k] < cs[k]},
               'wordsMissing': sum((ws - wd).values()), 'wordsExtra': sum((wd - ws).values())}
        enc = os.path.join(enc_dir, f'{slug}.html')
        if os.path.exists(enc):
            e = LH.document_fromstring(open(enc, 'rb').read().decode('utf-8'))
            we = build.words(e.xpath('//main')[0] if e.xpath('//main') else e)
            gap = wd - we
            rep['encoder'] = {'blocks': sorted({c.split()[0] for c in e.xpath('//main/div/div/@class')}),
                              'wordsNotCarried': sum(gap.values()), 'wordsTotal': sum(wd.values()),
                              'imgs': len(e.xpath('//img'))}
        if rep['drops'] or rep['wordsMissing']:
            bad += 1
        print(json.dumps(rep, ensure_ascii=False))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
