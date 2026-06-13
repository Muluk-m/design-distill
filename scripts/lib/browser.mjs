// Playwright helpers shared by screenshot + native extraction.
//
// One browser dependency (Chromium) underlies both dembrandt and our own
// capture. Importing playwright is deferred so that pure-logic modules (and
// their tests) never require the package to be installed.

let _chromium = null;
async function chromium() {
  if (_chromium) return _chromium;
  try {
    const mod = await import("playwright");
    _chromium = mod.chromium;
    return _chromium;
  } catch {
    throw new Error(
      "playwright is not installed. Run the design-distill setup/bootstrap to install it."
    );
  }
}

// Browser source preference. We do NOT force our own download when the user
// already has a usable browser. Order:
//   1. A user-provided CDP endpoint (DESIGN_DISTILL_CDP or BROWSER_CDP_ENDPOINT)
//      — connect to an already-running Chrome, no download.
//   2. Playwright's bundled Chromium (if it was installed).
//   3. A system-installed Chrome / Edge via Playwright `channel` — no download.
// Each entry returns a launched/connected Browser or throws.
function launchStrategies() {
  const cdp = process.env.DESIGN_DISTILL_CDP || process.env.BROWSER_CDP_ENDPOINT;
  const strategies = [];
  if (cdp) {
    strategies.push({
      name: `cdp:${cdp}`,
      open: async () => (await chromium()).connectOverCDP(cdp),
    });
  }
  strategies.push({
    name: "playwright-chromium",
    open: async () => (await chromium()).launch({ headless: true }),
  });
  for (const channel of ["chrome", "msedge"]) {
    strategies.push({
      name: `system-${channel}`,
      open: async () => (await chromium()).launch({ headless: true, channel }),
    });
  }
  return strategies;
}

let _chosen = null;
// Launch (or connect to) a usable browser, trying each source in order. Caches
// the first source that works so we don't re-probe every call.
export async function launchBrowser() {
  const ordered = _chosen
    ? [_chosen, ...launchStrategies().filter((s) => s.name !== _chosen.name)]
    : launchStrategies();
  let lastErr;
  for (const s of ordered) {
    try {
      const browser = await s.open();
      _chosen = s;
      return browser;
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`no usable browser (tried ${ordered.map((s) => s.name).join(", ")}): ${lastErr?.message || lastErr}`);
}

// Is any usable browser present (bundled, system, or CDP)? Returns false
// instead of throwing so probing never crashes.
export async function browserAvailable() {
  try {
    const browser = await launchBrowser();
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

// Which browser source satisfied the last/next probe (for diagnostics).
export async function browserSource() {
  try {
    const browser = await launchBrowser();
    await browser.close();
    return _chosen ? _chosen.name : null;
  } catch {
    return null;
  }
}

const HYDRATION_WAIT_MS = 2500;

async function gotoStable(page, url) {
  const resp = await page.goto(url, { waitUntil: "load", timeout: 45000 });
  // Wait for client-side hydration / late content to settle.
  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {
    /* networkidle can time out on chatty sites; proceed anyway */
  }
  await page.waitForTimeout(HYDRATION_WAIT_MS);
  // Trigger lazy content.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  return resp;
}

/**
 * Capture screenshots of a target across viewports and color schemes.
 * @param {string} url  normalized http(s) or file:// URL
 * @param {object} opts { viewports: {name,width,height}[], schemes: ("light"|"dark")[], fullPage, outDir }
 * @returns {Promise<{images: {path,viewport,scheme}[]}>}
 */
export async function capture(url, opts = {}) {
  const viewports = opts.viewports || [{ name: "desktop", width: 1920, height: 1080 }];
  const schemes = opts.schemes || ["light"];
  const fullPage = opts.fullPage !== false;
  const outDir = opts.outDir || ".";
  const writeFile = opts.writeFile; // injected for tests; defaults to real screenshot

  const browser = await launchBrowser();
  const images = [];
  try {
    for (const scheme of schemes) {
      const context = await browser.newContext({ colorScheme: scheme });
      try {
        for (const vp of viewports) {
          const page = await context.newPage();
          await page.setViewportSize({ width: vp.width, height: vp.height });
          let resp;
          try {
            resp = await gotoStable(page, url);
          } catch (err) {
            await page.close();
            throw new Error(`render failed for ${url}: ${err?.message || err}`);
          }
          if (resp && !resp.ok() && resp.status() >= 400) {
            await page.close();
            throw new Error(`render failed for ${url}: HTTP ${resp.status()}`);
          }
          const path = `${outDir}/${vp.name}-${scheme}.png`;
          if (writeFile) await writeFile(page, path, { fullPage });
          else await page.screenshot({ path, fullPage });
          images.push({ path, viewport: vp.name, scheme });
          await page.close();
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return { images };
}

// In-page native extraction: reads :root/html custom properties plus computed
// styles from representative elements. Returns the raw dump consumed by
// mapNativeComputed. This is the dembrandt-absent fallback path.
export async function nativeExtract(url) {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await gotoStable(page, url);
    const data = await page.evaluate(() => {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      const cssVariables = {};
      for (const sheet of [...document.styleSheets]) {
        let rules;
        try {
          rules = [...sheet.cssRules];
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (rule.selectorText === ":root" || rule.selectorText === "html") {
            for (const prop of rule.style) {
              if (prop.startsWith("--")) cssVariables[prop] = cs.getPropertyValue(prop).trim();
            }
          }
        }
      }
      const colors = new Set();
      const fontFamilies = new Set();
      const radius = new Set();
      const shadows = new Set();
      const sample = document.querySelectorAll("body, a, button, h1, h2, p, [class]");
      let count = 0;
      for (const el of sample) {
        if (count++ > 400) break;
        const s = getComputedStyle(el);
        if (s.color) colors.add(s.color);
        if (s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)") colors.add(s.backgroundColor);
        if (s.fontFamily) fontFamilies.add(s.fontFamily.split(",")[0].replace(/["']/g, "").trim());
        if (s.borderRadius && s.borderRadius !== "0px") radius.add(s.borderRadius);
        if (s.boxShadow && s.boxShadow !== "none") shadows.add(s.boxShadow);
      }
      return {
        cssVariables,
        colors: [...colors],
        fontFamilies: [...fontFamilies],
        radius: [...radius],
        shadows: [...shadows],
      };
    });
    return data;
  } finally {
    await browser.close();
  }
}
