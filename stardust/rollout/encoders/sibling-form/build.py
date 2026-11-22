#!/usr/bin/env python3
"""sibling-form builder: hydrated capture -> encoder-ready sibling render (Path A') for the `form`
template (forms and sign-up pages), archetype `contact`.

Forks the gated archetype prototype stardust/prototypes/contact-proposed.html (head, canon chrome and
the ct-* template classes the archetype encoder stardust/rollout/encoders/archetype-form/encode.py
reads: main .ct-wrap > section, .ct-form / .ct-field / .ct-label / .ct-tip__box / .ct-field--half /
.ct-consent / .ct-submit / .ct-formhidden / .ct-siderow) and injects ONE page's content VERBATIM from
its hydrated capture stardust/current/pages/<slug>.html (decoded as UTF-8). Field sets are read
generically (any label/legend + input/select/textarea/radio tiles/checkbox), so every form sibling
(login, register, demo, free-trial, instapage-form-*) builds with the same code.

Section mapping (capture regions in DOM order):
  promo strip  [role=complementary] in main  -> section.ct-promo   (variant ct-promo; NO archetype analogue:
                                                carried, declared deviation — live site chrome)
  main content holding a form                -> section.ct-sec hero: ct-col-6 = lead (logo, headings, text,
                                                leading in-form headings/notes lifted above the form) +
                                                .ct-formwrap > form.ct-form (+ display:none duplicate forms in
                                                .ct-formhidden[hidden]); ct-col-5 = .ct-media (images) +
                                                one .ct-siderow per after-form link/text group
  form in a dialog outside main (demo)       -> the same hero, variant ct-hero--modal
  main content without a form                -> section.ct-sec.ct-prose (headings/text/links/images) —
                                                iframes -> section.ct-embed (variant; NO archetype analogue)
Chrome: the archetype header/footer are kept only when the capture has them (header-* nav / footer in
main); demo's header CTA labels+hrefs are taken from the capture. Pages whose live page has no site
chrome (register, instapage-form-*) render without header/footer (variant ct-bare).
Variants also come from stardust/.work/render/form/variance.json (live probe, per sibling): instapage
embed family (proxima nova, flat fields) -> ct-instapage; compact 26px heading -> ct-compact;
form width -> ct-form--narrow (≤460) / ct-form--mid (≤700) / ct-form--full (≥1000); tinted hero -> ct-tint.

Usage (from the project root):
  python3 -I stardust/rollout/encoders/sibling-form/build.py <slug>… [--out-dir stardust/.work/render/form]
Per slug: <out-dir>/<slug>.html (pass to migrate.mjs render --source <slug>=<file>) and
<out-dir>/<slug>.build.json: modules[], variants[], deviations[] (contentDeviations shape),
counts{source, render}, drops{}, words{missing, extra} (multiset diff capture content vs render main).
Idempotent. Exit 0 when every slug built with no count drop and no missing word, 1 otherwise.
"""
import collections
import copy
import html
import json
import os
import re
import sys

from lxml import html as LH

PROTO = 'stardust/prototypes/contact-proposed.html'
CURRENT = 'stardust/current/pages'
SKIP = ('script', 'style', 'noscript', 'svg', 'template', 'link', 'meta', 'path')
HEADS = ('h1', 'h2', 'h3', 'h4', 'h5', 'h6')
WS = re.compile(r'[ \t\r\n]+')  # ASCII whitespace only: &nbsp; stays verbatim


def esc(s):
    return html.escape(s or '', quote=False)


def attr(s):
    return html.escape(s or '', quote=True)


def norm(s):
    return WS.sub(' ', s or '').strip()


def tag(el):
    return el.tag if isinstance(el.tag, str) else ''


def txt(el):
    return norm(''.join(t for t in el.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::svg)]')))


def classes(el):
    return el.get('class') or ''


def hidden_style(el):
    return bool(re.search(r'display:\s*none', el.get('style') or '')) or el.get('hidden') is not None


def hidden_between(el, stop):
    """el or an ancestor below `stop` is display:none / [hidden]"""
    cur = el
    while cur is not None and cur is not stop:
        if hidden_style(cur):
            return True
        cur = cur.getparent()
    return False


CONTROL = './/input[not(@type="hidden")]|.//select|.//textarea'


def controls(el):
    return el.xpath(CONTROL)


# ---------------------------------------------------------------- inline serialisation (verbatim text)
def inline(el, skip=None):
    out = [esc(el.text or '')]
    for c in el:
        t = tag(c)
        if skip is not None and skip(c):
            out.append(esc(c.tail or ''))
            continue
        if t in SKIP or not t:
            pass
        elif t == 'a':
            h = c.get('href')
            ha = f' href="{attr(h)}"' if h is not None else ''
            tg = ' target="_blank" rel="noopener noreferrer"' if c.get('target') == '_blank' else ''
            out.append(f'<a class="ct-link"{ha}{tg}>{inline(c, skip)}</a>')
        elif t in ('strong', 'b'):
            out.append(f'<strong>{inline(c, skip)}</strong>')
        elif t in ('em', 'i'):
            out.append(f'<em>{inline(c, skip)}</em>')
        elif t == 'br':
            out.append('<br>')
        elif t in ('sup', 'sub'):
            out.append(f'<{t}>{inline(c, skip)}</{t}>')
        else:
            out.append(inline(c, skip))
        out.append(esc(c.tail or ''))
    return WS.sub(' ', ''.join(out)).strip()


def own_text(el):
    """direct text of el (its .text and its children's tails) — a text-bearing wrapper div"""
    return norm((el.text or '') + ''.join((c.tail or '') for c in el))


def link_only(el):
    """every non-blank text node of el sits inside an <a> (a link group, not a paragraph)"""
    ts = [t for t in el.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::svg)]') if norm(t)]
    return bool(ts) and all(t.getparent() is not None and (tag(t.getparent()) == 'a' or t.getparent().xpath('ancestor::a')) for t in ts) \
        and len(el.xpath('.//a')) > 1


INLINE_TAGS = ('a', 'strong', 'b', 'em', 'i', 'br', 'span', 'sup', 'sub', 'small', 'code')


def is_text_leaf(el):
    """a block whose children are all inline (so it is one paragraph boundary)"""
    if not txt(el):
        return False
    for d in el.iter():
        if d is el or not tag(d):
            continue
        if tag(d) in SKIP:
            continue
        if tag(d) not in INLINE_TAGS and not (tag(d) == 'div' and not d.xpath('.//div|.//p|.//h1|.//h2|.//h3|.//h4|.//h5|.//h6')
                                                and d.getparent() is not None and tag(d.getparent()) in INLINE_TAGS):
            return False
    return True


# ---------------------------------------------------------------- form parsing
class Ids:
    def __init__(self):
        self.n = 0
        self.used = set()

    def make(self, name):
        self.n += 1
        base = re.sub(r'[^a-z0-9]+', '-', (name or 'f').lower()).strip('-') or 'f'
        return f'ct{self.n}-{base}'


def label_of(unit, ctl):
    lab = []
    if ctl is not None and ctl.get('id'):
        lab = unit.xpath(f'.//label[@for="{ctl.get("id")}"]')
    if not lab:
        lab = unit.xpath('.//legend') or unit.xpath('.//label')
    return lab[0] if lab else None


def parse_form(form):
    """ordered items of one form: ('unit', dict) | ('head', el) | ('note', html, el) | ('link', el) | ('submit', text)"""
    items = []

    def unit_dict(u, kind):
        d = {'kind': kind, 'el': u, 'hidden': hidden_between(u, form), 'tip': None, 'suffix': None}
        if kind == 'tiles':
            radios = u.xpath('.//input[@type="radio"]')
            d['name'] = radios[0].get('name') if radios else ''
            lg = u.xpath('.//legend')
            d['label'] = txt(lg[0]) if lg else ''
            tiles = []
            for r in radios:
                lab = r.xpath('ancestor::label[1]')
                lab = lab[0] if lab else r.getparent()
                parts = [norm(x) for x in lab.xpath('.//text()[not(ancestor::svg)]') if norm(x)]
                tiles.append({'value': r.get('value') or '', 'label': parts[0] if parts else '',
                              'desc': ' '.join(parts[1:]), 'checked': r.get('checked') is not None})
            d['tiles'] = tiles
        elif kind == 'check':
            cb = u.xpath('.//input[@type="checkbox"]')[0]
            d['name'], d['value'] = cb.get('name') or '', cb.get('value') or ''
            lab = label_of(u, cb)
            d['label_html'] = inline(lab) if lab is not None else ''
            d['checked'] = cb.get('checked') is not None
        else:
            ctl = controls(u)[0]
            d['ctl'] = ctl
            lab = label_of(u, ctl)
            d['label'] = txt(lab) if lab is not None else ''
            suf = [p for p in u.xpath('.//p') if txt(p) and not p.xpath('ancestor::label')]
            d['suffix'] = txt(suf[0]) if suf else None
            # an input-group submit button inside the field (newsletter / teaser-inline): rendered in the field
            btn = [x for x in u.xpath('.//button') if txt(x)]
            d['button'] = txt(btn[0]) if btn else None
        # inline validation messages carried verbatim (shown/hidden as captured)
        d['alerts'] = [(txt(m), hidden_style(m)) for m in u.xpath('.//*[@role="alert"]') if txt(m)]
        return d

    def walk(el):
        for c in el:
            t = tag(c)
            if not t or t in ('script', 'style', 'noscript', 'svg', 'template'):
                continue
            if c.get('role') == 'tooltip':
                tip = txt(c)
                for it in reversed(items):
                    if it[0] == 'unit':
                        if tip and not it[1]['tip']:
                            it[1]['tip'] = tip
                        break
                continue
            if t == 'fieldset' or (re.search(r'StyledField|FormField', classes(c)) and controls(c)
                                   and not c.xpath('ancestor::fieldset')):
                ctl = controls(c)
                if not ctl:
                    walk(c)
                    continue
                if t != 'fieldset' and len(ctl) > 1 and not c.xpath('.//input[@type="radio"]'):
                    walk(c)
                    continue
                if c.xpath('.//input[@type="radio"]'):
                    items.append(('unit', unit_dict(c, 'tiles')))
                elif c.xpath('.//input[@type="checkbox"]'):
                    items.append(('unit', unit_dict(c, 'check')))
                else:
                    items.append(('unit', unit_dict(c, 'field')))
                continue
            if t == 'input' and (c.get('type') or 'text') != 'hidden':
                # a bare control outside any field wrapper (honeypot FauxUsername / FauxPassword)
                items.append(('unit', {'kind': 'field', 'el': c, 'ctl': c, 'label': '', 'tip': None, 'suffix': None,
                                       'hidden': True}))
                continue
            if t in HEADS:
                if txt(c):
                    items.append(('head', c))
                continue
            if t == 'button':
                if (c.get('type') or 'submit') == 'submit' and txt(c):
                    items.append(('submit', txt(c)))
                elif txt(c):
                    items.append(('note', f'<button type="button" class="ct-link">{esc(txt(c))}</button>', c))
                continue
            if t == 'a' and not c.xpath('ancestor::p'):
                if txt(c):
                    items.append(('link', c))
                continue
            if controls(c) or c.xpath('.//button'):
                if own_text(c):
                    # text-bearing wrapper around a nested field (demo: "Not in United States? Change location"):
                    # the text is one note, the nested field block(s) follow it in order
                    nested = []

                    def skipf(x):
                        if x.get('role') == 'tooltip' or (tag(x) in ('div', 'fieldset') and controls(x) and not own_text(x)):
                            nested.append(x)
                            return True
                        return False
                    items.append(('note', inline(c, skip=skipf), c))
                    walk([x for x in nested if x.get('role') != 'tooltip'])
                    continue
                walk(c)
                continue
            if (t == 'p' or is_text_leaf(c)) and txt(c) and not link_only(c):
                items.append(('note', inline(c), c))
                continue
            walk(c)

    walk(form)
    return items


# ---------------------------------------------------------------- render pieces
def render_unit(u, ids):
    hid = ' hidden' if u.get('hidden') else ''
    if u['kind'] == 'tiles':
        fid = ids.make(u['name'])
        tiles = ''.join(
            f'<label class="ct-tile"><span class="ct-tile__label" title="{attr(t["label"])}">{esc(t["label"])}</span>'
            + (f'<span class="ct-tile__desc">{esc(t["desc"])}</span>' if t['desc'] else '')
            + f'<input class="ct-sr" name="{attr(u["name"])}" type="radio" value="{attr(t["value"])}"'
            + (' checked' if t['checked'] else '') + '></label>'
            for t in u['tiles'])
        return (f'<div class="ct-field ct-field--full"{hid}><fieldset class="ct-fieldset" id="{fid}">'
                f'<legend class="ct-label">{esc(u["label"])}</legend><div class="ct-wrapper">'
                f'<div class="ct-tiles" role="radiogroup">{tiles}</div></div></fieldset></div>')
    if u['kind'] == 'check':
        fid = ids.make(u['name'])
        return (f'<div class="ct-field ct-field--full ct-check"{hid}><input class="ct-checkbox" id="{fid}" type="checkbox" '
                f'name="{attr(u["name"])}" value="{attr(u["value"])}"' + (' checked' if u['checked'] else '')
                + f'><p class="ct-check__text"><label for="{fid}">{u["label_html"]}</label></p></div>')
    ctl = u['ctl']
    name = ctl.get('name') or ''
    fid = ids.make(name)
    cls = ['ct-field', 'ct-field--full']
    if name in ('FirstName', 'LastName'):
        cls[1] = 'ct-field--half'
    if u['tip']:
        cls.append('ct-field--tip')
    if u['suffix']:
        cls.append('ct-field--suffix')
    a = f'class="ct-input" id="{fid}" name="{attr(name)}"'
    for k in ('type', 'placeholder', 'autocomplete', 'maxlength', 'pattern', 'inputmode'):
        if ctl.get(k) is not None and tag(ctl) == 'input':
            a += f' {k}="{attr(ctl.get(k))}"'
    if ctl.get('required') is not None:
        a += ' required'
    if ctl.get('aria-label'):
        a += f' aria-label="{attr(ctl.get("aria-label"))}"'
    if tag(ctl) == 'select':
        opts = ''.join(f'<option value="{attr(o.get("value") or "")}"' + (' selected' if o.get('selected') is not None else '')
                       + f'>{esc(norm(o.text_content()))}</option>' for o in ctl.xpath('.//option'))
        control = f'<div class="ct-select"><select {a.replace("ct-input", "ct-input ct-select__el")}>{opts}</select></div>'
    elif tag(ctl) == 'textarea':
        control = f'<textarea {a.replace("ct-input", "ct-input ct-textarea")}>{esc(ctl.text or "")}</textarea>'
    else:
        control = f'<input {a} value="{attr(ctl.get("value") or "")}">'
    suffix = f'<p class="ct-suffix">{esc(u["suffix"])}</p>' if u['suffix'] else ''
    if u.get('button'):
        # inline submit (input group): the archetype encoder reads the first .ct-submit as the form's submit row
        cls.append('ct-field--inline-submit')
        suffix += f'<button type="submit" class="za-btn za-btn--primary ct-submit"><span><span>{esc(u["button"])}</span></span></button>'
    label = f'<label class="ct-label" id="{fid}--label" for="{fid}">{esc(u["label"])}</label>' if u['label'] else ''
    tip = (f'<div class="ct-tip" aria-hidden="true"><div class="ct-tip__box" id="{fid}-tip" role="tooltip">{esc(u["tip"])}</div></div>'
           if u['tip'] else '')
    msgs = ''.join(f'<div class="ct-msg" role="alert"{" hidden" if h else ""}>{esc(m)}</div>' for m, h in u.get('alerts') or [])
    return f'<div class="{" ".join(cls)}"{hid}>{label}<div class="ct-wrapper">{control}{suffix}</div>{msgs}{tip}</div>'


def render_form(items, form, ids):
    body, submit = [], None
    for it in items:
        if it[0] == 'unit':
            body.append(render_unit(it[1], ids))
        elif it[0] == 'head':
            h = it[1]
            body.append(f'<div class="ct-field ct-field--full ct-note"><{tag(h)} class="ct-formhead">{inline(h)}</{tag(h)}></div>')
        elif it[0] == 'note':
            consent = 'consent' if re.search(r'(?i)privacy|consent|agree', norm(LH.fromstring(f'<p>{it[1]}</p>').text_content())) else 'note'
            hid = ' hidden' if hidden_between(it[2], form) else ''
            inner = it[1]
            body.append(f'<div class="ct-field ct-field--full ct-note"{hid}><p class="ct-{consent}">{inner}</p></div>')
        elif it[0] == 'link':
            a = it[1]
            ha = f' href="{attr(a.get("href"))}"' if a.get('href') is not None else ''
            body.append(f'<div class="ct-field ct-field--full ct-note"><p><a class="ct-link"{ha}>{inline(a)}</a></p></div>')
        elif it[0] == 'submit':
            submit = it[1]
    fid = form.get('id')
    if fid in ids.used:
        fid = None  # the source repeats the id on its duplicate form; ids stay unique in the render
    ids.used.add(fid)
    out = f'<form class="ct-form"{f" id={chr(34)}{attr(fid)}{chr(34)}" if fid else ""} novalidate><div class="ct-grid2">' + ''.join(body) + '</div>'
    if submit:
        out += f'<div class="ct-actions"><button type="submit" class="za-btn za-btn--primary ct-submit"><span><span>{esc(submit)}</span></span></button></div>'
    return out + '</form>'


# ---------------------------------------------------------------- page-level walk (outside forms)
def real_img(i):
    s = i.get('src') or ''
    return s and not s.startswith('data:') and not re.search(r'cookielaw|doubleclick|facebook|bat\.bing|pixel', s)


def walk_content(el, out, chrome):
    for c in el:
        t = tag(c)
        if not t or t in SKIP or any(c is x for x in chrome):
            continue
        if t == 'form':
            out.append(('form', c))
            continue
        if t in HEADS:
            if txt(c):
                out.append(('head', c))
            continue
        if t == 'img':
            if real_img(c):
                out.append(('img', c))
            continue
        if t == 'iframe':
            if c.get('src') and 'googletagmanager' not in c.get('src'):
                out.append(('iframe', c))
            continue
        if t == 'a':
            if txt(c) and [i for i in c.xpath('.//img') if real_img(i)]:
                out.append(('card', c))  # whole-card anchor (image + text lines)
            elif txt(c) or c.xpath('.//img') or c.get('aria-label'):
                out.append(('link', c))
            continue
        if t == 'button':
            if c.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6'):
                out.append(('qhead', c))  # accordion trigger wrapping a heading (FAQ question)
            elif txt(c) or [i for i in c.xpath('.//img') if real_img(i)]:
                out.append(('button', c))
            continue
        if c.xpath('.//form|.//img|.//iframe') or link_only(c) or not ((t == 'p' or is_text_leaf(c)) and txt(c)):
            walk_content(c, out, chrome)
            continue
        out.append(('text', c))


def logo_html(proto):
    lg = proto.xpath('//*[@id="za-hdr-d"]//a[contains(@class,"za-logo")]')
    return LH.tostring(lg[0], encoding='unicode', with_tail=False) if lg else ''


class Page:
    def __init__(self, slug):
        self.slug = slug
        self.modules, self.variants, self.deviations = [], [], []

    def module(self, m):
        if m not in self.modules:
            self.modules.append(m)

    def variant(self, v):
        if v not in self.variants:
            self.variants.append(v)

    def deviation(self, kind, source, target, reason):
        self.deviations.append({'kind': kind, 'source': source, 'target': target, 'reason': reason})


def text_p(el, cls='ct-p'):
    return f'<p class="{cls}">{inline(el)}</p>'


def link_p(a, logo=''):
    h = a.get('href')
    ha = f' href="{attr(h)}"' if h is not None else ''
    tg = ' target="_blank" rel="noopener noreferrer"' if a.get('target') == '_blank' else ''
    if not txt(a) and not a.xpath('.//img'):
        # logo link: the archetype's logo mark
        al = a.get('aria-label') or 'Zendesk'
        return logo.replace('class="za-logo"', f'class="za-logo ct-formlogo" aria-label="{attr(al)}"', 1) if logo else f'<a class="ct-formlogo"{ha} aria-label="{attr(al)}"></a>'
    if a.xpath('.//img'):
        im = a.xpath('.//img')[0]
        return f'<p class="ct-linkp"><a class="ct-link"{ha}{tg}><img src="{attr(im.get("src"))}" alt="{attr(im.get("alt") or "")}" loading="lazy"></a></p>'
    return f'<p class="ct-linkp"><a class="ct-link"{ha}{tg}>{inline(a)}</a></p>'


def img_html(i):
    a = f'src="{attr(i.get("src"))}" alt="{attr(i.get("alt") or "")}"'
    for k in ('width', 'height'):
        if i.get(k):
            a += f' {k}="{attr(i.get(k))}"'
    return f'<div class="ct-media"><img {a} loading="lazy"></div>'


def hero_section(pg, items, sid, ids, logo, extra_cls):
    """items: page-level items of one region that holds >= 1 form"""
    forms_idx = [i for i, it in enumerate(items) if it[0] == 'form']
    first, last = forms_idx[0], forms_idx[-1]
    lead, side, media = [], [], []
    for it in items[:first]:
        if it[0] == 'img':
            media.append(img_html(it[1]))
        elif it[0] == 'head':
            h = it[1]
            lead.append(f'<{tag(h)} class="ct-{"h1" if tag(h) == "h1" else "lead-h"}">{inline(h)}</{tag(h)}>')
        elif it[0] == 'text':
            lead.append(f'<div class="za-text ct-text">{text_p(it[1])}</div>')
        elif it[0] == 'link':
            lead.append(link_p(it[1], logo))
        elif it[0] == 'button':
            lead.append(button_html(it[1]))
        elif it[0] == 'iframe':
            lead.append(iframe_html(it[1]))
        else:
            lead.append(piece_html(it, logo))
    formhtml = []
    n_visible = 0
    for it in items[first:last + 1]:
        if it[0] != 'form':
            # content between two forms stays between them, inside the form column
            if it[0] == 'text':
                formhtml.append(f'<div class="za-text ct-text">{text_p(it[1])}</div>')
            elif it[0] == 'head':
                formhtml.append(f'<{tag(it[1])}>{inline(it[1])}</{tag(it[1])}>')
            elif it[0] == 'link':
                formhtml.append(link_p(it[1], logo))
            else:
                formhtml.append(piece_html(it, logo))
            continue
        f = it[1]
        fitems = parse_form(f)
        hidden = any(hidden_style(a) for a in [f] + list(f.iterancestors()))
        if not hidden:
            # leading headings / notes of the form lift into the lead column (the encoder reads the lead outside forms)
            k = 0
            while k < len(fitems) and fitems[k][0] in ('head', 'note'):
                k += 1
            for x in fitems[:k]:
                if x[0] == 'head':
                    h = x[1]
                    lead.append(f'<{tag(h)} class="ct-{"h1" if tag(h) == "h1" else "lead-h"}">{inline(h)}</{tag(h)}>')
                else:
                    lead.append(f'<div class="za-text ct-text"><p class="ct-p">{x[1]}</p></div>')
            if k:
                pg.variant('ct-lead--lifted')
            fitems = fitems[k:]
        if any(x[0] == 'unit' and x[1]['kind'] == 'tiles' for x in fitems):
            pg.module('form-choice-tiles')
        fh = render_form(fitems, f, ids)
        pg.module('fm-form')
        if hidden:
            hid_anc = next((a for a in [f] + list(f.iterancestors()) if hidden_style(a)), None)
            hidn = f' id="{attr(hid_anc.get("id"))}"' if hid_anc is not None and hid_anc.get('id') else ''
            formhtml.append(f'<div class="ct-formhidden"{hidn} aria-hidden="true" hidden><div>{fh}</div></div>')
            pg.variant('ct-dupform')
        else:
            n_visible += 1
            formhtml.append(f'<div class="ct-formwrap" id="form-{ids.make("wrap")}">{fh}</div>')
    # after-form content -> side rows, one per parent group of consecutive items
    groups, cur, cur_parent = [], [], None
    for it in items[last + 1:]:
        par = it[1].getparent()
        while par is not None and len(par) == 1 and par.getparent() is not None:
            par = par.getparent()
        if cur and par is not cur_parent:
            groups.append(cur)
            cur = []
        cur.append(it)
        cur_parent = par
    if cur:
        groups.append(cur)
    for g in groups:
        parts = []
        for it in g:
            if it[0] == 'img':
                media.append(img_html(it[1]))
            elif it[0] == 'head':
                parts.append(f'<{tag(it[1])} class="ct-h3">{inline(it[1])}</{tag(it[1])}>')
            elif it[0] == 'text':
                parts.append(f'<div class="za-text ct-text">{text_p(it[1])}</div>')
            elif it[0] == 'link':
                parts.append(link_p(it[1], logo))
            elif it[0] == 'button':
                parts.append(button_html(it[1]))
            elif it[0] == 'iframe':
                parts.append(iframe_html(it[1]))
            else:
                parts.append(piece_html(it, logo))
        if parts:
            side.append(f'<div class="za-row ct-siderow"><div class="za-col">{"".join(parts)}</div></div>')
    if side:
        pg.variant('ct-siderow--links')
    if media:
        pg.variant('ct-hero--media')
    if not side and not media:
        pg.variant('ct-hero--stack')
    pg.module('fm-hero')
    col5 = ''.join(media) + ''.join(side)
    return (f'<section class="za-section ct-sec{extra_cls}" id="{attr(sid)}">\n<div class="za-container ct-rel">\n'
            f'<div class="za-row ct-hero">\n<div class="za-col ct-col-6">\n' + '\n'.join(lead) + '\n' + '\n'.join(formhtml)
            + '\n</div>\n<div class="za-col ct-col-1"></div>\n<div class="za-col ct-col-5">' + col5 + '</div>\n</div>\n</div>\n</section>\n')


def iframe_html(f):
    a = f'src="{attr(f.get("src"))}"'
    for k in ('title', 'name', 'width', 'height', 'allow', 'allowfullscreen'):
        if f.get(k) is not None:
            a += f' {k}="{attr(f.get(k))}"' if f.get(k) else f' {k}'
    return f'<div class="ct-embed__frame"><iframe {a} loading="lazy"></iframe></div>'


def prose_section(pg, items, sid, logo, extra_cls):
    parts = [piece_html(it, logo) for it in items]
    return (f'<section class="za-section ct-sec{extra_cls}" id="{attr(sid)}">\n<div class="za-container ct-rel">\n'
            + '\n'.join(parts) + '\n</div>\n</section>\n')


# ---------------------------------------------------------------- landing-like pages (variant ct-sections)
def button_html(b):
    """a non-submit button outside forms: text verbatim; an image-only button (carousel tab) keeps its image(s)"""
    imgs = ''.join(f'<img src="{attr(i.get("src"))}" alt="{attr(i.get("alt") or "")}" loading="lazy">'
                   for i in b.xpath('.//img[not(ancestor::noscript)]') if real_img(i))
    al = f' aria-label="{attr(b.get("aria-label"))}"' if b.get('aria-label') and not txt(b) else ''
    cls = 'ct-link ct-tab' if imgs and not txt(b) else 'ct-link'
    return f'<p class="ct-linkp"><button type="button" class="{cls}"{al}>{imgs}{esc(txt(b))}</button></p>'


def qhead_html(b):
    """accordion trigger (button > heading): rendered heading > button (valid ARIA accordion), text verbatim"""
    h = b.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6')[0]
    ex = b.get('aria-expanded')
    exa = f' aria-expanded="{attr(ex)}"' if ex is not None else ''
    return f'<{tag(h)} class="ct-faq__q"><button type="button" class="ct-faq__btn"{exa}>{inline(h)}</button></{tag(h)}>'


BLOCKS = ('p', 'div', 'li', 'blockquote') + HEADS


def card_html(a):
    """whole-card anchor -> image(s) + one <p> per text line (text nodes grouped by nearest block ancestor);
    the card href moves to its last line (the CTA), so every word stays outside a nested anchor"""
    imgs = ''.join(img_html(i) for i in a.xpath('.//img[not(ancestor::noscript)]') if real_img(i))
    groups, keys = [], []
    for t in a.xpath('.//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::noscript) and not(ancestor::svg)]'):
        if not norm(t):
            continue
        par = t.getparent()
        blk = next((x for x in [par] + list(par.iterancestors()) if x is a or tag(x) in BLOCKS), a)
        if not keys or keys[-1] is not blk:
            keys.append(blk)
            groups.append([])
        groups[-1].append(str(t))
    lines = [esc(norm(' '.join(g))) for g in groups]
    h = a.get('href')
    ha = f' href="{attr(h)}"' if h is not None else ''
    tg = ' target="_blank" rel="noopener noreferrer"' if a.get('target') == '_blank' else ''
    ps = [f'<p class="ct-card__line">{x}</p>' for x in lines[:-1]]
    if lines:
        ps.append(f'<p class="ct-card__cta"><a class="ct-link ct-arrowlink"{ha}{tg}>{lines[-1]}</a></p>')
    return f'<div class="ct-linkcard">{imgs}{"".join(ps)}</div>'


def piece_html(it, logo):
    k, el = it
    if k == 'head':
        return f'<{tag(el)}>{inline(el)}</{tag(el)}>'
    if k == 'text':
        if tag(el) == 'blockquote':
            return f'<blockquote class="ct-quote">{text_p(el)}</blockquote>'
        return f'<div class="za-text ct-text">{text_p(el)}</div>'
    if k == 'link':
        return link_p(el, logo)
    if k == 'button':
        return button_html(el)
    if k == 'qhead':
        return qhead_html(el)
    if k == 'card':
        return card_html(el)
    if k == 'img':
        return img_html(el)
    if k == 'iframe':
        return iframe_html(el)
    raise ValueError(f'unrenderable item kind {k}')  # never drop silently


def head_level(el):
    return int(tag(el)[1])


def card_split(items):
    """(head items, [card items…]) when the section is a card grid: >= 2 whole-card anchors, or >= 2 sub-headings
    below the section's first heading level (an image right before a sub-heading belongs to its card); else None"""
    if sum(1 for it in items if it[0] == 'card') >= 2:
        first = next(i for i, it in enumerate(items) if it[0] == 'card')
        cards = []
        for it in items[first:]:
            if it[0] == 'card' or not cards:
                cards.append([it])
            else:
                cards[-1].append(it)
        return items[:first], cards
    heads = [i for i, it in enumerate(items) if it[0] == 'head']
    if not heads:
        return None
    top = head_level(items[heads[0]][1])
    subs = [i for i in heads if head_level(items[i][1]) > top]
    if len(subs) < 2 or subs[0] < heads[0]:
        return None
    starts = []
    for i in subs:
        j = i
        while j > 0 and items[j - 1][0] == 'img' and (not starts or j - 1 > starts[-1]):
            j -= 1
        starts.append(j)
    cards = [items[a:b] for a, b in zip(starts, starts[1:] + [len(items)])]
    return items[:starts[0]], cards


def cards_section(pg, head, cards, sid, logo):
    """card grid -> the archetype's office grid (.ct-head + .ct-offices > .ct-orow > .ct-office cells):
    the closest contact module (the archetype encoder emits fm-offices, one row per cell)"""
    hh = ''.join(piece_html(it, logo) for it in head)
    cells = ''.join(f'<div class="za-col ct-office ct-card"><div class="za-text ct-text">'
                    + ''.join(piece_html(it, logo) for it in c) + '</div></div>' for c in cards)
    pg.module('fm-offices')
    return (f'<section class="za-section ct-sec ct-cards" id="{attr(sid)}">\n<div class="za-container ct-rel">\n'
            + (f'<div class="za-row ct-head"><div class="za-col ct-head__col">{hh}</div></div>\n' if hh else '')
            + f'<div class="ct-offices"><div class="za-row ct-orow">{cells}</div></div>\n</div>\n</section>\n')


def summary(items):
    h = next((txt(it[1]) for it in items if it[0] in ('head', 'qhead')), None)
    return (h or norm(' '.join(txt(it[1]) for it in items[:2])) or items[0][0])[:70]


def content_section(pg, items, sid, logo):
    """one non-form section of a landing-like page -> the closest archetype module or a declared deviation module"""
    src = f'section #{sid} ({summary(items)})'
    if any(it[0] == 'qhead' for it in items):
        pg.variant('ct-faq')
        pg.module('ct-faq')
        pg.deviation('module', src + f': accordion, {sum(1 for it in items if it[0] == "qhead")} questions',
                     'section.ct-faq: heading > button question + answer paragraphs (all answers open, verbatim)',
                     'no accordion module in the archetype (contact); the encoder carries it as default content '
                     '(delivery: accordion/faq block)')
        return prose_section(pg, items, sid, logo, ' ct-faq')
    if all(it[0] == 'img' for it in items[1:]) and items[0][0] == 'head' and len(items) > 3:
        pg.variant('ct-logos')
        pg.module('ct-logos')
        pg.deviation('module', src + f': logo strip, {len(items) - 1} images (marquee: the live set repeats twice)',
                     'section.ct-logos: heading + images verbatim (incl. the marquee repeat)',
                     'no logo module in the archetype; the encoder carries the heading only (delivery: logos block, '
                     'images via da-media-upload)')
        return prose_section(pg, items, sid, logo, ' ct-logos')
    if any(it[0] == 'text' and tag(it[1]) == 'blockquote' for it in items):
        pg.variant('ct-quotes')
        pg.module('ct-quotes')
        pg.deviation('module', src + f': testimonial carousel, {sum(1 for it in items if it[0] == "text" and tag(it[1]) == "blockquote")} quotes (carousel clones included)',
                     'section.ct-quotes: logo tabs, blockquote, name, role, story link — in source order, verbatim',
                     'no testimonial module in the archetype; encoder carries quotes/names/links as default content, '
                     'images dropped (delivery: testimonials block)')
        return prose_section(pg, items, sid, logo, ' ct-quotes')
    cs = card_split(items)
    if cs:
        head, cards = cs
        pg.variant('ct-cards')
        pg.deviation('module', src + f': {len(cards)}-card grid' + (' (whole-card links)' if any(it[0] == 'card' for c in cards for it in c) else ''),
                     'section.ct-cards on the archetype office grid (.ct-head + .ct-offices > .ct-office cells) -> fm-offices',
                     'closest contact module; card images are not carried by the encoder (delivery: cards block or '
                     'fm-offices image cell)' + ('; a whole-card anchor becomes text lines + its href on the CTA line'
                                                  if any(it[0] == 'card' for c in cards for it in c) else ''))
        return cards_section(pg, head, cards, sid, logo)
    pg.variant('ct-prose')
    pg.module('ct-prose')
    pg.deviation('module', src + f': {len(items)} item(s)', 'section.ct-prose (default content)',
                 'no fm- module for non-form content in the archetype; the encoder emits default content')
    return prose_section(pg, items, sid, logo, ' ct-prose')


# ---------------------------------------------------------------- counting (same rules both sides)
def counts(roots):
    heads = body = ctas = imgs = 0
    hrefs, words = set(), collections.Counter()
    for r in roots:
        heads += len([h for h in r.xpath('.//h1|.//h2|.//h3|.//h4|.//h5|.//h6') if txt(h)])
        body += len([e for e in r.xpath('.//p|.//li|.//blockquote')
                     if txt(e) and not e.xpath('ancestor::*[self::p or self::li or self::blockquote]')])
        links = [a for a in r.xpath('.//a[@href]') if txt(a) or a.xpath('.//img')]
        ctas += len(links) + len([b for b in r.xpath('.//button') if txt(b)])
        hrefs |= {a.get('href') for a in links}
        # a <noscript> fallback <img> repeats the lazy image above it (same src): not a second image
        imgs += len([i for i in r.xpath('.//img[not(ancestor::noscript)]') if real_img(i)])
        words.update(wordlist(r))
    return {'headings': heads, 'body': body, 'ctas': ctas, 'hrefs': len(hrefs), 'images': imgs,
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
    pr = (sib.get('raw') or {}).get('probes') or {}
    form = ((pr.get('form') or {}).get('first')) or {}
    hero = ((pr.get('hero') or {}).get('first')) or {}
    field = ((pr.get('field') or {}).get('first')) or {}
    if 'proxima' in (form.get('font') or ''):
        pg.variant('ct-instapage')
    hd = form.get('heading') or hero.get('heading') or ''
    if re.search(r'\b26px', hd):
        pg.variant('ct-compact')
    w = (form.get('rect') or {}).get('w')
    if w:
        pg.variant('ct-form--narrow' if w <= 460 else 'ct-form--mid' if w <= 700 else 'ct-form--full' if w >= 1000 else 'ct-form--wide')
    bg = hero.get('backgroundColor') or ''
    if bg and bg not in ('rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)'):
        pg.variant('ct-tint')
    if re.search(r' 1[0-9]{2}px ', ' ' + (field.get('padding') or '') + ' '):
        pg.variant('ct-field--suffix')
    pg.probe = [f.get('msg') for f in sib.get('findings', [])]


# ---------------------------------------------------------------- head
def set_head(doc, cap):
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
    if t:
        head.xpath('./title')[0].text = norm(t[0].text_content())
    can = ch.xpath('.//link[@rel="canonical"]/@href')
    for l in head.xpath('./link[@rel="canonical"]'):
        if can:
            l.set('href', can[0])
        else:
            head.remove(l)
    rob = cm('name', 'robots')
    if rob and 'noindex' in rob:
        m = LH.fromstring(f'<meta name="robots" content="{attr(rob)}">')
        head.xpath('./title')[0].addnext(m)


# ---------------------------------------------------------------- build one page
def build(slug, out_dir):
    pg = Page(slug)
    pg.probe = []
    cj = json.load(open(os.path.join(CURRENT, f'{slug}.json'), encoding='utf-8'))
    cap = LH.document_fromstring(open(os.path.join(CURRENT, f'{slug}.html'), 'rb').read().decode('utf-8'))
    proto = LH.document_fromstring(open(PROTO, 'rb').read().decode('utf-8'))
    logo = logo_html(proto)
    ids = Ids()
    probe_variants(pg, cj.get('url'), os.path.join(out_dir, 'variance.json'))

    main = cap.xpath('//main')[0]
    hdrs = main.xpath('.//*[starts-with(@id,"header-")][.//nav]')
    hdrs = [h for h in hdrs if not [a for a in h.iterancestors() if a in hdrs]]
    ftrs = main.xpath('.//footer')
    promo = promo_of(main)
    chrome = hdrs + ftrs + promo
    site_hdr, site_ftr = site_chrome(cap)
    dialogs = [d for d in cap.xpath('//*[@role="dialog"][not(ancestor::main)]')
               if d.xpath('.//form') and not d.xpath('ancestor-or-self::*[starts-with(@id,"onetrust") or contains(@class,"onetrust") or starts-with(@id,"ot-")]')]
    sections, src_roots = [], []
    n = 0
    if promo:
        items = []
        walk_content(promo[0], items, [])
        n += 1
        sections.append(prose_section(pg, items, f'form-promo-{n}', logo, ' ct-promo'))
        pg.variant('ct-promo')
        pg.deviation('module', 'promo strip [role=complementary] (' + norm(promo[0].text_content())[:80] + ')',
                     'section.ct-promo (default content, first section)',
                     'live site-chrome promo above the header; no archetype (contact) analogue — carried verbatim, '
                     'delivery decides promo nav section vs default content')
        src_roots.append(promo[0])
    top = top_sections(main, chrome)
    if len(top) >= 2:
        # landing-like page (free-trial): one render section per capture section, in order (variant ct-sections)
        pg.variant('ct-sections')
        outside = []
        walk_content(main, outside, chrome + top)
        if outside:
            n += 1
            sections.append(content_section(pg, outside, f'form-prose-{n}', logo))
        for sec in top:
            items = []
            walk_content(sec, items, chrome)
            if not items:
                continue
            sid = sec.get('id')
            if any(it[0] == 'form' for it in items):
                last = max(i for i, it in enumerate(items) if it[0] == 'form')
                tail = next((i for i in range(last + 1, len(items)) if items[i][0] == 'head'), None)
                hero_items, rest = (items, []) if tail is None else (items[:tail], items[tail:])
                sections.append(hero_section(pg, hero_items, sid, ids, logo, ''))
                if rest:
                    sections.append(content_section(pg, rest, f'{sid}-2', logo))
            else:
                sections.append(content_section(pg, items, sid, logo))
        src_roots.append(main)
        regions = [('dialog', d) for d in dialogs]
    else:
        regions = [('main', main)] + [('dialog', d) for d in dialogs]
    for kind, root in regions:
        items = []
        walk_content(root, items, chrome)
        src_roots.append(root)
        # split: embeds (iframes) outside any form region become their own section
        if any(it[0] == 'form' for it in items):
            fi = [i for i, it in enumerate(items) if it[0] == 'form']
            pre = [it for it in items[:fi[0]] if it[0] == 'iframe']
            rest = [it for it in items if not (it[0] == 'iframe' and it in pre)]
            for it in pre:
                n += 1
                sections.append(prose_section(pg, [it], f'form-embed-{n}', logo, ' ct-embed'))
                pg.variant('ct-embed')
            n += 1
            sec = root.xpath('.//section[@id]')
            sid = sec[0].get('id') if sec and kind == 'main' else f'form-hero-{n}'
            extra = ''
            if kind == 'dialog':
                extra += ' ct-hero--modal'
                pg.variant('ct-hero--modal')
                pg.deviation('layout', 'lead form in a modal dialog (role=dialog, outside main, open on load)',
                             'hero section after the page content, variant ct-hero--modal',
                             'the archetype has no dialog; the form keeps its fields/text verbatim, presented inline')
            sections.append(hero_section(pg, rest, sid, ids, logo, extra))
        elif items:
            embeds = [it for it in items if it[0] == 'iframe']
            other = [it for it in items if it[0] != 'iframe']
            for it in embeds:
                n += 1
                sections.append(prose_section(pg, [it], f'form-embed-{n}', logo, ' ct-embed'))
                pg.variant('ct-embed')
            if other:
                n += 1
                sections.append(prose_section(pg, other, f'form-prose-{n}', logo, ' ct-prose'))
                pg.variant('ct-prose')
                pg.deviation('module', f'{len(other)} content item(s) outside any form region',
                             'section.ct-prose (default content)', 'no fm- module for non-form content in the archetype')
    if 'ct-embed' in pg.variants:
        pg.deviation('module', 'iframe embed(s): ' + ', '.join(f.get('src') for r in src_roots for f in r.xpath('.//iframe[@src]')
                                                              if 'googletagmanager' not in f.get('src')),
                     'section.ct-embed > iframe (src/title verbatim)',
                     'no embed module in the archetype (contact); carried as a variant section — the archetype encoder '
                     'does not emit it (delivery: embed block)')
    variant_cls = ' '.join(v for v in pg.variants if v.startswith('ct-') and v not in ('ct-embed', 'ct-promo', 'ct-prose', 'ct-hero--modal'))
    main_html = (f'<main id="main-content" class="ct-main" lang="{attr(cap.get("lang") or "en-US")}">\n'
                 f'<div class="ct-wrap ct-sibling{(" " + variant_cls) if variant_cls else ""}">\n' + ''.join(sections) + '</div>\n</main>')

    # ---- chrome
    body = proto.xpath('//body')[0]
    p_hdrs = body.xpath('./div[contains(@class,"za-hdr")]')
    p_ftr = body.xpath('./footer')
    if not hdrs and site_hdr:
        pg.variant('ct-sitechrome')
        pg.deviation('chrome', f'full site header outside main (mega-menu, {len([a for h in site_hdr for a in h.xpath(".//a[@href]") if txt(a)])} links, '
                     f'{len([x for h in site_hdr for x in h.xpath(".//h1|.//h2|.//h3|.//h4|.//h5|.//h6") if txt(x)])} menu headings)',
                     'archetype header kept in the render (canon chrome)',
                     'the live page carries the FULL site nav, not the slim contact nav (delivery: metadata nav=/nav, not /nav-slim)')
    elif not hdrs:
        for h in p_hdrs:
            body.remove(h)
        pg.variant('ct-bare')
    else:
        src_ctas = [a for a in hdrs[-1].xpath('.//a[@href]') if txt(a)]
        prt = [a for a in p_hdrs[-1].xpath('.//a[contains(@class,"za-btn")]')]
        if [(txt(a), a.get('href')) for a in src_ctas] != [(txt(a), a.get('href')) for a in prt]:
            for ph in p_hdrs:
                btns = ph.xpath('.//a[contains(@class,"za-btn")]')
                for i, b in enumerate(btns):
                    if i < len(src_ctas):
                        b.set('href', src_ctas[i].get('href'))
                        sp = b.xpath('.//span')
                        (sp[0] if sp else b).text = txt(src_ctas[i])
            pg.deviation('chrome', 'header CTAs ' + ' / '.join(f'{txt(a)} ({a.get("href")})' for a in src_ctas),
                         'archetype slim header with the page\'s own CTA labels and hrefs',
                         'the page\'s live slim header carries different CTAs than /nav-slim (delivery: nav variant document)')
            pg.variant('nav-ctas')
    if not ftrs and site_ftr:
        pg.deviation('chrome', f'full site footer outside main ({len([a for f in site_ftr for a in f.xpath(".//a[@href]") if txt(a)])} links, '
                     f'{len([x for f in site_ftr for x in f.xpath(".//h1|.//h2|.//h3|.//h4|.//h5|.//h6") if txt(x)])} column headings)',
                     'archetype footer kept in the render (canon chrome)',
                     'the live page carries the FULL site footer, not the legal footer (delivery: metadata footer=/footer, not /footer-legal)')
    elif not ftrs:
        for f in p_ftr:
            body.remove(f)
    else:
        sl = [(txt(a), a.get('href')) for a in ftrs[0].xpath('.//a') if txt(a)]
        pl = [(txt(a), a.get('href')) for a in p_ftr[0].xpath('.//a') if txt(a)] if p_ftr else []
        if sl != pl:
            pg.deviation('chrome', f'footer links {sl}', f'archetype legal footer {pl}', 'footer differs from /footer-legal')
    if 'ct-bare' in pg.variants:
        pg.deviation('chrome', 'live page has no site header/footer (bare form page)', 'render without canon header/footer',
                     'verbatim: the source carries no chrome (delivery: nav/footer metadata off or an empty fragment)')
    set_head(proto, cap)
    pm = body.xpath('./main')[0]
    new_main = LH.fragment_fromstring(main_html)
    pm.getparent().replace(pm, new_main)
    out = '<!DOCTYPE html>\n' + LH.tostring(proto, encoding='unicode')

    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, f'{slug}.html')
    open(dst, 'w', encoding='utf-8').write(out)

    # ---- counts + word census (capture content regions vs render main sections)
    rdoc = LH.document_fromstring(out)
    rsecs = rdoc.xpath('//main//section')
    cs, ws = counts([copy.deepcopy(r) for r in src_roots] and [strip_chrome(r, chrome) for r in src_roots])
    cd, wd = counts(rsecs)
    drops = {k: cs[k] - cd[k] for k in cs if k != 'words' and cd[k] < cs[k]}
    missing = ws - wd
    rtext = norm(' '.join(norm(s.text_content()) for s in rsecs))
    lost, chrome_heads = lost_headings(cj, rtext, site_hdr + site_ftr)
    rep = {'slug': slug, 'render': dst, 'modules': pg.modules, 'variants': pg.variants, 'deviations': pg.deviations,
           'probe': pg.probe, 'counts': {'source': cs, 'render': cd}, 'drops': drops,
           'words': {'missing': sum(missing.values()), 'missingSample': list(missing.items())[:20],
                     'extra': sum((wd - ws).values()), 'extraSample': list((wd - ws).items())[:20]},
           'jsonHeadingsLost': lost, 'chromeHeadings': chrome_heads}
    json.dump(rep, open(os.path.join(out_dir, f'{slug}.build.json'), 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print(f'{slug}: {dst} modules={pg.modules} variants={pg.variants} deviations={len(pg.deviations)} '
          f'src={cs} dst={cd} drops={drops or "none"} wordsMissing={sum(missing.values())} lostHeadings={len(lost)}')
    return not drops and not missing and not lost


def promo_of(main):
    """the site promo strip: [role=complementary] in main outside any content section (a complementary aside
    inside a page section is content, kept in place)"""
    return [x for x in main.xpath('.//*[@role="complementary"]') if not x.xpath('ancestor::section')]


def site_chrome(cap):
    """full site header / footer rendered outside main (landing-like pages)"""
    hs = cap.xpath('//*[starts-with(@id,"header-")][.//nav][not(ancestor::main)]')
    hs = [h for h in hs if not [a for a in h.iterancestors() if a in hs]]
    fs = [f for f in cap.xpath('//footer[not(ancestor::main)]')
          if not f.xpath('ancestor-or-self::*[starts-with(@id,"onetrust") or starts-with(@id,"ot-")]')]
    return hs, fs


def top_sections(main, chrome):
    return [x for x in main.xpath('.//section') if not x.xpath('ancestor::section')
            and not any(c is x or c in x.iterancestors() or x in c.iterancestors() for c in chrome)]


def lost_headings(cj, rtext, site):
    """capture-JSON headings missing from the render; headings that live only in the site header/footer outside
    main are chrome (delivered by the nav/footer fragments), reported apart, not lost"""
    stext = norm(' '.join(norm(h.text_content()) for h in site))
    lost, chrome_heads = [], []
    for h in cj.get('headings', []):
        t = norm(h.get('text') or '')
        if not t or t in rtext:
            continue
        (chrome_heads if site and t in stext else lost).append(h['text'])
    return lost, chrome_heads


def strip_chrome(root, chrome):
    """a copy of a capture region without its chrome subtrees (header nav, footer, promo — promo is its own root)"""
    c = copy.deepcopy(root)
    if any(root is x for x in chrome):
        return c
    # map chrome nodes by path
    tree = root.getroottree()
    paths = [tree.getpath(x) for x in chrome if root in x.iterancestors()]
    rp = tree.getpath(root)
    hits = []
    for p in paths:  # resolve every path first, then detach (removing shifts sibling indices)
        rel = p[len(rp):]
        hits += c.xpath('.' + rel) if rel else []
    for h in hits:
        if h.getparent() is not None:
            h.getparent().remove(h)
    return c


def main_():
    args = sys.argv[1:]
    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if args else 2)
    out_dir, slugs, i = 'stardust/.work/render/form', [], 0
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
