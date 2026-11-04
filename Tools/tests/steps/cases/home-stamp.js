// The campaign folder's stamp (Joseph's Kalatecha save, 2026-11-04): a save that carries "savedAt" loads without it
// becoming part of the campaign, and Current save.json is always written with it last, where the app reads it.
const stampDir = () => { const tree = {}; return { kind: "directory", name: "Kal", tree, async queryPermission() { return "granted"; },
  async getFileHandle(n, o) { if (!(n in tree)) { if (!(o && o.create)) throw new Error("NotFound"); tree[n] = { file: "" }; } const e = tree[n];
    return { async getFile() { return { text: async () => e.file, lastModified: Date.now() }; }, async createWritable() { let b = ""; return { async write(s) { b += s; }, async close() { e.file = b; } }; } }; },
  async getDirectoryHandle() { throw new Error("NotFound"); } }; };
step("a save carrying a stamp loads without it; writing puts the stamp last", async () => {
  const d = { format: "ordinate-survey-v1", title: "Stamp", nodes: [{ id: "a", name: "A", kind: "town", x: 0, y: 0 }], roads: [], savedAt: "2020-01-01T00:00:00.000Z", library: {} };
  loadJSONNow(JSON.stringify(d)); await wait(200);
  const D = stampDir(); campDir = D; homeState = "connected"; await homeWrite(true);
  const text = D.tree["Current save.json"].file, r = await homeRead(D);
  campDir = null; homeState = "";
  expect(!("savedAt" in root), "no stamp in the campaign", root.savedAt);
  return `in the campaign: ${"savedAt" in root} | the file ends with its stamp: ${/"savedAt":"[^"]+"}$/.test(text)} | read back: ${r && r.at !== "2020-01-01T00:00:00.000Z"} | page errors ${__KIT.errors.length}`;
});
