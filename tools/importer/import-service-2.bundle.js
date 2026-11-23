/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-service-2.js
  var import_service_2_exports = {};
  __export(import_service_2_exports, {
    default: () => import_service_2_default
  });

  // tools/importer/parsers/sv-hero.js
  var WISTIA_RE = /wistia_async_([a-z0-9]{6,})/i;
  function wistiaId(root) {
    const el = root.querySelector('[class*="wistia_async_"]');
    if (!el) return "";
    const m = WISTIA_RE.exec(el.className);
    return m ? m[1] : "";
  }
  function realImg(root, document2) {
    const imgs = [...root.querySelectorAll("img")];
    const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute("src") || "") && !i.id;
    const pick = imgs.find((i) => /^image-/.test(i.id || "")) || imgs.find((i) => !isSizer(i));
    if (!pick) return null;
    let src = pick.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) {
      const set = pick.getAttribute("srcset") || pick.getAttribute("data-srcset") || "";
      const fromSet = (set.split(",").pop() || "").trim().split(/\s+/)[0];
      src = pick.getAttribute("data-src") || fromSet || src;
    }
    if (src.startsWith("data:")) {
      const ns = pick.parentElement && pick.parentElement.querySelector("noscript");
      const m = ns && /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || "");
      if (m && !m[1].startsWith("data:")) src = m[1].replace(/&amp;/g, "&");
    }
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = pick.getAttribute("alt") || "";
    return out;
  }
  function linkP(document2, href, text, wrapTag) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    if (wrapTag) {
      const w = document2.createElement(wrapTag);
      w.append(a);
      p.append(w);
    } else {
      p.append(a);
    }
    return p;
  }
  function cleanP(src, document2) {
    const p = document2.createElement("p");
    const clone = src.cloneNode(true);
    clone.querySelectorAll("svg").forEach((s) => s.remove());
    clone.querySelectorAll("a").forEach((a) => {
      const n = document2.createElement("a");
      n.href = a.getAttribute("href") || "";
      n.textContent = a.textContent.trim();
      a.replaceWith(n);
    });
    p.innerHTML = clone.innerHTML.trim();
    return p;
  }
  function parse(element, { document: document2 }) {
    const row = element.querySelector("div.sc-f23d7fd5-8");
    const cols = row ? [...row.children] : [];
    const textCol = cols.find((c) => c.querySelector("h1")) || cols[0] || element;
    const mediaCol = cols.find((c) => c !== textCol && c.querySelector("img")) || null;
    const options = [];
    const text = [];
    const h1 = textCol.querySelector("h1");
    const eyebrow = textCol.querySelector(':scope > p[id^="title-"]');
    if (eyebrow && eyebrow.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = eyebrow.textContent.trim();
      text.push(p);
    }
    if (h1) {
      const h = document2.createElement("h1");
      h.textContent = h1.textContent.trim();
      text.push(h);
    }
    textCol.querySelectorAll(':scope > div[id^="text-"] > p, :scope > div[id^="text-"] > ul').forEach((n) => {
      if (n.textContent.trim()) text.push(n.tagName === "UL" ? n.cloneNode(true) : cleanP(n, document2));
    });
    const form = textCol.querySelector("form");
    if (form) {
      options.push("trial");
      const note = [...form.querySelectorAll("p")].find((p) => p.querySelector("strong"));
      if (note) text.push(cleanP(note, document2));
      const btn = form.querySelector('button[type="submit"], button');
      const label = btn ? btn.textContent.trim() : "Start your free trial";
      text.push(linkP(document2, "/register", label, "strong"));
      const tip = form.querySelector('[role="tooltip"]');
      if (tip && tip.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = tip.textContent.trim();
        text.push(p);
      }
      const privacy = [...form.querySelectorAll("p")].find((p) => p !== note && p.querySelector("a"));
      if (privacy) text.push(cleanP(privacy, document2));
    }
    let hasVideo = false;
    const group = textCol.querySelector('[class*="LinkGroupstyle__LinkGroupRoot"]');
    if (group && !form) {
      let first = true;
      [...group.children].forEach((item) => {
        const id = wistiaId(item);
        if (id) {
          hasVideo = true;
          text.push(linkP(document2, `https://fast.wistia.net/embed/iframe/${id}`, item.textContent.trim(), first ? "strong" : "em"));
          first = false;
          return;
        }
        const a = item.matches("a") ? item : item.querySelector("a");
        if (!a || !a.textContent.trim()) return;
        text.push(linkP(document2, a.getAttribute("href"), a.textContent.trim(), first ? "strong" : "em"));
        first = false;
      });
    }
    const media = [];
    let posterId = "";
    if (mediaCol) {
      const img = realImg(mediaCol, document2);
      if (img) media.push(img);
      posterId = wistiaId(mediaCol);
      if (posterId) hasVideo = true;
    }
    if (hasVideo) options.unshift("video");
    const cells = [[text, media]];
    const logoRow = element.querySelector('[data-aem-id="aem.components.LogoTypeRow"], [id^="logotyperow-"]');
    if (logoRow) {
      const rowEl = logoRow.closest("div.sc-f23d7fd5-8") || logoRow;
      const h = rowEl.querySelector("h2, h3");
      const track = rowEl.querySelector('div[direction]:not([aria-hidden="true"])') || rowEl;
      const logos = [...track.querySelectorAll("img")].filter((i) => !(i.getAttribute("src") || "").startsWith("data:"));
      if (logos.length) {
        options.push("logos");
        if (h && h.textContent.trim()) {
          const h2 = document2.createElement("h2");
          h2.textContent = h.textContent.trim();
          cells.push([[h2], ""]);
        }
        logos.forEach((l) => {
          const img = document2.createElement("img");
          img.src = l.getAttribute("src");
          img.alt = l.getAttribute("alt") || "";
          cells.push([[img], ""]);
        });
      }
    }
    const name = options.length ? `sv-hero (${options.join(", ")})` : "sv-hero";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
    if (posterId) {
      block.after(linkP(document2, `https://fast.wistia.net/embed/iframe/${posterId}`, "Play video"));
    }
  }

  // tools/importer/parsers/sv-cards.js
  function realImg2(root, document2) {
    const imgs = [...root.querySelectorAll("img")];
    const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute("src") || "") && !i.id;
    const pick = imgs.find((i) => /^image-/.test(i.id || "")) || imgs.find((i) => !isSizer(i));
    if (!pick) return null;
    let src = pick.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) {
      const set = pick.getAttribute("srcset") || pick.getAttribute("data-srcset") || "";
      const fromSet = (set.split(",").pop() || "").trim().split(/\s+/)[0];
      src = pick.getAttribute("data-src") || fromSet || src;
    }
    if (src.startsWith("data:")) {
      const ns = pick.parentElement && pick.parentElement.querySelector("noscript");
      const m = ns && /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || "");
      if (m && !m[1].startsWith("data:")) src = m[1].replace(/&amp;/g, "&");
    }
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = pick.getAttribute("alt") || "";
    return out;
  }
  function cleanBlock(src, document2) {
    const clone = src.cloneNode(true);
    clone.querySelectorAll("svg").forEach((s) => s.remove());
    clone.querySelectorAll("a").forEach((a) => {
      const n = document2.createElement("a");
      n.href = a.getAttribute("href") || "";
      n.textContent = a.textContent.trim();
      a.replaceWith(n);
    });
    const out = document2.createElement(src.tagName === "UL" || src.tagName === "OL" ? src.tagName : "p");
    out.innerHTML = clone.innerHTML.trim();
    return out;
  }
  function parse2(element, { document: document2 }) {
    const cards = [...element.querySelectorAll(".Cardstyle__CardRoot-sc-12jokda-2")];
    const cells = [];
    cards.forEach((card) => {
      const media = card.querySelector('[class*="Cardstyle__CardMedia"]') || card;
      const img = realImg2(media, document2);
      const content = [];
      const title = card.querySelector("h1, h2, h3, h4, h5, h6");
      if (title && title.textContent.trim()) {
        const h3 = document2.createElement("h3");
        h3.textContent = title.textContent.trim();
        content.push(h3);
      }
      card.querySelectorAll([
        '[class*="Textstyle__TextRoot"] > p',
        '[class*="Textstyle__TextRoot"] > ul',
        '[class*="Textstyle__TextRoot"] > ol',
        'p[class*="Textstyle__TextRoot"]',
        'ul[class*="Textstyle__TextRoot"]',
        'ol[class*="Textstyle__TextRoot"]'
      ].join(", ")).forEach((n) => {
        if (n.textContent.trim()) content.push(cleanBlock(n, document2));
      });
      card.querySelectorAll(":scope > a[href], :scope > div > a[href]").forEach((a) => {
        if (media.contains(a) || !a.textContent.trim()) return;
        const p = document2.createElement("p");
        const link = document2.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = a.textContent.trim();
        p.append(link);
        content.push(p);
      });
      cells.push([img ? [img] : "", content]);
    });
    const name = cards.length === 3 ? "sv-cards (cols-3)" : "sv-cards";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sv-columns.js
  function realImg3(root, document2) {
    const imgs = [...root.querySelectorAll("img")];
    const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute("src") || "") && !i.id;
    const pick = imgs.find((i) => /^image-/.test(i.id || "")) || imgs.find((i) => !isSizer(i));
    if (!pick) return null;
    let src = pick.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) {
      const set = pick.getAttribute("srcset") || pick.getAttribute("data-srcset") || "";
      const fromSet = (set.split(",").pop() || "").trim().split(/\s+/)[0];
      src = pick.getAttribute("data-src") || fromSet || src;
    }
    if (src.startsWith("data:")) {
      const ns = pick.parentElement && pick.parentElement.querySelector("noscript");
      const m = ns && /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || "");
      if (m && !m[1].startsWith("data:")) src = m[1].replace(/&amp;/g, "&");
    }
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = pick.getAttribute("alt") || "";
    return out;
  }
  function cleanBlock2(src, document2) {
    const clone = src.cloneNode(true);
    clone.querySelectorAll("svg").forEach((s) => s.remove());
    clone.querySelectorAll("a").forEach((a) => {
      const n = document2.createElement("a");
      n.href = a.getAttribute("href") || "";
      n.textContent = a.textContent.trim();
      a.replaceWith(n);
    });
    const tag = /^(UL|OL)$/.test(src.tagName) ? src.tagName : "p";
    const out = document2.createElement(tag);
    out.innerHTML = clone.innerHTML.trim();
    return out;
  }
  function ctaParagraphs(group, document2) {
    const out = [];
    let buttons = 0;
    group.querySelectorAll("a[href]").forEach((a) => {
      const label = a.textContent.trim();
      if (!label) return;
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = label;
      if (/Buttonstyle__ButtonRoot/.test(a.className)) {
        const w = document2.createElement(buttons === 0 ? "strong" : "em");
        w.append(link);
        p.append(w);
        buttons += 1;
      } else {
        p.append(link);
      }
      out.push(p);
    });
    return out;
  }
  function textContent(col, document2) {
    const out = [];
    const visit = (node) => {
      [...node.children].forEach((n) => {
        if (/^H[1-6]$/.test(n.tagName)) {
          if (!n.textContent.trim()) return;
          const h = document2.createElement(n.tagName === "H1" ? "h2" : n.tagName.toLowerCase());
          h.textContent = n.textContent.trim();
          out.push(h);
        } else if (/LinkGroupstyle__LinkGroupRoot/.test(n.className) || n.matches("a[href]")) {
          if (n.matches("a[href]")) {
            const wrap = document2.createElement("div");
            wrap.append(n.cloneNode(true));
            out.push(...ctaParagraphs(wrap, document2));
          } else {
            out.push(...ctaParagraphs(n, document2));
          }
        } else if (n.tagName === "P" || n.tagName === "UL" || n.tagName === "OL") {
          if (n.textContent.trim()) out.push(cleanBlock2(n, document2));
        } else if (n.tagName === "DIV" || n.tagName === "SPAN") {
          visit(n);
        }
      });
    };
    visit(col);
    return out;
  }
  function parse3(element, { document: document2 }) {
    if (element.matches("div.sc-c5fa0909-1") || /sc-c5fa0909-1/.test(element.className)) {
      const content = textContent(element, document2);
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "sv-columns (text, banner)", cells: [[content]] });
      element.replaceWith(block2);
      return;
    }
    const cols = [...element.children];
    const textCol = cols.find((c) => c.querySelector("h1, h2, h3")) || cols[0];
    const mediaCol = cols.find((c) => c !== textCol && c.querySelector("img")) || null;
    const text = textContent(textCol, document2);
    const media = [];
    if (mediaCol) {
      const img = realImg3(mediaCol, document2);
      if (img) media.push(img);
    }
    const reverse = !!mediaCol && (textCol.classList.contains("vAcTu") || mediaCol.classList.contains("JVUfo") || cols.indexOf(mediaCol) < cols.indexOf(textCol));
    const name = reverse ? "sv-columns (media, reverse)" : "sv-columns (media)";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells: [[text, media]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sv-stories.js
  function realImg4(root, document2) {
    const imgs = [...root.querySelectorAll("img")];
    const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute("src") || "") && !i.id;
    const pick = imgs.find((i) => !isSizer(i));
    if (!pick) return null;
    let src = pick.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) {
      const set = pick.getAttribute("srcset") || pick.getAttribute("data-srcset") || "";
      const fromSet = (set.split(",").pop() || "").trim().split(/\s+/)[0];
      src = pick.getAttribute("data-src") || fromSet || src;
    }
    if (src.startsWith("data:")) {
      const ns = pick.parentElement && pick.parentElement.querySelector("noscript");
      const m = ns && /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || "");
      if (m && !m[1].startsWith("data:")) src = m[1].replace(/&amp;/g, "&");
    }
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = pick.getAttribute("alt") || "";
    return out;
  }
  var txt = (n) => n ? n.textContent.replace(/\s+/g, " ").trim() : "";
  function para(document2, text) {
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function parse4(element, { document: document2 }) {
    const slides = [...element.querySelectorAll(".slick-slide:not(.slick-cloned)")];
    let stories = slides.map((s) => s.querySelector(".sc-8c256214-0") || s).filter((s) => s.querySelector("blockquote"));
    if (!stories.length) {
      const seen = /* @__PURE__ */ new Set();
      stories = [...element.querySelectorAll(".sc-8c256214-0")].filter((s) => {
        const k = txt(s.querySelector("blockquote"));
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
    const cells = [];
    stories.forEach((story) => {
      const aside = [];
      const logoBox = story.querySelector(".sc-8c256214-2") || story;
      const logo = realImg4(logoBox, document2);
      if (logo) aside.push(logo);
      story.querySelectorAll('[class*="Statstyle__StatRoot"]').forEach((stat) => {
        const fig = stat.querySelector(".stat-figure") || stat.querySelector("p");
        const label = stat.querySelector(".stat-headline") || stat.querySelectorAll("p")[1];
        if (txt(fig)) {
          const p = document2.createElement("p");
          const strong = document2.createElement("strong");
          strong.textContent = txt(fig).replace(/\s+/g, "");
          p.append(strong);
          aside.push(p);
        }
        if (txt(label)) aside.push(para(document2, txt(label)));
      });
      const body = [];
      const bq = story.querySelector("blockquote");
      if (bq) {
        const clone = bq.cloneNode(true);
        clone.querySelectorAll("cite").forEach((c) => c.remove());
        const quote = txt(clone);
        if (quote) {
          const b = document2.createElement("blockquote");
          b.append(para(document2, quote));
          body.push(b);
        }
      }
      const cite = story.querySelector("cite") || story;
      const people = [...cite.querySelectorAll("p")].filter((p) => txt(p));
      people.forEach((p) => body.push(para(document2, txt(p))));
      if (logo && (!logo.alt || /^(next|previous|prev|logo|image)$/i.test(logo.alt.trim()))) {
        const m = / at (.+)$/.exec(txt(people[people.length - 1]));
        if (m) logo.alt = m[1].trim();
      }
      cite.querySelectorAll("a[href]").forEach((a) => {
        if (!txt(a)) return;
        const p = document2.createElement("p");
        const link = document2.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = txt(a);
        p.append(link);
        body.push(p);
      });
      cells.push([aside, body]);
    });
    const name = cells.length === 1 ? "sv-stories (single)" : "sv-stories";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sv-carousel.js
  function realImg5(root, document2) {
    const imgs = [...root.querySelectorAll("img")];
    const isSizer = (i) => /^data:image\/svg\+xml/.test(i.getAttribute("src") || "") && !i.id;
    const pick = imgs.find((i) => /^image-/.test(i.id || "")) || imgs.find((i) => !isSizer(i));
    if (!pick) return null;
    let src = pick.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) {
      const set = pick.getAttribute("srcset") || pick.getAttribute("data-srcset") || "";
      const fromSet = (set.split(",").pop() || "").trim().split(/\s+/)[0];
      src = pick.getAttribute("data-src") || fromSet || src;
    }
    if (src.startsWith("data:")) {
      const ns = pick.parentElement && pick.parentElement.querySelector("noscript");
      const m = ns && /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || "");
      if (m && !m[1].startsWith("data:")) src = m[1].replace(/&amp;/g, "&");
    }
    if (!src) return null;
    const out = document2.createElement("img");
    out.src = src;
    out.alt = pick.getAttribute("alt") || "";
    return out;
  }
  var txt2 = (n) => n ? n.textContent.replace(/\s+/g, " ").trim() : "";
  function parse5(element, { document: document2 }) {
    let slides = [...element.querySelectorAll(".slick-slide:not(.slick-cloned)")];
    if (!slides.length) slides = [...element.querySelectorAll('a[class*="LinkCard"]')];
    const cells = [];
    slides.forEach((slide) => {
      const card = slide.matches("a[href]") ? slide : slide.querySelector("a[href]") || slide;
      const href = card.getAttribute("href") || "";
      const content = card.querySelector('[class*="LinkCardstyle__LinkCardContent"]') || card;
      const media = content === card ? card : card.querySelector("span.sc-fdfb305c-0") || card;
      const img = realImg5(media, document2);
      const ps = [...content.querySelectorAll("p")].filter((p) => txt2(p));
      const titleEl = ps.length > 1 ? ps[ps.length - 1] : ps[0];
      const kindEl = ps.length > 1 ? ps[0] : null;
      const text = [];
      if (kindEl) {
        const p = document2.createElement("p");
        p.textContent = txt2(kindEl);
        text.push(p);
      }
      if (titleEl) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = href;
        a.textContent = txt2(titleEl);
        p.append(a);
        text.push(p);
      }
      if (!text.length && !img) return;
      cells.push([img ? [img] : "", text]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "sv-carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sv-accordion.js
  var WISTIA_RE2 = /wistia_async_([a-z0-9]{6,})/i;
  function imgSrc(img) {
    let src = img.getAttribute("src") || "";
    if (src && !src.startsWith("data:")) return src;
    const set = img.getAttribute("srcset") || img.getAttribute("data-srcset") || "";
    const fromSet = (set.split(",").pop() || "").trim().split(/\s+/)[0];
    if (img.getAttribute("data-src")) return img.getAttribute("data-src");
    if (fromSet) return fromSet;
    const ns = img.parentElement && img.parentElement.querySelector("noscript");
    if (ns) {
      const m = /src="([^"]+)"/.exec(ns.innerHTML || ns.textContent || "");
      if (m && !m[1].startsWith("data:")) return m[1].replace(/&amp;/g, "&");
    }
    return "";
  }
  function contentImgs(root) {
    return [...root.querySelectorAll("img")].filter((i) => /^image-/.test(i.id || "") || !/^data:image\/svg\+xml/.test(i.getAttribute("src") || ""));
  }
  function makeImg(document2, src, alt) {
    const out = document2.createElement("img");
    out.src = src;
    out.alt = alt || "";
    return out;
  }
  function cleanBlock3(src, document2) {
    const clone = src.cloneNode(true);
    clone.querySelectorAll("svg, img").forEach((s) => s.remove());
    clone.querySelectorAll("a").forEach((a) => {
      const n = document2.createElement("a");
      n.href = a.getAttribute("href") || "";
      n.textContent = a.textContent.trim();
      a.replaceWith(n);
    });
    const tag = /^(UL|OL)$/.test(src.tagName) ? src.tagName : "p";
    const out = document2.createElement(tag);
    out.innerHTML = clone.innerHTML.replace(/&nbsp;/g, " ").trim();
    return out;
  }
  function linkP2(document2, href, text, wrapTag) {
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    if (wrapTag) {
      const w = document2.createElement(wrapTag);
      w.append(a);
      p.append(w);
    } else p.append(a);
    return p;
  }
  function panelBody(panel, document2) {
    const out = [];
    panel.querySelectorAll('[class*="Textstyle__TextRoot"] > p, [class*="Textstyle__TextRoot"] > ul, [class*="Textstyle__TextRoot"] > ol').forEach((n) => {
      if (n.textContent.trim()) out.push(cleanBlock3(n, document2));
    });
    panel.querySelectorAll('[class*="LinkGroupstyle__LinkGroupRoot"] > *, [class*="VideoLinkstyle__VideoLinkRoot"]').forEach((item) => {
      if (item.closest('[class*="Textstyle__TextRoot"]')) return;
      const wm = WISTIA_RE2.exec((item.querySelector('[class*="wistia_async_"]') || item).className || "");
      if (wm) {
        const label = item.textContent.trim() || "Watch video";
        if (!out.some((p) => p.textContent === label)) out.push(linkP2(document2, `https://fast.wistia.net/embed/iframe/${wm[1]}`, label, "em"));
        return;
      }
      const a = item.matches("a[href]") ? item : item.querySelector("a[href]");
      if (a && a.textContent.trim()) out.push(linkP2(document2, a.getAttribute("href"), a.textContent.trim(), /Buttonstyle__ButtonRoot/.test(a.className) ? "strong" : null));
    });
    panel.querySelectorAll('a[href][data-aem-id="aem.components.Button"]').forEach((a) => {
      if (a.closest('[class*="Textstyle__TextRoot"], [class*="LinkGroupstyle__LinkGroupRoot"], [class*="VideoLinkstyle__VideoLinkRoot"], [class*="Accordionstyle__AccordionMediaMobile"]')) return;
      const label = a.textContent.trim();
      if (!label || out.some((p) => p.textContent === label)) return;
      out.push(linkP2(document2, a.getAttribute("href"), label, /Buttonstyle__ButtonRoot/.test(a.className) ? "strong" : null));
    });
    return out;
  }
  function parse6(element, { document: document2 }) {
    const acc = element.matches('[class*="Accordionstyle__AccordionRoot"]') ? element : element.querySelector('[class*="Accordionstyle__AccordionRoot"]');
    const sections = acc ? [...acc.querySelectorAll(':scope > [class*="Accordionstyle__AccordionSection"]')] : [];
    const isMediaShape = element.matches("section.sc-ceec712a-1") || /sc-ceec712a-1/.test(element.className);
    let desktopImgs = [];
    let reverse = false;
    if (isMediaShape && acc) {
      const row = acc.closest('[class*="Gridstyle__Row"]');
      const cols = row ? [...row.children] : [];
      const accCol = cols.find((c) => c.contains(acc));
      const mediaCol = cols.find((c) => c !== accCol && c.querySelector("img"));
      if (mediaCol) {
        desktopImgs = [...mediaCol.querySelectorAll(".sc-ceec712a-0")].map((box) => contentImgs(box)[0]).filter(Boolean);
        if (!desktopImgs.length) desktopImgs = contentImgs(mediaCol);
        reverse = mediaCol.classList.contains("hPUMno") || cols.indexOf(accCol) < cols.indexOf(mediaCol);
      }
    }
    const cells = [];
    sections.forEach((sec, i) => {
      const h = sec.querySelector('[class*="Accordionstyle__AccordionHeader"] h1, [class*="Accordionstyle__AccordionHeader"] h2, [class*="Accordionstyle__AccordionHeader"] h3, [class*="Accordionstyle__AccordionHeader"] h4') || sec.querySelector("h3");
      const title = document2.createElement("h3");
      title.textContent = h ? h.textContent.trim() : "";
      if (!title.textContent) return;
      const panel = sec.querySelector('[class*="Accordionstyle__AccordionPanel"]') || sec;
      const body = panelBody(panel, document2);
      if (isMediaShape) {
        const mobile = panel.querySelector('[class*="Accordionstyle__AccordionMediaMobile"]');
        const candidates = [];
        const m = mobile && contentImgs(mobile)[0];
        if (m) candidates.push(m);
        if (m && m.id) {
          const twin = desktopImgs.find((d) => d.id === m.id);
          if (twin) candidates.push(twin);
        }
        if (desktopImgs[i]) candidates.push(desktopImgs[i]);
        const withSrc = candidates.find((c) => imgSrc(c));
        if (withSrc) body.push(makeImg(document2, imgSrc(withSrc), withSrc.getAttribute("alt")));
        else if (candidates[0]) body.push(makeImg(document2, candidates[0].getAttribute("src") || "", candidates[0].getAttribute("alt")));
      }
      cells.push([[title], body]);
    });
    let name = "sv-accordion (faq)";
    if (isMediaShape) name = reverse ? "sv-accordion (reverse)" : "sv-accordion";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sv-cta.js
  function parse7(element, { document: document2 }) {
    const col = element.querySelector("div.sc-f23d7fd5-8 > div") || element;
    const content = [];
    let buttons = 0;
    const visit = (node) => {
      [...node.children].forEach((n) => {
        if (/^H[1-6]$/.test(n.tagName)) {
          if (!n.textContent.trim()) return;
          const h = document2.createElement("h2");
          h.textContent = n.textContent.trim();
          content.push(h);
        } else if (n.matches("a[href]")) {
          const label = n.textContent.trim();
          if (!label) return;
          const p = document2.createElement("p");
          const a = document2.createElement("a");
          a.href = n.getAttribute("href");
          a.textContent = label;
          if (/Buttonstyle__ButtonRoot/.test(n.className)) {
            const w = document2.createElement(buttons === 0 ? "strong" : "em");
            w.append(a);
            p.append(w);
            buttons += 1;
          } else p.append(a);
          content.push(p);
        } else if (n.tagName === "P") {
          if (!n.textContent.trim()) return;
          const p = document2.createElement("p");
          p.textContent = n.textContent.trim();
          content.push(p);
        } else if (n.tagName === "DIV" || n.tagName === "SPAN") {
          visit(n);
        }
      });
    };
    visit(col);
    const block = WebImporter.Blocks.createBlock(document2, { name: "sv-cta", cells: [[content]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/sv-form.js
  var TYPES = ["text", "email", "tel", "textarea", "select", "checkbox"];
  var NAMES = {
    "work email": "owner.email",
    message: "question",
    "first name": "FirstName",
    "last name": "LastName",
    "company name": "account.name",
    "number of employees": "account.help_desk_size",
    "phone number": "address.phone",
    country: "selectedCountry"
  };
  var txt3 = (n) => n ? n.textContent.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim() : "";
  function para2(document2, text) {
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function cleanP2(src, document2) {
    const clone = src.cloneNode(true);
    clone.querySelectorAll("svg, img").forEach((s) => s.remove());
    clone.querySelectorAll("a").forEach((a) => {
      const n = document2.createElement("a");
      n.href = a.getAttribute("href") || "";
      n.textContent = a.textContent.trim();
      a.replaceWith(n);
    });
    const p = document2.createElement("p");
    p.innerHTML = clone.innerHTML.replace(/\s+/g, " ").trim().replace(/<\/a>\s+([.,;:!?])/g, "</a>$1");
    return p;
  }
  function fieldType(control, label) {
    if (control.tagName === "TEXTAREA") return "textarea";
    if (control.tagName === "SELECT") return "select";
    const t = (control.getAttribute("type") || "").toLowerCase();
    if (TYPES.includes(t)) return t;
    if (/e-?mail/i.test(label)) return "email";
    if (/phone/i.test(label)) return "tel";
    return "text";
  }
  function parse8(element, { document: document2 }) {
    const form = element.querySelector("form") || element;
    const cells = [];
    const head = [];
    const title = form.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > h4") || form.querySelector("h3");
    if (txt3(title)) {
      const h = document2.createElement("h3");
      h.textContent = txt3(title);
      head.push(h);
    }
    form.querySelectorAll(':scope > [class*="Textstyle__TextRoot"] > p, :scope > [class*="Textstyle__TextRoot"]:is(p)').forEach((p) => {
      if (txt3(p)) head.push(cleanP2(p, document2));
    });
    if (head.length) cells.push([head]);
    const roots = [...form.querySelectorAll('[class*="FormFieldstyle__FormFieldRoot"]')];
    roots.forEach((root) => {
      const control = root.querySelector("input, textarea, select");
      if (!control) return;
      const labelText = txt3(root.querySelector("label")) || control.getAttribute("aria-label") || control.getAttribute("label") || "";
      const labelCell = [para2(document2, labelText)];
      const wrap = root.closest(".sc-9709aa77-5") || root.parentElement.closest('[class*="sc-9709aa77-5"]');
      const tip = wrap && wrap.querySelector('[class*="Tooltipstyle__TooltipRoot"], [role="tooltip"]');
      if (txt3(tip)) labelCell.push(para2(document2, txt3(tip)));
      const type = fieldType(control, labelText);
      const name = control.getAttribute("name") || NAMES[labelText.toLowerCase()] || "";
      let options = "";
      if (control.tagName === "SELECT") {
        const ul = document2.createElement("ul");
        [...control.querySelectorAll("option")].forEach((o, i) => {
          const v = txt3(o);
          if (!v || i === 0 && /^select$/i.test(v)) return;
          const li = document2.createElement("li");
          li.textContent = v;
          ul.append(li);
        });
        if (ul.children.length) options = [ul];
      }
      cells.push([labelCell, type, name, options]);
    });
    const foot = [];
    const privacy = [...form.querySelectorAll("p")].filter((p) => p.querySelector("a") && !p.closest('[class*="FormFieldstyle__FormFieldRoot"]')).pop();
    if (privacy) foot.push(cleanP2(privacy, document2));
    const submit = form.querySelector('button[type="submit"], [class*="LinkGroupstyle"] button, button');
    foot.push(para2(document2, txt3(submit) || "Submit"));
    cells.push([foot]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "sv-form (modal)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/zendesk-cleanup.js
  function transform(hookName, element, payload) {
    var _a;
    if (hookName === "beforeTransform") {
      const isPlaceholder = (src) => !src || src.startsWith("data:") || src.startsWith("blob:");
      element.querySelectorAll("noscript").forEach((ns) => {
        var _a2;
        const html = ns.innerHTML || ns.textContent || "";
        const decode = (v) => v && v.replace(/&amp;/g, "&");
        const src = decode((html.match(/\ssrc="([^"]+)"/) || [])[1]);
        if (!src || isPlaceholder(src)) return;
        const srcset = decode((html.match(/\ssrcset="([^"]+)"/) || [])[1]);
        const img = [...((_a2 = ns.parentElement) == null ? void 0 : _a2.querySelectorAll(":scope > img")) || []].find((i) => i.getAttribute("aria-hidden") !== "true");
        if (!img || !isPlaceholder(img.getAttribute("src"))) return;
        img.setAttribute("src", src);
        if (srcset) img.setAttribute("srcset", srcset);
        else img.removeAttribute("srcset");
      });
      const byAlt = /* @__PURE__ */ new Map();
      element.querySelectorAll("img[alt]").forEach((img) => {
        const alt = img.getAttribute("alt").trim();
        const s = img.getAttribute("src");
        if (alt && !isPlaceholder(s) && !byAlt.has(alt)) byAlt.set(alt, s);
      });
      element.querySelectorAll("img[alt]").forEach((img) => {
        const real = byAlt.get(img.getAttribute("alt").trim());
        if (real && isPlaceholder(img.getAttribute("src"))) {
          img.setAttribute("src", real);
          img.removeAttribute("srcset");
        }
      });
      const pending = [...element.querySelectorAll("img")].filter((img) => img.getAttribute("aria-hidden") !== "true" && isPlaceholder(img.getAttribute("src")));
      const pageUrl = (_a = payload == null ? void 0 : payload.params) == null ? void 0 : _a.originalURL;
      if (pending.length && pageUrl) {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", pageUrl, false);
          xhr.send();
          if (xhr.status === 200) {
            const server = new DOMParser().parseFromString(xhr.responseText, "text/html");
            const byId = /* @__PURE__ */ new Map();
            const altSeen = /* @__PURE__ */ new Map();
            server.querySelectorAll("noscript img[src]").forEach((img) => {
              const s = img.getAttribute("src");
              if (isPlaceholder(s)) return;
              if (img.id && !byId.has(img.id)) byId.set(img.id, s);
              const alt = (img.getAttribute("alt") || "").trim();
              if (alt) altSeen.set(alt, altSeen.has(alt) && altSeen.get(alt) !== s ? null : s);
            });
            const textKey = (el) => (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 160);
            const byContext = (img) => {
              let anc = img.parentElement;
              for (let depth = 0; anc && depth < 10 && textKey(anc).length < 20; depth += 1) anc = anc.parentElement;
              if (!anc || textKey(anc).length < 20) return null;
              const visible = [...anc.querySelectorAll("img")].filter((i) => i.getAttribute("aria-hidden") !== "true");
              const idx = visible.indexOf(img);
              const cls = (anc.getAttribute("class") || "").split(/\s+/)[0];
              const sel = cls ? `${anc.tagName.toLowerCase()}.${CSS.escape(cls)}` : anc.tagName.toLowerCase();
              const key = textKey(anc);
              const match = [...server.querySelectorAll(sel)].find((el) => textKey(el) === key);
              const nsImgs = match ? [...match.querySelectorAll("noscript img[src]")] : [];
              return nsImgs.length === visible.length && nsImgs[idx] ? nsImgs[idx].getAttribute("src") : null;
            };
            pending.forEach((img) => {
              const alt = (img.getAttribute("alt") || "").trim();
              let real = img.id && byId.get(img.id) || alt && altSeen.get(alt);
              if (!real) {
                try {
                  real = byContext(img);
                } catch (e) {
                  real = null;
                }
              }
              if (real && !isPlaceholder(real)) {
                img.setAttribute("src", real);
                img.removeAttribute("srcset");
              }
            });
          }
        } catch (e) {
        }
      }
      element.querySelectorAll('img[aria-hidden="true"]').forEach((img) => {
        if (isPlaceholder(img.getAttribute("src"))) img.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        // skip link
        'a[href="#main-content"]',
        // top announcement bar
        "#__next > div > div.sc-c5fa0909-6",
        // header / nav (desktop + mobile variants)
        '#__next > div > div[id^="header-"]',
        "header",
        // footer
        "#__next > div > div.sc-70d743a6-5",
        "footer",
        // chat widget launcher
        "#__next > div > button.sc-f75820d7-0",
        // Wistia video popover overlay (outside main)
        'div[id$="_popover_container"]',
        ".wistia_popover_embed",
        "wistia-tag-manager",
        // cookie banner
        "#onetrust-consent-sdk",
        "#onetrust-banner-sdk",
        // hidden overlays, trackers, framework helpers
        "next-route-announcer",
        "#CrossStorageClient",
        '[id^="batBeacon"]',
        "iframe",
        "script",
        "style",
        "noscript",
        "link"
      ]);
      [...element.querySelectorAll(":scope > img, :scope > div:empty")].forEach((el) => el.remove());
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "script",
        "style",
        "noscript",
        "link",
        "source"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-track") || n.startsWith("data-ga") || n.startsWith("data-analytics") || n.startsWith("on")) {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/zendesk-sections.js
  var MARKER = "data-excat-section-id";
  var FIRST_MARKER = "data-excat-first-section";
  var FORM_MARKER = "data-excat-form-break";
  var FORM_SELECTOR = "#main-content > div > div:has(> div.sc-d0574c0f-1 > form)";
  function findSectionEl(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      const form = element.querySelector(FORM_SELECTOR);
      if (form) {
        const hr = doc.createElement("hr");
        hr.setAttribute(FORM_MARKER, "");
        form.before(hr);
      }
      const found = sections.map((section) => ({ section, el: findSectionEl(element, section) })).filter((s) => s.el);
      for (let i = found.length - 1; i >= 0; i -= 1) {
        const { section, el } = found[i];
        if (i === 0) {
          if (section.style) {
            const hr2 = doc.createElement("hr");
            hr2.setAttribute(MARKER, section.id);
            hr2.setAttribute(FIRST_MARKER, "");
            el.before(hr2);
          }
          continue;
        }
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const start = marker || findSectionEl(element, section);
        if (!start) continue;
        const meta = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        let last = marker ? marker : start;
        let next = last.nextElementSibling;
        while (next && next.tagName !== "HR") {
          last = next;
          next = next.nextElementSibling;
        }
        last.after(meta);
        if (marker) {
          if (marker.hasAttribute(FIRST_MARKER)) {
            marker.remove();
          } else {
            marker.removeAttribute(MARKER);
          }
        }
      }
      element.querySelectorAll(`hr[${FORM_MARKER}]`).forEach((hr) => hr.removeAttribute(FORM_MARKER));
    }
  }

  // tools/importer/transformers/zendesk-page-corrections.js
  var CORRECTIONS = {
    // '<page URL: origin and path, no trailing slash, query or hash>': [(main, document) => { ... }],
    "https://www.zendesk.com/employee-service/itsm": [
      // DuPage County logo: the source SVG is 156KB and Edge Delivery rejects SVGs over 40KB;
      // use the same seal as a PNG (from the migrated DuPage customer story).
      (main) => main.querySelectorAll('img[src$="/partner-logos/TheCountyofDupage_Logo.svg"]').forEach((img) => {
        img.setAttribute("src", "https://main--zendesk--martinbuergi.aem.page/customer/media_18b6202c51e3e286c745b1b116ea588752c5b52fd.png");
        img.removeAttribute("srcset");
      })
    ]
  };
  var FRAGMENT_CORRECTIONS = {
    // '<fragment document path, e.g. fragments/authors/jane-doe>': [(fragment, document) => { ... }],
  };
  var pageKey = (u) => {
    try {
      const { origin, pathname } = new URL(u);
      return `${origin}${pathname.replace(/\/$/, "")}`;
    } catch (e) {
      return u;
    }
  };
  var fragmentKey = (p) => String(p).replace(/\\/g, "/").replace(/\.plain\.html$/, "").split("/").reduce((parts, part) => {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
    return parts;
  }, []).join("/");
  function applyCorrections(element, payload, pageCorrections, fragmentCorrections) {
    const { document: document2, params } = payload || {};
    if (!document2 || !params) return;
    if (element === document2.body) {
      if (!params.originalURL) return;
      (pageCorrections[pageKey(params.originalURL)] || []).forEach((fix) => fix(element, document2));
      return;
    }
    const fragment = (params.fragments || []).find((f) => f.element === element);
    if (!fragment || typeof fragment.path !== "string") return;
    (fragmentCorrections[fragmentKey(fragment.path)] || []).forEach((fix) => fix(element, document2));
  }
  function transform3(hookName, element, payload) {
    if (hookName !== "afterTransform") return;
    applyCorrections(element, payload, CORRECTIONS, FRAGMENT_CORRECTIONS);
  }

  // tools/importer/import-service-2.js
  var PAGE_TEMPLATE = {
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
          '#main-content > div > section.sc-f23d7fd5-11 > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^="grid-"]:has(.Cardstyle__CardRoot-sc-12jokda-2)'
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
          '#main-content > div > section.sc-f23d7fd5-11 > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^="grid-"] .Accordionstyle__AccordionRoot-sc-1baakjb-1'
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
          '#main-content > div > section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^="grid-"] .Accordionstyle__AccordionRoot-sc-1baakjb-1)'
        ],
        "style": null,
        "blocks": [
          "sv-accordion"
        ],
        "defaultContent": [
          '#main-content > div > section.sc-f23d7fd5-11:has(> div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^="grid-"] .Accordionstyle__AccordionRoot-sc-1baakjb-1) > div.sc-f23d7fd5-7 > div.sc-f23d7fd5-2 > div[id^="grid-"] h2.Headingstyle__HeadingRoot-sc-6ks3it-0'
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
  var parsers = {
    "sv-hero": parse,
    "sv-cards": parse2,
    "sv-columns": parse3,
    "sv-stories": parse4,
    "sv-carousel": parse5,
    "sv-accordion": parse6,
    "sv-cta": parse7,
    "sv-form": parse8
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var correctionTransformers = [transform3];
  var transformers = [transform, ...lateTransformers, ...correctionTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template, url) {
    const pageBlocks = [];
    const pageKey2 = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey2(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document2.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      matches.forEach((element) => {
        if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    };
    template.blocks.forEach((blockDef) => {
      const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey2(u) === key);
      (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
    });
    template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
    return pageBlocks;
  }
  function markPageTargets(payload) {
    const { document: document2, params } = payload;
    executeTransformers("beforeTransform", document2.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document2, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document2.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_service_2_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document2.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document: document2, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document2.createElement("hr"));
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document2);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document2.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_service_2_exports);
})();
