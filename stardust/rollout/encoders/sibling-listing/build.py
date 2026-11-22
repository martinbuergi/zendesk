#!/usr/bin/env python3
"""sibling-listing builder: hydrated capture -> encoder-ready sibling render (Path A') for the
`listing` template (hubs and directories), archetype `blog`.

Forks the gated archetype prototype stardust/prototypes/blog-proposed.html (head, canon chrome
and the bl-* / hp-teaser template classes the archetype encoder
stardust/rollout/encoders/archetype-listing/encode.mjs reads) and injects one hub/directory page's
content VERBATIM from its hydrated capture stardust/current/pages/<slug>.html (decoded as UTF-8).

Hubs differ far more from the blog than article siblings do, so every top-level capture section is
carried with the CLOSEST archetype module, in source order, and logged:
  first section            -> bl-hero  (variants: hub = text hero with h1; directory = h2 head +
                              breadcrumbs; legacy = Basestyle family eyebrow + media; lead = featured story)
  card rows (no paging)    -> bl-listing > bl-group (variant grid: cards are a static grid, not a carousel)
  card rows + paging/more  -> bl-latest (variant filters when a filter column rides along)
  link lists               -> bl-guides (variant grouped when sub-headings split the list)
  heading + text + CTAs    -> hp-teaser (variant text-only when there is no image; pair = two promo cols)
  image-only logo strip    -> bl-group (variant logos)
  filter dropdowns         -> bl-filters  (NO archetype analogue: carried, declared as a deviation)
Marketplace-family pages (marketplace, marketplace-*) carry the source's marketplace sub-header in
the archetype bl-subnav slot (brand Marketplace + Apps/Connectors/Themes/Partners).

Usage (from the project root):
  python3 -I stardust/rollout/encoders/sibling-listing/build.py <slug>… \
      [--out-dir stardust/.work/render/listing] [--assets-dir stardust/migrated/assets] [--no-download]

Per slug it writes <out-dir>/<slug>.html (pass to migrate.mjs render --source <slug>=<file>) and
<out-dir>/<slug>.build.json: variants[], deviations[] (contentDeviations shape), modules[],
counts{source, render}, drops{}, words{missing, extra} (multiset diff capture main vs render main).
Images download to <assets-dir>/<slug>/<file> (render references assets/<slug>/<file>).
Idempotent. Exit 0 when every slug built with no uncovered word drop, 1 otherwise.
"""
import collections
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

from lxml import html as LH

PROTO = 'stardust/prototypes/blog-proposed.html'
CURRENT = 'stardust/current/pages'
SKIP = ('script', 'style', 'noscript', 'svg', 'template', 'iframe', 'link', 'meta')
HEADS = ('h1', 'h2', 'h3', 'h4', 'h5', 'h6')
EXT_SVG = ('<svg class="za-ext" xmlns="http://www.w3.org/2000/svg" width="12" height="12" focusable="false" viewBox="0 0 12 12" '
           'role="img" aria-label="(opens in a new tab)"><path fill="none" stroke="currentColor" stroke-linecap="round" '
           'd="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>')
MARKET_NAV = ['/marketplace/', '/marketplace/apps/', '/marketplace/connectors/', '/marketplace/themes/', '/marketplace/partners/']


def esc(s):
    return html.escape(s or '', quote=False)


def attr(s):
    return html.escape(s or '', quote=True)


def cls(el):
    return el.get('class') or '' if isinstance(el.tag, str) else ''


def has(el, frag):
    return frag in cls(el)


def tag(el):
    return el.tag if isinstance(el.tag, str) else ''


def norm_ws(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def text_of(el):
    return norm_ws(' '.join(t for t in el.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::noscript) and not(ancestor::svg)]')))


def is_card(el):
    c = cls(el)
    return ('Cardstyle__CardRoot' in c or 'LinkCardstyle' in c or
            (tag(el) == 'a' and ('Card' in c or el.xpath('.//*[contains(@class,"LinkCardstyle__LinkCardContent")]'))))


def card_rows(el):
    """element children that are cards (>=2 of them, nothing else with text) -> list, else []"""
    kids = [k for k in el if tag(k) and tag(k) not in SKIP]
    cards = [k for k in kids if is_card(k)]
    if len(cards) >= 2 and all(is_card(k) or not text_of(k) and not k.xpath('.//img') for k in kids):
        return cards
    return []


class Page:
    def __init__(self, slug, assets_dir, download):
        self.slug = slug
        self.assets_dir = assets_dir
        self.download = download
        self.variants = []
        self.deviations = []
        self.modules = []
        self.names = {}
        self.missing = []
        self.jslinks = 0
        self.tint = None

    def variant(self, v):
        if v not in self.variants:
            self.variants.append(v)

    def module(self, m):
        if m not in self.modules:
            self.modules.append(m)

    def deviation(self, kind, source, target, reason):
        d = {'kind': kind, 'source': source, 'target': target, 'reason': reason}
        if d not in self.deviations:
            self.deviations.append(d)

    # -- images -----------------------------------------------------------
    def local(self, src):
        if not src:
            return src
        src = src.strip()
        if src in self.names:
            return self.names[src]
        path = urllib.parse.urlparse(src).path
        base = urllib.parse.unquote(os.path.basename(path)) or 'image'
        base = re.sub(r'[^A-Za-z0-9._-]+', '-', base)
        stem, ext = os.path.splitext(base)
        if not ext:
            ext = '.png'
            base = stem + ext
        name, n = base, 1
        taken = {v.rsplit('/', 1)[-1] for v in self.names.values()}
        while name in taken:
            n += 1
            name = f'{stem}-{n}{ext}'
        dst = os.path.join(self.assets_dir, self.slug, name)
        if not os.path.exists(dst):
            if not self.download:
                self.missing.append(src)
                self.names[src] = src
                return src
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            try:
                req = urllib.request.Request(urllib.parse.quote(src, safe=':/?&=%+#~,'),
                                             headers={'User-Agent': 'Mozilla/5.0 stardust-sibling-builder'})
                with urllib.request.urlopen(req, timeout=60) as r:
                    data = r.read()
                with open(dst, 'wb') as fh:
                    fh.write(data)
            except Exception as e:  # keep the remote URL; logged, never silently dropped
                self.missing.append(f'{src} ({e})')
                self.names[src] = src
                return src
        self.names[src] = f'assets/{self.slug}/{name}'
        return self.names[src]

    def img(self, el, extra=''):
        return f'<img src="{attr(self.local(el.get("src") or ""))}" alt="{attr(el.get("alt") or "")}"{extra}>'

    def field(self, el):
        t = (el.get('type') or ('text' if tag(el) == 'input' else '')).lower()
        a = [f'type="{attr(t)}"'] if tag(el) == 'input' else []
        for k in ('name', 'placeholder', 'aria-label', 'value'):
            if el.get(k):
                a.append(f'{k}="{attr(el.get(k))}"')
        if tag(el) == 'input':
            return f'<input {" ".join(a)}>'
        return f'<{tag(el)} {" ".join(a)}></{tag(el)}>'

    # -- inline (verbatim) ------------------------------------------------
    def inline(self, el):
        return self._inline(el).strip()

    def _inline(self, el):
        out = [esc(el.text)]
        for c in el:
            t = tag(c)
            if t in SKIP:
                if t == 'svg' and c.get('aria-label'):
                    lab = c.get('aria-label')
                    out.append(EXT_SVG if 'new tab' in lab else
                               f'<svg class="bl-icon" role="img" aria-label="{attr(lab)}" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"></svg>')
            elif t == 'a':
                href = c.get('href') or ''
                if href.startswith('javascript:'):
                    self.jslinks += 1
                    out.append(f'<button type="button" class="bl-filter">{self._inline(c)}</button>')
                else:
                    a = f'<a href="{attr(href)}"'
                    if c.get('target'):
                        a += f' target="{attr(c.get("target"))}"'
                    if c.get('target') == '_blank':
                        a += ' rel="noopener noreferrer"'
                    if c.get('aria-label'):
                        a += f' aria-label="{attr(c.get("aria-label"))}"'
                    out.append(a + '>' + self._inline(c) + '</a>')
            elif t in ('strong', 'b', 'em', 'i', 'sup', 'sub', 'u', 'code', 's'):
                out.append(f'<{t}>{self._inline(c)}</{t}>')
            elif t == 'br':
                out.append('<br>')
            elif t == 'img':
                out.append(self.img(c))
            elif t in ('input', 'select', 'textarea'):
                out.append(self.field(c))
            elif t == 'button':
                out.append(f'<button type="button">{self._inline(c)}</button>')
            elif c.get('role') == 'img' and c.get('aria-label'):
                out.append(f'<span class="bl-rating" role="img" aria-label="{attr(c.get("aria-label"))}"></span>')
            elif t:
                out.append(self._inline(c) + (' ' if t in ('div', 'p', 'li', 'label') else ''))
            out.append(esc(c.tail))
        return ''.join(out)

    # -- block walker (verbatim, source order) ---------------------------
    def blocks(self, el, out):
        self.bare(el.text, out)
        for c in el:
            t = tag(c)
            if not t or t in SKIP:
                self.bare(c.tail, out)
                continue
            rows = card_rows(c) or ([c] if is_card(c) else [])
            if rows:
                cards = ''.join(self.card(k) for k in rows)
                if out and out[-1].startswith('<div class="bl-grid">'):
                    out[-1] = out[-1][:-len('</div>')] + cards + '</div>'
                else:
                    out.append('<div class="bl-grid">' + cards + '</div>')
            elif t in HEADS:
                if text_of(c) or c.xpath('.//img'):
                    out.append(f'<{t}>{self.inline(c)}</{t}>')
            elif t == 'p':
                if text_of(c) or c.xpath('.//img|.//input'):
                    out.append(f'<p>{self.inline(c)}</p>')
            elif t in ('ul', 'ol'):
                if 'Pagination' in cls(c) or 'listElement' in cls(c):
                    out.append(self.pages(c))
                elif text_of(c) or c.xpath('.//img|.//input'):
                    lis = ''.join(f'<li>{self.inline(li)}</li>' for li in c.xpath('./li') if text_of(li) or li.xpath('.//img|.//input'))
                    if lis:
                        out.append(f'<{t}>{lis}</{t}>')
            elif t == 'nav' and 'Breadcrumb' in cls(c):
                lis = ''.join(f'<li>{self.inline(li)}</li>' for li in c.xpath('.//li'))
                out.append(f'<nav class="bl-crumbs" aria-label="{attr(c.get("aria-label") or "Breadcrumb")}"><ol>{lis}</ol></nav>')
            elif t == 'a':
                if text_of(c) or c.xpath('.//img'):
                    kind = (c.get('data-interaction-type') or 'link').replace('button-', 'btn-')
                    inner = self._inline(LH.fromstring(f'<p>{LH.tostring(c, encoding="unicode")}</p>'))
                    inner = inner.replace('<a ', f'<a class="bl-cta bl-cta--{attr(kind)}" ', 1)
                    out.append(f'<p>{inner.strip()}</p>')
            elif t == 'img':
                out.append(f'<p class="bl-img">{self.img(c)}</p>')
            elif t == 'button':
                hh = c.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6')
                if hh and text_of(hh[0]) == text_of(c):
                    ht = tag(hh[0])
                    out.append(f'<{ht} class="bl-filters__label"><button type="button">{self.inline(c)}</button></{ht}>')
                elif text_of(c) or c.xpath('.//img'):
                    out.append(f'<p class="bl-btn"><button type="button">{self.inline(c)}</button></p>')
            elif t in ('input', 'select', 'textarea'):
                out.append(f'<p class="bl-field">{self.field(c)}</p>')
            elif 'FormFieldstyle__FormFieldRoot' in cls(c) and c.xpath('.//input|.//select|.//textarea'):
                out.append(f'<div class="bl-field">{self.inline(c)}</div>')
            elif t == 'label':
                if text_of(c) or c.xpath('.//input'):
                    out.append(f'<div class="bl-field">{self.inline(c)}</div>')
            elif t == 'hr':
                out.append('<hr>')
            elif c.get('role') == 'img' and c.get('aria-label'):
                out.append(f'<span class="bl-rating" role="img" aria-label="{attr(c.get("aria-label"))}"></span>')
            elif t in ('blockquote',):
                out.append(f'<blockquote>{self.inline(c)}</blockquote>')
            else:
                wid = c.xpath('./descendant-or-self::*[starts-with(@id,"wistia-")]/@id')
                if 'VideoLinkstyle__VideoLinkRoot' in cls(c) and wid:
                    m = re.match(r'wistia-(\w+?)-\d+$', wid[0])
                    vid = m.group(1) if m else ''
                    self.variant('video-popover')
                    self.deviation('video', f'wistia popover {vid}', f'<div class="bl-video" data-video="wistia:{vid}">',
                                   'source plays a Wistia popover on click; mount carried as data-video, player regenerated at delivery')
                    inner = []
                    self.blocks(c, inner)
                    out.append(f'<div class="bl-video" data-video="wistia:{attr(vid)}">' + ''.join(inner) + '</div>')
                else:
                    self.blocks(c, out)
            self.bare(c.tail, out)

    def bare(self, text, out):
        t = norm_ws(text)
        if t:
            out.append(f'<p>{esc(t)}</p>')

    def pages(self, ul):
        lis = []
        for li in ul.xpath('./li'):
            a = []
            for k in ('aria-label', 'aria-current', 'title'):
                if li.get(k):
                    a.append(f'{k}="{attr(li.get(k))}"')
            lis.append(f'<li{" " if a else ""}{" ".join(a)}>{self.inline(li)}</li>')
        return '<ul class="bl-pages">' + ''.join(lis) + '</ul>'

    # -- card -------------------------------------------------------------
    def leaves(self, el, out):
        for c in el:
            t = tag(c)
            if not t or t in SKIP:
                if norm_ws(c.tail):
                    out.append(('text', c.tail))
                continue
            if t == 'img':
                out.append(('img', c))
            elif t in HEADS:
                if text_of(c) or c.xpath('.//img'):
                    out.append(('h', c))
            elif t == 'p':
                if text_of(c):
                    out.append(('p', c))
            elif t == 'a' and not c.xpath('.//div|.//p|.//h1|.//h2|.//h3|.//h4|.//h5|.//h6'):
                out.append(('a', c))
            elif t == 'button':
                out.append(('button', c))
            elif c.get('role') == 'img' and c.get('aria-label'):
                out.append(('rating', c))
            elif 'VideoLinkstyle__VideoLinkRoot' in cls(c):
                out.append(('video', c))
            else:
                if norm_ws(c.text) and t not in ('ul', 'ol'):
                    out.append(('text', c.text))
                self.leaves(c, out)
            if norm_ws(c.tail):
                out.append(('text', c.tail))

    def card(self, el):
        lv = []
        if norm_ws(el.text):
            lv.append(('text', el.text))
        self.leaves(el, lv)
        heads = [i for i, (k, _) in enumerate(lv) if k == 'h']
        if heads:
            ti = heads[-1]
        else:
            ps = [i for i, (k, _) in enumerate(lv) if k == 'p']
            ti = ps[0] if ps else -1
        whole = tag(el) == 'a'
        parts, media_done, desc_done, link_done = [], False, False, whole
        for i, (k, n) in enumerate(lv):
            if k == 'img':
                if not media_done and (ti < 0 or i < ti):
                    parts.append(f'<div class="bl-card__media">{self.img(n)}</div>')
                    media_done = True
                else:
                    parts.append(f'<span class="bl-card__logo">{self.img(n)}</span>')
            elif k == 'video' or k == 'button':
                inner = self.inline(n)
                wid = n.xpath('./descendant-or-self::*[starts-with(@id,"wistia-")]/@id')
                if wid:
                    m = re.match(r'wistia-(\w+?)-\d+$', wid[0])
                    vid = m.group(1) if m else ''
                    self.variant('video-popover')
                    self.deviation('video', f'wistia popover {vid}', f'data-video="wistia:{vid}" on the card media',
                                   'source plays a Wistia popover on click; mount carried as data-video, player regenerated at delivery')
                    parts.append(f'<div class="bl-card__media" data-video="wistia:{attr(vid)}">{inner}</div>')
                    media_done = True
                else:
                    parts.append(f'<div class="bl-card__media">{inner}</div>' if k == 'video' else f'<button type="button">{inner}</button>')
            elif k in ('h', 'p'):
                t = tag(n)
                inner = self.inline(n)
                if i == ti:
                    c = 'bl-card__title'
                    if not link_done and '<a ' in inner:
                        inner = inner.replace('<a ', '<a class="bl-card__link" ', 1)
                        link_done = True
                elif i < ti:
                    c = 'bl-card__eyebrow'
                elif not desc_done and k == 'p':
                    c = 'bl-card__desc'
                    desc_done = True
                else:
                    c = 'bl-card__meta'
                parts.append(f'<{t} class="{c}">{inner}</{t}>')
            elif k == 'a':
                inner = self.inline(LH.fromstring(f'<p>{LH.tostring(n, encoding="unicode")}</p>'))
                if not link_done and inner.startswith('<a '):
                    inner = inner.replace('<a ', '<a class="bl-card__link bl-card__cta" ', 1)
                    link_done = True
                else:
                    inner = inner.replace('<a ', '<a class="bl-card__cta" ', 1)
                parts.append(f'<p class="bl-card__more">{inner}</p>')
            elif k == 'rating':
                parts.append(f'<span class="bl-rating" role="img" aria-label="{attr(n.get("aria-label"))}"></span>')
            elif k == 'text':
                parts.append(f'<p class="bl-card__meta">{esc(norm_ws(n))}</p>')
        body = ''.join(parts)
        if whole:
            a = f'<a class="bl-card__link" href="{attr(el.get("href") or "")}"'
            if el.get('aria-label'):
                a += f' aria-label="{attr(el.get("aria-label"))}"'
            if el.get('target') == '_blank':
                a += ' target="_blank" rel="noopener noreferrer"'
            body = a + '>' + body + '</a>'
        elif not link_done:
            self.variant('bl-card static')
        return f'<div class="bl-card">{body}</div>'


# -- section classification + module wrappers ----------------------------
def parts_of(sec):
    node = sec
    while True:
        kids = [k for k in node if tag(k) and tag(k) not in SKIP and (text_of(k) or k.xpath('.//img|.//input'))]
        if len(kids) == 1 and not is_card(kids[0]) and not norm_ws(node.text):
            node = kids[0]
            continue
        return kids


def own_heads(el):
    return [h for h in el.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6')
            if not any(is_card(a) for a in h.iterancestors()) and text_of(h)]


def n_cards(el):
    return len([c for c in el.iter() if tag(c) and is_card(c)])


def plain_links(el):
    return [a for a in el.xpath('.//a[@href]') if not any(is_card(x) for x in a.iterancestors()) and text_of(a)]


def classify(sec):
    if sec.xpath('.//*[contains(@class,"DropdownFilterstyle__DropdownFilterRoot")]'):
        return 'filters'
    if n_cards(sec):
        if sec.xpath('.//ul[contains(@class,"Pagination") or contains(@class,"listElement")]') or \
                any(re.search(r'load more', text_of(b), re.I) for b in sec.xpath('.//button')):
            return 'latest'
        return 'group'
    imgs = sec.xpath('.//img')
    if len(imgs) >= 3 and not plain_links(sec):
        return 'logos'
    if len(plain_links(sec)) >= 4:
        return 'guides'
    return 'teaser'


def add_class_first(html_s, pattern, klass):
    """add klass to the first opening tag matching pattern (a regex over the tag name)."""
    m = re.search(rf'<({pattern})(\s[^>]*)?>', html_s)
    if not m:
        return html_s, False
    t, rest = m.group(1), m.group(2) or ''
    if 'class="' in rest:
        new = rest.replace('class="', f'class="{klass} ', 1)
    else:
        new = f' class="{klass}"' + rest
    return html_s[:m.start()] + f'<{t}{new}>' + html_s[m.end():], True


def hero_module(pg, sec, pre, family):
    copy, media = [], []
    # main media: images outside cards/links that sit in their own column after the copy
    for p in parts_of(sec):
        target = copy
        if (p.xpath('./descendant-or-self::img') and not own_heads(p) and not plain_links(p)
                and not p.xpath('.//input') and not n_cards(p)):
            target = media
        wrap = LH.fromstring('<div></div>')
        wrap.append(_clone(p))
        pg.blocks(wrap, target)
    body = ''.join(pre + copy)
    variant = family
    if '<h1' in body:
        body, _ = add_class_first(body, 'h1', 'bl-picks__eyebrow')
    else:
        pg.variant('bl-hero no-h1')
    # a non-h1 heading before/after the h1 -> picks title (archetype: sticker h1 + h2 title)
    m = re.search(r'<(h2|h3|h4|h5)>', body)
    if m:
        body = body[:m.start()] + f'<{m.group(1)} class="bl-picks__title">' + body[m.end():]
    if variant == 'lead':
        # featured story without an h1: carried in the archetype lead-story slot
        body, _ = add_class_first(body, 'a', 'bl-lead__link')
        med = ''.join(media).replace('<p class="bl-img">', '<div class="bl-lead__media">').replace('</p>', '</div>')
        inner = (f'<div class="za-col bl-hero__lead"><div class="bl-lead">{med}<div class="bl-lead__copy">{body}</div></div></div>')
    else:
        med = ''.join(media)
        inner = (f'<div class="za-col bl-hero__side"><div class="bl-picks bl-picks--{variant}"><div class="bl-picks__head">{body}</div></div></div>'
                 + (f'<div class="za-col bl-hero__media">{med}</div>' if med else ''))
    pg.variant(f'bl-hero {variant}')
    extra = ''
    if body.count('<a ') >= 4:
        pg.variant('bl-hero links')
        extra += ' bl-hero--links'
    if pg.tint:
        pg.variant(f'bl-hero tint-{pg.tint}')
        extra += f' bl-hero--tint-{pg.tint}'
    pg.module('bl-hero')
    return (f'<section class="za-section bl-hero bl-hero--{variant}{extra}">\n  <div class="bl-hero__bg"></div>\n'
            f'  <div class="za-container bl-hero__container"><div class="za-row bl-hero__row">\n    {inner}\n  </div></div>\n</section>\n')


def _clone(el):
    return LH.fromstring(LH.tostring(el, encoding='unicode'))


def blocks_of(pg, el):
    out = []
    wrap = LH.fromstring('<div></div>')
    wrap.append(_clone(el))
    pg.blocks(wrap, out)
    return out


def group_html(pg, el, variant='grid'):
    out = blocks_of(pg, el)
    body = ''.join(out)
    i = body.find('<div class="bl-grid">')
    head, rest = (body[:i], body[i:]) if i >= 0 else (body, '')
    head = re.sub(r'<a class="bl-cta[^"]*"', '<a class="bl-more"', head, count=1) if head else ''
    rest = rest.replace('<div class="bl-grid">', '<div class="bl-grid bl-group__grid">')
    if not head:
        pg.variant('bl-group no-head')
    pg.variant(f'bl-group {variant}')
    pg.module('bl-group')
    return (f'    <section class="bl-group bl-group--{variant}">\n'
            + (f'      <div class="bl-group__head">{head}</div>\n' if head else '')
            + f'      {rest}\n    </section>\n')


def listing_module(pg, groups):
    return ('<section class="za-section bl-listing">\n  <div class="za-container bl-listing__groups">\n'
            + ''.join(groups) + '  </div>\n</section>\n')


def guides_module(pg, el):
    out = blocks_of(pg, el)
    k = 0
    while k < len(out) and re.match(r'<h[1-6]', out[k]):
        k += 1
    while k < len(out) and out[k].startswith('<p>') and '<a ' not in out[k] and \
            not (k + 1 < len(out) and ('<a ' in out[k + 1] or '<button' in out[k + 1])):
        k += 1
    intro, lst = out[:k], out[k:]
    grouped = any(re.match(r'<h[1-6]', b) for b in lst)
    if grouped:
        pg.variant('bl-guides grouped')
    lst_html = ''.join(lst)
    pg.module('bl-guides')
    return ('<section class="za-section bl-guides">\n  <div class="za-container"><div class="za-row">\n'
            f'    <div class="za-col bl-guides__intro">{"".join(intro)}</div>\n'
            f'    <div class="za-col bl-guides__list">{lst_html}</div>\n  </div></div>\n</section>\n')


def teaser_card(pg, el):
    out = blocks_of(pg, el)
    imgs = [b for b in out if b.startswith('<p class="bl-img">')]
    ctas = [b for b in out if b.startswith('<p><a class="bl-cta')]
    copy = [b for b in out if b not in imgs and b not in ctas]
    if not imgs:
        pg.variant('hp-teaser text-only')
    img_html = ''.join(b.replace('<p class="bl-img">', '<span class="hp-img">').replace('</p>', '</span>') for b in imgs)
    cta_html = ''.join(b.replace('class="bl-cta', 'class="za-btn za-btn--' + ('secondary' if 'btn-secondary' in b else 'primary') + ' bl-cta') for b in ctas)
    return ('    <div class="hp-teaser__card" role="complementary">\n'
            + (f'      <div class="hp-teaser__img">{img_html}</div>\n' if img_html else '')
            + f'      <div class="hp-teaser__copy">{"".join(copy)}</div>\n'
            + (f'      <div class="hp-teaser__cta">{cta_html}</div>\n' if cta_html else '')
            + '    </div>\n')


def teaser_module(pg, els):
    if len(els) > 1:
        pg.variant(f'hp-teaser {"pair" if len(els) == 2 else str(len(els)) + "-up"}')
    pg.module('hp-teaser')
    return ('<section class="za-section hp-teaser">\n  <div class="za-container">\n'
            + ''.join(teaser_card(pg, e) for e in els) + '  </div>\n</section>\n')


def latest_module(pg, el, extra_pre=''):
    out = blocks_of(pg, el)
    body = extra_pre + ''.join(out)
    body = body.replace('<div class="bl-grid">', '<div class="bl-grid bl-latest__grid">', 1)
    m = re.search(r'<h2>((?:\d[\d,]*\s*-\s*\d[\d,]*\s+of)[^<]*)</h2>', body) or re.search(r'<h2>', body)
    if m:
        body = body[:m.start()] + '<h2 class="bl-latest__title">' + body[m.start() + 4:]
    else:
        pg.variant('bl-latest no-title')
    pg.module('bl-latest')
    return f'<section class="za-section bl-latest">\n  <div class="za-container">{body}</div>\n</section>\n'


def filters_module(pg, el):
    out = blocks_of(pg, el)
    pg.module('bl-filters')
    pg.deviation('module', 'filter dropdowns (DropdownFilter: Industry, Business Challenge, Region, Product feature, Company size)',
                 'bl-filters (no archetype module)', 'the blog archetype has no filter module; carried verbatim as checkbox groups — delivery adds a bl-filters block (client-side filtering is dynamic)')
    return f'<section class="za-section bl-filters">\n  <div class="za-container">{"".join(out)}</div>\n</section>\n'


def directory_split(pg, sec, pre):
    """marketplace directory: GridRoot > [head col, filter/count row, (filters col, results col)]."""
    parts = parts_of(sec)
    head = parts[0]
    hero = hero_module_from(pg, head, pre, 'directory')
    rest = parts[1:]
    wrap = LH.fromstring('<div></div>')
    for p in rest:
        wrap.append(_clone(p))
    body = []
    pg.blocks(wrap, body)
    html_b = ''.join(body)
    # the filter column: from "Filter by" through the last filter control before the results grid
    i = html_b.find('<div class="bl-grid">')
    j = html_b.find('<h5>Sort By</h5>')
    pre_grid = html_b[:i] if i >= 0 else html_b
    post_grid = html_b[i:] if i >= 0 else ''
    # keep order: [Filter by][count h2][Sort By …][keywords + accordion filters][grid][pages]
    m = re.search(r'<div class="bl-field">.*', pre_grid, re.S)
    if m and j >= 0:
        aside = m.group(0)
        top = pre_grid[:m.start()]
        pre_grid = top + f'<aside class="bl-filters bl-filters--aside">{aside}</aside>'
    pg.variant('bl-latest filters')
    pg.deviation('module', 'directory filter column (keywords, Categories/Works With/Collections/Rating/Payment accordions, sort)',
                 'bl-latest > aside.bl-filters (no archetype module)',
                 'the blog archetype has no filter module; carried verbatim inside bl-latest — delivery adds the filter UI (Algolia-backed, dynamic)')
    pg.module('bl-filters')
    latest = latest_module(pg, LH.fromstring('<div></div>'), extra_pre=pre_grid + post_grid)
    return hero + latest


def hero_module_from(pg, el, pre, family):
    wrap = LH.fromstring('<section></section>')
    wrap.append(_clone(el))
    return hero_module(pg, wrap, pre, family)


def build_main(pg, main):
    secs = main.xpath('.//section[not(ancestor::section)]')
    secs = [s for s in secs if text_of(s) or s.xpath('.//img')]
    # content in main outside every top section (breadcrumbs) -> hero prefix
    pre = []
    for crumbs in main.xpath('.//nav[contains(@class,"Breadcrumb")][not(ancestor::section)]'):
        w = LH.fromstring('<div></div>')
        w.append(_clone(crumbs))
        pg.blocks(w, pre)
        pg.variant('bl-hero crumbs')
    out = []
    for i, s in enumerate(secs):
        if i == 0:
            if s.xpath('.//*[contains(@class,"Accordionstyle__AccordionRoot")]') and n_cards(s):
                out.append(directory_split(pg, s, pre))
                continue
            if 'Basestyle__BaseRoot' in cls(s):
                fam = 'legacy' if s.xpath('.//h1') else 'lead'
            else:
                fam = 'hub'
            out.append(hero_module(pg, s, pre, fam))
            continue
        kind = classify(s)
        parts = parts_of(s)
        head_parts = [p for p in parts if own_heads(p)]
        if kind in ('group', 'latest') and len(head_parts) >= 2:
            # one section holding several headed groups (+ link lists) -> split, order kept
            groups = []
            for p in parts:
                if n_cards(p):
                    groups.append(group_html(pg, p))
                else:
                    if groups:
                        out.append(listing_module(pg, groups))
                        groups = []
                    out.append(guides_module(pg, p) if len(plain_links(p)) >= 4 else teaser_module(pg, [p]))
            if groups:
                out.append(listing_module(pg, groups))
            continue
        if kind == 'teaser' and len(head_parts) >= 2 or kind == 'guides' and len(head_parts) >= 2 and \
                any(len(plain_links(p)) < 4 for p in head_parts):
            # mixed: a link list next to promo columns (newsroom press releases + two promos)
            for p in parts:
                if len(plain_links(p)) >= 4:
                    out.append(guides_module(pg, p))
                else:
                    sub = [q for q in parts_of(p) if own_heads(q)] if len(own_heads(p)) >= 2 else [p]
                    out.append(teaser_module(pg, sub))
            continue
        if kind == 'filters':
            out.append(filters_module(pg, s))
        elif kind == 'latest':
            out.append(latest_module(pg, s))
        elif kind == 'group':
            out.append(listing_module(pg, [group_html(pg, s)]))
        elif kind == 'logos':
            body = blocks_of(pg, s)
            head = ''.join(b for b in body if not b.startswith('<p class="bl-img">'))
            cards = ''.join('<div class="bl-card bl-card--logo"><div class="bl-card__media">'
                            + b[len('<p class="bl-img">'):-len('</p>')] + '</div></div>' for b in body if b.startswith('<p class="bl-img">'))
            pg.variant('bl-group logos')
            pg.module('bl-group')
            out.append(listing_module(pg, [f'    <section class="bl-group bl-group--logos">\n      <div class="bl-group__head">{head}</div>\n'
                                           f'      <div class="bl-grid bl-group__grid">{cards}</div>\n    </section>\n']))
        elif kind == 'guides':
            out.append(guides_module(pg, s))
        else:
            out.append(teaser_module(pg, [s]))
    return ''.join(out)


def subnav(pg, cap):
    links = []
    for a in cap.xpath('//body//a[@href][not(ancestor::main)][not(ancestor::footer)]'):
        h = a.get('href')
        if h in MARKET_NAV and h not in [x[0] for x in links]:
            links.append((h, text_of(a)))
    if len(links) < 2 or links[0][0] != '/marketplace/':
        return ''
    pg.module('bl-subnav')
    pg.variant('bl-subnav marketplace')
    pg.deviation('chrome', 'marketplace sub-header (Marketplace, Apps, Connectors, Themes, Partners) replacing the global nav',
                 'canon global header + bl-subnav (brand Marketplace, 4 items)',
                 'archetype chrome is the canon global header; the marketplace section nav is carried in the archetype bl-subnav slot')
    brand = f'<a class="bl-brand" href="{attr(links[0][0])}"><span>{esc(links[0][1])}</span></a>'
    items = ''.join(f'<div class="bl-subnav__item" role="menubar"><a class="bl-subnav__link" href="{attr(h)}"><span>{esc(t)}</span></a></div>'
                    for h, t in links[1:])
    return ('<div class="bl-subnav bl-subnav--desktop" id="bl-subnav-d"><nav class="bl-subnav__nav" aria-label="Marketplace navigation"><div class="bl-subnav__bar">\n'
            f'  <div class="bl-subnav__brand">{brand}</div>\n'
            f'  <div class="bl-subnav__menus"><div class="bl-subnav__list">{items}</div></div>\n</div></nav></div>\n')


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
    def vis(e):
        return text_of(e)
    heads = [h for h in main.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6') if vis(h)]
    body = [e for e in main.xpath('.//p|.//li|.//blockquote')
            if vis(e) and not e.xpath('ancestor::*[self::p or self::li or self::blockquote]')]
    links = [a for a in main.xpath('.//a[@href]|.//button') if vis(a) or a.xpath('.//svg|.//img')]
    hrefs = sorted({a.get('href') for a in main.xpath('.//a[@href]')})
    imgs = main.xpath('.//img[not(ancestor::noscript)]')
    return {'headings': len(heads), 'body': len(body), 'ctas': len(links), 'hrefs': len(hrefs), 'images': len(imgs),
            'words': len(text_of(main).split())}


def words(el):
    return collections.Counter(text_of(el).split())


TINTS = {'rgb(243, 240, 238)': 'sand', 'rgb(232, 254, 255)': 'aqua'}


def tint_of(cap):
    """hero background delta from the template's variance probe (stardust/.work/render/listing/variance.json)."""
    vf = 'stardust/.work/render/listing/variance.json'
    canon = cap.xpath('//link[@rel="canonical"]/@href')
    if not os.path.exists(vf) or not canon:
        return None
    for sib in json.load(open(vf, encoding='utf-8')).get('siblings', []):
        if sib.get('url') != canon[0]:
            continue
        for f in sib.get('findings', []):
            m = re.search(r'backgroundColor rgb\(255, 255, 255\) → (rgba?\([^)]*\))', f.get('msg', ''))
            if f.get('probe') == 'hero' and m:
                return TINTS.get(m.group(1), re.sub(r'\D+', '-', m.group(1)).strip('-'))
    return None


def build(slug, out_dir, assets_dir, download):
    proto = open(PROTO, encoding='utf-8').read()
    cap_path = os.path.join(CURRENT, f'{slug}.html')
    cap = LH.document_fromstring(open(cap_path, 'rb').read().decode('utf-8'))
    pg = Page(slug, assets_dir, download)
    main = cap.xpath('//main')[0]
    pg.tint = tint_of(cap)
    content = build_main(pg, main)
    main_inner = subnav(pg, cap) + content
    main_open = re.search(r'<main[^>]*>\n<div class="bl-root" id="bl-root">\n', proto).group(0)
    i_sub = proto.index('<div class="bl-subnav bl-subnav--desktop"')
    i_ftr = proto.index('<div class="za-ftr">')
    chrome_top = proto[proto.index(main_open) + len(main_open):i_sub]
    pre = proto[:proto.index(main_open)]
    post = proto[i_ftr:]
    head_open, head_rest = pre.split('<head>', 1)
    head_inner, after_head = head_rest.split('</head>', 1)
    lang = cap.get('lang') or 'en-US'
    head_open = re.sub(r'<html lang="[^"]*">', f'<html lang="{attr(lang)}">', head_open)
    out = head_open + '<head>' + head_from_capture(head_inner, cap) + '</head>' + after_head + main_open + chrome_top + main_inner + post
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, f'{slug}.html')
    with open(dst, 'w', encoding='utf-8') as fh:
        fh.write(out)
    # measure: capture main vs the rendered page content (between the chrome and the footer)
    rmain = LH.fromstring('<div>' + content + '</div>')
    src_c, dst_c = counts_main(main), counts_main(rmain)
    ws, wr = words(main), words(rmain)
    missing, extra = dict(ws - wr), dict(wr - ws)
    if pg.jslinks:
        pg.deviation('link-to-button', f'{pg.jslinks} <a href="javascript:void(0)"> filter toggles', '<button type="button" class="bl-filter"> (same labels)',
                     'JS pseudo-links (client-side filter toggles) have no destination; carried as buttons with the same labels')
    for m in pg.missing:
        pg.deviation('media', m, 'remote URL kept', 'download failed or disabled')
    if cap.xpath('//header[contains(@class,"sc-b03eb99a")]') or 'Basestyle__BaseRoot' in LH.tostring(main, encoding='unicode')[:2000]:
        pg.deviation('chrome', 'legacy Basestyle header/footer family (proxima nova / sharp sans)', 'canon header/footer (vanilla sans)',
                     'archetype chrome is canon; the legacy chrome family is a site-level inconsistency, not a per-page fork')
    report = {'slug': slug, 'source': cap_path, 'render': dst, 'variants': pg.variants, 'deviations': pg.deviations,
              'modules': pg.modules, 'counts': {'source': src_c, 'render': dst_c},
              'drops': {k: src_c[k] - dst_c[k] for k in src_c if k != 'words' and dst_c[k] < src_c[k]},
              'words': {'missing': missing, 'extra': extra}}
    with open(os.path.join(out_dir, f'{slug}.build.json'), 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)
    print(f'{slug}: {dst} modules={",".join(pg.modules)} images={len(pg.names)} variants={len(pg.variants)} '
          f'deviations={len(pg.deviations)} drops={report["drops"] or "none"} words-missing={sum(missing.values())} extra={sum(extra.values())}')
    return report


def main_():
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if args else 2)
    out_dir, assets_dir, download, slugs = 'stardust/.work/render/listing', 'stardust/migrated/assets', True, []
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
            r = build(s, out_dir, assets_dir, download)
            if r['words']['missing']:
                bad += 1
        except Exception as e:
            import traceback
            traceback.print_exc()
            bad += 1
            print(f'{s}: FAILED {e!r}', file=sys.stderr)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main_()
