#!/usr/bin/env python3
"""sibling-unique builder: hydrated capture -> encoder-ready sibling render (Path A') for the `unique`
template (one-of-a-kind pages), archetype `pricing`.

Forks the gated archetype prototype stardust/prototypes/pricing-proposed.html (head, canon chrome, the
za-section / pr-* template classes: pr-split / pr-final / pr-btns / pr-body / pr-h1 / pr-h2) and injects ONE
page's content VERBATIM from its hydrated capture stardust/current/pages/<slug>.html (decoded as UTF-8).
`unique` pages share no layout with pricing, so every capture region is carried with the CLOSEST archetype
module, or with a declared deviation module (no archetype analogue) — never dropped:

  promo strip [role=complementary] in main  -> section.pr-promo   (deviation module; live site chrome)
  region with a heading AND an image         -> section.pr-split   (h1 heading -> variant pr-split--hero)
  region with a heading, no image            -> section.pr-final   (variant pr-final--light)
  link/logo bar without a heading (tour bar) -> section.pr-bar     (deviation module; the page's own top bar)
  iframe embed                               -> section.pr-embed   (deviation module; src/title verbatim)
  non-HTML body (raw JSON feed)              -> section.pr-data    (deviation module; text verbatim in <pre>)

Capture regions: Next.js pages -> main minus header-*/footer/promo chrome, top-level sections in order;
legacy pages without <main> -> body > article; a body with no element content -> the raw text (data feed).
Chrome: archetype header kept when the live page shows a site header (CTA labels/hrefs from the capture);
removed when the live global header is hidden (intro-tour: the tour bar is the header) or absent (data feed).
Archetype (full) footer kept when the live footer is full; reduced to its legal row (labels from the
capture) when the live footer is legal-only; removed when absent.

Usage (from the project root):
  python3 -I stardust/rollout/encoders/sibling-unique/build.py <slug>… [--out-dir stardust/.work/render/unique]
Per slug: <out-dir>/<slug>.html (pass to migrate.mjs render --source <slug>=<file>) and
<out-dir>/<slug>.build.json: modules[], variants[], deviations[] (contentDeviations shape), decisions[],
counts{source, render}, drops{}, words{missing, extra}. Idempotent. Exit 0 when every slug built with no
count drop and no missing word, 1 otherwise.
"""
import collections
import copy
import html
import json
import os
import re
import sys

from lxml import html as LH

PROTO = 'stardust/prototypes/pricing-proposed.html'
CURRENT = 'stardust/current/pages'
SKIP = ('script', 'style', 'noscript', 'svg', 'template', 'link', 'meta', 'path')
WS = re.compile(r'[ \t\r\n]+')  # ASCII whitespace only: &nbsp; stays verbatim
HX = ('h1', 'h2', 'h3', 'h4', 'h5', 'h6')


def esc(s):
    return html.escape(s or '', quote=False)


def attr(s):
    return html.escape(s or '', quote=True)


def norm(s):
    return WS.sub(' ', s or '').strip()


def tag(el):
    return el.tag if isinstance(el.tag, str) else ''


def txt(el):
    return norm(''.join(el.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::svg) and not(ancestor::noscript)]')))


def real_img(i):
    s = i.get('src') or ''
    return bool(s) and not s.startswith('data:') and not re.search(r'cookielaw|doubleclick|facebook|bat\.bing|pixel', s)


def is_button(a):
    c = (a.get('class') or '') + ' ' + (a.get('data-interaction-type') or '')
    return bool(re.search(r'\bbutton\b|button-(primary|secondary)', c))


DEV_CSS = ('.pr-promo{background:var(--za-ink,#11110d);color:#fff;font-size:14px;padding:12px 0;text-align:center}'
           '.pr-promo__row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}.pr-promo p{margin:0}'
           '.pr-bar{padding:16px 0}.pr-bar__row{display:flex;align-items:center;justify-content:space-between}'
           '.pr-bar__brand img{display:block;height:32px;width:auto}.pr-bar__acts{display:flex;gap:24px;align-items:center;margin:0}'
           '.pr-embed__frame{position:relative;aspect-ratio:16/9;max-width:1280px;margin:0 auto}'
           '.pr-embed__frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}'
           '.pr-data__pre{white-space:pre-wrap;word-break:break-word;font:13px/1.5 ui-monospace,monospace}'
           '.pr-split--hero .pr-h1{font-size:clamp(42px,5vw,68px);line-height:1.05}')


class Page:
    def __init__(self, slug):
        self.slug, self.modules, self.variants, self.deviations, self.decisions, self.probe = slug, [], [], [], [], []

    def module(self, m):
        if m not in self.modules:
            self.modules.append(m)

    def variant(self, v):
        if v not in self.variants:
            self.variants.append(v)

    def deviation(self, kind, source, target, reason, **extra):
        d = {'kind': kind, 'source': source, 'target': target, 'reason': reason}
        d.update(extra)
        self.deviations.append(d)


# ---------------------------------------------------------------- inline serialisation (verbatim text)
def inline(el):
    out = [esc(el.text or '')]
    for c in el:
        t = tag(c)
        if t in SKIP or not t or t == 'img':
            pass
        elif t == 'a':
            h = c.get('href')
            ha = f' href="{attr(h)}"' if h is not None else ''
            tg = ' target="_blank" rel="noopener noreferrer"' if c.get('target') == '_blank' else ''
            out.append(f'<a{ha}{tg}>{inline(c)}</a>')
        elif t in ('strong', 'b'):
            out.append(f'<strong>{inline(c)}</strong>')
        elif t in ('em', 'i'):
            out.append(f'<em>{inline(c)}</em>')
        elif t == 'br':
            out.append('<br>')
        elif t in ('sup', 'sub', 'code'):
            out.append(f'<{t}>{inline(c)}</{t}>')
        else:
            out.append(inline(c))
        out.append(esc(c.tail or ''))
    return WS.sub(' ', ''.join(out)).strip(' ')  # ASCII strip only: a leading &nbsp; is verbatim text


INLINE_TAGS = ('a', 'strong', 'b', 'em', 'i', 'br', 'span', 'sup', 'sub', 'small', 'code')


def is_text_leaf(el):
    if not txt(el):
        return False
    return all(tag(d) in INLINE_TAGS or tag(d) in SKIP or not tag(d) or d is el for d in el.iter())


# ---------------------------------------------------------------- content walk -> items
def walk(el, out, chrome):
    """items in DOM order: ('head', lvl, html, id) ('p', html) ('li', [html]) ('cta', a) ('link', a)
    ('img', img, link_a|None) ('iframe', f)"""
    for c in el:
        t = tag(c)
        if not t or t in SKIP or any(c is x for x in chrome):
            continue
        if t == 'button' and not txt(c):
            continue  # icon-only control (promo close): presentational
        if t in HX:
            if txt(c):
                out.append(('head', int(t[1]), inline(c), c.get('id')))
        elif t in ('p', 'blockquote') or (t in ('div', 'span', 'strong', 'b', 'em', 'i') and is_text_leaf(c) and not c.xpath('.//a')):
            if txt(c):
                out.append(('p', inline(c)))
            for i in c.xpath('.//img[not(ancestor::noscript)]'):
                if real_img(i):
                    out.append(('img', i, None))
        elif t in ('ul', 'ol'):
            lis = [inline(li) for li in c.xpath('./li') if txt(li)]
            if lis:
                out.append(('li', lis))
        elif t == 'a':
            imgs = [i for i in c.xpath('.//img[not(ancestor::noscript)]') if real_img(i)]
            if imgs and not txt(c):
                out.append(('img', imgs[0], c))
            elif txt(c) and c.get('href') is not None:
                out.append(('cta' if is_button(c) else 'link', c))
            elif txt(c):
                out.append(('p', inline(c)))
        elif t == 'img':
            if real_img(c):
                out.append(('img', c, None))
        elif t == 'iframe':
            if c.get('src') and c.get('title') != 'Optimizely Internal Frame' and 'display: none' not in (c.get('style') or ''):
                out.append(('iframe', c))
        else:
            walk(c, out, chrome)


def img_html(i, a=None, cls='pr-media'):
    im = f'<img src="{attr(i.get("src"))}" alt="{attr(i.get("alt") or "")}"'
    for k in ('width', 'height'):
        if i.get(k) and i.get(k).isdigit():
            im += f' {k}="{i.get(k)}"'
    im += '>'
    if a is not None:
        im = f'<a href="{attr(a.get("href"))}" class="pr-bar__logo">{im}</a>'
    return f'<div class="{cls}">{im}</div>'


def btn_html(a, first):
    tg = ' target="_blank" rel="noopener noreferrer"' if a.get('target') == '_blank' else ''
    v = 'za-btn--primary' if first else 'za-btn--secondary'
    return f'<a class="za-btn {v} pr-btn" href="{attr(a.get("href"))}"{tg}><span><span>{esc(txt(a))}</span></span></a>'


def link_html(a):
    tg = ' target="_blank" rel="noopener noreferrer"' if a.get('target') == '_blank' else ''
    return f'<a class="pr-link" href="{attr(a.get("href"))}"{tg}>{esc(txt(a))}</a>'


def text_html(items):
    """heading / paragraph / list / link / CTA items -> pr-split__text style flow (CTAs grouped in pr-btns)"""
    out, btns, n = [], [], 0

    def flush():
        if btns:
            out.append('<div class="pr-btns">' + ''.join(btns) + '</div>')
            btns.clear()
    body = []

    def flush_body():
        if body:
            out.append('<div class="za-text pr-body">' + ''.join(body) + '</div>')
            body.clear()
    for it in items:
        k = it[0]
        if k == 'cta':
            flush_body()
            btns.append(btn_html(it[1], n == 0))
            n += 1
            continue
        flush()
        if k == 'head':
            flush_body()
            lvl, h, hid = it[1], it[2], it[3]
            cls = 'pr-h1' if lvl == 1 else 'pr-h2'
            ida = f' id="{attr(hid)}"' if hid else ''
            out.append(f'<h{lvl} class="{cls}"{ida}>{h}</h{lvl}>')
        elif k == 'p':
            body.append(f'<p>{it[1]}</p>')
        elif k == 'li':
            body.append('<ul>' + ''.join(f'<li>{x}</li>' for x in it[1]) + '</ul>')
        elif k == 'link':
            body.append(f'<p>{link_html(it[1])}</p>')
    flush_body()
    flush()
    return ''.join(out)


def section(pg, items, sid):
    """one capture region -> one or more sections (closest archetype module / declared deviation module)"""
    out = []
    ida = lambda s: f' id="{attr(s)}"' if s else ''  # noqa: E731
    frames = [it for it in items if it[0] == 'iframe']
    rest = [it for it in items if it[0] != 'iframe']
    heads = [it for it in rest if it[0] == 'head']
    imgs = [it for it in rest if it[0] == 'img']
    if rest and not heads:
        # a bar of logo / links / CTAs without a heading: the page's own top bar
        logo = ''.join(img_html(it[1], it[2], 'pr-bar__brand') for it in imgs)
        acts = []
        nb = 0
        for it in rest:
            if it[0] == 'link':
                acts.append(link_html(it[1]))
            elif it[0] == 'cta':
                acts.append(btn_html(it[1], nb == 0))
                nb += 1
            elif it[0] == 'p':
                acts.append(f'<p>{it[1]}</p>')
            elif it[0] == 'li':
                acts.append('<ul>' + ''.join(f'<li>{x}</li>' for x in it[1]) + '</ul>')
        out.append(f'<section{ida(sid)} class="za-section pr-bar" data-module="pr-bar">\n  <div class="za-container"><div class="za-row pr-bar__row">'
                   f'{logo}<div class="pr-bar__acts pr-btns">{"".join(acts)}</div></div></div>\n</section>\n')
        pg.module('pr-bar')
        pg.deviation('module', f'top bar without a heading ({len(imgs)} logo, {len(rest) - len(imgs)} link/CTA item(s))',
                     'section.pr-bar (logo + link group, verbatim)',
                     'no archetype (pricing) module for a page-own top bar; closest is the canon header bar — carried as a '
                     'deviation module (delivery: default content row or a page nav fragment)')
    elif rest and imgs:
        h1 = any(it[1] == 1 for it in heads)
        txt_items = [it for it in rest if it[0] != 'img']
        media = ''.join(img_html(it[1], it[2]) for it in imgs)
        var = ' pr-split--hero' if h1 else ''
        out.append(f'<section{ida(sid)} class="za-section pr-split{var}" data-module="pr-split">\n  <div class="za-container"><div class="za-row pr-split__row">'
                   f'<div class="za-col pr-split__text">{text_html(txt_items)}</div>'
                   f'<div class="za-col pr-split__media">{media}</div></div></div>\n</section>\n')
        pg.module('pr-split')
        if h1:
            pg.variant('pr-split--hero')
            pg.deviation('variant', 'page hero: h1 + text + CTA + image in one region', 'section.pr-split.pr-split--hero (h1 kept as h1)',
                         'pricing splits carry an h2; this page\'s single hero region carries its h1 — block VARIANT, not a fork')
    elif rest:
        out.append(f'<section{ida(sid)} class="za-section pr-final pr-final--light" data-module="pr-final">\n  <div class="za-container"><div class="pr-final__col">'
                   f'{text_html(rest)}</div></div>\n</section>\n')
        pg.module('pr-final')
        pg.variant('pr-final--light')
    for f in frames:
        out.append(f'<section class="za-section pr-embed" data-module="pr-embed">\n  <div class="za-container"><div class="pr-embed__frame">'
                   f'<iframe src="{attr(f[1].get("src"))}" title="{attr(f[1].get("title") or "")}" loading="lazy" allowfullscreen></iframe>'
                   f'</div></div>\n</section>\n')
        pg.module('pr-embed')
        pg.variant('pr-embed')
        pg.deviation('module', f'iframe embed {f[1].get("src")} (title "{f[1].get("title") or ""}")',
                     'section.pr-embed > iframe (src/title verbatim)',
                     'no embed module in the archetype (pricing); carried as a deviation module — the archetype encoder does '
                     'not emit it (delivery: embed block)')
        pg.deviation('dynamic-dependency', f'third-party embed {f[1].get("src")}', 'iframe passthrough',
                     'stardust/dynamic-features.md rows 106/107 (app.getreprise.com / static.reprise.com): embed-passthrough, '
                     'decision needs-business-decision — the live tour renders "This Account\'s Published Demos are '
                     'Deactivated" (captured state); markup kept verbatim',
                     disposition='embed-passthrough', row='t-unknown-third-party-host-app-getreprise-com',
                     endpoint=f[1].get('src'))
    return out


# ---------------------------------------------------------------- counting (same rules both sides)
def counts(roots):
    heads = body = ctas = imgs = frames = 0
    hrefs, words = set(), collections.Counter()
    for r in roots:
        heads += len([h for h in r.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6') if txt(h)])
        body += len([e for e in r.xpath('.//p|.//li|.//blockquote')
                     if txt(e) and not e.xpath('ancestor::*[self::p or self::li or self::blockquote]')])
        links = [a for a in r.xpath('.//a[@href]') if txt(a) or a.xpath('.//img')]
        ctas += len(links) + len([b for b in r.xpath('.//button') if txt(b)])
        hrefs |= {a.get('href') for a in links}
        imgs += len([i for i in r.xpath('.//img[not(ancestor::noscript)]') if real_img(i)])
        frames += len([f for f in r.xpath('.//iframe[@src]') if f.get('title') != 'Optimizely Internal Frame'
                       and 'display: none' not in (f.get('style') or '')])
        words.update(wordlist(r))
    return {'headings': heads, 'body': body, 'ctas': ctas, 'hrefs': len(hrefs), 'images': imgs, 'iframes': frames,
            'words': sum(words.values())}, words


def wordlist(r):
    t = ' '.join(r.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::noscript) and not(ancestor::svg)]'))
    return [w for w in norm(t).split(' ') if w]


# ---------------------------------------------------------------- variance -> variants
def probe_variants(pg, url, vpath):
    if not os.path.exists(vpath):
        return
    v = json.load(open(vpath, encoding='utf-8'))
    sib = next((s for s in v.get('siblings', []) if s.get('url') == url), None)
    if not sib:
        return
    pg.probe = [f.get('msg') for f in sib.get('findings', [])]
    blob = ' '.join(pg.probe)
    if 'sharp sans' in blob or 'proxima nova' in blob:
        # legacy (pre-Next) page family: sharp sans / proxima type, square teal buttons, 1280x720 tour frame
        pg.variant('pr-legacy')
    if re.search(r'h1 vanilla sans (6\d|7\d)px', blob):
        pg.variant('pr-split--hero')


# ---------------------------------------------------------------- head
def set_head(doc, cap, cj):
    head = doc.xpath('//head')[0]
    ch = cap.xpath('//head')[0]

    def cm(kind, key):
        m = ch.xpath(f'.//meta[@{kind}="{key}"]/@content')
        return m[0] if m else None
    for m in head.xpath('./meta[@name or @property]'):
        kind = 'name' if m.get('name') else 'property'
        key = m.get(kind)
        if key == 'viewport':
            continue
        val = cm(kind, key)
        if val is None:
            head.remove(m)
        else:
            m.set('content', val)
    t = ch.xpath('.//title')
    head.xpath('./title')[0].text = norm(t[0].text_content()) if t else (cj.get('title') or '')
    can = ch.xpath('.//link[@rel="canonical"]/@href')
    for li in head.xpath('./link[@rel="canonical"]'):
        if can:
            li.set('href', can[0])
        else:
            head.remove(li)
    rob = cm('name', 'robots')
    if rob and 'noindex' in rob:
        head.xpath('./title')[0].addnext(LH.fromstring(f'<meta name="robots" content="{attr(rob)}">'))


# ---------------------------------------------------------------- chrome helpers
def promo_of(main):
    return [x for x in main.xpath('.//*[@role="complementary"]') if not x.xpath('ancestor::section')]


def strip_chrome(root, chrome):
    c = copy.deepcopy(root)
    tree = root.getroottree()
    rp = tree.getpath(root)
    hits = []
    for x in chrome:
        if root in x.iterancestors():
            hits += c.xpath('.' + tree.getpath(x)[len(rp):])
    for h in hits:
        if h.getparent() is not None:
            h.getparent().remove(h)
    return c


# ---------------------------------------------------------------- build one page
def build(slug, out_dir, write=True):
    """write=False: no files; returns the capture content roots (count.py's source side)"""
    pg = Page(slug)
    cj = json.load(open(os.path.join(CURRENT, f'{slug}.json'), encoding='utf-8'))
    raw = open(os.path.join(CURRENT, f'{slug}.html'), 'rb').read().decode('utf-8')
    cap = LH.document_fromstring(raw)
    proto = LH.document_fromstring(open(PROTO, 'rb').read().decode('utf-8'))
    probe_variants(pg, cj.get('url'), os.path.join(out_dir, 'variance.json'))
    body = proto.xpath('//body')[0]
    p_hdrs = body.xpath('./div[contains(@class,"za-hdr")]')
    p_ftr = body.xpath('./div[contains(@class,"za-ftr")]')
    cbody = cap.xpath('//body')[0]
    sections, src_roots = [], []
    hdr_mode, ftr_mode, hdr_ctas, ftr_links = 'keep', 'keep', None, None

    if cap.xpath('//main'):
        main = cap.xpath('//main')[0]
        hdrs = [h for h in main.xpath('.//*[starts-with(@id,"header-")][.//nav]')]
        hdrs = [h for h in hdrs if not [a for a in h.iterancestors() if a in hdrs]]
        ftrs = main.xpath('.//footer')
        promo = promo_of(main)
        chrome = hdrs + ftrs + promo
        if promo:
            items = []
            walk(promo[0], items, [])
            ps = [it for it in items if it[0] == 'p']
            # the source repeats the promo line (mobile/desktop pair): both carried, the 2nd hidden like the live page
            seen, rows = set(), []
            for it in ps:
                h = f'<p class="pr-promo__alt" hidden>{it[1]}</p>' if it[1] in seen else f'<p>{it[1]}</p>'
                seen.add(it[1])
                rows.append(h)
            sections.append(f'<section class="pr-promo" data-module="pr-promo" role="complementary">\n  <div class="za-container pr-promo__row">{"".join(rows)}</div>\n</section>\n')
            pg.module('pr-promo')
            pg.variant('pr-promo')
            pg.deviation('module', 'promo strip [role=complementary] (' + norm(promo[0].text_content())[:120] + ')',
                         'section.pr-promo (first section; the repeated line kept, hidden, as on the live page)',
                         'live site-chrome promo above the header; no archetype (pricing) analogue — carried verbatim, '
                         'delivery decides promo nav section vs default content')
            src_roots.append(strip_chrome(promo[0], []))
        top = [x for x in main.xpath('.//section') if not x.xpath('ancestor::section')
               and not any(c is x or c in x.iterancestors() or x in c.iterancestors() for c in chrome)]
        for sec in top:
            items = []
            walk(sec, items, chrome)
            if items:
                sections += section(pg, items, sec.get('id'))
        src_roots.append(strip_chrome(main, chrome))
        if hdrs:
            hdr_ctas = [a for a in hdrs[-1].xpath('.//a[@href]') if txt(a)]
        else:
            hdr_mode = 'drop'
        if not ftrs:
            ftr_mode = 'drop'
    elif cbody.xpath('./article'):
        arts = cbody.xpath('./article')
        for art in arts:
            for reg in art.xpath('.//*[contains(@class,"logo-section")] | .//*[contains(@class,"tour-container")]') or [art]:
                items = []
                walk(reg, items, [])
                if items:
                    sections += section(pg, items, reg.get('id'))
            src_roots.append(copy.deepcopy(art))
        g = cbody.xpath('./header')
        if g:
            hdr_mode = 'drop'
            pg.deviation('chrome', 'global site header (present in the DOM, not displayed on the live page — the tour '
                         'bar is the page header)', 'render without canon header',
                         'verbatim: the live page shows only its own tour bar (delivery: nav metadata off / empty nav)')
            pg.variant('pr-bare-hdr')
        f = cbody.xpath('./footer')
        if f:
            ftr_links = [(txt(a), a.get('href')) for a in f[0].xpath('.//a[@href]') if txt(a)]
            ftr_mode = 'legal' if len(ftr_links) <= 8 else 'keep'
        else:
            ftr_mode = 'drop'
    else:
        # non-HTML body: raw data feed (JSON) rendered into a <body> by the browser
        text = ''.join(cbody.itertext())
        data = text  # byte-verbatim (no pretty-print: the feed's own serialisation is the content)
        try:
            json.loads(text)
            fmt = 'JSON (raw serialisation, verbatim)'
        except ValueError:
            fmt = 'text'
        sections.append(f'<section class="za-section pr-data" data-module="pr-data">\n  <div class="za-container">'
                        f'<pre class="pr-data__pre"><code>{esc(data)}</code></pre></div>\n</section>\n')
        pg.module('pr-data')
        pg.variant('pr-data')
        pg.variant('pr-bare')
        hdr_mode = ftr_mode = 'drop'
        src_roots.append(copy.deepcopy(cbody))
        n = None
        try:
            n = len(json.loads(text))
        except ValueError:
            pass
        pg.deviation('module', f'non-HTML body: {fmt[:4]} data feed ({n} records, {len(text)} chars), no title/headings/chrome',
                     f'section.pr-data > pre > code ({fmt})',
                     'the URL serves a machine-readable feed (blog ad / promoted-post records), not a page; no archetype '
                     'module — carried verbatim as preformatted text, nothing dropped')
        pg.deviation('dynamic-dependency', '/blog-ads-api-output/ JSON feed consumed client-side by the blog (ads rail)',
                     'static snapshot of the captured records',
                     'no dynamic-features.md row covers this endpoint (unclassified); delivery should serve it as data '
                     '(EDS sheet /blog-ads-api-output.json or static JSON) rather than a page',
                     disposition='unclassified', row=None, endpoint='GET https://www.zendesk.com/blog-ads-api-output/')
        pg.decisions.append({'kind': 'data-endpoint', 'records': n,
                             'note': 'deliver as JSON data (sheet or static file), not as a DA page; the rendered page '
                                     'is the verbatim content carrier'})
        pg.deviation('chrome', 'source has no header/footer (raw feed)', 'render without canon header/footer', 'verbatim')
        if not cj.get('title'):
            cj['title'] = slug  # strict metadata needs a <title>; the feed has none -> its URL slug, declared
            pg.deviation('metadata', 'no <title> (raw feed)', f'<title>{slug}</title>',
                         'driver strict metadata requires a title; the URL slug is used — no copy invented')

    # ---- chrome
    if hdr_mode == 'drop':
        for h in p_hdrs:
            body.remove(h)
        for a in body.xpath('./a[contains(@class,"za-skip")]'):
            pass  # skip link targets #main-content, still valid
    elif hdr_ctas is not None:
        prt = [a for a in p_hdrs[-1].xpath('.//a[contains(@class,"za-btn")]')]
        if [(txt(a), a.get('href')) for a in hdr_ctas] != [(txt(a), a.get('href')) for a in prt]:
            for ph in p_hdrs:
                for i, b in enumerate(ph.xpath('.//a[contains(@class,"za-btn")]')):
                    if i < len(hdr_ctas):
                        b.set('href', hdr_ctas[i].get('href'))
                        sp = b.xpath('.//span[not(*)]')
                        (sp[0] if sp else b).text = txt(hdr_ctas[i])
            pg.deviation('chrome', 'live header: slim bar (logo + ' + ' / '.join(f'{txt(a)} ({a.get("href")})' for a in hdr_ctas) + ')',
                         'archetype header with the page\'s own CTA labels and hrefs',
                         'the live page shows a slim header, not the pricing mega-nav (delivery: nav variant document, '
                         'e.g. /nav-slim with these CTAs)')
            pg.variant('nav-ctas')
    if ftr_mode == 'drop':
        for f in p_ftr:
            body.remove(f)
    elif ftr_mode == 'legal':
        for f in p_ftr:
            grid = f.xpath('.//*[contains(@class,"za-ftr__grid")]')[0]
            for row in list(grid):
                if 'za-ftr__legal' not in (row.get('class') or ''):
                    grid.remove(row)
            nav = grid.xpath('.//nav')[0]
            for a in list(nav):
                nav.remove(a)
            nav.text = '\n'
            for lab, h in ftr_links:
                a = LH.fromstring(f'<a class="za-ftr__a" href="{attr(h)}"><span>{esc(lab)}</span></a>')
                a.tail = '\n'
                nav.append(a)
            f.set('class', (f.get('class') or '') + ' pr-ftr--legal')
        pg.variant('pr-ftr--legal')
        pg.deviation('chrome', 'live footer: legal row only (' + ' / '.join(lab for lab, _ in ftr_links) + ')',
                     'archetype footer reduced to its legal row, labels/hrefs from the capture',
                     'verbatim chrome (delivery: footer=/footer-legal or a page footer variant)')

    variant_cls = ' '.join(v for v in pg.variants if v in ('pr-bare', 'pr-bare-hdr', 'pr-legacy'))
    lang = cap.xpath('//html/@lang')
    main_html = (f'<main id="main-content" class="za-main pr-main pr-sibling{(" " + variant_cls) if variant_cls else ""}" '
                 f'lang="{attr(lang[0] if lang else "en-US")}">\n' + ''.join(sections) + '</main>')
    set_head(proto, cap, cj)
    # deviation modules have no rule in pricing.css: minimal layout so the render reads like the live page
    css = LH.fromstring('<style data-sibling="unique">' + DEV_CSS + '</style>')
    proto.xpath('//head')[0].append(css)
    pm = body.xpath('./main')[0]
    pm.getparent().replace(pm, LH.fragment_fromstring(main_html))
    out = '<!DOCTYPE html>\n' + LH.tostring(proto, encoding='unicode')
    if not write:
        return src_roots
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, f'{slug}.html')
    open(dst, 'w', encoding='utf-8').write(out)

    rsecs = LH.document_fromstring(out).xpath('//main//section')
    cs, ws = counts(src_roots)
    cd, wd = counts(rsecs)
    drops = {k: cs[k] - cd[k] for k in cs if k != 'words' and cd[k] < cs[k]}
    missing = ws - wd
    rtext = norm(' '.join(norm(s.text_content()) for s in rsecs))
    lost = [h['text'] for h in cj.get('headings', []) if norm(h.get('text')) and norm(h.get('text')) not in rtext]
    rep = {'slug': slug, 'render': dst, 'modules': pg.modules, 'variants': pg.variants, 'deviations': pg.deviations,
           'decisions': pg.decisions, 'probe': pg.probe, 'counts': {'source': cs, 'render': cd}, 'drops': drops,
           'words': {'missing': sum(missing.values()), 'missingSample': list(missing.items())[:20],
                     'extra': sum((wd - ws).values()), 'extraSample': list((wd - ws).items())[:20]},
           'jsonHeadingsNotInMain': lost}
    json.dump(rep, open(os.path.join(out_dir, f'{slug}.build.json'), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'{slug}: {dst} modules={pg.modules} variants={pg.variants} deviations={len(pg.deviations)} '
          f'src={cs} dst={cd} drops={drops or "none"} wordsMissing={sum(missing.values())} headingsNotInMain={lost}')
    return not drops and not missing


def main_():
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if args else 2)
    out_dir, slugs, i = 'stardust/.work/render/unique', [], 0
    while i < len(args):
        if args[i] == '--out-dir':
            out_dir = args[i + 1]
            i += 2
            continue
        slugs.append(args[i])
        i += 1
    bad = 0
    for s in slugs:
        try:
            if not build(s, out_dir):
                bad += 1
        except Exception as e:  # noqa: BLE001
            import traceback
            traceback.print_exc()
            print(f'{s}: FAILED {e!r}', file=sys.stderr)
            bad += 1
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main_()
