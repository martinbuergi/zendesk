#!/usr/bin/env python3
"""archetype-article encoder: migrated gen-B customer story -> DA content page.

Usage:
  python3 -I stardust/rollout/encoders/archetype-article.py \
      stardust/migrated/customer/<name>/index.html content/customer/<name>.html \
      [--media-base https://content.da.live/aemcoder/3055ed88/media/customer-<name>]
      [--captured stardust/current/pages/customer-<name>.html | --publication-date YYYY-MM-DD]

Input: the migrated page (template customer-canva, zb- classes) + its _meta.json
sidecar (title/description/canonical). Output: a DA body fragment using the
zb-story-hero / zb-quotes / zb-facts / zb-stats / zb-article blocks.

Every section is optional; a story with no quotes, no facts, no stats or no
video simply omits that block/row. Images are re-pointed at the DA media
scope (upload the migrated assets/customer-<name>/ folder first with
da-media-upload.mjs --scope customer-<name>). Run sanitise.js and
localize-links.mjs on the output afterwards.
"""
import html
import json
import os
import re
import sys

from lxml import html as LH

WISTIA = 'https://fast.wistia.net/embed/iframe/{}'
SHARE_NAMES = [
    (r'twitter\.com|x\.com', 'X'),
    (r'facebook\.com', 'Facebook'),
    (r'linkedin\.com', 'LinkedIn'),
    (r'feed|rss|\.xml', 'RSS'),
]


def esc(s):
    return html.escape(s, quote=False)


def attr(s):
    return html.escape(s, quote=True)


def text(el):
    return re.sub(r'\s+', ' ', el.text_content() if el is not None else '')


def norm_href(href):
    href = href or ''
    # migrated hrefs are relative to customer/<name>/index.html or root-relative
    if href.startswith('../../'):
        href = '/' + href[len('../../'):]
        href = re.sub(r'(^|/)index\.html(?=$|[?#])', r'\1', href)  # migrate's folder-index form -> /x/
    if href.startswith('/'):
        href = 'https://www.zendesk.com' + href  # localize-links.mjs makes in-scope ones root-relative
    return href


def img_src(src, media_base):
    name = os.path.basename(src.split('?')[0])
    return f'{media_base}/{name}' if media_base else src


def inline(el, media_base=False):
    """inner HTML of a prose element, keeping only a / strong / em / br (and img when media_base is given)."""
    out = [esc(el.text or '')]
    for c in el:
        tag = c.tag if isinstance(c.tag, str) else ''
        inner = inline(c, media_base)
        if tag == 'a':
            out.append(f'<a href="{attr(norm_href(c.get("href")))}">{inner}</a>')
        elif tag in ('strong', 'b'):
            out.append(f'<strong>{inner}</strong>')
        elif tag in ('em', 'i'):
            out.append(f'<em>{inner}</em>')
        elif tag == 'br':
            out.append('<br>')
        elif tag == 'svg':
            pass
        elif tag == 'img' and media_base is not False:
            out.append(f'<img src="{attr(img_src(c.get("src"), media_base))}" alt="{attr(c.get("alt") or "")}">')
        else:
            out.append(inner)
        out.append(esc(c.tail or ''))
    return ''.join(out).strip()


def block(name, rows):
    body = ''.join('<div>' + ''.join(f'<div>{c}</div>' for c in row) + '</div>' for row in rows)
    return f'<div class="{name}">{body}</div>'


def hero(main, media_base):
    sec = main.find_class('zb-story-hero')
    if not sec:
        return ''
    sec = sec[0]
    parts = []
    back = sec.find_class('zb-backlink')
    if back:
        parts.append(f'<p><a href="{attr(norm_href(back[0].get("href")))}">{esc(text(back[0]).strip())}</a></p>')
    for img in sec.xpath('.//*[contains(@class,"zb-logorow")]//img'):
        parts.append(f'<p><img src="{attr(img_src(img.get("src"), media_base))}" alt="{attr(img.get("alt") or "")}"></p>')
    h1 = sec.xpath('.//h1')
    if h1:
        parts.append(f'<h1>{inline(h1[0])}</h1>')
    textcol = sec.find_class('zb-story-hero__text')
    if textcol:
        for p in textcol[0].xpath('./p'):
            if text(p).strip():
                parts.append(f'<p>{inline(p)}</p>')
    share = sec.xpath('.//*[contains(@class,"zb-social")]//a')
    if share:
        items = []
        for a in share:
            href = a.get('href') or ''
            name = next((n for rx, n in SHARE_NAMES if re.search(rx, href, re.I)), 'Share')
            items.append(f'<li><a href="{attr(norm_href(href))}">{name}</a></li>')
        parts.append('<ul>' + ''.join(items) + '</ul>')
    for a in sec.xpath('.//*[contains(@class,"zb-linkgroup")]//a[contains(@class,"zb-btn")]'):
        label = esc(text(a).strip())
        mark = 'strong' if 'zb-btn--primary' in (a.get('class') or '') else 'em'
        parts.append(f'<p><{mark}><a href="{attr(norm_href(a.get("href")))}">{label}</a></{mark}></p>')
    for btn in sec.xpath('.//*[@data-video]'):
        m = re.match(r'wistia:(\w+)', btn.get('data-video') or '')
        if m:
            parts.append(f'<p><a href="{WISTIA.format(m.group(1))}">{esc(text(btn).strip())}</a></p>')
    media = sec.xpath('.//*[contains(@class,"zb-story-hero__media")]//img')
    cells = [''.join(parts)]
    if media:
        cells.append(f'<img src="{attr(img_src(media[0].get("src"), media_base))}" alt="{attr(media[0].get("alt") or "")}">')
    return '<div>' + block('zb-story-hero', [cells]) + '</div>'


def quotes_and_facts(main):
    out = []
    qrows = []
    for q in main.find_class('zb-quote'):
        bq = q.xpath('.//blockquote')
        quote = ''.join(f'<p>{inline(b)}</p>' for b in bq)
        cite = ''.join(f'<p>{inline(p)}</p>' for p in q.xpath('.//cite//p') if text(p).strip())
        stats = ''
        for st in q.xpath('.//*[contains(@class,"zb-quote__stats")]//*[contains(concat(" ",normalize-space(@class)," ")," zb-stat ")]'):
            fig = st.find_class('zb-stat__figure')
            cap = st.find_class('zb-stat__text')
            if fig:
                stats += f'<p>{inline(fig[0])}</p>' + (f'<p>{inline(cap[0])}</p>' if cap else '')
        qrows.append([quote, cite] + ([stats] if stats else []))
    facts = main.find_class('zb-fact')
    if qrows:
        # variant: quotes with no fact row below (render variant 'zb-quotes no-facts')
        qvar = '' if facts else ' no-facts'
        # variant: one quote on live = centred 8-of-12 column (render marks it zb-quotes--single)
        if main.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," zb-quotes--single ")]'):
            qvar += ' single'
        out.append(block('zb-quotes' + qvar, qrows))
    frows = []
    for f in facts:
        h = f.xpath('./h1|./h2|./h3|./h4|./h5')
        vals = ''.join(f'<p>{inline(p)}</p>' for p in f.xpath('./p'))
        frows.append([f'<h2>{inline(h[0])}</h2>' if h else '', vals])
    if frows:
        # variant: the render marks a non-4 fact count as zb-facts--<word>-up (live col = 12 / count)
        fvar = ''
        for row in main.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," zb-facts ")]'):
            m = re.search(r'zb-facts--(\w+-up)', row.get('class') or '')
            if m:
                fvar = ' ' + m.group(1)
        out.append(block('zb-facts' + fvar, frows))
    return '<div>' + ''.join(out) + '</div>' if out else ''


def stats(main):
    rows = []
    for row in main.find_class('zb-stats'):
        for st in row.find_class('zb-stat'):
            fig = st.find_class('zb-stat__figure')
            cap = st.find_class('zb-stat__text')
            rows.append([f'<p>{inline(fig[0])}</p>' if fig else '', f'<p>{inline(cap[0])}</p>' if cap else ''])
    return '<div>' + block('zb-stats', rows) + '</div>' if rows else ''


def article(main, media_base, body_md=False, para_images=False, img_lsep=False, split_sections=False):
    cols = main.find_class('zb-body__col')
    if not cols:
        return ''
    parts = []
    for el in cols[0]:
        tag = el.tag if isinstance(el.tag, str) else ''
        if tag == 'p' and text(el).strip() and el.xpath('.//img'):
            # text + image in one live paragraph (docebo: text<br><br><img>): keep it whole, image inline
            parts.append(f'<p>{inline(el, media_base)}</p>')
            continue
        if tag in ('h2', 'h3', 'h4', 'h5', 'h6'):
            parts.append(f'<h3>{inline(el)}</h3>')
        elif tag == 'p' and text(el).strip():
            parts.append(f'<p>{inline(el)}</p>')
        elif tag in ('ul', 'ol'):
            lis = ''.join(f'<li>{inline(li)}</li>' for li in el.xpath('./li'))
            parts.append(f'<{tag}>{lis}</{tag}>')
        elif tag == 'blockquote':
            # live body pull quote (yape): a UA blockquote (40px side indents) around one paragraph
            parts.append(f'<blockquote><p>{inline(el)}</p></blockquote>')
        for img in ([el] if tag == 'img' else el.xpath('.//img')):
            parts.append(f'<p><img src="{attr(img_src(img.get("src"), media_base))}" alt="{attr(img.get("alt") or "")}"></p>')
        for v in el.xpath('.//*[@data-video]') + ([el] if el.get('data-video') else []):
            m = re.match(r'wistia:(\w+)', v.get('data-video') or '')
            if m:
                parts.append(f'<p><a href="{WISTIA.format(m.group(1))}">{WISTIA.format(m.group(1))}</a></p>')
    name = 'zb-article' + (' body-md' if body_md else '') + (' para-images' if para_images else '') \
        + (' img-lsep' if img_lsep else '') + (' split-sections' if split_sections else '')
    return '<div>' + block(name, [[''.join(parts)]]) + '</div>' if parts else ''


def metadata(meta, hero_img):
    md = meta.get('metadata', {})
    # sidecar strings carry source HTML entities (&#x27;, &rsquo;): decode once before escaping
    rows = [('Title', esc(html.unescape(md.get('title', '')))), ('Description', esc(html.unescape(md.get('description', ''))))]
    if md.get('canonical'):
        rows.append(('Canonical', esc(md['canonical'])))
    if hero_img:
        rows.append(('Image', f'<img src="{attr(hero_img)}" alt="">'))
    if meta.get('publicationDate'):
        rows.append(('publication-date', esc(meta['publicationDate'])))
    rows += [('nav', '/nav-legacy'), ('footer', '/footer-legacy'), ('theme', 'legacy')]
    body = ''.join(f'<div><div><p>{k}</p></div><div><p>{v}</p></div></div>' for k, v in rows)
    return f'<div><div class="metadata">{body}</div></div>'


def main_():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(2)
    src, dst = args[0], args[1]
    media_base = None
    if '--media-base' in args:
        media_base = args[args.index('--media-base') + 1].rstrip('/')
    pub = None
    img_lsep = False
    split_sections = False
    body_md = False
    para_images = False
    if '--publication-date' in args:
        pub = args[args.index('--publication-date') + 1]
    # explicit utf-8: libxml2 sniffs latin-1 when <meta charset> sits past its look-ahead (recargapay mojibake)
    doc = LH.parse(src, parser=LH.HTMLParser(encoding='utf-8')).getroot()
    main = doc.xpath('//main')[0]
    sidecar = os.path.join(os.path.dirname(src), '_meta.json')
    meta = json.load(open(sidecar)) if os.path.exists(sidecar) else {}
    if '--captured' in args:  # stardust/current/pages/<slug>.html: article:published_time
        cap = open(args[args.index('--captured') + 1], encoding='utf-8').read()
        m = re.search(r'article:published_time" content="([0-9-]{10})', cap)
        if m and not pub:
            pub = m.group(1)
        # live body-text size is a per-story styled-components prop on the body col: hash eBPZJn = 18px
        # (canva, mimecast, irc-video), every other hash (cJTakS) = the 16px default -> variant body-md
        m = re.search(r'sc-7f78ffc2-5 hmvmFG (\w+)', cap)
        body_md = bool(m) and m.group(1) != 'eBPZJn'
        # body images authored inside a <p> on live (vs bare after a block) -> variant para-images
        body = cap[m.start():] if m else ''
        para_images = bool(re.search(r'<p[^>]*>\s*<img', body))
        # every live body image followed by U+2028 inside its paragraph (docebo, britbox, action-property-management):
        # the separator wraps under the full-width image (+1 line); the delivery pipeline strips U+2028 from content,
        # so the block re-adds it as generated content -> variant img-lsep
        body = body[:body.find('<footer')] if '<footer' in body else body
        # (yape: every in-paragraph image ends in one or more U+2028; a bare image outside a <p> is ignored)
        n_img = len(re.findall(r'<p[^>]*>\s*<img\b', body))
        img_lsep = n_img > 0 and n_img == len(re.findall('<img\\b[^>]*>[ \t\n\r]*(?:\u2028[ \t\n\r]*)+</p>', body))
        # body as alternating two-column Basestyle sections (heading + text | image, grey/white bands): ballys
        # -> variant split-sections (the block regroups the merged column at each sub-head)
        split_sections = 'Basestyle__BaseColTextRoot' in cap
    if pub:
        meta['publicationDate'] = pub
    hero_imgs = main.xpath('.//*[contains(@class,"zb-story-hero__media")]//img')
    hero_img = img_src(hero_imgs[0].get('src'), media_base) if hero_imgs else None
    sections = [hero(main, media_base), quotes_and_facts(main), stats(main),
                article(main, media_base, body_md, para_images, img_lsep, split_sections), metadata(meta, hero_img)]
    out = '<body>\n<header></header>\n<main>\n' + '\n'.join(s for s in sections if s) + '\n</main>\n<footer></footer>\n</body>\n'
    os.makedirs(os.path.dirname(dst) or '.', exist_ok=True)
    with open(dst, 'w', encoding='utf-8') as fh:
        fh.write(out)
    print(f'{dst}: ' + ', '.join(n for n in ('zb-story-hero', 'zb-quotes', 'zb-facts', 'zb-stats', 'zb-article') if re.search(f'class="{n}[ "]', out)))


if __name__ == '__main__':
    main_()
