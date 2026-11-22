#!/usr/bin/env python3
"""sibling-form content-count + encoder-coverage check.

Usage (from the project root):
  python3 -I stardust/rollout/encoders/sibling-form/count.py <slug>… [--enc-dir stardust/.work/render/form/enc]

Per slug: role-classified counts (build.py counts() rules) of the capture content regions (main minus
header/footer chrome, the promo strip, form dialogs outside main — build.py's own region rules) vs the
MIGRATED page's content sections (stardust/migrated/<path>/index.html, every section under main), the
word-multiset diff, the capture-JSON heading census, and — when <enc-dir>/<slug>.html exists (archetype-form
encode.py output, scratch only) — the blocks it emitted and the words of the migrated content it does NOT
carry (encoder gaps the delivery unit must close). One JSON object per slug. Exit 1 on any count drop or
missing word (encoder gaps are reported, not failed).
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


def source_roots(cap):
    main = cap.xpath('//main')[0]
    hdrs = main.xpath('.//*[starts-with(@id,"header-")][.//nav]')
    hdrs = [h for h in hdrs if not [a for a in h.iterancestors() if a in hdrs]]
    promo = build.promo_of(main)
    chrome = hdrs + main.xpath('.//footer') + promo
    dialogs = [d for d in cap.xpath('//*[@role="dialog"][not(ancestor::main)]')
               if d.xpath('.//form') and not d.xpath('ancestor-or-self::*[starts-with(@id,"onetrust") or contains(@class,"onetrust") or starts-with(@id,"ot-")]')]
    roots = promo[:1] + [main] + dialogs
    return [build.strip_chrome(r, chrome) for r in roots]


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
    enc_dir = 'stardust/.work/render/form/enc'
    if '--enc-dir' in args:
        i = args.index('--enc-dir')
        enc_dir = args[i + 1]
        del args[i:i + 2]
    bad = 0
    for slug in args:
        cap = LH.document_fromstring(open(f'stardust/current/pages/{slug}.html', 'rb').read().decode('utf-8'))
        cj = json.load(open(f'stardust/current/pages/{slug}.json', encoding='utf-8'))
        mig_file = migrated_path(slug)
        mig = LH.document_fromstring(open(mig_file, 'rb').read().decode('utf-8'))
        secs = mig.xpath('//main//section')
        roots = source_roots(cap)
        cs, ws = build.counts(roots)
        cd, wd = build.counts(secs)
        # hrefs compared as resolved targets: the driver rewrites internal links depth-relative
        # (../pricing/index.html), so /pricing/ and https://www.zendesk.com/pricing/ are one target on both sides
        cs['hrefs'], cd['hrefs'] = len(targets(roots, cj['url'])), len(targets(secs, cj['url']))
        rtext = build.norm(' '.join(build.norm(s.text_content()) for s in secs))
        site_hdr, site_ftr = build.site_chrome(cap)
        lost, chrome_heads = build.lost_headings(cj, rtext, site_hdr + site_ftr)
        rep = {'slug': slug, 'migrated': mig_file, 'source': cs, 'render': cd,
               'drops': {k: cs[k] - cd[k] for k in cs if k != 'words' and cd[k] < cs[k]},
               'wordsMissing': sum((ws - wd).values()), 'wordsExtra': sum((wd - ws).values()),
               'jsonHeadingsLost': lost, 'chromeHeadings': chrome_heads}
        enc = os.path.join(enc_dir, f'{slug}.html')
        if os.path.exists(enc):
            e = LH.document_fromstring(open(enc, 'rb').read().decode('utf-8'))
            em = e.xpath('//main')[0] if e.xpath('//main') else e
            # metadata block text is not page content
            for md in em.xpath('.//div[@class="metadata"]'):
                md.getparent().remove(md)
            we = collections.Counter(build.wordlist(em))
            gap = wd - we
            rep['encoder'] = {'blocks': sorted({c for c in em.xpath('./div/div/@class')}),
                              'wordsNotCarried': sum(gap.values()), 'wordsTotal': sum(wd.values()),
                              'gapSample': ' '.join(w for w, n in gap.items() for _ in range(n))[:400],
                              'iframesDropped': len(mig.xpath('//main//iframe')) - len(em.xpath('.//iframe')),
                              'imgsDropped': cd['images'] - len(em.xpath('.//img'))}
        if rep['drops'] or rep['wordsMissing'] or lost:
            bad += 1
        print(json.dumps(rep, ensure_ascii=False))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
