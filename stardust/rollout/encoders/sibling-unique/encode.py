#!/usr/bin/env python3
"""sibling-unique encoder: a rendered `unique` sibling (stardust/migrated/<path>/index.html, or the builder's .work
file) -> DA body fragment, using the archetype's block names and row shapes where an archetype module was used.

The archetype encoder ../archetype-unique/gen-content.py is a one-off scraper of the pricing prototype (every
section regex is mandatory) and cannot read siblings — it crashes on the first section (pr-tabs) of any sibling,
i.e. it carries none of their content. This encoder reads one data-module <section> at a time:

  pr-split (+ pr-split--hero)  -> block `pr-split` (variant `hero` -> library block `sv-hero tint-white notice`: the live
                                  gen-A teaser hero), row [text cell, image cell] (headings, paragraphs, CTAs as
                                  <p><strong><a> primary / <p><em><a> secondary)
  pr-final (+ pr-final--light) -> block `pr-final` (variant `light`), one cell
  pr-promo                     -> NOT in the page: the live strip is header chrome (role=complementary above the
                                  slim nav) -> carried by the nav document's `promo` section (--nav /nav-slim-help)
  pr-bar + pr-embed            -> block `un-tour` (NEW, cluster-unique): row 1 [logo image link] [links / CTA],
                                  row 2 [iframe src link, title as link text]
  pr-data                      -> block `un-raw` (NEW, cluster-unique): the verbatim feed text in one <p>
Images: captured source URLs -> uploaded DA media (MEDIA map below).
Links: depth-relative migrated links -> site-root paths; absolute zendesk links -> root paths.
A metadata block carries Title / Description / Canonical / nav / footer derived from the render's chrome.

Usage: python3 -I encode.py <rendered.html> <out.html> --path /<slug>/ [--nav </nav-doc|off>] [--footer </footer-doc|off>]
  (defaults: /nav when the render keeps a header else off; /footer, /footer-legal for a legal-only footer, else off)
  this cluster (stardust/.work/cluster-unique/encode.sh): help-center-closed --nav /nav-slim-help --footer /footer;
  intro-tour --nav /nav-none --footer /footer-tour (live minimal legal row, ©Zendesk 2023);
  blog-ads-api-output --nav /nav-none --footer /footer-none (bare feed, no chrome)
Prints `sections N blocks N bytes N`; exit 1 when nothing was produced.
"""
import html
import re
import sys
from urllib.parse import urljoin

from lxml import html as LH

Z = 'https://www.zendesk.com'
DA = 'https://content.da.live/aemcoder/3055ed88/media/'
MEDIA = {  # captured src prefix -> uploaded DA media
    'https://web-assets.zendesk.com/is/image/zendesk/Hero-6': DA + 'help-center-closed/Hero-6.webp',
    'https://web-assets.zendesk.com/images/navigation/header/zendesk-logo.svg': DA + 'intro-tour/zendesk-logo.svg',
}


def media(src):
    for k, v in MEDIA.items():
        if (src or '').startswith(k):
            return v
    return src


def esc(s):
    return html.escape(s or '', quote=False)


def attr(s):
    return html.escape(s or '', quote=True)


def norm(s):
    return re.sub(r'[ \t\r\n]+', ' ', s or '').strip(' ')


def txt(el):
    return norm(''.join(el.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::svg)]')))


def fix_href(h, page):
    if h is None:
        return None
    if h.startswith('#') or re.match(r'^[a-z]+:', h, re.I) and not h.startswith(Z):
        return h
    u = urljoin(Z + page, h)
    if u.startswith(Z + '/'):
        u = u[len(Z):]
        u = re.sub(r'index\.html(?=$|[?#])', '', u)
    return u


def inner(el, page):
    """inline html of el: a/strong/em/br/sup/sub/code only, no classes"""
    out = [esc(el.text or '')]
    for c in el:
        t = c.tag if isinstance(c.tag, str) else ''
        if t == 'a':
            out.append(f'<a href="{attr(fix_href(c.get("href"), page))}">{inner(c, page)}</a>')
        elif t in ('strong', 'em', 'sup', 'sub', 'code'):
            out.append(f'<{t}>{inner(c, page)}</{t}>')
        elif t == 'br':
            out.append('<br>')
        elif t and t not in ('script', 'style', 'svg', 'img'):
            out.append(inner(c, page))
        out.append(esc(c.tail or ''))
    return ''.join(out).strip(' \n')


def block(name, rows):
    out = [f'<div class="{name}">']
    for r in rows:
        out.append('<div>' + ''.join(f'<div>{c}</div>' for c in r) + '</div>')
    out.append('</div>')
    return '\n'.join(out)


def flow(el, page):
    """text column -> headings / p / ul / CTA paragraphs"""
    out = []
    for d in el.iter():
        t = d.tag if isinstance(d.tag, str) else ''
        if t in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6') and txt(d):
            out.append(f'<{t}>{inner(d, page)}</{t}>')
        elif t == 'p' and txt(d) and d.get('hidden') is None:
            out.append(f'<p>{inner(d, page)}</p>')
        elif t == 'ul':
            out.append('<ul>' + ''.join(f'<li>{inner(li, page)}</li>' for li in d.xpath('./li')) + '</ul>')
        elif t == 'a' and 'za-btn' in (d.get('class') or ''):
            w = 'strong' if 'za-btn--primary' in d.get('class') else 'em'
            out.append(f'<p><{w}><a href="{attr(fix_href(d.get("href"), page))}">{esc(txt(d))}</a></{w}></p>')
        elif t == 'a' and 'pr-link' in (d.get('class') or ''):
            out.append(f'<p><a href="{attr(fix_href(d.get("href"), page))}">{esc(txt(d))}</a></p>')
    return ''.join(out)


def imgs(el, page):
    out = []
    for i in el.xpath('.//img'):
        im = f'<img src="{attr(media(i.get("src")))}" alt="{attr(i.get("alt") or "")}">'
        a = i.xpath('ancestor::a[1]')
        if a:
            im = f'<a href="{attr(fix_href(a[0].get("href"), page))}">{im}</a>'
        out.append(f'<p>{im}</p>')
    return ''.join(out)


def main():
    if len(sys.argv) < 3 or sys.argv[1] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if len(sys.argv) > 1 else 2)
    inp, outp = sys.argv[1], sys.argv[2]
    page = sys.argv[sys.argv.index('--path') + 1] if '--path' in sys.argv else '/'
    doc = LH.document_fromstring(open(inp, 'rb').read().decode('utf-8'))
    S, nblocks = [], 0
    for sec in doc.xpath('//main/section[@data-module]'):
        mod = sec.get('data-module')
        cls = sec.get('class') or ''
        if mod == 'pr-split':
            text = sec.xpath('.//*[contains(@class,"pr-split__text")]')[0]
            media = sec.xpath('.//*[contains(@class,"pr-split__media")]')
            name = 'sv-hero tint-white notice' if 'pr-split--hero' in cls else 'pr-split' + (' hero' if 'pr-split--hero' in cls else ' dark' if 'pr-split--dark' in cls
                                 else ' reverse' if 'pr-split--rev' in cls else '')
            S.append(block(name, [[flow(text, page), imgs(media[0], page) if media else '']]))
        elif mod == 'pr-final':
            S.append(block('pr-final' + (' light' if 'pr-final--light' in cls else ''), [[flow(sec, page)]]))
        elif mod == 'pr-promo':
            continue  # header chrome: the nav document's promo section
        elif mod == 'pr-bar':
            acts = sec.xpath('.//*[contains(@class,"pr-bar__acts")]')
            brand = sec.xpath('.//*[contains(@class,"pr-bar__brand")]')
            tour = [[imgs(brand[0], page) if brand else '', flow(acts[0], page) if acts else '']]
            S.append(None)  # placeholder: the following pr-embed completes the un-tour block
        elif mod == 'pr-embed':
            rows = [[f'<p><a href="{attr(f.get("src"))}">{esc(f.get("title") or f.get("src"))}</a></p>']
                    for f in sec.xpath('.//iframe[@src]')]
            if S and S[-1] is None:
                S[-1] = block('un-tour', tour + rows)
            else:
                S.append(block('un-tour', rows))
        elif mod == 'pr-data':
            code = sec.xpath('.//pre//code')
            S.append(block('un-raw', [[f'<p>{esc("".join(code[0].itertext()) if code else txt(sec))}</p>']]))
        else:
            print(f'unknown module {mod}', file=sys.stderr)
            continue
        nblocks += 1
    S = [x for x in S if x is not None]
    # metadata from the render head + chrome
    head = doc.xpath('//head')[0]

    def meta(k):
        m = head.xpath(f'./meta[@name="{k}"]/@content')
        return m[0] if m else None
    t = head.xpath('./title')
    can = head.xpath('./link[@rel="canonical"]/@href')
    body = doc.xpath('//body')[0]
    has_hdr = bool(body.xpath('./div[contains(@class,"za-hdr")]'))
    ftr = body.xpath('./div[contains(@class,"za-ftr")]')
    rows = [['Title', esc(norm(t[0].text_content())) if t else '']]
    if meta('description'):
        rows.append(['Description', esc(meta('description'))])
    rows.append(['Canonical', attr(can[0]) if can else Z + page])
    opt = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else None  # noqa: E731
    rows.append(['nav', opt('--nav') or ('/nav' if has_hdr else 'off')])
    rows.append(['footer', opt('--footer') or (('/footer-legal' if 'pr-ftr--legal' in (ftr[0].get('class') or '') else '/footer') if ftr else 'off')])
    if rows[-2][1] == '/nav-none':
        rows.append(['promo', 'off'])
    meta_b = block('metadata', rows)
    out = '<body>\n<header></header>\n<main>\n' + ''.join(f'<div>\n{s}\n</div>\n' for s in S) + \
          f'<div>\n{meta_b}\n</div>\n</main>\n<footer></footer>\n</body>\n'
    open(outp, 'w', encoding='utf-8').write(out)
    print(f'sections {len(S)} blocks {nblocks} bytes {len(out)}')
    sys.exit(0 if S else 1)


if __name__ == '__main__':
    main()
