/* eslint-disable */
/* global WebImporter */

import svHeroParser from './parsers/sv-hero.js';
import svCardsParser from './parsers/sv-cards.js';
import svColumnsParser from './parsers/sv-columns.js';
import svStoriesParser from './parsers/sv-stories.js';
import svCarouselParser from './parsers/sv-carousel.js';
import svAccordionParser from './parsers/sv-accordion.js';
import svCtaParser from './parsers/sv-cta.js';
import svFormParser from './parsers/sv-form.js';
import cleanupTransformer from './transformers/zendesk-cleanup.js';
import sectionsTransformer from './transformers/zendesk-sections.js';
import pageCorrectionsTransformer from './transformers/zendesk-page-corrections.js';

const PAGE_TEMPLATE = {
  "name": "service-2",
  "urls": [
    "https://www.zendesk.com/service/ai/",
    "https://www.zendesk.com/service/ai/ai-agents/any-platform/",
    "https://www.zendesk.com/service/ai/ai-agents/zendesk-bridge/",
    "https://www.zendesk.com/service/analytics/",
    "https://www.zendesk.com/service/messaging/",
    "https://www.zendesk.com/service/ticketing-system/",
    "https://www.zendesk.com/employee-service/itsm/",
    "https://www.zendesk.com/service/knowledge/",
    "https://www.zendesk.com/service/voice/",
    "https://www.zendesk.com/business/startups/",
    "https://www.zendesk.com/industries/retail/",
    "https://www.zendesk.com/industries/financial-services/",
    "https://www.zendesk.com/industries/technology/",
    "https://www.zendesk.com/industries/media/",
    "https://www.zendesk.com/business/enterprise/",
    "https://www.zendesk.com/business/smb/",
    "https://www.zendesk.com/industries/transportation/",
    "https://www.zendesk.com/industries/education/",
    "https://www.zendesk.com/industries/government/",
    "https://www.zendesk.com/industries/manufacturing/",
    "https://www.zendesk.com/industries/healthcare/",
    "https://www.zendesk.com/industries/telecommunications/",
    "https://www.zendesk.com/industries/igaming-and-betting/"
  ],
  "representativeUrl": "https://www.zendesk.com/service/ai/",
  "description": "Zendesk AI product sub-pages (AI, AI agents, Bridge, analytics): hero, media splits, cards, stories, resources carousel, FAQ and closing CTA, built from the sv-* blocks.",
  "blocks": [
    {
      "name": "sv-hero",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11:has(h1)"
      ]
    },
    {
      "name": "sv-cards",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11 > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^=\"grid-\"]:has(.Cardstyle__CardRoot-sc-12jokda-2)"
      ]
    },
    {
      "name": "sv-columns",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11:not(:has(h1)) > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8:has(> div span.sc-fdfb305c-0)",
        "#main-content > div > section.sc-f23d7fd5-11 div.sc-c5fa0909-1"
      ]
    },
    {
      "name": "sv-stories",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11 div.sc-612b179e-0",
        "#main-content > div > section.sc-f23d7fd5-11 div:has(> div.sc-8c256214-0):not(:has(.slick-slide))"
      ]
    },
    {
      "name": "sv-carousel",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11 div:has(> .Carouselstyle__CarouselSlider-sc-1mnw5o8-3)"
      ]
    },
    {
      "name": "sv-accordion",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11 > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1",
        "#main-content > div > section.sc-f23d7fd5-11 > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^=\"grid-\"] .Accordionstyle__AccordionRoot-sc-1baakjb-1"
      ]
    },
    {
      "name": "sv-cta",
      "instances": [
        "#main-content > div > section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-9):not(:has(h1))"
      ]
    },
    {
      "name": "sv-form",
      "instances": [
        "#main-content > div > div:has(> div.sc-d0574c0f-1 > form)"
      ]
    }
  ],
  "urlPattern": "/service/*",
  "sections": [
    {
      "id": "rc2",
      "name": "Hero",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(h1)"
      ],
      "style": null,
      "blocks": [
        "sv-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "AI solutions icon row",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(.Cardstyle__CardRoot-sc-12jokda-2)"
      ],
      "style": null,
      "blocks": [
        "sv-cards"
      ],
      "defaultContent": [
        "#main-content > div > section.sc-f23d7fd5-11:has(.Cardstyle__CardRoot-sc-12jokda-2) > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 p.Headingstyle__HeadingRoot-sc-6ks3it-0",
        "#main-content > div > section.sc-f23d7fd5-11:has(.Cardstyle__CardRoot-sc-12jokda-2) > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 h2.Headingstyle__HeadingRoot-sc-6ks3it-0"
      ]
    },
    {
      "id": "rc4",
      "name": "Knowledge split",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1))"
      ],
      "style": null,
      "blocks": [
        "sv-columns",
        "sv-accordion"
      ],
      "defaultContent": []
    },
    {
      "id": "rc5",
      "name": "AI agents split (image left)",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1)) ~ section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1))"
      ],
      "style": null,
      "blocks": [
        "sv-columns",
        "sv-accordion"
      ],
      "defaultContent": []
    },
    {
      "id": "rc6",
      "name": "Copilot split",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1)) ~ section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1)) ~ section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1))"
      ],
      "style": null,
      "blocks": [
        "sv-columns",
        "sv-accordion"
      ],
      "defaultContent": []
    },
    {
      "id": "rc7",
      "name": "Quality assurance split (image left)",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1)) ~ section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1)) ~ section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1)) ~ section.sc-f23d7fd5-11:not(:has(h1)):is(:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 > div span.sc-fdfb305c-0), :has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > section.sc-ceec712a-1))"
      ],
      "style": null,
      "blocks": [
        "sv-columns",
        "sv-accordion"
      ],
      "defaultContent": []
    },
    {
      "id": "rc8",
      "name": "Customer stories",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(div.sc-612b179e-0)"
      ],
      "style": "cream",
      "blocks": [
        "sv-stories"
      ],
      "defaultContent": [
        "#main-content > div > section.sc-f23d7fd5-11:has(div.sc-612b179e-0) > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div.sc-f23d7fd5-8 p.Headingstyle__HeadingRoot-sc-6ks3it-0"
      ]
    },
    {
      "id": "rc9",
      "name": "ROI report banner",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(div.sc-c5fa0909-1)"
      ],
      "style": null,
      "blocks": [
        "sv-columns"
      ],
      "defaultContent": []
    },
    {
      "id": "rc10",
      "name": "Additional resources",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(.Carouselstyle__CarouselSlider-sc-1mnw5o8-3)"
      ],
      "style": null,
      "blocks": [
        "sv-carousel"
      ],
      "defaultContent": [
        "#main-content > div > section.sc-f23d7fd5-11:has(.Carouselstyle__CarouselSlider-sc-1mnw5o8-3) h2.Headingstyle__HeadingRoot-sc-6ks3it-0"
      ]
    },
    {
      "id": "rc11",
      "name": "FAQ",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^=\"grid-\"] .Accordionstyle__AccordionRoot-sc-1baakjb-1)"
      ],
      "style": null,
      "blocks": [
        "sv-accordion"
      ],
      "defaultContent": [
        "#main-content > div > section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^=\"grid-\"] .Accordionstyle__AccordionRoot-sc-1baakjb-1) > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^=\"grid-\"] h2.Headingstyle__HeadingRoot-sc-6ks3it-0"
      ]
    },
    {
      "id": "rc12",
      "name": "Closing CTA",
      "selector": [
        "#main-content > div > section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-9):not(:has(h1))"
      ],
      "style": null,
      "blocks": [
        "sv-cta",
        "sv-form"
      ],
      "defaultContent": []
    }
  ]
};

const parsers = {
  'sv-hero': svHeroParser,
  'sv-cards': svCardsParser,
  'sv-columns': svColumnsParser,
  'sv-stories': svStoriesParser,
  'sv-carousel': svCarouselParser,
  'sv-accordion': svAccordionParser,
  'sv-cta': svCtaParser,
  'sv-form': svFormParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
// Page corrections (zendesk-page-corrections.js, when it exists) run last.
const correctionTransformers = [pageCorrectionsTransformer];
const transformers = [cleanupTransformer, ...lateTransformers, ...correctionTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
