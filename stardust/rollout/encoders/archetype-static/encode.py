# archetype-static encoder: migrated static-template page (co- modules) -> DA body fragment.
# Usage:
#   python3 -I encode.py --page stardust/migrated/<path>/index.html --meta stardust/migrated/<path>/_meta.json \
#     --scope <slug> --media-dir <dir of converted images> --out content/<path>.html [--cta-lg] [--meta-row k=v]
# Section mapping (walks main .co-wrap > section in order; unknown sections fall back to default content):
#   section.co-hero + .co-row        -> co-teaser (hero)       [text cell (eyebrow <p> before the heading) | image cell]
#   .co-row with .co-media--l        -> co-teaser (reverse)
#   .co-row with .co-media--video    -> co-teaser (video)      text cell ends with <p><a href="https://fast.wistia.net/embed/iframe/<id>">
#   .co-row (media right)            -> co-teaser
#     + a following section.co-card-row -> a 2nd co-teaser row [h3 + p] (cream card under the row, same live section)
#     + a following .co-acc-section without its own heading -> the accordion's head (see co-acc below)
#   section holding .co-car          -> default content head (h2, p, CTA) + co-carousel, one row per card [image | title]
#   section holding .co-car--desc    -> default content head (h2, p) + co-cards, one row per card [image | h3, p, link p]
#   .co-promo                        -> co-promo               [h2 + CTA]
#   section.co-cta                   -> co-cta                 [h2 + CTA]  (variant lg for .co-cta--lg or --cta-lg)
#   section.co-tabs-section          -> co-tabs                one row per tab [:icon: (--tab-icons) | link]; the tab targets are re-pointed at the
#                                       auto heading ids of the tab groups (EDS has no section ids)
#   section.co-acc-section           -> default content head (h2, p, CTA, picture) + co-accordion (variant lead when the
#                                       section starts a tab group) + trailing default content (h3, p after the accordion).
#                                       co-accordion rows: [h3 title | leading panel prose], then table rows [cell | cell]
#                                       (the panel's 2-column table), then 1-cell rows = panel prose after the table
#   section with .co-logos           -> default content h2 + co-logos, one row per logo image
#   section with .co-stats           -> co-stats: [h2 | list] row, [prose] row, one [figure | label] row per stat
#   section.co-legacy (sitemap)      -> default content h2 + co-linklist (legacy), one row per [h3 + ul] column
# In-page links (#<section id>) are re-pointed at the heading id EDS generates for the target section's first heading.
# Images: assets/<scope>/<Name>.avif -> https://content.da.live/aemcoder/3055ed88/media/<scope>/<name>.<ext>
# (name lowercased, _ -> -, ext from the converted file in --media-dir: run avif2png.mjs first, then da-media-upload).
# Metadata rows: Title / Description / Canonical from _meta.json, promo | off (gen-A, no promo strip on the static pages);
# add extra rows with --meta-row key=value (e.g. nav=/nav-slim).
import argparse
import html
import json
import os
import re
import unicodedata
from urllib.parse import urljoin

from lxml import html as LH

ap = argparse.ArgumentParser()
ap.add_argument('--page', required=True)
ap.add_argument('--meta', required=True)
ap.add_argument('--scope', required=True)
ap.add_argument('--media-dir', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--meta-row', action='append', default=[])
ap.add_argument('--cta-lg', action='store_true', help='closing CTA uses the display-size title (live h2 68px)')
ap.add_argument('--tab-icons', default='', help='comma-separated icon names for the co-tabs rows (live sidebar glyphs, '
                'dropped by the render): icons/<name>.svg, authored as :name:')
ap.add_argument('--capture', default=None, help='hydrated capture (default stardust/current/pages/<scope>.html): '
                'its no-break spaces, normalised away by the render, are restored between the same word pairs')
ap.add_argument('--site-plan', default='stardust/.labs/site-plan.json')
a = ap.parse_args()

Z = 'https://www.zendesk.com'
M = f'https://content.da.live/aemcoder/3055ed88/media/{a.scope}/'
PLAN = set()
if os.path.exists(a.site_plan):
    PLAN = {x['url'] for x in json.load(open(a.site_plan))['pages'] if x.get('selected')}
D5 = ('/login/', '/register/')
MEDIA = {os.path.splitext(f)[0]: f for f in os.listdir(a.media_dir)}

doc = LH.fromstring(open(a.page, encoding='utf-8').read())
meta = json.load(open(a.meta, encoding='utf-8'))
BASE = meta.get('metadata', {}).get('canonical') or Z + '/'
ANCHOR = {}  # source section id -> EDS heading id


def esc(s):
    return html.escape(s, quote=False)


def slug(s):
    """the heading id the EDS pipeline generates (github-slugger rules)"""
    s = unicodedata.normalize('NFC', s).strip().lower()
    s = re.sub(r'[^\w\- ]', '', s)
    return s.replace(' ', '-')


def absu(h):
    """in-scope pages root-relative (source trailing slash), the rest absolute (runtime contract links)"""
    if not h:
        return h
    if h.startswith('#'):
        return '#' + ANCHOR.get(h[1:], h[1:])
    if not re.match(r'^(https?:|/|#|mailto:|tel:)', h):
        # migrated tree links are relative to the page file (../x/index.html): resolve against the source URL
        h = urljoin(BASE, h)
        h = re.sub(r'index\.html$', '', h)
    u = Z + h if h.startswith('/') else h
    if u.startswith(Z + '/') and u in PLAN and not u.endswith(D5):
        return u[len(Z):]
    return u


def cls(el):
    return set((el.get('class') or '').split())


def has(el, c):
    return el.xpath(f'.//*[contains(concat(" ", normalize-space(@class), " "), " {c} ")]')


def inline(el, top=True):
    """children of el as inline DA markup: text + a/strong/em/br kept, svg and decorative spans dropped.
    Whitespace at the edges of a nested inline element moves outside it (live `<b>ISO 27001:2022: </b>Information`
    keeps its word break)."""
    def wrap(open_, inner, close):
        lead = ' ' if inner[:1].isspace() else ''
        trail = ' ' if inner[-1:].isspace() else ''
        return f'{lead}{open_}{inner.strip()}{close}{trail}' if inner.strip() else lead or trail

    out = [esc(el.text or '')]
    for c in el:
        tag = c.tag if isinstance(c.tag, str) else ''
        if tag in ('svg',):
            pass
        elif tag == 'a':
            out.append(wrap(f'<a href="{html.escape(absu(c.get("href", "")))}">', inline(c, False), '</a>'))
        elif tag in ('strong', 'b'):
            out.append(wrap('<strong>', inline(c, False), '</strong>'))
        elif tag in ('em', 'i'):
            out.append(wrap('<em>', inline(c, False), '</em>'))
        elif tag == 'br':
            out.append('<br>')
        elif tag:
            out.append(inline(c, False))
        out.append(esc(c.tail or ''))
    s = re.sub(r'[ \t\n\r\f\v]+', ' ', ''.join(out))
    return s.strip() if top else s


def text(el):
    return re.sub(r'\s+', ' ', ''.join(t for t in el.itertext())).strip()


def img(el):
    src = el.get('src', '')
    stem = os.path.splitext(os.path.basename(src))[0].lower().replace('_', '-')
    f = MEDIA.get(stem)
    if not f:
        raise SystemExit(f'encode: no converted media for {src} (stem {stem}) in {a.media_dir}')
    return f'<p><img src="{M}{f}" alt="{html.escape(el.get("alt", ""))}"></p>'


def real_img(scope):
    for i in scope.iter('img'):
        if 'co-ii__sizer' not in cls(i) and not i.get('src', '').startswith('data:'):
            return i
    return None


def ctas(scope):
    """za-btn anchors -> <p><strong><a></a></strong></p> (primary) / <em> (secondary)"""
    out = []
    for x in scope.iter('a'):
        c = cls(x)
        if 'za-btn' not in c:
            continue
        label = text(x)
        if not label:
            continue
        mark = 'em' if 'za-btn--secondary' in c else 'strong'
        out.append(f'<p><{mark}><a href="{html.escape(absu(x.get("href", "")))}">{esc(label)}</a></{mark}></p>')
    return out


def prose(scope, skip=()):
    """heading + body paragraphs/lists of a text column, in order (CTAs excluded)"""
    out = []
    for el in scope.iter():
        if not isinstance(el.tag, str) or any(el is s or s in el.iterancestors() for s in skip):
            continue
        if el.tag in ('h1', 'h2', 'h3', 'h4'):
            if text(el):
                out.append(f'<{el.tag}>{inline(el)}</{el.tag}>')
        elif el.tag == 'p' and not el.xpath('ancestor::a') and not el.xpath('ancestor::li') and text(el):
            out.append(f'<p>{inline(el)}</p>')
        elif el.tag in ('ul', 'ol') and not el.xpath('ancestor::ul|ancestor::ol'):
            items = ''.join(f'<li>{inline(li)}</li>' for li in el.findall('li'))
            out.append(f'<{el.tag}>{items}</{el.tag}>')
    return out


def flow(nodes):
    """direct children (p / ul / ol / h*) of a panel or cell as DA markup; bare text and inline nodes become a <p>"""
    out, buf = [], []

    def flush():
        s = re.sub(r'\s+', ' ', ''.join(buf)).strip()
        if s:
            out.append(f'<p>{s}</p>')
        buf.clear()

    for n in nodes:
        if isinstance(n, str):
            buf.append(esc(n))
            continue
        if n.tag in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            flush()
            if text(n):
                out.append(f'<{n.tag}>{inline(n)}</{n.tag}>')
        elif n.tag in ('ul', 'ol'):
            flush()
            items = ''.join(f'<li>{inline(li)}</li>' for li in n.findall('li'))
            out.append(f'<{n.tag}>{items}</{n.tag}>')
        else:
            buf.append(inline_one(n))
        if n.tail and n.tail.strip():
            buf.append(esc(n.tail))
    flush()
    return out


def inline_one(n):
    """one inline element (with its edge whitespace kept outside the tag)"""
    box = LH.fragment_fromstring('<span></span>')
    box.append(LH.fragment_fromstring(LH.tostring(n, encoding='unicode', with_tail=False)))
    return inline(box, False)


def children(el):
    """text + element children of el, in order"""
    out = []
    if el.text and el.text.strip():
        out.append(el.text)
    for c in el:
        if isinstance(c.tag, str):
            out.append(c)
    return out


def block(name, rows):
    out = [f'<div class="{name}">']
    for r in rows:
        out.append('<div>' + ''.join(f'<div>{c}</div>' for c in r) + '</div>')
    out.append('</div>')
    return '\n'.join(out)


wrap = doc.xpath('//main//*[contains(concat(" ", normalize-space(@class), " "), " co-wrap ")]')
root = wrap[0] if wrap else doc.xpath('//main')[0]
SECS = root.xpath('./section')

# tab groups: the tab links name the section that starts each group
TABS = []
for sec in SECS:
    if 'co-tabs-section' in cls(sec):
        TABS = [x.get('href', '')[1:] for x in sec.iter('a') if x.get('href', '').startswith('#')]
# in-page anchors -> the EDS id of the target section's first heading
for sec in SECS:
    sid = sec.get('id')
    h = sec.xpath('.//h1|.//h2|.//h3')
    if sid and h and text(h[0]):
        ANCHOR[sid] = slug(text(h[0]))


def teaser_rows(sec):
    txt = has(sec, 'co-txt')
    med = has(sec, 'co-media')
    im = real_img(med[0]) if med else None
    media = img(im) if im is not None else ''
    play = sec.xpath('.//*[@data-wistia]')
    vid = []
    if play:
        # the player link rides in the text cell (an embed URL alone in a cell reads as an un-autoblocked embed)
        vid = [f'<p><a href="https://fast.wistia.net/embed/iframe/{play[0].get("data-wistia")}">{esc(play[0].get("aria-label") or "Play video")}</a></p>']
    return [''.join(prose(txt[0]) + ctas(txt[0]) + vid), media]


def acc_rows(acc):
    rows = []
    for det in acc.xpath('./details'):
        title = det.xpath('./summary')[0]
        h = title.xpath('.//h3|.//h4')
        head = f'<h3>{inline(h[0] if h else title)}</h3>'
        pan = has(det, 'co-acc__panel')
        lead, tail, trows, seen_table = [], [], [], False
        for n in children(pan[0]) if pan else []:
            if not isinstance(n, str) and n.tag == 'table':
                seen_table = True
                for tr in n.xpath('.//tr'):
                    trows.append([''.join(flow(children(td))) for td in tr.xpath('./td|./th')])
            elif seen_table:
                tail.extend(flow([n]))
            else:
                lead.extend(flow([n]))
        rows.append([head, ''.join(lead)])
        rows.extend(trows)
        rows.extend([[t] for t in tail])
    return rows


S = []
i = 0
while i < len(SECS):
    sec = SECS[i]
    nxt = SECS[i + 1] if i + 1 < len(SECS) else None
    sc = cls(sec)
    car = has(sec, 'co-car')
    promo = has(sec, 'co-promo')
    row = has(sec, 'co-row')
    acc = has(sec, 'co-acc')
    if car and 'co-car--desc' in cls(car[0]):
        head = has(sec, 'co-head__col')
        parts = prose(head[0]) if head else []
        rows = []
        for card in has(car[0], 'co-card'):
            im = real_img(card)
            t = has(card, 'co-card__title')
            d = has(card, 'co-card__desc')
            ln = has(card, 'co-card__link')
            cell = (f'<h3>{inline(t[0])}</h3>' if t else '') + (f'<p>{inline(d[0])}</p>' if d else '')
            if ln:
                cell += f'<p><a href="{html.escape(absu(ln[0].get("href", "")))}">{inline(ln[0])}</a></p>'
            rows.append([img(im) if im is not None else '', cell])
        S.append('\n'.join(parts + [block('co-cards', rows)]))
    elif car:
        head = has(sec, 'co-head__col')
        parts = (prose(head[0]) + ctas(head[0])) if head else []
        rows = []
        for sl in has(car[0], 'co-car__slide'):
            im = real_img(sl)
            t = has(sl, 'co-card__title')
            k = has(sl, 'co-card__kind')
            card = sl.xpath('.//a[contains(concat(" ", normalize-space(@class), " "), " co-card ")]')
            title = inline(t[0]) if t else ''
            href = card[0].get('href') if card else None
            cell = ''
            if k and text(k[0]):
                cell += f'<p>{inline(k[0])}</p>'
            cell += f'<p><a href="{html.escape(absu(href))}">{title}</a></p>' if href else f'<p>{title}</p>'
            rows.append([img(im) if im is not None else '', cell])
        S.append('\n'.join(parts + [block('co-carousel', rows)]))
    elif promo:
        S.append(block('co-promo', [[''.join(prose(promo[0]) + ctas(promo[0]))]]))
    elif 'co-cta' in sc:
        name = 'co-cta lg' if ('co-cta--lg' in sc or a.cta_lg) else 'co-cta'
        S.append(block(name, [[''.join(prose(sec) + ctas(sec))]]))
    elif 'co-tabs-section' in sc:
        icons = [x for x in a.tab_icons.split(',') if x]
        S.append(block('co-tabs', [[f'<p>:{icons[k]}:</p>' if k < len(icons) else '',
                                    f'<p><a href="{html.escape(absu(x.get("href", "")))}">{inline(x)}</a></p>']
                                   for k, x in enumerate(sec.iter('a'))]))
    elif row and nxt is not None and has(nxt, 'co-acc') and not nxt.xpath('./div/h2'):
        # teaser that heads the following accordion (live: one section, text 6/12 + media 5/12, accordion below)
        txt, media = teaser_rows(sec)
        lead = sec.get('id') in TABS
        rows = acc_rows(has(nxt, 'co-acc')[0])
        S.append('\n'.join([txt + media, block('co-accordion lead' if lead else 'co-accordion', rows)]))
        i += 1
    elif row:
        med = has(sec, 'co-media')
        variants = []
        if 'co-hero' in sc:
            variants.append('hero')
        if med and 'co-media--l' in cls(med[0]):
            variants.append('reverse')
        if med and 'co-media--video' in cls(med[0]):
            variants.append('video')
        rows = [teaser_rows(sec)]
        if nxt is not None and 'co-card-row' in cls(nxt):
            rows.append([''.join(prose(nxt))])
            i += 1
        S.append(block(' '.join(['co-teaser'] + variants), rows))
    elif acc:
        box = sec.xpath('./div')[0]
        before, after, seen = [], [], False
        for n in box:
            if n is acc[0]:
                seen = True
                continue
            part = (prose(n) + ctas(n)) if n.tag == 'div' else flow([n])
            (after if seen else before).extend(part)
        lead = sec.get('id') in TABS
        out = before + [block('co-accordion lead' if lead else 'co-accordion', acc_rows(acc[0]))] + after
        S.append('\n'.join(out))
    elif has(sec, 'co-logos'):
        logos = has(sec, 'co-logos')[0]
        S.append('\n'.join(prose(sec, skip=[logos]) + [block('co-logos', [[img(im)] for im in logos.iter('img')
                                                                           if 'co-ii__sizer' not in cls(im)])]))
    elif has(sec, 'co-stats'):
        box = sec.xpath('./div')[0]
        stats = has(sec, 'co-stats')[0]
        h2 = box.xpath('./h2')
        lists = box.xpath('./ul|./ol')
        body = [n for n in box if n.tag == 'p']
        rows = [[f'<h2>{inline(h2[0])}</h2>' if h2 else '', ''.join(flow(lists))]]
        if body:
            rows.append([''.join(flow(body))])
        for st in has(stats, 'co-stat'):
            ps = st.findall('p')
            rows.append([f'<p>{inline(ps[0])}</p>', f'<p>{inline(ps[1])}</p>' if len(ps) > 1 else ''])
        S.append(block('co-stats', rows))
    elif 'co-legacy' in sc:
        box = sec.xpath('./div')[0]
        head, cols = [], []
        for n in box:
            if n.tag == 'h2':
                head.append(f'<h2>{inline(n)}</h2>')
            elif n.tag == 'h3':
                cols.append([f'<h3>{inline(n)}</h3>'])
            elif cols:
                cols[-1].extend(flow([n]))
        S.append('\n'.join(head + [block('co-linklist legacy', [[''.join(c)] for c in cols])]))
    else:
        # unknown composition: keep its prose + CTAs as default content (flag it in the unit report)
        S.append('\n'.join(prose(sec) + ctas(sec)))
    i += 1

md = meta.get('metadata', {})
mrows = [('Title', md.get('title', '')), ('Description', md.get('description', '')),
         ('Canonical', md.get('canonical', '')), ('promo', 'off')]
for kv in a.meta_row:
    k, v = kv.split('=', 1)
    mrows.append((k, v))
S.append(block('metadata', [[esc(k), esc(v)] for k, v in mrows if v]))



def restore_nbsp(markup):
    """re-join the word pairs the live page joins with U+00A0 (they set the table/column min-content widths)"""
    cap = a.capture or f'stardust/current/pages/{a.scope}.html'
    if not os.path.exists(cap):
        return markup
    cdoc = LH.fromstring(open(cap, encoding='utf-8').read())
    croot = cdoc.xpath('//main') or [cdoc]
    flat = re.sub(r'[ \t\n\r\f\v]+', ' ', ''.join(croot[0].itertext()))
    pairs = set()
    for m in re.finditer('\u00a0', flat):
        left = re.split('[ \u00a0]', flat[max(0, m.start() - 60):m.start()].strip(' '))
        right = re.split('[ \u00a0]', flat[m.end():m.end() + 60].lstrip(' '))
        if len(left) >= 2 and left[-1] and right and right[0]:
            # only a word prefix anchors the right side (block texts run together in the flat capture text)
            w2 = re.match(r"[\w@\-\u2019']*", right[0]).group(0)
            if w2:
                pairs.add((left[-2], left[-1], w2))
    sep = '[ \u00a0]'
    for w0, w1, w2 in sorted(pairs):
        e = lambda w: re.escape(html.escape(w, quote=False))  # noqa: E731
        pat = re.compile('(' + e(w0) + sep + '(?:<[^>]+>)*' + e(w1) + ') ((?:<(?:a|strong|em)\\b[^>]*>)*)(?=' + e(w2) + ')')
        markup = pat.sub(lambda m: m.group(1) + '\u00a0' + m.group(2), markup)
    return markup


S = [restore_nbsp(x) for x in S[:-1]] + S[-1:]
body = '<body>\n<header></header>\n<main>\n' + ''.join(f'<div>\n{s}\n</div>\n' for s in S) + '</main>\n<footer></footer>\n</body>\n'
os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
open(a.out, 'w', encoding='utf-8').write(body)
print(f'encode: {a.out} — {len(S) - 1} section(s)')
