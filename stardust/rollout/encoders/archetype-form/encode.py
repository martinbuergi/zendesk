# archetype-form encoder: migrated form-template page (ct- modules, contact prototype) -> DA body fragment.
# Usage:
#   python3 -I encode.py --page stardust/migrated/<path>/index.html --meta stardust/migrated/<path>/_meta.json \
#     --out content/<path>.html [--meta-row key=value ...]
# Section mapping (walks main .ct-wrap > section in order; unknown sections fall back to default content):
#   section holding a .ct-form   -> fm-hero (lead row: eyebrow <p>, <h1>, intro <p>s; one row per side card
#                                   .ct-siderow: <h3>, copy, link-only <p> for the arrow link)
#                                   + one fm-form per form (forms under a [hidden] / .ct-formhidden ancestor
#                                   -> `fm-form (hidden)`, the live duplicate)
#   section holding .ct-office   -> head <h2> as default content + fm-offices (one row per office cell),
#                                   section style cream when the section carries .ct-cream
# fm-form rows: label <p> (+ hint <p> from .ct-tip__box) | type word + flags | name | options <ul>
#   type: email | tel | text | textarea | select | tiles (radio tiles); flags: required, half (.ct-field--half),
#   hidden (field [hidden]); a selected <option> / checked radio -> <strong> item. Fields are read
#   generically from .ct-field, so siblings with other field sets encode without changes.
#   consent .ct-consent -> single-cell row; submit label (.ct-submit text) -> last single-cell row.
# Metadata rows: Title / Description / Canonical from _meta.json + nav /nav-slim, footer /footer-legal,
# promo off (runtime-contract chrome.pageMetadata.slim); override/add with --meta-row key=value.
# Siblings (cluster-form-1): --config <json> --key <migrated path> reads per-page options (siblings.json beside
# this file documents them): block variants (fm-hero <v>, fm-form <v>), the on-load step (fields outside `step1`
# get the hidden flag; notes matching `hideNotes` become `note hidden` rows), a `progress` row, tile / lead icons
# (:icon: tokens), side links as secondary buttons, a hero backdrop image row, iframes -> fm-embed, metadata rows.
# Generic sibling shapes: the site-chrome promo strip section (.ct-promo) is not page content (it lives in the
# page's nav document) and is skipped; radio tiles carry their label text (not the value); a .ct-suffix inside
# the field wrapper -> flag `suffix` + a 4th cell <p>suffix</p>; .ct-formlogo -> <p><a href="/">:za-wordmark:</a></p>.
import argparse
import html
import json
import os
import re
from urllib.parse import urljoin

from lxml import html as LH

ap = argparse.ArgumentParser()
ap.add_argument('--page', required=True)
ap.add_argument('--meta', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--meta-row', action='append', default=[])
ap.add_argument('--site-plan', default='stardust/.labs/site-plan.json')
ap.add_argument('--config')
ap.add_argument('--key')
a = ap.parse_args()
CFG = {}
if a.config:
    CFG = json.load(open(a.config, encoding='utf-8')).get(a.key, {})
STEP1 = set(CFG.get('step1') or [])

Z = 'https://www.zendesk.com'
PLAN = set()
if os.path.exists(a.site_plan):
    PLAN = {x['url'] for x in json.load(open(a.site_plan))['pages'] if x.get('selected')}
D5 = ('/login/', '/register/')

doc = LH.fromstring(open(a.page, encoding='utf-8').read())
meta = json.load(open(a.meta, encoding='utf-8'))
BASE = meta.get('metadata', {}).get('canonical') or Z + '/'
WS = re.compile(r'[ \t\r\n]+')  # collapse ASCII whitespace only: &nbsp; stays (verbatim source text)


def esc(s):
    return html.escape(s, quote=False)


def absu(h):
    """in-scope pages root-relative (source trailing slash), the rest absolute (runtime contract links)"""
    if not h:
        return h
    if not re.match(r'^(https?:|/|#|mailto:|tel:)', h):
        h = urljoin(BASE, h)  # migrated links are relative to the page file
        h = re.sub(r'index\.html(?=$|[?#])', '', h)
    u = Z + h if h.startswith('/') else h
    if u.startswith(Z + '/') and u in PLAN and not u.endswith(D5):
        return u[len(Z):]
    return u


def cls(el):
    return set((el.get('class') or '').split())


def has(scope, c):
    return scope.xpath(f'.//*[contains(concat(" ", normalize-space(@class), " "), " {c} ")]')


def inline(el):
    """children of el as inline DA markup: text + a/strong/em/br kept, svg and spans unwrapped/dropped"""
    out = [esc(el.text or '')]
    for c in el:
        tag = c.tag if isinstance(c.tag, str) else ''
        if tag == 'svg':
            pass
        elif tag == 'a':
            # a space inside the link edge (live "You can<a> sign up</a>") stays outside it
            raw = ''.join(c.itertext())
            # the migrated render trims that space ("You can<a>sign up"): a word abutting the link
            prev = out[-1] if out else ''
            lead = ' ' if raw[:1].isspace() or (prev[-1:].isalnum() and raw[:1].isalnum()) else ''
            trail = ' ' if raw[-1:].isspace() else ''
            out.append(f'{lead}<a href="{html.escape(absu(c.get("href", "")))}">{inline(c)}</a>{trail}')
        elif tag in ('strong', 'b'):
            out.append(f'<strong>{inline(c)}</strong>')
        elif tag in ('em', 'i'):
            out.append(f'<em>{inline(c)}</em>')
        elif tag == 'br':
            out.append('<br>')
        elif tag:
            out.append(inline(c))
        out.append(esc(c.tail or ''))
    return WS.sub(' ', ''.join(out)).strip()


def text(el):
    return WS.sub(' ', ''.join(el.itertext())).strip()


def prose(scope, skip=()):
    out = []
    for el in scope.iter():
        if not isinstance(el.tag, str) or any(el is s or s in el.iterancestors() for s in skip):
            continue
        if el.xpath('ancestor::form') or el.xpath('ancestor::a'):
            continue
        if re.match(r'^h[1-6]$', el.tag):
            out.append(f'<{el.tag}>{inline(el)}</{el.tag}>')
        elif el.tag == 'p' and text(el):
            out.append(f'<p>{inline(el)}</p>')
        elif el.tag in ('ul', 'ol') and not el.xpath('ancestor::ul|ancestor::ol'):
            items = ''.join(f'<li>{inline(li)}</li>' for li in el.findall('li'))
            out.append(f'<{el.tag}>{items}</{el.tag}>')
    return out


def block(name, rows):
    out = [f'<div class="{name}">']
    for r in rows:
        out.append('<div>' + ''.join(f'<div>{c}</div>' for c in r) + '</div>')
    out.append('</div>')
    return '\n'.join(out)


def field_row(f):
    """one .ct-field -> [label cell, type cell, name cell, (options cell)] or None (consent / empty)"""
    lab = f.xpath('.//*[contains(concat(" ", normalize-space(@class), " "), " ct-label ")]')
    tip = has(f, 'ct-tip__box')
    radios = f.xpath('.//input[@type="radio"]')
    sel = f.xpath('.//select')
    ta = f.xpath('.//textarea')
    inp = f.xpath('.//input[not(@type="radio") and not(@type="hidden") and not(@type="checkbox")]')
    if radios:
        typ, ctl = 'tiles', radios[0]
    elif sel:
        typ, ctl = 'select', sel[0]
    elif ta:
        typ, ctl = 'textarea', ta[0]
    elif inp:
        t = (inp[0].get('type') or 'text').lower()
        typ, ctl = (t if t in ('email', 'tel') else 'text'), inp[0]
    else:
        return None
    if not lab:
        lab = f.xpath('.//legend')
    label = text(lab[0]) if lab else (ctl.get('aria-label') or ctl.get('placeholder') or ctl.get('name') or '')
    suffix = has(f, 'ct-suffix')
    cell1 = f'<p>{esc(label)}</p>' + (f'<p>{inline(tip[0])}</p>' if tip and text(tip[0]) else '')
    flags = [typ]
    if ctl.get('required') is not None:
        flags.append('required')
    if 'ct-field--half' in cls(f):
        flags.append('half')
    if suffix:
        flags.append('suffix')
    if f.get('hidden') is not None or (STEP1 and ctl.get('name') not in STEP1):
        flags.append('hidden')
    row = [cell1, ' '.join(flags), esc(ctl.get('name') or '')]
    if suffix:
        row.append(f'<p>{esc(text(suffix[0]))}</p>')
    if typ == 'select':
        items = []
        for o in ctl.xpath('.//option'):
            v = text(o)
            if not o.get('value') and v.lower() in ('select', ''):
                continue
            items.append(f'<li><strong>{esc(v)}</strong></li>' if o.get('selected') is not None else f'<li>{esc(v)}</li>')
        row.append('<ul>' + ''.join(items) + '</ul>')
    elif typ == 'tiles':
        items = []
        icons = CFG.get('tileIcons') or {}
        for r in radios:
            tl = r.xpath('ancestor::label[1]')
            v = (' '.join(t.strip() for t in tl[0].itertext() if t.strip()) if tl else '') or r.get('value') or ''
            if v in icons:
                v = f':{icons[v]}:{v}'
            items.append(f'<li><strong>{esc(v)}</strong></li>' if r.get('checked') is not None else f'<li>{esc(v)}</li>')
        row.append('<ul>' + ''.join(items) + '</ul>')
    return row


def note_row(p, hidden=False):
    body = inline(p)
    for t, h in (CFG.get('noteHref') or {}).items():
        body = body.replace(f'<a href="">{esc(t)}</a>', f'<a href="{html.escape(h)}">{esc(t)}</a>')
    if hidden or any(text(p).startswith(x) for x in CFG.get('hideNotes') or []):
        return [f'<p>{body}</p>', 'note hidden']
    return [f'<p>{body}</p>']


def form_block(form):
    rows = []
    hidden = bool(form.xpath('ancestor-or-self::*[@hidden] | ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ct-formhidden ")]'))
    fields = has(form, 'ct-field')
    for f in fields:
        if f.xpath('ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ct-field ")]'):
            continue  # nested field wrapper
        cons = f.xpath('.//p')
        r = field_row(f)
        if r:
            rows.append(r)
        elif cons:
            for p in cons:
                if text(p):
                    rows.append(note_row(p, f.get('hidden') is not None))
    sub = form.xpath('.//button[@type="submit"] | .//*[contains(concat(" ", normalize-space(@class), " "), " ct-submit ")]')
    if sub and text(sub[0]):
        rows.append([f'<p>{esc(text(sub[0]))}</p>'])
    name = 'fm-form' + (' ' + CFG['form'] if CFG.get('form') and not hidden else '')
    if CFG.get('progress') and not hidden:
        step = form.xpath('ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ct-col-6 ")]//p[starts-with(normalize-space(.), "Step ")]')
        rows.insert(0, [f'<p>{esc(text(step[0]))}</p>' if step else '', 'progress', CFG['progress']])
    return block('fm-form hidden' if hidden else name, rows)


def hero_section(sec):
    forms = sec.xpath('.//form')
    side = has(sec, 'ct-siderow')
    eyebrow = has(sec, 'ct-eyebrow') or has(sec, 'za-eyebrow')
    lead = ''
    if eyebrow and text(eyebrow[0]):
        lead += f'<p>{inline(eyebrow[0])}</p>'
    # the lead column: everything before the forms, outside the side cards
    h1 = sec.xpath('.//h1')
    col = h1[0].getparent() if h1 else sec
    fl = has(sec, 'ct-formlogo')
    if fl:
        lead += f'<p><a href="/">:za-wordmark:{esc(fl[0].get("aria-label") or "")}</a></p>'
    media = has(sec, 'ct-media')
    steps = [p for p in sec.xpath('.//p') if CFG.get('progress') and text(p).startswith('Step ')]
    parts = prose(col, skip=tuple(side) + tuple(eyebrow) + tuple(media) + tuple(steps))
    for t, ic in (CFG.get('leadIcons') or {}).items():
        parts = [x.replace(f'<p><strong>{esc(t)}', f'<p>:{ic}:<strong>{esc(t)}', 1) for x in parts]
    lead += ''.join(parts)
    rows = [[lead]]
    if CFG.get('media'):
        rows.append([f'<p><img src="{html.escape(CFG["media"])}" alt=""></p>'])
    for s in side:
        parts = prose(s)
        for x in s.xpath('.//a'):
            if x.xpath('ancestor::p') or not text(x):
                continue
            parts.append(f'<p><a href="{html.escape(absu(x.get("href", "")))}">{esc(text(x))}</a></p>')
        for t in CFG.get('sideButtons') or []:
            parts = [re.sub(r'^<p>(<a [^>]+>' + re.escape(esc(t)) + r'</a>)</p>$', r'<p><em>\1</em></p>', x) for x in parts]
        rows.append([''.join(parts)])
    out = [block('fm-hero' + (' ' + CFG['hero'] if CFG.get('hero') else ''), rows)] if lead or len(rows) > 1 else []
    out += [form_block(f) for f in forms]
    return '\n'.join(out)


def offices_section(sec):
    head = has(sec, 'ct-head')
    parts = prose(head[0]) if head else []
    rows = []
    for o in has(sec, 'ct-office'):
        rows.append([''.join(prose(o))])
    out = parts + [block('fm-offices', rows)]
    if 'ct-cream' in cls(sec) or has(sec, 'ct-cream'):
        out.append(block('section-metadata', [['style', 'cream']]))
    return '\n'.join(out)


# --- cluster-form-2: full-page form siblings (free-trial) -------------------------------------------
# siblings.json `sections` maps a migrated section id to an existing site block (reused unchanged) or
# a form-template block; images are rehosted under DA media/<mediaScope>/ (da-media-upload) with the
# file name derived from the source URL (`mediaNames` renames, e.g. an .svg served under .png).
# `submitHref`: the trial form's submit link (sv-hero trial); `tags`: resource-card type line ->
# trailing tag word (<code>); `rotate`: slick clones -> the first real slide index; `portraits`:
# customer logo alt -> portrait file (the live slide photos lazy-loaded outside the capture).
MS = 'https://content.da.live/aemcoder/3055ed88/media/' + CFG.get('mediaScope', '') + '/'


def media_url(src):
    from urllib.parse import urlparse
    u = urlparse(src)
    name = u.path.rsplit('/', 1)[1]
    if '/is/image/' in u.path:
        name += '.png'
    name = (CFG.get('mediaNames') or {}).get(name, name)
    return MS + name


def img_p(i):
    return f'<p><img src="{html.escape(media_url(i.get("src")))}" alt="{html.escape(i.get("alt") or "")}"></p>'


def heads(scope):
    return [x for x in prose(scope) if re.match(r'<h[1-6]>', x)]


def cta(a, kind='strong'):
    return f'<p><{kind}><a href="{html.escape(absu(a.get("href", "")))}">{inline(a)}</a></{kind}></p>'


def x_hero_trial(sec, variant):
    col = has(sec, 'ct-col-6')[0]
    form = sec.xpath('.//form')[0]
    out = []
    for el in col:
        if el.xpath('.//form'):
            continue
        out += prose(el) if not re.match(r'^h[1-6]$', el.tag or '') else [f'<{el.tag}>{inline(el)}</{el.tag}>']
    sub = form.xpath('.//button')
    if sub:
        out.append(f'<p><strong><a href="{html.escape(CFG.get("submitHref", ""))}">{esc(text(sub[0]))}</a></strong></p>')
    tip = has(form, 'ct-tip__box')
    if tip:
        out.append(f'<p>{inline(tip[0])}</p>')
    out += [f'<p>{inline(c)}</p>' for c in has(form, 'ct-consent') if text(c)]
    imgs = [img_p(i) for i in has(sec, 'ct-media')[0].xpath('.//img')] if has(sec, 'ct-media') else []
    return block(variant, [[''.join(out), ''.join(imgs)]])


def x_logos(sec, variant):
    seen, imgs = set(), []
    for i in sec.xpath('.//img'):
        if i.get('src') not in seen:
            seen.add(i.get('src'))
            imgs.append(img_p(i))
    return block(variant, [[''.join(heads(sec)) + ''.join(imgs)]])


def card_rows(sec):
    rows = []
    for c in has(sec, 'ct-office'):
        im = c.xpath('.//img')
        body = []
        for el in c.iter():
            if not isinstance(el.tag, str) or el.xpath('ancestor::a'):
                continue
            if re.match(r'^h[1-6]$', el.tag):
                body.append(f'<{el.tag}>{inline(el)}</{el.tag}>')
            elif el.tag == 'p' and text(el):
                links = el.xpath('./a')
                if len(links) == 1 and text(links[0]) == text(el) and 'ct-card__cta' not in cls(el):
                    body.append(cta(links[0], CFG.get('cardCta', 'strong')))
                else:
                    line = inline(el)
                    tag = (CFG.get('tags') or {}).get(text(el))
                    if tag and line.endswith(' ' + tag):
                        line = line[:-len(tag)] + f'<code>{esc(tag)}</code>'
                    body.append(f'<p>{line}</p>')
        rows.append([img_p(im[0]) if im else '', ''.join(body)])
    return rows


def x_cards(sec, variant):
    head = has(sec, 'ct-head')
    return '\n'.join((prose(head[0]) if head else []) + [block(variant, card_rows(sec))])


def x_quotes(sec, variant):
    eyebrow = [f'<p>{inline(p)}</p>' for p in sec.xpath('./div/div[contains(@class,"ct-text")]/p')[:1]]
    slides, seen, cur = [], set(), None
    for el in sec.xpath('./div/*')[1:]:
        im = el.xpath('.//img')
        if im and im[0].get('alt'):
            cur = {'logo': im[0], 'photo': None, 'parts': []}
            slides.append(cur)
        elif im and cur:
            cur['photo'] = im[0]
        elif cur is not None and el.tag == 'blockquote':
            cur['parts'].append(f'<blockquote>{"".join(prose(el))}</blockquote>')
        elif cur is not None and el.xpath('.//a'):
            a = el.xpath('.//a')[0]
            cur['parts'].append(f'<p><a href="{html.escape(absu(a.get("href", "")))}">{inline(a)}</a></p>')
        elif cur is not None:
            cur['parts'] += prose(el)
    uniq = []
    for s in slides:
        if s['parts'] and s['parts'][0] not in seen:
            seen.add(s['parts'][0])
            uniq.append(s)
    r = CFG.get('rotate', 0)
    uniq = uniq[r:] + uniq[:r]
    rows = []
    for s in uniq:
        ph = s['photo']
        photo = img_p(ph) if ph is not None else ''
        port = (CFG.get('portraits') or {}).get(s['logo'].get('alt'))
        if not photo and port:
            photo = f'<p><img src="{html.escape(MS + port)}" alt=""></p>'
        rows.append([photo, img_p(s['logo']) + ''.join(s['parts'])])
    return '\n'.join(eyebrow + [block(variant, rows)])


def x_prose(sec, variant):
    out = []
    for el in sec.xpath('./div/*'):
        if re.match(r'^h[1-6]$', el.tag):
            out.append(f'<{el.tag}>{inline(el)}</{el.tag}>')
        elif el.xpath('.//img'):
            out += [img_p(i) for i in el.xpath('.//img')]
        else:
            for p in el.xpath('.//p'):
                links = p.xpath('./a')
                if len(links) == 1 and text(links[0]) == text(p):
                    out.append(cta(links[0]))
                elif text(p):
                    out.append(f'<p>{inline(p)}</p>')
    return block(variant, [[''.join(out)]])


def x_faq(sec, variant):
    rows = [heads(sec)[:1]]
    for q in has(sec, 'ct-faq__q'):
        ans = []
        for el in q.itersiblings():
            if 'ct-faq__q' in cls(el):
                break
            ans += prose(el)
        rows.append([f'<{q.tag}>{esc(text(q))}</{q.tag}>', ''.join(ans)])
    return block(variant, rows)


XMAP = {'hero-trial': x_hero_trial, 'logos': x_logos, 'cards': x_cards, 'quotes': x_quotes,
        'prose': x_prose, 'faq': x_faq}


wrap = has(doc, 'ct-wrap')
root = wrap[0] if wrap else doc.xpath('//main')[0]
S = []
for sec in root.xpath('./section'):
    if 'ct-promo' in cls(sec):
        print(f'encode: section {sec.get("id")} is the site-chrome promo strip -> nav document, skipped')
        continue
    spec = (CFG.get('sections') or {}).get(sec.get('id'))
    if spec:
        kind, variant = spec.split(' ', 1)
        S.append(XMAP[kind](sec, variant))
        if (CFG.get('sectionStyle') or {}).get(sec.get('id')):
            S[-1] += '\n' + block('section-metadata', [['style', CFG['sectionStyle'][sec.get('id')]]])
        continue
    if CFG.get('embed') and sec.xpath('.//iframe'):
        S.append('\n'.join(block('fm-embed', [[f'<p><a href="{html.escape(f.get("src", ""))}">{esc(f.get("title") or f.get("name") or "Embed")}</a></p>']])
                           for f in sec.xpath('.//iframe')))
        continue
    if sec.xpath('.//form'):
        S.append(hero_section(sec))
    elif has(sec, 'ct-office'):
        S.append(offices_section(sec))
    else:
        # unknown composition: prose as default content (flag it in the unit report)
        print(f'encode: WARN section {sec.get("id")} has no fm- mapping, default content')
        S.append('\n'.join(prose(sec)))
        if 'ct-cream' in cls(sec):
            S[-1] += '\n' + block('section-metadata', [['style', 'cream']])

md = meta.get('metadata', {})
mrows = {'Title': md.get('title', ''), 'Description': md.get('description', ''),
         'Canonical': md.get('canonical', ''), 'nav': '/nav-slim', 'footer': '/footer-legal', 'promo': 'off'}
for k, v in (CFG.get('meta') or {}).items():
    mrows[k] = v
for kv in a.meta_row:
    k, v = kv.split('=', 1)
    mrows[k] = v
S.append(block('metadata', [[esc(k), esc(html.unescape(v))] for k, v in mrows.items() if v]))

body = '<body>\n<header></header>\n<main>\n' + ''.join(f'<div>\n{s}\n</div>\n' for s in S) + '</main>\n<footer></footer>\n</body>\n'
os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
open(a.out, 'w', encoding='utf-8').write(body)
print(f'encode: {a.out} — {len(S) - 1} section(s)')
