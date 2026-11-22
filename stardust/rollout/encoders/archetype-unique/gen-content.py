# Encoder for the `unique` template archetype (pricing): gated prototype -> DA body fragment.
# Usage: python3 -I gen-content.py <prototype.html> <out.html> [--path /pricing/]
# Blocks: pr-head, pr-plans (+ variant addons), pr-modal, pr-split (dark | reverse), pr-logos,
#         pr-faq, pr-final, pr-matrix, sv-form (modal, reused unchanged).
import html
import json
import re
import sys

src = open(sys.argv[1], encoding='utf-8').read()
OUT = sys.argv[2]
PAGE = sys.argv[sys.argv.index('--path') + 1] if '--path' in sys.argv else '/pricing/'
M = 'https://content.da.live/aemcoder/3055ed88/media/pricing/'
Z = 'https://www.zendesk.com'
PLAN = {x['url'] for x in json.load(open('/workspace/3055ed88/stardust/.labs/site-plan.json'))['pages'] if x.get('selected')}
D5 = ('/login/', '/register/')
MEDIA = {  # prototype asset -> uploaded DA media name (avif decoded to png/webp)
    'Photo_ZendeskForethought.avif': 'Photo_ZendeskForethought.webp',
    'Photos_People_Relate_2025_Retail_4x3_01.avif': 'Photos_People_Relate_2025_Retail_4x3_01.webp',
    'BlockFrame_ROI_Calculator__en_us.png': 'BlockFrame_ROI_Calculator__en_us.png',
}


def absu(h):
    """in-scope pages root-relative, everything else absolute (runtime contract links)"""
    h = html.unescape(h)
    if h.startswith('#'):
        return h
    u = Z + h if h.startswith('/') else h
    base = u.split('?')[0].split('#')[0]
    if u.startswith(Z + '/') and base in PLAN and u == base and not base.endswith(D5):
        return u[len(Z):]
    return u


def t(s):
    return html.escape(s, quote=False)


def strip(s):
    s = re.sub(r'<svg[\s\S]*?</svg>', '', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).strip()


def inline(s):
    """clean inline markup: keep a/strong/em/br, drop svg, spans, classes, ids"""
    s = re.sub(r'<svg[\s\S]*?</svg>', '', s)
    s = re.sub(r'<span class="pr-li__ico">\s*</span>', '', s)
    s = re.sub(r'</?span[^>]*>', '', s)
    s = re.sub(r'<(/?)b>', r'<\1strong>', s)
    s = re.sub(r'<(/?)i>', r'<\1em>', s)

    def link(m):
        return f'<a href="{html.escape(absu(m.group(1)))}">'
    s = re.sub(r'<a [^>]*?href="([^"]*)"[^>]*>', link, s)
    s = re.sub(r'(<br>\s*)+$', '', s.strip())
    s = re.sub(r'\s*\n\s*', ' ', s)
    return s.strip()


H3P = r'</h3><p>([\s\S]*?)</p>'


def inner(s, tag):
    return re.search(rf'<{tag}[^>]*>([\s\S]*?)</{tag}>', s).group(1)


def block(name, rows):
    out = [f'<div class="{name}">']
    for r in rows:
        out.append('<div>' + ''.join(f'<div>{c}</div>' for c in r) + '</div>')
    out.append('</div>')
    return '\n'.join(out)


def img(file, alt=''):
    return f'<p><img src="{M}{MEDIA.get(file, file)}" alt="{html.escape(html.unescape(alt))}"></p>'


def prose(s):
    """flow content (modal / FAQ body) -> h2-h6 / p / ul; image spans without a source are dropped"""
    s = re.sub(r'<svg[\s\S]*?</svg>', '', s)
    s = re.sub(r'<span><span><span><img[^>]*></span><img[^>]*></span></span>', '', s)
    out = []
    for m in re.finditer(r'<(h[1-6]|p|ul)\b[^>]*>([\s\S]*?)</\1>', s):
        tag, body = m.group(1), m.group(2)
        if tag == 'ul':
            lis = [inline(re.sub(r'</?p>', '', li)) for li in re.findall(r'<li>([\s\S]*?)</li>', body)]
            out.append('<ul>' + ''.join(f'<li>{x}</li>' for x in lis) + '</ul>')
        else:
            x = inline(body)
            if strip(x):
                out.append(f'<{tag}>{x}</{tag}>')
    return ''.join(out)


main = src[src.find('<main'):src.find('</main>')]
S = []

# 1 tabs + title -> pr-head
tabs = re.search(r'<section class="za-section pr-tabs">([\s\S]*?)</section>', main).group(1)
label = strip(re.search(r'pr-tabs__label">([\s\S]*?)</p>', tabs).group(1))
lis = ''.join(f'<li><a href="{html.escape(absu(h))}">{t(strip(x))}</a></li>'
              for h, x in re.findall(r'<a class="pr-tab[^"]*" href="([^"]+)"[^>]*>([\s\S]*?)</a>', tabs))
h1 = re.search(r'<h1 class="pr-h1"[^>]*>([\s\S]*?)</h1>', main).group(1)
h1 = re.sub(r'<span>([\s\S]*?)</span>', r'<em>\1</em>', h1)
S.append(block('pr-head', [[f'<p>{t(label)}</p><ul>{lis}</ul><h1>{h1}</h1>']]))


# 2 plans -> pr-plans + feature modals (pr-modal)
def card(c):
    c1 = ''
    st = re.search(r'pr-card__sticker">([\s\S]*?)</span>', c)
    if st:
        c1 += f'<p>{t(strip(st.group(1)))}</p>'
    c1 += f'<h3>{t(strip(inner(c, "h3")))}</h3>'
    d = re.search(r'pr-card__desc"><p class="pr-small">([\s\S]*?)</p>', c)
    if d:
        c1 += f'<p>{inline(d.group(1))}</p>'
    pr = re.search(r'pr-price__amt">([\s\S]*?)</span><span class="pr-price__per">([\s\S]*?)</span>', c)
    if pr:
        c1 += f'<p><strong>{t(strip(pr.group(1)))}</strong> {t(strip(pr.group(2)))}</p>'
    for cls, h, x in re.findall(r'<a class="pr-cta pr-cta--(\w+)" href="([^"]+)">([\s\S]*?)</a>', c):
        w = 'em' if cls == 'buy' else 'strong'
        c1 += f'<p><{w}><a href="{html.escape(absu(h))}">{t(strip(x))}</a></{w}></p>'
    more = re.search(r'pr-card__more"><a [^>]*href="([^"]+)">([\s\S]*?)</a>', c)
    if more:
        c1 += f'<p><a href="{html.escape(absu(more.group(1)))}">{t(strip(more.group(2)))}</a></p>'
    row = [c1]
    f = re.search(r'pr-card__feat">([\s\S]*?)</ul>', c)
    if f:
        lead = strip(re.search(r'pr-card__lead">([\s\S]*?)</p>', f.group(1)).group(1))
        items = []
        for li in re.findall(r'<li>([\s\S]*?)</li>', f.group(1)):
            slug, name = re.search(r'data-modal="([^"]+)"><span>([\s\S]*?)</span>', li).groups()
            ai = '<em>AI</em> ' if 'pr-ai' in li else ''
            items.append(f'<li>{ai}<a href="#modal.{slug}">{t(html.unescape(name))}</a></li>')
        row.append(f'<p>{t(lead)}</p><ul>{"".join(items)}</ul>')
    return row


plans = re.search(r'<section id="plans" class="pr-plans">([\s\S]*?)</section>\s*<section id="addons"', main).group(1)
rows = []
cad = re.search(r'pr-cadence__off">([^<]*)</span>[\s\S]*?</svg>([^<]*)</label>[\s\S]*?pr-cadence__tag">([^<]*)</span>', plans)
rows.append([f'<p>{t(cad.group(1))}</p><p>{t(cad.group(2))}</p><p>{t(cad.group(3))}</p>'])
for c in re.findall(r'<div class="pr-plans__col">([\s\S]*?)</div></div>\n(?=<div class="pr-plans__col">|\s*</div>)', plans):
    rows.append(card(c))
cmp_h = re.search(r'<h4 class="pr-compare__h"[^>]*>([\s\S]*?)</h4>', plans).group(1)
rows.append([f'<h4>{inline(cmp_h)}</h4>'])
modal_rows = [[f'<p>{slug}</p>', prose(body)] for slug, body in
              re.findall(r'<div class="pr-modal" hidden data-modal="([^"]+)">([\s\S]*?)\n</div>', plans)]
S.append(block('pr-plans', rows) + '\n' + '\n'.join(block('pr-modal', [r]) for r in modal_rows))

# 3 add-ons -> pr-plans (addons)
addons = re.search(r'<section id="addons"[^>]*>([\s\S]*?)</section>', main).group(1)
rows = [[f'<h2>{t(strip(inner(addons, "h2")))}</h2>']]
for c in re.findall(r'<div class="pr-addons__col">([\s\S]*?)</div></div>\n', addons):
    rows.append(card(c))
S.append(block('pr-plans addons', rows))


# 4-5, 7 split rows -> pr-split
def split(sec, variant):
    c1 = ''
    eb = re.search(r'za-eyebrow pr-eyebrow"[^>]*>([\s\S]*?)<span class="za-tag pr-tag">([\s\S]*?)</span></p>', sec)
    if eb:
        c1 += f'<p>{t(strip(eb.group(1)))} <em>{t(strip(eb.group(2)))}</em></p>'
    c1 += f'<h2>{t(strip(inner(sec, "h2")))}</h2>'
    body = re.search(r'pr-body"[^>]*>([\s\S]*?)</div>', sec).group(1)
    c1 += prose(body)
    for cls, h, x in re.findall(r'<a class="za-btn za-btn--([\w-]+) pr-btn"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', sec):
        w = 'strong' if cls == 'primary' else 'em'
        c1 += f'<p><{w}><a href="{html.escape(absu(h))}">{t(strip(x))}</a></{w}></p>'
    im = re.search(r'<img src="assets/pricing/([^"]+)" alt="([^"]*)"', sec)
    name = 'pr-split' + (f' {variant}' if variant else '')
    return block(name, [[c1, img(im.group(1), im.group(2))]])


for sid, variant in (('forethought', 'dark'), ('zendesk_for_startups', ''), ('roi-calculator', 'reverse')):
    sec = re.search(rf'<section id="{sid}"[^>]*>([\s\S]*?)</section>', main).group(1)
    S.append(split(sec, variant))
    if sid == 'zendesk_for_startups':
        # 6 logos -> pr-logos (the 7 authored logos; the marquee clones are presentational)
        lg = re.search(r'<section id="teaser-893101fae7"[^>]*>([\s\S]*?)</section>', main).group(1)
        h = strip(re.search(r'<h2[^>]*>([\s\S]*?)</h2>', lg).group(1))
        logos = [(f, a) for f, a in re.findall(r'<img class="pr-logos__img" src="assets/pricing/([^"]+)" alt="([^"]*)" width', lg) if a]
        S.append(block('pr-logos', [[f'<h2>{t(h)}</h2>'], [''.join(img(f.replace('.avif', '.png'), a) for f, a in logos)]]))

# 8 FAQ -> pr-faq
faq = re.search(r'<section id="faqs"[^>]*>([\s\S]*?)</section>\s*<section id="final-callout"', main).group(1)
rows = [[f'<h2>{t(strip(inner(faq, "h2")))}</h2>']]
for q, body in re.findall(r'<h5 class="pr-acc__q">([\s\S]*?)</h5>[\s\S]*?pr-faq__text">([\s\S]*?)</div></div></section></div>', faq):
    rows.append([f'<h5>{t(strip(q))}</h5>', prose(body)])
S.append(block('pr-faq', rows))

# 9 final callout -> pr-final
fin = re.search(r'<section id="final-callout"[^>]*>([\s\S]*?)</section>', main).group(1)
c = f'<h2>{t(strip(inner(fin, "h2")))}</h2>'
for cls, h, x in re.findall(r'<a class="za-btn za-btn--([\w-]+) pr-btn"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>', fin):
    w = 'strong' if cls == 'primary' else 'em'
    c += f'<p><{w}><a href="{html.escape(absu(h))}">{t(strip(x))}</a></{w}></p>'
S.append(block('pr-final', [[c]]))

# 10 page-level hidden modals: comparison table (pr-matrix), contact-sales form (sv-form modal), add-on modals
pt = re.search(r'data-modal="pricing-table">([\s\S]*?)\n</div>\n<div class="pr-modal" hidden data-modal="copilot-modal"', main).group(1)
head = re.search(r'<thead><tr><th>([\s\S]*?)</th>([\s\S]*?)</tr></thead>', pt)
hrow = [f'<p>{t(strip(head.group(1)))}</p>']
for td in re.findall(r'<td>([\s\S]*?)</td>', head.group(2)):
    nm = strip(re.sub(r'<ul[\s\S]*?</ul>|<a[\s\S]*?</a>', '', td))
    a = re.search(r'<a href="([^"]+)">([\s\S]*?)</a>', td)
    hrow.append(f'<p>{t(nm)}</p><p><em><a href="{html.escape(absu(a.group(1)))}">{t(strip(a.group(2)))}</a></em></p>')
mrows = [hrow]
body = pt[head.end():]
for m in re.finditer(r'<h3>([\s\S]*?)</h3>|<tr><th>([\s\S]*?)</th>((?:<td>[\s\S]*?</td>)+)</tr>', body):
    if m.group(1) is not None:
        mrows.append([f'<h3>{t(strip(m.group(1)))}</h3>'])
        continue
    th = m.group(2)
    hd = re.search(r'<h6>([\s\S]*?)</h6>', th)
    if hd:
        c1 = f'<h6>{t(strip(hd.group(1)))}</h6>'
    else:
        parts = re.split(r'(<p>[\s\S]*?</p>)', th)  # descriptions are sometimes bare text after the name <p>
        c1 = ''.join(f'<p>{inline(x[3:-4] if x.startswith("<p>") else x)}</p>' for x in parts if strip(x))
    cells = [c1]
    for td in re.findall(r'<td>([\s\S]*?)</td>', m.group(3)):
        cells.append('<p>:pr-check:</p>' if 'pr-check' in td else f'<p>{inline(td) or "&nbsp;"}</p>')
    mrows.append(cells)
S_end = [block('pr-matrix', mrows)]

f = re.search(r'data-modal="contact-sales">\s*<form>([\s\S]*?)</form>', main).group(1)
rows = [[f'<h3>{t(strip(inner(f, "h3")))}</h3><p>{t(strip(re.search(H3P, f).group(1)))}</p>']]
hint = strip(re.search(r'</span>([^<]+)<label>Message', f).group(1))
for lab, ctl in re.findall(r'<label>([^<]+)</label>(<input[^>]*>|<textarea[^>]*>|<select[\s\S]*?</select>)', f):
    name = re.search(r'name="([^"]+)"', ctl).group(1)
    kind = 'textarea' if ctl.startswith('<textarea') else 'select' if ctl.startswith('<select') else (
        re.search(r'type="(\w+)"', ctl).group(1) if 'type=' in ctl else 'text')
    c1 = f'<p>{t(lab)}</p>' + (f'<p>{t(hint)}</p>' if name == 'owner.email' else '')
    r = [c1, kind, name]
    if kind == 'select':
        opts = [html.unescape(o) for o in re.findall(r'<option value="[^"]+">([^<]+)</option>', ctl)]
        r.append('<ul>' + ''.join(f'<li>{t(o)}</li>' for o in opts) + '</ul>')
    rows.append(r)
pp = re.search(r'<p>(By submitting[\s\S]*?)</p>', f).group(1)
btn = strip(re.search(r'<button[^>]*>([\s\S]*?)</button>', f).group(1))
rows.append([f'<p>{inline(pp)}</p><p>{t(btn)}</p>'])
S_end.append(block('sv-form modal', rows))

addon_modals = [[f'<p>{slug}</p>', prose(b)] for slug, b in
                re.findall(r'<div class="pr-modal" hidden data-modal="((?:copilot|workforce-engagement|contact)-modal)">([\s\S]*?)\n</div>', main)]
S_end.extend(block('pr-modal', [r]) for r in addon_modals)
S.append('\n'.join(S_end))

meta = block('metadata', [
    ['Title', 'Zendesk Pricing Plans | Starting from $19/month'],
    ['Description', 'Explore Zendesk pricing — from core support to AI agents, Copilot, and full CX suites — and choose the plan that fits your business.'],
    ['Canonical', 'https://www.zendesk.com/pricing/'],
    ['nav', '/nav-pricing'],
    ['footer', '/footer'],
    ['promo', 'off'],
])
body = '<body>\n<header></header>\n<main>\n' + ''.join(f'<div>\n{s}\n</div>\n' for s in S) + f'<div>\n{meta}\n</div>\n</main>\n<footer></footer>\n</body>\n'
open(OUT, 'w', encoding='utf-8').write(body)
print('sections', len(S), 'bytes', len(body), 'matrix rows', len(mrows), 'feature modals', len(modal_rows))
