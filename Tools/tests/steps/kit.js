/* Test kit (Joseph, 2026-11-01: tests must not hang, must fail fast, and must start again where they failed).
   The same file is in Character Book\tests and Ordinate Survey's Tools\tests\steps: keep the two in step.

   Loaded before the app. Nothing a test does can hang the page:
   - confirm and prompt answer from __KIT.answers (a queue; empty: confirm says __KIT.confirmDefault, prompt its default);
   - a download (a link with download, or a blob link) is caught in __KIT.downloads as { name, blob } and goes nowhere;
   - file pickers, window.open and following links do nothing.
   A test is named steps, run in order:
       step("brings Gnick in", async () => { ...; expect(c.hp === 39, "hit points", c.hp); return `hp ${c.hp}`; });
   A step passes by returning (its text is the result line), and fails by throwing: expect() throws with what it got.
   The first failure stops the test. After each step the app's state is kept, so the runner can start again at a
   step (-From): steps must look things up from the app (C(), root), not from variables an earlier step set; small
   values to carry across go in __KIT.keep, which is kept with the state. Progress is written as it goes, so a test
   that times out still shows the step it was on. */
(() => {
  const K = window.__KIT = { kind: window.__KIT_KIND || "", from: window.__FROM || 1, answers: [], confirmDefault: window.__CONFIRM !== false,
    downloads: [], steps: [], lines: [], states: {}, errors: [], keep: {}, done: false, failedAt: 0, at: 0 };
  // what "the app's state" is, per app: the Character Book keeps it in localStorage, the survey in its bundle
  const ADAPT = {
    // all of the app's own keys (the sheets, the sync settings, the screen it was on), not just the main one; which
    // keys are the app's: steps.json's "keys" (the Field Book: its own, and the sync setup it shares with the Character Book)
    cb: { key: "character-book",
      pre: s => { try { const o = JSON.parse(s); if (o && o.__all) { for (const [k, v] of Object.entries(o.__all)) localStorage.setItem(k, v); } else localStorage.setItem("character-book", s); } catch (e) {} },
      save: () => { try { if (typeof window.save === "function") window.save(true); } catch (e) {}
        const mine = window.__KIT_KEYS || ["character-book"], all = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && mine.some(p => k.startsWith(p))) all[k] = localStorage.getItem(k); } return JSON.stringify({ __all: all }); } },
    survey: { post: s => window.loadJSONNow(s), save: () => JSON.stringify(window.exportBundle()) }
  };
  const A = ADAPT[K.kind === "local" ? "cb" : K.kind] || {};   // "local": an app kept in localStorage, like the Character Book
  // the survey also asks for an artifact storage API a plain browser doesn't have: one in memory, empty each run
  if (K.kind === "survey" && !window.storage) { const M = {}; window.storage = { get: async k => { if (!(k in M)) throw new Error("none"); return { key: k, value: M[k] }; },
    set: async (k, v) => { M[k] = v; return { key: k, value: v }; }, delete: async k => { delete M[k]; return { key: k, deleted: true }; }, list: async () => ({ keys: Object.keys(M) }) }; }
  window.addEventListener("error", e => K.errors.push(`${e.message} @${e.lineno}:${e.colno}`));
  window.addEventListener("unhandledrejection", e => K.errors.push(`unhandled: ${e.reason && e.reason.message || e.reason}`));

  // nothing can wait on a person
  window.alert = () => {};
  window.confirm = () => K.answers.length ? !!K.answers.shift() : K.confirmDefault;
  window.prompt = (q, d) => K.answers.length ? K.answers.shift() : (d ?? "");
  window.open = () => null;
  try { Object.defineProperty(navigator, "canShare", { value: () => false, configurable: true }); } catch (e) {}
  // a download is caught, never followed
  const blobs = new Map(), mk = URL.createObjectURL.bind(URL);
  URL.createObjectURL = b => { const u = mk(b); blobs.set(u, b); return u; };
  const aClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download") || /^(blob|data):/.test(this.href)) { K.downloads.push({ name: this.download || "", blob: blobs.get(this.href) || null, href: this.href }); return; }
    if (this.href && !/^javascript:/.test(this.href) && !this.getAttribute("href").startsWith("#")) return;
    return aClick.call(this);
  };
  document.addEventListener("click", e => { const a = e.target && e.target.closest && e.target.closest("a[href]"); if (a && !a.getAttribute("href").startsWith("#")) e.preventDefault(); }, true);
  const iClick = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function () { if (this.type === "file") return; return iClick.call(this); };

  // a restart at a step: the state kept after the step before it
  let restore = null;
  if (K.from > 1 && window.__STATE) { restore = window.__STATE; K.keep = restore.keep || {}; if (A.pre) A.pre(restore.app); }

  K.text = async b => b && b.text ? await b.text() : "";
  K.flush = () => {
    let pre = document.getElementById("__KIT");
    if (!pre) { pre = document.createElement("pre"); pre.id = "__KIT"; pre.hidden = true; (document.body || document.documentElement).appendChild(pre); }
    pre.textContent = JSON.stringify({ done: K.done, failedAt: K.failedAt, at: K.at, lines: K.lines, errors: K.errors, states: K.states, files: K.files || [] });
    document.title = K.done ? "RES " + K.lines.join(" || ") : `STEP ${K.at} of ${K.steps.length}`;
  };
  // the dice: the same every run, and fixed per step, so a test started at step 5 rolls what a full run rolls there
  let seed = 20261101; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  K.seed = n => { seed = (20261101 + n * 7919) % 2147483647 || 1; };
  window.step = (name, fn) => K.steps.push({ name, fn });
  window.expect = function (cond, what, got) { if (!cond) throw new Error(`${what}${arguments.length > 2 ? ` (got ${JSON.stringify(got)})` : ""}`); };
  window.wait = ms => new Promise(r => setTimeout(r, ms));
  K.run = async () => {
    await wait(50);
    if (restore && A.post) { try { A.post(restore.app); await wait(300); } catch (e) { K.errors.push("restore: " + e.message); } }
    for (let i = 0; i < K.steps.length; i++) {
      const n = i + 1, s = K.steps[i]; K.at = n;
      if (n < K.from) { K.lines.push(`${n}. ${s.name}: (resumed after this)`); continue; }
      K.flush(); K.seed(n);
      try {
        const r = await s.fn();
        if (K.errors.length) throw new Error("the page had an error: " + K.errors.join(" ; "));
        K.lines.push(`${n}. ${s.name}: ${r === undefined ? "ok" : typeof r === "string" ? r : JSON.stringify(r)}`);
      } catch (e) { K.lines.push(`${n}. ${s.name}: FAILED ${e.message}`); K.failedAt = n; break; }
      try { if (A.save) K.states[n] = { app: await A.save(), keep: K.keep }; } catch (e) {}
    }
    // what the test downloaded, as text, so the runner can keep it (out\<test>\downloads) for another test to use
    K.files = []; for (const d of K.downloads) { try { K.files.push({ name: d.name, text: await K.text(d.blob) }); } catch (e) {} }
    K.done = true; K.flush();
  };
})();
