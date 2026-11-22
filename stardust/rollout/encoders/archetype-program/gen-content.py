# Generates content/service.html (DA body fragment) from the gated prototype strings.
# Usage: python3 -I gen-content.py <prototype.html> <out.html>
import html
import re
import sys

src = open(sys.argv[1], encoding='utf-8').read()
M = 'https://content.da.live/aemcoder/3055ed88/media/service/'
Z = 'https://www.zendesk.com'


import json
PLAN = {x['url'] for x in json.load(open('/workspace/3055ed88/stardust/.labs/site-plan.json'))['pages'] if x.get('selected')}
D5 = ('/login/', '/register/')


def absu(h):
    """in-scope pages root-relative (source trailing slash), the rest absolute (runtime contract links)"""
    u = Z + h if h.startswith('/') else h
    if u.startswith(Z + '/') and u in PLAN and not u.endswith(D5):
        return u[len(Z):]
    return u


def strip(s):
    s = re.sub(r'<svg[\s\S]*?</svg>', '', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s).strip()


def t(s):
    return html.escape(s, quote=False)


def img(name, alt=''):
    return f'<p><img src="{M}{name}" alt="{html.escape(alt)}"></p>'


def block(name, rows):
    out = [f'<div class="{name}">']
    for r in rows:
        out.append('<div>' + ''.join(f'<div>{c}</div>' for c in r) + '</div>')
    out.append('</div>')
    return '\n'.join(out)


def sm(style):
    return f'<div class="section-metadata"><div><div><p>style</p></div><div><p>{style}</p></div></div></div>'


S = []

# 1 hero
lead = strip(re.search(r'sv-lead"><p>([\s\S]*?)</p>', src).group(1))
tip = strip(re.search(r'id="trial-email-tip"[^>]*>([\s\S]*?)</div>', src).group(1))
priv = re.search(r'sv-trial__more"><p[^>]*>([\s\S]*?)<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>([\s\S]*?)</p>', src)
hero_text = ''.join([
    '<p>Zendesk for customer service</p>',
    '<h1>AI-powered customer service software</h1>',
    f'<p>{t(lead)}</p>',
    '<p><strong>14-day free trial.</strong> No credit card required.</p>',
    f'<p><strong><a href="{Z}/register/">Start your free trial</a></strong></p>',
    f'<p>{t(tip)}</p>',
    f'<p>{t(strip(priv.group(1)))} <a href="{absu(priv.group(2))}">{t(strip(priv.group(3)))}</a>{t(strip(priv.group(4)))}</p>',
])
hero_media = img('hero.png')
S.append(block('sv-hero trial', [[hero_text, hero_media]])
         + '\n<p><a href="https://fast.wistia.net/embed/iframe/izivwbhm2u">Play video</a></p>')

# 2 promo
promo_t = strip(re.search(r'sv-promo__title">([\s\S]*?)</h2>', src).group(1))
S.append(block('sv-promo', [[img('gartner-white.png'),
                             f'<h2>{t(promo_t)}</h2><p><strong><a href="{Z}/campaigns/gartner-mq-crm-2025/">Read the report</a></strong></p>']]))

# 3 benefits
acc_imgs = ['aiagentbuilder-aiagent-productimagery-en-us.png',
            'customerservice-quick-answers-for-agents-productimagery-en-us.png',
            'automationpotential-aiagent-productimagery-en-us.png',
            'productimagery-adpp-datamasking-productimagery-en-us.png']
titles = [strip(x) for x in re.findall(r'<h3 class="sv-acc__title">([\s\S]*?)</h3>', src)]
bodies = [strip(x) for x in re.findall(r'sv-acc__inner"><div class="za-text"><p>([\s\S]*?)</p>', src)]
rows = [[f'<h3>{t(a)}</h3>', f'<p>{t(b)}</p>' + img(i)] for a, b, i in zip(titles, bodies, acc_imgs)]
S.append('<p>Benefits</p>\n<h2>The Resolution Platform that scales with you</h2>\n' + block('sv-accordion', rows))

# 4 stories
logos = {'Bestegg_Default.svg': 'bestegg-default.svg', 'britbox_Default.svg': 'britbox-default.svg',
         'NOBULL_Default.avif': 'nobull-default.png', 'Vimeo_Default.avif': 'vimeo-default.png'}
rows = []
for sl in re.findall(r'<div class="sv-story">([\s\S]*?)</cite>', src):
    lg = re.search(r'sv-story__logo"><img src="assets/service/([^"]+)" alt="([^"]*)"', sl)
    stats = re.findall(r'sv-stat__fig">([\s\S]*?)</p><p class="sv-stat__head">([\s\S]*?)</p>', sl)
    c1 = img(logos[lg.group(1)], html.unescape(lg.group(2)))
    for f, h in stats:
        c1 += f'<p><strong>{t(strip(f))}</strong></p><p>{t(strip(h))}</p>'
    q = strip(re.search(r'<blockquote[^>]*>([\s\S]*?)</blockquote>', sl).group(1))
    who = [strip(x) for x in re.findall(r'<p>([\s\S]*?)</p>', re.search(r'sv-story__who">([\s\S]*?)</div></div>', sl).group(1))]
    lk = re.search(r'sv-story__link" href="([^"]+)"><span>([\s\S]*?)</span>', sl)
    c2 = f'<blockquote><p>{t(q)}</p></blockquote>' + ''.join(f'<p>{t(w)}</p>' for w in who)
    c2 += f'<p><a href="{absu(lk.group(1))}">{t(strip(lk.group(2)))}</a></p>'
    rows.append([c1, c2])
S.append('<p>Customer stories</p>\n' + block('sv-stories', rows) + '\n' + sm('cream'))

# 5 why
why_imgs = {'Privacy.webp': 'privacy.webp', 'Sales.webp': 'sales.webp', 'Sparkle.webp': 'sparkle.webp',
            'CustomerSupportTeams.webp': 'customersupportteams.webp'}
rows = []
for c in re.findall(r'<div class="sv-why__card"[\s\S]*?</div>\s*</div></div>', src):
    im = re.search(r'<img src="assets/service/([^"]+)" alt="([^"]*)"', c)
    h = strip(re.search(r'sv-why__title">([\s\S]*?)</h3>', c).group(1))
    p = strip(re.search(r'sv-why__text"><p>([\s\S]*?)</p>', c).group(1))
    rows.append([img(why_imgs[im.group(1)], html.unescape(im.group(2))), f'<h3>{t(h)}</h3><p>{t(p)}</p>'])
S.append('<p>Why choose Zendesk</p>\n<h2>Confidence at every customer touchpoint</h2>\n' + block('sv-cards', rows))

# 6 capabilities
icons = {'/service/ai/ai-agents/': 'sv-ai-agents', '/service/ai/': 'sv-ai-automation', '/platform/': 'sv-platform',
         '/service/knowledge/': 'sv-knowledge', '/service/quality-assurance/': 'sv-qa', '/service/analytics/': 'sv-analytics',
         '/service/ticketing-system/': 'sv-ticketing', '/service/voice/': 'sv-voice',
         '/service/workforce-engagement-management/': 'sv-wfm', '/customer-data-privacy-protection/': 'sv-privacy',
         '/service/messaging/': 'sv-messaging', '/marketplace/': 'sv-integrations'}
rows = []
for h, ti, sub in re.findall(r'<a class="sv-cap"[^>]*href="([^"]+)">[\s\S]*?sv-cap__title">([\s\S]*?)</span><span class="sv-cap__sub">([\s\S]*?)</span>', src):
    rows.append([f'<p>:{icons[h]}:</p>', f'<p><a href="{absu(h)}"><strong>{t(strip(ti))}</strong> {t(strip(sub))}</a></p>'])
S.append('<h2>Explore service capabilities</h2>\n' + block('sv-links', rows))

# 7 demo
demo_lead = strip(re.search(r'See it in action</h2>\s*<div class="za-text sv-lead"><p>([\s\S]*?)</p>', src).group(1))
S.append(f'<h2>See it in action</h2>\n<p>{t(demo_lead)}</p>\n' + block('sv-embed desktop', [[
    '<p><a href="https://app.storylane.io/demo/htqk95bthcym?embed=inline">Zendesk customer service guided tour</a></p>']]))

# 8 protect
cols = ['<h2>Protected by Zendesk</h2>']
for h3, p, href, lt in re.findall(r'<h3>([^<]+)</h3><div class="za-text"><p>([\s\S]*?)</p></div><a class="za-link sv-protect__link"[^>]*href="([^"]+)">([^<]+)</a>', src):
    cols.append(f'<h3>{t(strip(h3))}</h3><p>{t(strip(p))}</p><p><a href="{absu(href)}">{t(strip(lt))}</a></p>')
S.append(block('sv-columns', [cols]))

# 9 resources
res_imgs = {'CXT26-Trend05-Detail03-SCB.avif': 'cxt26-trend05-detail03-scb.webp',
            'Photos_People_ZAIS24_CXLeader.avif': 'photos-people-zais24-cxleader.webp',
            'Photos_People_Relate_2025_TravelConsumer_1x1_01.avif': 'photos-people-relate-2025-travelconsumer-1x1-01.webp',
            'image4.avif': 'image4.png', 'Photos_People_ZAIS24_Admin_1x1_03.avif': 'photos-people-zais24-admin-1x1-03.webp',
            'Photos_People_TwoBusinessLeadersDiscussing.avif': 'photos-people-twobusinessleadersdiscussing.webp'}
rows = []
for href, im, alt, kind, ti in re.findall(r'<a class="sv-res__card"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img src="assets/service/([^"]+)" alt="([^"]*)"[\s\S]*?sv-res__kind">([\s\S]*?)</p><p class="sv-res__title">([\s\S]*?)</p>', src):
    rows.append([img(res_imgs[im], html.unescape(alt)), f'<p>{t(strip(kind))}</p><p><a href="{absu(href)}">{t(strip(ti))}</a></p>'])
S.append('<h2>Additional Resources</h2>\n' + block('sv-carousel', rows))

# 10 cta
S.append(block('sv-cta', [['<p>Get started</p><h2>Try Zendesk today</h2>'
                            f'<p><strong><a href="{absu("/contact/")}">Contact Sales</a></strong></p>']]))

# 11 contact-sales modal form
m = re.search(r'<div class="sv-modal"[\s\S]*?</form>', src).group(0)
mt = strip(re.search(r'<h3[^>]*>([\s\S]*?)</h3>', m).group(1))
mi = strip(re.search(r'text-a0387e7e91"><p>([\s\S]*?)</p>', m).group(1))
rows = [[f'<h3>{t(mt)}</h3><p>{t(mi)}</p>']]
for f in re.findall(r'<div class="sv-field">([\s\S]*?)</div>(?=\s*<div class="sv-field">|\s*</div>\s*<p)', m):
    label = strip(re.search(r'<label[^>]*>([\s\S]*?)</label>', f).group(1))
    tipm = re.search(r'class="sv-tip"[^>]*>([\s\S]*?)$', f)
    c1 = f'<p>{t(label)}</p>' + (f'<p>{t(strip(tipm.group(1)))}</p>' if tipm else '')
    if '<textarea' in f:
        typ = 'textarea'
    elif '<select' in f:
        typ = 'select'
    else:
        tm = re.search(r'<input[^>]*type="([^"]+)"', f)
        typ = tm.group(1) if tm else 'text'
    name = re.search(r'name="([^"]+)"', f).group(1)
    r = [c1, typ, name]
    if typ == 'select':
        opts = [html.unescape(o) for o in re.findall(r'<option value="[^"]+">([^<]+)</option>', f)]
        r.append('<ul>' + ''.join(f'<li>{t(o)}</li>' for o in opts) + '</ul>')
    rows.append(r)
pp = re.search(r'zendesk-privacy-notice">([\s\S]*?)<a[^>]*href="([^"]+)">([\s\S]*?)</a>([\s\S]*?)</p>', m)
rows.append([f'<p>{t(strip(pp.group(1)))} <a href="{absu(pp.group(2))}">{t(strip(pp.group(3)))}</a>{t(strip(pp.group(4)))}</p><p>Submit</p>'])
S.append(block('sv-form modal', rows))

meta = block('metadata', [
    ['Title', 'AI-powered customer service software | Zendesk'],
    ['Description', 'Zendesk customer service software connects AI, agents, knowledge, and workflows in one platform to resolve customer requests faster and deliver better support.'],
    ['Canonical', 'https://www.zendesk.com/service/'],
])

body = '<body>\n<header></header>\n<main>\n' + ''.join(f'<div>\n{s}\n</div>\n' for s in S) + f'<div>\n{meta}\n</div>\n</main>\n<footer></footer>\n</body>\n'
open(sys.argv[2], 'w', encoding='utf-8').write(body)
print('sections', len(S), 'bytes', len(body))
