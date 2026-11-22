#!/usr/bin/env python3
"""sibling-article builder: hydrated capture -> encoder-ready sibling render (Path A').

Forks the gated archetype prototype stardust/prototypes/customer-canva-proposed.html
(head, canon header/footer and every zb- template class the archetype encoder
stardust/rollout/encoders/archetype-article.py reads) and injects one customer
story's content VERBATIM from its hydrated capture stardust/current/pages/<slug>.html
(+ <slug>.json for media sizes). Sections the story lacks are omitted; anything the
archetype has no slot for is carried in the closest module and logged.

Usage (run from the project root):
  python3 -I stardust/rollout/encoders/sibling-article/build.py <slug>… \
      [--out-dir stardust/.work/render/article] [--assets-dir stardust/migrated/assets] \
      [--no-download]

Per slug it writes:
  <out-dir>/<slug>.html         the render (pass to migrate.mjs render --source <slug>=<file>)
  <out-dir>/<slug>.build.json   variants[], deviations[] (contentDeviations shape), counts{source, render}
and downloads the story's images to <assets-dir>/<slug>/<file> (the render references
them as assets/<slug>/<file>; migrate.mjs resolves that against its --out assets dir, and
archetype-article.py --media-base …/media/<slug> re-points them by file name).
Idempotent: existing image files are not re-fetched; identical renders are rewritten byte-equal.
Exit 0 when every slug built, 1 otherwise.
"""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

from lxml import html as LH

PROTO = 'stardust/prototypes/customer-canva-proposed.html'
CURRENT = 'stardust/current/pages'
EXT_SVG = ('<svg class="zb-ext" xmlns="http://www.w3.org/2000/svg" '
           'viewBox="0 0 12 12" role="img" aria-label="(opens in a new tab)"><path fill="none" stroke="currentColor" '
           'stroke-linecap="round" d="M10.5 8.5V10c0 .3-.2.5-.5.5H2c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5h1.5M6 6l4-4m-3.5-.5H10c.3 0 .5.2.5.5v3.5"></path></svg>')
SHARE_KINDS = [('TwitterIcon', r'twitter\.com|x\.com'), ('FacebookIcon', r'facebook\.com'),
               ('LinkedInIcon', r'linkedin\.com'), ('RssIcon', r'feed|rss|\.xml')]


def esc(s):
    return html.escape(s or '', quote=False)


def attr(s):
    return html.escape(s or '', quote=True)


def cls(el):
    return el.get('class') or ''


def has(el, frag):
    return frag in cls(el)


def norm_ws(s):
    return re.sub(r'\s+', ' ', s or '').strip()


class Page:
    def __init__(self, slug, assets_dir, download):
        self.slug = slug
        self.assets_dir = assets_dir
        self.download = download
        self.variants = []
        self.deviations = []
        self.names = {}
        self.sizes = {}
        self.missing = []

    def variant(self, v):
        if v not in self.variants:
            self.variants.append(v)

    def deviation(self, kind, source, target, reason):
        self.deviations.append({'kind': kind, 'source': source, 'target': target, 'reason': reason})

    # -- images -----------------------------------------------------------
    def local(self, src):
        """remote capture URL -> assets/<slug>/<file> (downloaded once)."""
        if not src:
            return src
        if src in self.names:
            return self.names[src]
        path = urllib.parse.urlparse(src.strip()).path  # captures can carry edge whitespace in src
        base = urllib.parse.unquote(os.path.basename(path)) or 'image'
        base = re.sub(r'[^A-Za-z0-9._-]+', '-', base)
        stem, ext = os.path.splitext(base)
        name, n = base, 1
        while name in {v.rsplit('/', 1)[-1] for v in self.names.values()}:
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
                req = urllib.request.Request(urllib.parse.quote(src.strip(), safe=':/?&=%+#~'), headers={'User-Agent': 'Mozilla/5.0 stardust-sibling-builder'})
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
        src = el.get('src') or ''
        out = f'<img src="{attr(self.local(src))}" alt="{attr(el.get("alt") or "")}"'
        w, h = self.sizes.get(src, (None, None))
        if w and h:
            out += f' width="{w}" height="{h}"'
        return out + extra + '>'

    # -- inline (verbatim) ------------------------------------------------
    def inline(self, el):
        return self._inline(el).strip()  # block boundary: only edge whitespace is transformed

    def _inline(self, el):
        out = [esc(el.text)]
        for c in el:
            tag = c.tag if isinstance(c.tag, str) else ''
            if tag == 'svg':
                if c.get('aria-label'):
                    out.append(EXT_SVG if 'new tab' in c.get('aria-label') else
                               f'<span class="zb-sr-only">{esc(c.get("aria-label"))}</span>')
            elif tag == 'a':
                a = f'<a href="{attr(c.get("href"))}"'
                if c.get('target'):
                    a += f' target="{attr(c.get("target"))}"'
                if c.get('target') == '_blank':
                    a += ' rel="noopener noreferrer"'
                out.append(a + '>' + self._inline(c) + '</a>')
            elif tag in ('strong', 'b', 'em', 'i', 'sup', 'sub', 'u', 'code', 's'):
                out.append(f'<{tag}>{self._inline(c)}</{tag}>')
            elif tag == 'br':
                out.append('<br>')
            elif tag == 'img':
                out.append(self.img(c))
            elif tag:
                out.append(self._inline(c))  # span / wrapper: keep its content, drop the wrapper
            out.append(esc(c.tail))
        return ''.join(out)


def head_from_capture(proto_head, cap):
    """prototype head lines, values swapped for the capture's (a key the capture lacks is dropped)."""
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


def build_hero(pg, sec, proto):
    p = []
    back = sec.xpath('.//a[@href][1]')
    proto_back_svg = re.search(r'<a class="zb-backlink"[^>]*>(<svg.*?</svg>)', proto, re.S).group(1)
    p.append('  <div class="zb-story-hero-wrap">\n  <section class="zb-story-hero">\n    <div class="zb-container">\n')
    if back:
        b = back[0]
        p.append(f'      <div class="zb-row"><div class="zb-col-12 zb-story-hero__back"><a class="zb-backlink" '
                 f'href="{attr(b.get("href"))}">{proto_back_svg}<span>{esc(norm_ws(b.text_content()))}</span></a></div></div>\n')
    p.append('      <div class="zb-row zb-story-hero__main">\n        <div class="zb-story-hero__text">\n')
    logos = sec.xpath('.//*[contains(@class,"LogotypeRowstyle__LogotypeRowRoot")]//img')
    if logos:
        p.append('          <div class="zb-logorow">' + ''.join(pg.img(i) for i in logos) + '</div>\n')
    h1 = sec.xpath('.//h1')
    if h1:
        p.append(f'          <h1>{pg.inline(h1[0])}</h1>\n')
        for para in h1[0].xpath('./following-sibling::p'):
            if norm_ws(para.text_content()):
                p.append(f'          <p>{pg.inline(para)}</p>\n')
    share = sec.xpath('.//*[contains(@class,"SocialBlockstyle__ListWrapper")]/li//a')
    if share:
        items = []
        for a in share:
            icon = a.xpath('.//svg')
            kind = next((k for k, _ in SHARE_KINDS if icon and k in cls(icon[0])), None)
            if not kind:
                kind = next((k for k, rx in SHARE_KINDS if re.search(rx, a.get('href') or '', re.I)), None)
            svg = proto_share_svg(proto, kind)
            if svg is None:
                pg.deviation('share-icon', a.get('href'), 'link without icon', f'no archetype icon for {kind}')
                svg = ''
            items.append(f'            <li><a href="{attr(a.get("href"))}" target="_blank" rel="noopener noreferrer">{svg}</a></li>\n')
        p.append('          <div class="zb-social"><ul>\n' + ''.join(items) + '          </ul></div>\n')
    lg = sec.xpath('.//*[contains(@class,"LinkGroupstyle__LinkGroupRoot")]')
    if lg:
        inner = []
        for a in lg[0].xpath('./a'):
            kind = (a.get('data-interaction-type') or 'button-primary').replace('button-', '')
            if kind != 'primary':
                pg.variant(f'zb-story-hero cta-{kind}')
            label = esc(norm_ws(''.join(a.itertext())))
            ext = EXT_SVG if a.xpath('.//svg[@aria-label]') else ''
            tgt = ' target="_blank" rel="noopener noreferrer"' if a.get('target') == '_blank' else ''
            inner.append(f'            <a class="zb-btn zb-btn--lg zb-btn--{kind}" href="{attr(a.get("href"))}"{tgt}>{label}{ext}</a>\n')
        for v in lg[0].xpath('.//*[contains(@class,"VideoLinkstyle__VideoLinkRoot")]'):
            wid = v.xpath('.//*[starts-with(@id,"wistia-")]/@id')
            m = re.match(r'wistia-(\w+)-\d+$', wid[0]) if wid else None
            btn = v.xpath('.//button')
            label = esc(norm_ws(btn[0].text_content())) if btn else 'Watch the video'
            svg = re.search(r'<div class="zb-videolink">(<svg.*?</svg>)', proto, re.S).group(1)
            if m:
                inner.append(f'            <div class="zb-videolink">{svg}<button class="zb-videolink__btn" type="button" data-video="wistia:{m.group(1)}">{label}</button></div>\n')
            else:
                pg.deviation('video', 'VideoLink without wistia id', 'omitted', 'no media id in the capture')
        if inner:
            p.append('          <div class="zb-linkgroup">\n' + ''.join(inner) + '          </div>\n')
    p.append('        </div>\n')
    media = [i for i in sec.xpath('.//img') if i not in logos]
    if media:
        p.append('        <div class="zb-story-hero__media">' + pg.img(media[0], ' fetchpriority="high" decoding="async"') + '</div>\n')
        for extra in media[1:]:
            pg.deviation('image', extra.get('src'), 'not rendered', 'second hero image has no archetype slot')
    p.append('      </div>\n    </div>\n  </section>\n  </div>\n')
    return ''.join(p)


_share_cache = {}


def proto_share_svg(proto, kind):
    if not _share_cache:
        for li in re.findall(r'<li><a href="([^"]+)"[^>]*>(<svg.*?</svg>)</a></li>', proto, re.S):
            for k, rx in SHARE_KINDS:
                if re.search(rx, li[0], re.I) and k not in _share_cache:
                    _share_cache[k] = li[1]
    return _share_cache.get(kind)


def stat_html(pg, st, indent):
    kids = [c for c in st if isinstance(c.tag, str)]
    fig = next((c for c in kids if 'stat-figure' in cls(c) or 'Headingstyle' in cls(c)), kids[0] if kids else None)
    rest = [c for c in kids if c is not fig]
    out = f'{indent}<div><div class="zb-stat"><p class="zb-stat__figure">{pg.inline(fig) if fig is not None else ""}</p>'
    for r in rest:
        out += f'<p class="zb-stat__text">{pg.inline(r)}</p>'
    return out + '</div></div>\n'


def build_quotes_facts(pg, sec):
    quotes = sec.xpath('.//*[contains(@class,"Quotestyle__QuoteRoot")]')
    facts = sec.xpath('.//*[contains(@class,"Cardstyle__CardRoot")]')
    if not quotes and not facts:
        return ''
    out = ['  <section class="zb-section zb-section--soft">\n    <div class="zb-container">\n']
    if quotes:
        qmod = ''
        if len(quotes) == 1:  # live: one quote column instead of the archetype's pair
            pg.variant('zb-quotes single')
            qmod = ' zb-quotes--single'
        out.append(f'      <div class="zb-row zb-quotes{qmod}">\n')
        for q in quotes:
            out.append('        <div class="zb-quotes__col"><div class="zb-quote">\n')
            for bq in q.xpath('.//blockquote'):
                out.append(f'          <blockquote>{pg.inline(bq)}</blockquote>\n')
            cps = [c for c in q.xpath('.//cite/p') if norm_ws(c.text_content())]
            if cps:
                names = ['zb-quote__name', 'zb-quote__role']
                out.append('          <cite>' + ''.join(
                    f'<p class="{names[min(i, 1)]}">{pg.inline(c)}</p>' for i, c in enumerate(cps)) + '</cite>\n')
            stats = q.xpath('.//*[contains(@class,"QuoteStatsRow")]//*[contains(@class,"Statstyle__StatRoot")]')
            if stats:
                out.append('          <div class="zb-quote__stats">\n' + ''.join(stat_html(pg, s, '            ') for s in stats) + '          </div>\n')
            else:
                out.append('          <div class="zb-quote__stats"></div>\n')
            out.append('        </div></div>\n')
        out.append('      </div>\n')
    else:
        pg.variant('zb-facts no-quotes')
    if facts:
        fmod = ''
        if len(facts) != 4:  # live grid: col width = 12 / count (variance probe: fact rect w 260 -> 352 at 3)
            word = {1: 'one', 2: 'two', 3: 'three', 5: 'five', 6: 'six'}.get(len(facts), str(len(facts)))
            pg.variant(f'zb-facts {word}-up')
            fmod = f' zb-facts--{word}-up'
        out.append(f'      <div class="zb-row zb-facts{fmod}">\n')
        for f in facts:
            hs = f.xpath('./h1|./h2|./h3|./h4|./h5|./h6')
            h = f'<h2 class="zb-eyebrow">{pg.inline(hs[0])}</h2>' if hs else ''
            ps = ''.join(f'<p>{pg.inline(p)}</p>' for p in f.xpath('./p'))
            out.append(f'        <div><div class="zb-fact">{h}{ps}</div></div>\n')
        out.append('      </div>\n')
    elif quotes:
        pg.variant('zb-quotes no-facts')
    out.append('    </div>\n  </section>\n')
    return ''.join(out)


def build_stats(pg, sec):
    stats = sec.xpath('.//*[contains(@class,"Statstyle__StatRoot")]')
    if not stats:
        return ''
    return ('  <section class="zb-section zb-section--flush-bottom">\n    <div class="zb-container"><div class="zb-row zb-stats">\n'
            + ''.join(stat_html(pg, s, '      ') for s in stats) + '    </div></div>\n  </section>\n')


def bare_text(pg, text, out):
    """a text run sitting directly in a body column (e.g. after a <br>) -> its own <p>, verbatim."""
    t = norm_ws(text or '')
    if t:
        out.append(f'      <p>{esc(t)}</p>\n')


def body_nodes(pg, col, out):
    bare_text(pg, col.text, out)
    for el in col:
        tag = el.tag if isinstance(el.tag, str) else ''
        if not tag:
            bare_text(pg, el.tail, out)
            continue
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            if tag != 'h4':
                pg.variant(f'zb-article {tag}')
            out.append(f'      <{tag} class="zb-h4">{pg.inline(el)}</{tag}>\n')
        elif tag == 'p':
            if norm_ws(el.text_content()) or el.xpath('.//img'):
                out.append(f'      <p>{pg.inline(el)}</p>\n')
        elif tag in ('ul', 'ol'):
            lis = ''.join(f'<li>{pg.inline(li)}</li>' for li in el.xpath('./li'))
            out.append(f'      <{tag}>{lis}</{tag}>\n')
        elif tag == 'blockquote':
            out.append(f'      <blockquote>{pg.inline(el)}</blockquote>\n')
        elif tag == 'img':
            out.append(f'      {pg.img(el)}\n')
        elif tag == 'div' and has(el, 'VideoEmbedstyle__VideoEmbedRoot'):
            # inline Wistia player -> embed-passthrough mount (dynamic-features: v-video-hosted-player);
            # the player's runtime chrome (thumbnail, "Click for sound", duration) is regenerated by the embed.
            ids = re.findall(r'wistia_async_(\w+)', ' '.join(el.xpath('.//@class')))
            if ids:
                pg.variant('zb-article embed-wistia')
                out.append(f'      <div class="zb-embed" data-video="wistia:{ids[0]}"><iframe src="https://fast.wistia.net/embed/iframe/{ids[0]}" '
                           'title="Wistia video player" loading="lazy" allow="autoplay; fullscreen" allowfullscreen '
                           'style="display:block;width:100%;aspect-ratio:16/9;border:0"></iframe></div>\n')
            else:
                pg.deviation('video', 'inline VideoEmbed without wistia id', 'not rendered', 'no media id in the capture')
        elif tag in ('div', 'figure', 'span', 'section'):
            body_nodes(pg, el, out)  # wrapper: carry its block children in order
        elif tag in ('script', 'style', 'noscript', 'svg', 'br'):
            pass
        else:
            pg.deviation('body-node', f'<{tag}> {norm_ws(el.text_content())[:60]}', 'not rendered', 'no archetype slot')
        bare_text(pg, el.tail, out)


def build_body(pg, secs):
    out = []
    for sec in secs:
        cols = sec.xpath('.//*[contains(@class,"Gridstyle__Col")]')
        leaf = [c for c in cols if not c.xpath('.//*[contains(@class,"Gridstyle__Col")]')] or [sec]
        for c in leaf:
            body_nodes(pg, c, out)
    if len(secs) > 1:
        pg.variant('zb-article merged-sections')
        pg.deviation('layout', f'{len(secs)} body sections', 'one zb-body__col', 'archetype has one body column; content kept in order')
    if not out:
        return ''
    return ('  <section class="zb-section">\n    <div class="zb-container"><div class="zb-row"><div class="zb-body__col">\n'
            + ''.join(out) + '    </div></div></div>\n  </section>\n')


def counts_main(main):
    """role-classified counts on a main element (same rules on both sides)."""
    def visible_text(e):
        return norm_ws(e.text_content())
    heads = [h for h in main.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6') if visible_text(h)]
    body = [e for e in main.xpath('.//p|.//li|.//blockquote')
            if visible_text(e) and not e.xpath('ancestor::*[self::p or self::li or self::blockquote]')]
    links = [a for a in main.xpath('.//a[@href]|.//button') if visible_text(a) or a.xpath('.//svg|.//img')]
    hrefs = sorted({a.get('href') for a in main.xpath('.//a[@href]')})
    imgs = main.xpath('.//img')
    return {'headings': len(heads), 'body': len(body), 'ctas': len(links), 'hrefs': len(hrefs), 'images': len(imgs),
            'words': len(norm_ws(' '.join(main.xpath('.//text()[not(ancestor::script) and not(ancestor::style)]'))).split())}


def build(slug, out_dir, assets_dir, download):
    proto = open(PROTO, encoding='utf-8').read()
    cap_path = os.path.join(CURRENT, f'{slug}.html')
    cap = LH.parse(cap_path).getroot()
    pg = Page(slug, assets_dir, download)
    jpath = os.path.join(CURRENT, f'{slug}.json')
    if os.path.exists(jpath):
        cj = json.load(open(jpath, encoding='utf-8'))
        for m in (cj.get('media') or {}).get('imgs') or []:
            if m.get('src') and m.get('w') and m.get('h'):
                pg.sizes[m['src']] = (m['w'], m['h'])
    main = cap.xpath('//main')[0]
    secs = main.xpath('.//section[not(ancestor::section)]')
    hero = next((s for s in secs if s.xpath('.//h1')), None)
    qf = [s for s in secs if s.xpath('.//*[contains(@class,"Quotestyle__QuoteRoot") or contains(@class,"Cardstyle__CardRoot")]')]
    st = [s for s in secs if s not in qf and s.xpath('.//*[contains(@class,"Statstyle__StatRoot")]')]
    body = [s for s in secs if s is not hero and s not in qf and s not in st]
    parts = [build_hero(pg, hero, proto) if hero is not None else '']
    if hero is None:
        pg.deviation('section', 'no h1 hero', 'omitted', 'capture has no hero section')
    parts += [build_quotes_facts(pg, s) for s in qf]
    parts += [build_stats(pg, s) for s in st]
    parts.append(build_body(pg, body))
    main_html = '<main id="main-content" class="zb-main">\n' + ''.join(parts) + '</main>'

    pre, rest = proto.split('<main', 1)
    post = rest.split('</main>', 1)[1]
    head_open, head_rest = pre.split('<head>', 1)
    head_inner, after_head = head_rest.split('</head>', 1)
    lang = cap.get('lang') or 'en-US'
    head_open = re.sub(r'<html lang="[^"]*">', f'<html lang="{attr(lang)}">', head_open)
    if lang.lower() not in ('en-us', 'en'):
        pg.deviation('chrome-locale', f'lang {lang}', 'en-US canon header/footer', 'archetype chrome is en-US; localized chrome is a site-level decision')
    out = head_open + '<head>' + head_from_capture(head_inner, cap) + '</head>' + after_head + main_html + post

    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, f'{slug}.html')
    with open(dst, 'w', encoding='utf-8') as fh:
        fh.write(out)
    rmain = LH.fromstring(main_html)
    src_c, dst_c = counts_main(main), counts_main(rmain)
    for m in pg.missing:
        pg.deviation('media', m, 'remote URL kept', 'download failed or disabled')
    report = {'slug': slug, 'source': cap_path, 'render': dst, 'variants': pg.variants, 'deviations': pg.deviations,
              'counts': {'source': src_c, 'render': dst_c},
              'drops': {k: src_c[k] - dst_c[k] for k in src_c if k != 'words' and dst_c[k] < src_c[k]},
              'blocks': [n for n, ok in (('zb-story-hero', hero is not None), ('zb-quotes', 'zb-quote"' in main_html),
                                         ('zb-facts', 'zb-fact"' in main_html), ('zb-stats', 'zb-stats"' in main_html),
                                         ('zb-article', 'zb-body__col' in main_html)) if ok]}
    with open(os.path.join(out_dir, f'{slug}.build.json'), 'w', encoding='utf-8') as fh:
        json.dump(report, fh, indent=2, ensure_ascii=False)
    print(f'{slug}: {dst} blocks={",".join(report["blocks"])} images={len(pg.names)} '
          f'variants={pg.variants} deviations={len(pg.deviations)} drops={report["drops"] or "none"}')
    return report


def main_():
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if args else 2)
    out_dir, assets_dir, download, slugs = 'stardust/.work/render/article', 'stardust/migrated/assets', True, []
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
            print(f'{s}: FAILED {e!r}', file=sys.stderr)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main_()
