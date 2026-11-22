#!/usr/bin/env python3
"""sibling-static builder: hydrated capture -> encoder-ready sibling render (Path A') for the `static` template.

Forks the gated archetype prototype stardust/prototypes/company-proposed.html (head, canon header/footer,
scripts and the co- module vocabulary the archetype encoder stardust/rollout/encoders/archetype-static/encode.py
reads: main .co-wrap > section, co-hero/co-row/co-txt/co-media teasers, .co-car carousel, .co-promo,
section.co-cta) and injects one page's content VERBATIM from its hydrated capture
stardust/current/pages/<slug>.html (+ <slug>.json for image sizes).

Section mapping (live AEM component -> closest co- module; anything without a co- module is carried as a
plain section, which the archetype encoder emits as default content):
  Base section with an h1                         -> section.co-hero  (co-row: co-txt | co-media)
  Base section whose head has an image            -> co-row teaser (co-media--r), accordion/rest split off
  last top-level section with button CTAs         -> section.co-cta   (variant co-cta--lg when the live h2 is display-size)
  Base section with >= 2 image Cards              -> .co-car carousel (variant co-car--desc: card body + link kept)
  Base section with a VideoLink                   -> co-row teaser with a play button over the media (variant co-media--video)
  Accordion                                       -> plain section, <details class="co-acc__item"> per item (no co- module)
  tab bar (link-block anchors)                    -> plain section, ul.co-tabs list of in-page links (no co- module)
  logo wall (images only)                         -> plain section, .co-logos (no co- module)
  everything else (text, tables, lists, stats)    -> plain section, default content
Sections the page lacks are omitted; nothing is padded.

Usage (run from the project root):
  python3 -I stardust/rollout/encoders/sibling-static/build.py <slug>... \
      [--out-dir stardust/.work/render/static] [--assets-dir stardust/migrated/assets] [--no-download]
Per slug: <out-dir>/<slug>.html (migrate.mjs render --source) and <out-dir>/<slug>.build.json
(modules, variants, deviations, counts). Images go to <assets-dir>/<slug>/<file> and are referenced
as assets/<slug>/<file>. Idempotent. Exit 0 when every slug built, 1 otherwise.
"""
import html
import json
import mimetypes
import os
import re
import sys
import urllib.parse
import urllib.request

from lxml import html as LH

PROTO = 'stardust/prototypes/company-proposed.html'
CURRENT = 'stardust/current/pages'
HEADS = ('h1', 'h2', 'h3', 'h4', 'h5', 'h6')
INLINE_KEEP = ('strong', 'b', 'em', 'i', 'sup', 'sub', 'u', 'code', 's', 'small')
SKIP = ('script', 'style', 'noscript', 'svg', 'template', 'link', 'meta', 'button')
EXT = {'image/avif': '.avif', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
       'image/svg+xml': '.svg', 'image/gif': '.gif'}


def esc(s):
    return html.escape(s or '', quote=False)


def attr(s):
    return html.escape(s or '', quote=True)


def norm_ws(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def aem(el):
    return el.get('data-aem-id') or el.get('data-garden-id') or ''


def tag(el):
    return el.tag.lower() if isinstance(el.tag, str) else ''


class Page:
    def __init__(self, slug, assets_dir, download):
        self.slug, self.assets_dir, self.download = slug, assets_dir, download
        self.variants, self.deviations, self.modules = [], [], []
        self.names, self.sizes, self.missing = {}, {}, []

    def variant(self, v):
        if v not in self.variants:
            self.variants.append(v)

    def module(self, m):
        if m not in self.modules:
            self.modules.append(m)

    def deviation(self, kind, source, target, reason):
        self.deviations.append({'kind': kind, 'source': source, 'target': target, 'reason': reason})

    # ------------------------------------------------------------------ images
    def local(self, src):
        if src in self.names:
            return self.names[src]
        path = urllib.parse.urlparse(src.strip()).path
        base = re.sub(r'[^A-Za-z0-9._-]+', '-', urllib.parse.unquote(os.path.basename(path)) or 'image')
        stem, ext = os.path.splitext(base)
        d = os.path.join(self.assets_dir, self.slug)
        existing = [f for f in (os.listdir(d) if os.path.isdir(d) else []) if os.path.splitext(f)[0] == (stem if ext else base)]
        taken = {v.rsplit('/', 1)[-1] for v in self.names.values()}
        if existing and existing[0] not in taken:
            self.names[src] = f'assets/{self.slug}/{existing[0]}'
            return self.names[src]
        if not self.download:
            self.missing.append(src)
            self.names[src] = src
            return src
        try:
            req = urllib.request.Request(urllib.parse.quote(src.strip(), safe=':/?&=%+#~$,;'),
                                         headers={'User-Agent': 'Mozilla/5.0 stardust-sibling-builder',
                                                  'Accept': 'image/avif,image/webp,image/png,image/*'})
            with urllib.request.urlopen(req, timeout=60) as r:
                data, ctype = r.read(), (r.headers.get('Content-Type') or '').split(';')[0].strip()
        except Exception as e:  # keep the remote URL; logged, never silently dropped
            self.missing.append(f'{src} ({e})')
            self.names[src] = src
            return src
        if not ext:
            ext = EXT.get(ctype) or mimetypes.guess_extension(ctype) or '.img'
            base = stem + ext
        name, n = base, 1
        while name in taken:
            n += 1
            name = f'{stem}-{n}{ext}'
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, name), 'wb') as fh:
            fh.write(data)
        self.names[src] = f'assets/{self.slug}/{name}'
        return self.names[src]

    def co_img(self, el, mod=''):
        """prototype image shape: span.co-ii > sizer + real img"""
        src = (el.get('src') or '').strip()
        w, h = self.sizes.get(src, (None, None))
        sizer = ''
        if w and h:
            sizer = ('<img class="co-ii__sizer" alt="" aria-hidden="true" src="data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27'
                     f'%20version=%271.1%27%20width=%27{w}%27%20height=%27{h}%27/%3e">')
        dims = f' width="{w}" height="{h}"' if w and h else ''
        return (f'<span class="co-ii{(" " + mod) if mod else ""}">{sizer}'
                f'<img src="{attr(self.local(src))}" alt="{attr(el.get("alt") or "")}"{dims}></span>')

    # ------------------------------------------------------------------ inline (verbatim)
    def inline(self, el):
        return self._inline(el).strip()

    def one(self, c):
        """one inline element as markup (no tail)"""
        t = tag(c)
        if t == 'a':
            a = f'<a href="{attr(c.get("href"))}"'
            if c.get('target'):
                a += f' target="{attr(c.get("target"))}"'
            if c.get('rel'):
                a += f' rel="{attr(c.get("rel"))}"'
            return a + '>' + self._inline(c).strip() + '</a>'
        if t in INLINE_KEEP:
            return f'<{t}>{self._inline(c)}</{t}>'
        if t == 'br':
            return '<br>'
        if t == 'img':
            return f'<img src="{attr(self.local(c.get("src").strip()))}" alt="{attr(c.get("alt") or "")}">' if real_img(c) else ''
        if t and t not in SKIP:
            return self._inline(c)
        return ''

    def _inline(self, el):
        out = [esc(el.text)]
        for c in el:
            out.append(self.one(c))
            out.append(esc(c.tail))
        return re.sub(r'\s+', ' ', ''.join(out))


def real_img(el):
    src = (el.get('src') or '').strip()
    return bool(src) and not src.startswith(('data:', 'blob:')) and not el.xpath('ancestor::noscript')


def is_btn(a):
    return (a.get('data-interaction-type') or '').startswith('button')


def has_block_child(el):
    return any(tag(c) in HEADS + ('p', 'ul', 'ol', 'table', 'div', 'blockquote') for c in el)


# ---------------------------------------------------------------------- generic block serializer
def is_inline(c):
    t = tag(c)
    if t == 'a':
        return not is_btn(c)
    if t in INLINE_KEEP or t == 'br':
        return True
    if t == 'span':
        return not c.xpath('.//*[self::p or self::div or self::ul or self::ol or self::table or self::h1 or self::h2 or self::h3 or self::h4 or self::img]')
    return False


def nodes(pg, el, out):
    """walk a capture subtree in order -> list of (kind, html, el); kinds: h, text, btn, img, acc, stats, raw.
    Mixed content (text + inline elements between blocks) is kept as one <p> per run."""
    buf = [esc(el.text)] if tag(el) not in SKIP else []

    def flush():
        h = re.sub(r'\s+', ' ', ''.join(buf)).strip()
        if re.sub(r'<[^>]+>', '', h).strip() or '<img' in h:
            out.append(('text', f'<p>{h}</p>', el))
        buf.clear()
    for c in el:
        t = tag(c)
        a = aem(c)
        if is_inline(c):
            buf.append(pg.one(c))
            buf.append(esc(c.tail))
            continue
        flush()
        if not t or t in SKIP:
            pass
        elif t in HEADS:
            txt = pg.inline(c)
            if norm_ws(c.text_content()):
                out.append(('h', f'<{t}{id_attr(c)}>{txt}</{t}>', c))
            else:
                pg.deviation('drop-empty', f'<{t} id="{c.get("id") or ""}"> (empty)', 'omitted', 'empty heading node in the source (no text)')
        elif t == 'p':
            if norm_ws(c.text_content()) or c.xpath('.//img'):
                out.append(('text', f'<p>{pg.inline(c)}</p>', c))
        elif t in ('ul', 'ol'):
            lis = []
            for li in c.findall('li'):
                if any(tag(x) in ('p', 'ul', 'ol', 'table') for x in li):
                    sub = []
                    nodes(pg, li, sub)
                    lis.append('<li>' + ''.join(h for _, h, _ in sub) + '</li>')
                else:
                    lis.append(f'<li>{pg.inline(li)}</li>')
            out.append(('text', f'<{t}>' + ''.join(lis) + f'</{t}>', c))
        elif t == 'table':
            rows = []
            for tr in c.xpath('.//tr'):
                cells = []
                for td in tr.xpath('./td|./th'):
                    ct = tag(td)
                    if has_block_child(td):
                        sub = []
                        nodes(pg, td, sub)
                        cells.append(f'<{ct}>' + ''.join(h for _, h, _ in sub) + f'</{ct}>')
                    else:
                        cells.append(f'<{ct}>{pg.inline(td)}</{ct}>')
                rows.append('<tr>' + ''.join(cells) + '</tr>')
            out.append(('text', '<table class="co-table"><tbody>' + ''.join(rows) + '</tbody></table>', c))
        elif t == 'a':
            label = pg.inline(c)
            if not norm_ws(c.text_content()):
                continue
            if is_btn(c):
                kind = 'secondary' if 'secondary' in c.get('data-interaction-type') else 'primary'
                out.append(('btn', f'<a class="za-btn za-btn--{kind} za-btn--block-sm" href="{attr(c.get("href"))}"><span><span>{label}</span></span></a>', c))
            else:
                out.append(('text', f'<p><a href="{attr(c.get("href"))}">{label}</a></p>', c))
        elif t == 'img':
            if real_img(c):
                out.append(('img', pg.co_img(c), c))
        elif a == 'aem.components.Accordion':
            out.append(('acc', accordion(pg, c), c))
        elif a == 'aem.components.Stats':
            items = []
            for st in c.xpath('./div'):
                ps = [f'<p>{pg.inline(p)}</p>' for p in st.xpath('.//p') if norm_ws(p.text_content())]
                items.append('<div class="co-stat">' + ''.join(ps) + '</div>')
            out.append(('stats', '<div class="co-stats">' + ''.join(items) + '</div>', c))
        else:
            nodes(pg, c, out)
        buf.append(esc(c.tail))
    flush()
    return out


def id_attr(el):
    i = el.get('id') or ''
    return f' id="{attr(i)}"' if i and not i.startswith(('title-', 'heading-', 'text-', ':')) else ''


def accordion(pg, acc):
    items = []
    for sec in acc.xpath('.//*[@data-garden-id="accordions.section"]'):
        h = sec.xpath('.//*[@data-garden-id="accordions.header"]//*[self::h2 or self::h3 or self::h4]')
        head = (f'<{tag(h[0])}>{pg.inline(h[0])}</{tag(h[0])}>' if h else '')
        if not h:
            b = sec.xpath('.//*[@data-garden-id="accordions.header"]//button')
            head = f'<h3>{esc(norm_ws(b[0].text_content()))}</h3>' if b else ''
            pg.deviation('accordion-trigger', 'accordion trigger without heading', 'h3', 'trigger label carried as h3')
        panel = sec.xpath('.//*[@data-garden-id="accordions.panel"]')
        body = []
        if panel:
            nodes(pg, panel[0], body)
        items.append('<details class="co-acc__item"><summary class="co-acc__trigger">' + head + '</summary>'
                     '<div class="co-acc__panel">' + ''.join(x for _, x, _ in body) + '</div></details>')
    pg.module('accordion')
    return '<div class="co-acc">' + ''.join(items) + '</div>'


# ---------------------------------------------------------------------- co- module layouts
def txt_col(items):
    """headings direct, paragraphs/lists in .za-text.co-text, buttons in .co-links (prototype co-txt shape)"""
    out, buf, btns = [], [], []

    def flush():
        if buf:
            out.append('<div class="za-text co-text">' + ''.join(buf) + '</div>')
            buf.clear()
        if btns:
            out.append('<div class="co-links">' + ''.join(btns) + '</div>')
            btns.clear()
    for k, h, _ in items:
        if k == 'h':
            flush()
            out.append(h)
        elif k == 'btn':
            if buf:
                out.append('<div class="za-text co-text">' + ''.join(buf) + '</div>')
                buf.clear()
            btns.append(h)
        else:
            if btns:
                flush()
            buf.append(h)
    flush()
    return ''.join(out)


def sec_id(el):
    i = el.get('id') or ''
    return f' id="{attr(i)}"' if i else ''


def row_section(sid, cls, items, media, extra=''):
    glow = '<div class="co-hero__glow"></div>' if 'co-hero' in cls else ''
    rel = ' co-rel' if 'co-hero' in cls else ''
    return (f'<section{sid} class="za-section{(" " + cls) if cls else ""}">\n  {glow}<div class="za-container{rel}">'
            f'<div class="za-row co-row"><div class="za-col co-txt co-txt--l">{txt_col(items)}</div>'
            f'<div class="za-col co-media co-media--r{(" " + extra) if extra else ""}">{media}</div></div></div>\n</section>\n')


def plain_section(sid, items, cls=''):
    body = []
    for k, h, _ in items:
        if k == 'btn':
            body.append(f'<div class="co-links">{h}</div>')
        elif k == 'img':
            body.append(f'<p>{h}</p>')
        else:
            body.append(h)
    return (f'<section{sid} class="za-section{(" " + cls) if cls else ""}">\n  <div class="za-container">'
            + ''.join(body) + '</div>\n</section>\n')


def cta_section(pg, sec, items, large):
    hs = [h for k, h, _ in items if k == 'h']
    btns = [h for k, h, _ in items if k == 'btn']
    rest = [h for k, h, _ in items if k not in ('h', 'btn')]
    h2 = re.sub(r'^<h2', '<h2 class="co-cta__h"', hs[0]) if hs else ''
    cls = 'za-section co-cta' + (' co-cta--lg' if large else '')
    if large:
        pg.variant('co-cta--lg')
    pg.module('co-cta')
    return (f'<section{sec_id(sec)} class="{cls}">\n  <div class="co-cta__glow"></div>\n  <div class="za-container co-rel">'
            f'<div class="za-row co-head"><div class="za-col co-head__col">{h2}{"".join(hs[1:])}{"".join(rest)}'
            f'<div class="co-links co-links--c">{"".join(btns)}</div></div></div></div>\n</section>\n')


def carousel_section(pg, sec, head_items, cards):
    slides = []
    for n, card in enumerate(cards, 1):
        im = next((i for i in card.xpath('.//img') if real_img(i)), None)
        sub = []
        nodes(pg, card, sub)
        title = next((h for k, h, _ in sub if k == 'h'), '')
        title = re.sub(r'^<(h\d)([^>]*)>', r'<\1\2 class="co-card__title">', title)
        rest = [h for k, h, _ in sub if k not in ('h', 'img')]
        desc = [re.sub(r'^<p>', '<p class="co-card__desc">', h, count=1) if 'href' not in h else
                re.sub(r'^<p><a ', '<p class="co-card__cta"><a class="co-card__link" ', h, count=1) for h in rest]
        slides.append(f'<div class="co-car__slide" role="group" aria-roledescription="slide" aria-label="{n} of {len(cards)}">'
                      f'<div class="co-card co-card--desc">{pg.co_img(im, "co-ii--card") if im is not None else ""}'
                      f'<div class="co-card__content">{title}{"".join(desc)}</div></div></div>')
    pg.variant('co-car--desc')
    pg.module('co-carousel')
    return (f'<section{sec_id(sec)} class="za-section">\n  <div class="za-container za-row-gap">'
            f'<div class="za-row co-head"><div class="za-col co-head__col">{txt_col(head_items)}</div></div>'
            f'<div class="co-grid"><div class="co-car co-car--desc"><div class="co-car__list"><div class="co-car__track">'
            + ''.join(slides) + '</div></div></div></div></div>\n</section>\n')


def split_head(pg, sec):
    """a Base section -> (head items before the first accordion/card grid, rest items)"""
    items = []
    nodes(pg, sec, items)
    for i, (k, _, _) in enumerate(items):
        if k in ('acc',):
            return items[:i], items[i:]
    return items, []


def build_base(pg, sec, sid_override=None, *, last=False):
    """one live Base section -> one or more co-wrap sections"""
    sid = f' id="{attr(sid_override)}"' if sid_override else sec_id(sec)
    cards = [c for c in sec.xpath('.//*[@data-aem-id="aem.components.Card"]')
             if any(real_img(i) for i in c.xpath('.//img'))]
    video = sec.xpath('.//*[@data-aem-id="aem.components.VideoLink"]')
    if sec.xpath('.//h1'):
        items = []
        nodes(pg, sec, items)
        imgs = [x for x in items if x[0] == 'img']
        pg.module('co-teaser')
        return row_section(sid, 'co-hero', [x for x in items if x[0] != 'img'], imgs[0][1] if imgs else '')
    if last and sec.xpath('.//a[starts-with(@data-interaction-type,"button")]') and not sec.xpath('.//img[not(starts-with(@src,"data:"))]'):
        items = []
        nodes(pg, sec, items)
        return cta_section(pg, sec, items, large=pg.cta_large)
    if len(cards) >= 2:
        all_items = []
        nodes(pg, sec, all_items)
        card_els = set()
        for c in cards:
            card_els.update(c.iter())
        head = [x for x in all_items if x[2] not in card_els]
        return carousel_section(pg, sec, head, cards)
    if video:
        items = []
        nodes(pg, sec, items)
        vl = video[0]
        vids = set(vl.iter())
        im = next((i for i in vl.xpath('.//img') if real_img(i)), None)
        play = vl.xpath('.//button[@aria-label]')
        wid = re.search(r'wistia-([a-z0-9]+)', ' '.join(x.get('id') or '' for x in vl.iter() if isinstance(x.tag, str)))
        btn = (f'<button class="co-play" type="button" aria-label="{attr(play[0].get("aria-label"))}"'
               f'{(" data-wistia=" + chr(34) + wid.group(1) + chr(34)) if wid else ""}></button>') if play else ''
        media = (pg.co_img(im) if im is not None else '') + btn
        card = [c for c in sec.xpath('.//*[@data-aem-id="aem.components.Card"]')]
        card_els = set()
        for c in card:
            card_els.update(c.iter())
        head = [x for x in items if x[2] not in vids and x[2] not in card_els]
        tail = [x for x in items if x[2] in card_els]
        pg.variant('co-media--video')
        pg.module('co-teaser')
        pg.deviation('video', f'Wistia video {wid.group(1) if wid else "?"} (VideoLink play overlay)',
                     'thumbnail + button.co-play[data-wistia]', 'co-teaser has no video slot; thumbnail kept as the media image, player id kept on the play button')
        out = row_section(sid, '', head, media, 'co-media--video')
        if tail:
            out += plain_section('', tail, 'co-card-row')
            pg.deviation('section-split', 'Card under the video teaser (same live section)', 'own plain section after the co-teaser',
                         'co-teaser row has two cells; the card is carried in order as default content')
        return out
    head, rest = split_head(pg, sec)
    imgs = [x for x in head if x[0] == 'img']
    logos = [x for x in head if x[0] == 'img' and (x[2].get('alt') or '')]
    if imgs and len(imgs) >= 3 and not [x for x in head if x[0] == 'text']:
        body = [x for x in head if x[0] != 'img']
        wall = '<div class="co-logos">' + ''.join(h for k, h, _ in head if k == 'img') + '</div>'
        pg.variant('co-logos')
        pg.deviation('module', f'logo wall ({len(imgs)} logos)', 'plain section .co-logos (default content)',
                     'no co- logo module in the archetype; images carried in order')
        return plain_section(sid, body + [('raw', wall, None)] + rest)
    if imgs:
        pg.module('co-teaser')
        out = row_section(sid, '', [x for x in head if x[0] != 'img'], imgs[0][1])
        if len(imgs) > 1:
            pg.deviation('media', f'{len(imgs) - 1} extra head image(s)', 'dropped', 'co-teaser has one media cell')
        if rest:
            out += plain_section('', rest, 'co-acc-section')
            pg.deviation('section-split', f'accordion under teaser "{norm_ws(sec.xpath(".//h2")[0].text_content()) if sec.xpath(".//h2") else ""}"',
                         'own plain section after the co-teaser', 'co-teaser row has two cells; the accordion follows in order')
        return out
    cls = 'co-acc-section' if rest else ''
    return plain_section(sid, head + rest, cls)


def head_from_capture(proto_head, cap):
    cap_head = cap.xpath('//head')[0]

    def cap_meta(kind, key):
        m = cap_head.xpath(f'.//meta[@{kind}="{key}"]/@content')
        return m[0] if m else None
    out = []
    for line in proto_head.split('\n'):
        m = re.match(r'(\s*)<meta (name|property)="([^"]+)" content="[^"]*">', line)
        if m and m.group(3) not in ('viewport',):
            v = cap_meta(m.group(2), m.group(3))
            if v is None:
                continue
            line = f'{m.group(1)}<meta {m.group(2)}="{m.group(3)}" content="{attr(v)}">'
        elif line.strip().startswith('<title>'):
            t = cap_head.xpath('.//title')
            line = f'<title>{esc(norm_ws(t[0].text_content()))}</title>' if t else line
        elif line.strip().startswith('<link rel="canonical"'):
            c = cap_head.xpath('.//link[@rel="canonical"]/@href')
            if not c:
                continue
            line = f'<link rel="canonical" href="{attr(c[0])}">'
        out.append(line)
    return '\n'.join(out)


def counts_main(main):
    """role-classified counts (same rules both sides). Accordion triggers (button wrapping the item heading)
    are UI chrome around the heading, not CTAs, so they are excluded on both sides."""
    def vt(e):
        return norm_ws(e.text_content())
    heads = [h for h in main.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6') if vt(h)]
    body = [e for e in main.xpath('.//p|.//li|.//blockquote|.//td')
            if vt(e) and not e.xpath('ancestor::*[self::p or self::li or self::blockquote]')
            and not (tag(e) == 'td' and e.xpath('.//p|.//li'))]
    links = [a for a in main.xpath('.//a[@href]') if vt(a) or a.xpath('.//img')]
    btns = [b for b in main.xpath('.//button') if not b.xpath('.//h1|.//h2|.//h3|.//h4')
            and (vt(b) or b.get('aria-label')) and not re.match(r'(Previous|Next)$', vt(b))]
    hrefs = sorted({a.get('href') for a in links})
    imgs = [i for i in main.xpath('.//img') if real_img(i) and 'co-ii__sizer' not in (i.get('class') or '')]
    return {'headings': len(heads), 'body': len(body), 'ctas': len(links) + len(btns), 'hrefs': len(hrefs),
            'images': len(imgs),
            'words': len(norm_ws(' '.join(main.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::noscript) and not(ancestor::svg)]'))).split())}


def build(slug, out_dir, assets_dir, download):
    proto = open(PROTO, encoding='utf-8').read()
    cap_path = os.path.join(CURRENT, f'{slug}.html')
    cap = LH.parse(cap_path).getroot()
    pg = Page(slug, assets_dir, download)
    cj = json.load(open(os.path.join(CURRENT, f'{slug}.json'), encoding='utf-8'))
    for m in (cj.get('media') or {}).get('imgs') or []:
        if m.get('src') and m.get('w') and m.get('h'):
            pg.sizes[m['src'].strip()] = (m['w'], m['h'])
    vpath = os.path.join(out_dir, 'variance.json')
    pg.cta_large = False
    legacy = None
    if os.path.exists(vpath):
        v = json.load(open(vpath, encoding='utf-8'))
        for s in v.get('siblings', []):
            if s.get('url') == cj.get('url'):
                cta = (s.get('raw', {}).get('probes', {}).get('cta') or {})
                f = cta.get('first') or {}
                pg.cta_large = cta.get('count') == 1 and bool(re.search(r'^h2 \S+ sans (6\d|7\d)px', f.get('heading') or ''))
                hero = (s.get('raw', {}).get('probes', {}).get('hero') or {}).get('first') or {}
                if 'vanilla' not in (hero.get('font') or 'vanilla'):
                    legacy = f"{hero.get('font')}; heading {hero.get('heading')}; padding {hero.get('padding')}"
    main = cap.xpath('//main')[0]
    top = main.xpath('.//section[not(ancestor::section)]')
    parts = []
    for i, sec in enumerate(top):
        nested = sec.xpath('.//section[@data-aem-id="aem.components.Base"]')
        if nested:  # tab container: tab bar + one block of Base sections per tab panel
            tabs = [a for a in sec.xpath('.//a[@data-interaction-type="link-block"]') if not a.xpath('ancestor::section[@data-aem-id="aem.components.Base"][ancestor::section]')]
            if tabs:
                lis = ''.join(f'<li><a href="{attr(a.get("href"))}">{pg.inline(a)}</a></li>' for a in tabs)
                parts.append(f'<section class="za-section co-tabs-section">\n  <div class="za-container"><ul class="co-tabs">{lis}</ul></div>\n</section>\n')
                pg.variant('co-tabs')
                pg.deviation('module', f'tab bar ({len(tabs)} tabs: {", ".join(norm_ws(a.text_content()) for a in tabs)})',
                             'ul.co-tabs list of in-page links + every panel rendered in order',
                             'no co- tabs module in the archetype; all panels stay in the DOM (live tabs only toggle visibility)')
            for b in nested:
                if len(b.xpath('ancestor::section')) != 1:
                    continue  # only the tab container's own Base sections; deeper ones are serialized by their parent
                panel = b.xpath('ancestor::*[@data-garden-id="grid.row"][@id][1]')
                first_in_panel = panel and b is panel[0].xpath('.//section[@data-aem-id="aem.components.Base"]')[0]
                sid = panel[0].get('id') if first_in_panel and (b.get('id') or '').startswith('teaser-') else None
                parts.append(build_base(pg, b, sid))
        else:
            parts.append(build_base(pg, sec, last=(i == len(top) - 1 and len(top) > 1)))
    if pg.modules and 'accordion' in pg.modules:
        pg.modules.remove('accordion')
        pg.deviation('module', 'Accordion items (live aem.components.Accordion)', 'plain section, details.co-acc__item per item',
                     'no co- accordion module in the archetype; carried as default content (encoder fallback) in order')
    if legacy:
        parts = [p.replace('class="za-section', 'class="za-section co-legacy', 1) for p in parts]
        pg.variant('co-legacy')
        pg.deviation('design', f'live page uses the legacy template family ({legacy})', 'section variant co-legacy on canon type',
                     'variance probe: different type family than the archetype; budgeted as a section variant class, not a fork')
    main_html = ('<main id="main-content" class="za-main co-main" lang="en-US">\n<div class="co-wrap">\n'
                 + ''.join(parts) + '</div>\n</main>')

    pre, rest = proto.split('<main', 1)
    post = rest.split('</main>', 1)[1]
    head_open, head_rest = pre.split('<head>', 1)
    head_inner, after_head = head_rest.split('</head>', 1)
    lang = cap.get('lang') or 'en-US'
    if lang.lower() not in ('en-us', 'en'):
        pg.deviation('chrome-locale', f'lang {lang}', 'en-US canon header/footer', 'archetype chrome is en-US')
    out = head_open + '<head>' + head_from_capture(head_inner, cap) + '</head>' + after_head + main_html + post

    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, f'{slug}.html')
    with open(dst, 'w', encoding='utf-8') as fh:
        fh.write(out)
    rmain = LH.fromstring(main_html)
    src_c, dst_c = counts_main(main), counts_main(rmain)
    for m in pg.missing:
        pg.deviation('media', m, 'remote URL kept', 'download failed or disabled')
    # heading-text census against the capture JSON (main-scoped headings only)
    rtext = norm_ws(rmain.text_content())
    lost = [h['text'] for h in cj.get('headings', []) if h.get('text') and norm_ws(h['text']) in norm_ws(main.text_content())
            and norm_ws(h['text']) not in rtext]
    report = {'slug': slug, 'source': cap_path, 'render': dst, 'modules': pg.modules, 'variants': pg.variants,
              'deviations': pg.deviations, 'counts': {'source': src_c, 'render': dst_c},
              'drops': {k: src_c[k] - dst_c[k] for k in src_c if k != 'words' and dst_c[k] < src_c[k]},
              'jsonHeadingsLost': lost, 'images': pg.names}
    with open(os.path.join(out_dir, f'{slug}.build.json'), 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)
    print(f'{slug}: {dst} modules={pg.modules} variants={pg.variants} deviations={len(pg.deviations)} '
          f'counts src={src_c} dst={dst_c} drops={report["drops"] or "none"} lostHeadings={len(lost)}')
    return report


def main_():
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if args else 2)
    out_dir, assets_dir, download, slugs = 'stardust/.work/render/static', 'stardust/migrated/assets', True, []
    i = 0
    while i < len(args):
        a = args[i]
        if a == '--out-dir':
            out_dir = args[i + 1]; i += 2; continue
        if a == '--assets-dir':
            assets_dir = args[i + 1]; i += 2; continue
        if a == '--no-download':
            download = False; i += 1; continue
        slugs.append(a); i += 1
    bad = 0
    for s in slugs:
        try:
            build(s, out_dir, assets_dir, download)
        except Exception as e:
            bad += 1
            import traceback
            traceback.print_exc()
            print(f'{s}: FAILED {e!r}', file=sys.stderr)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main_()
