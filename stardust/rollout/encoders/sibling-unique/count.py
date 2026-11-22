#!/usr/bin/env python3
"""sibling-unique content-count + encoder-coverage check.

Usage (from the project root):
  python3 -I stardust/rollout/encoders/sibling-unique/count.py <slug>… [--enc-dir stardust/.work/render/unique/enc]

Per slug: role-classified counts (build.py counts() rules: headings, body p/li/blockquote, CTAs, hrefs as resolved
targets, images, iframes, words) of the capture content regions (build.py's own region rules: main minus
header/footer/promo chrome + the promo strip; body > article on legacy pages; the raw body text of a data feed)
vs the MIGRATED page's main sections (stardust/migrated/<path>/index.html), the word-multiset diff, the
capture-JSON heading census (headings found only in the kept canon footer are reported as chrome), and — when
<enc-dir>/<slug>.html exists (encode.py output, scratch only) — its blocks and the migrated words it does NOT
carry. One JSON object per slug. Exit 1 on any count drop or missing word (encoder gaps are reported, not failed).
"""
import collections
import json
import os
import re
import sys
from urllib.parse import urljoin

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lxml import html as LH  # noqa: E402

import build  # noqa: E402


def migrated_path(slug):
    st = json.load(open('stardust/state.json', encoding='utf-8'))
    page = next(p for p in st['pages'] if p['slug'] == slug)
    path = page['url'].split('://', 1)[1].split('/', 1)[1]
    return os.path.join('stardust/migrated', path, 'index.html')


def targets(roots, page_url):
    out = set()
    for r in roots:
        for a in r.xpath('.//a[@href]'):
            if build.txt(a) or a.xpath('.//img'):
                u = urljoin(page_url, a.get('href'))
                out.add(re.sub(r'index\.html(?=$|[?#])', '', u))
    return out


def main():
    args = sys.argv[1:]
    enc_dir = 'stardust/.work/render/unique/enc'
    if '--enc-dir' in args:
        i = args.index('--enc-dir')
        enc_dir = args[i + 1]
        del args[i:i + 2]
    bad = 0
    for slug in args:
        cj = json.load(open(f'stardust/current/pages/{slug}.json', encoding='utf-8'))
        roots = build.build(slug, 'stardust/.work/render/unique', write=False)
        mig_file = migrated_path(slug)
        mig = LH.document_fromstring(open(mig_file, 'rb').read().decode('utf-8'))
        secs = mig.xpath('//main//section')
        cs, ws = build.counts(roots)
        cd, wd = build.counts(secs)
        cs['hrefs'], cd['hrefs'] = len(targets(roots, cj['url'])), len(targets(secs, cj['url']))
        rtext = build.norm(' '.join(build.norm(s.text_content()) for s in secs))
        ftext = build.norm(' '.join(build.norm(f.text_content()) for f in mig.xpath('//body/div[contains(@class,"za-ftr")]')))
        lost, chrome_heads = [], []
        for h in cj.get('headings', []):
            t = build.norm(h.get('text'))
            if t and t not in rtext:
                (chrome_heads if t in ftext.replace('?', '? ').replace('  ', ' ') or t in ftext else lost).append(h['text'])
        rep = {'slug': slug, 'migrated': mig_file, 'source': cs, 'render': cd,
               'drops': {k: cs[k] - cd[k] for k in cs if k != 'words' and cd[k] < cs[k]},
               'wordsMissing': sum((ws - wd).values()), 'wordsExtra': sum((wd - ws).values()),
               'jsonHeadingsLost': lost, 'chromeHeadings': chrome_heads}
        enc = os.path.join(enc_dir, f'{slug}.html')
        if os.path.exists(enc):
            e = LH.document_fromstring(open(enc, 'rb').read().decode('utf-8'))
            em = e.xpath('//main')[0] if e.xpath('//main') else e
            for md in em.xpath('.//div[@class="metadata"]'):
                md.getparent().remove(md)
            gap = wd - collections.Counter(build.wordlist(em))
            rep['encoder'] = {'blocks': sorted({c for c in em.xpath('./div/div/@class')}),
                              'defaultContent': sorted({x.tag for x in em.xpath('./div/*[not(self::div)]')}),
                              'wordsNotCarried': sum(gap.values()), 'wordsTotal': sum(wd.values()),
                              'gapSample': ' '.join(w for w, n in gap.items() for _ in range(n))[:400],
                              'imgsDropped': cd['images'] - len(em.xpath('.//img'))}
        if rep['drops'] or rep['wordsMissing'] or lost:
            bad += 1
        print(json.dumps(rep, ensure_ascii=False))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
