// uses: kal
// Probe (not committed: the save holds the players' data): the Kalatecha save with the new features filled in
// (2026-11-02), in today's app.
const npc = id => lib().npcs.find(p => p.id === id);
step("load the new Kalatecha save", async () => {
  loadJSONNow(JSON.stringify(FIX["kal"])); await wait(800);
  expect(!__KIT.errors.length, "no page errors on load", __KIT.errors);
  return `${campName()} | themeMix ${JSON.stringify(root.themeMix)} | day ${root.dayFights} fights, ${root.dayShorts} short | flags ${root.flags.map(f => f.id).join(",")}`;
});
step("every tab draws", async () => {
  const bad = [];
  for (const b of document.querySelectorAll("button[data-pane]")) { const n = __KIT.errors.length; b.click(); await wait(150); if (__KIT.errors.length > n) bad.push(b.dataset.pane + ": " + __KIT.errors.slice(n).join(" / ")); }
  expect(!bad.length, "no errors on any tab", bad);
  return "ok";
});
step("people: known, gender, kind", () => {
  const P = lib().npcs;
  return `known: ${P.filter(p => p.known).map(p => p.name).join(", ")}\ngender set: ${P.filter(p => p.gender).length} | kind set: ${P.filter(p => p.pkind).length}`;
});
step("villains' tactics from their sheets", () => ["ln_hargrove", "ln_queen"].map(id => {
  const p = npc(id); let t; try { t = JSON.stringify(tacOf({}, { kind: "npc", id: "n:" + id, p })); } catch (e) { t = "ERR " + e.message; }
  return `${p.name}: ${t}`;
}).join("\n"));
step("the stowaway rescued: her stage switches", async () => {
  const before = personNow(npc("ln_stowaway")).wants;
  setFlag("f_stowaway", true); await wait(200);
  const p = npc("ln_stowaway");
  expect(p.stageNow === "st_safe", "stage switched to rescued", p.stageNow);
  expect(!__KIT.errors.length, "no page errors", __KIT.errors);
  return `${p.name}: "${before}" -> "${personNow(p).wants}"`;
});
step("the theme mix rolls nautical most", () => {
  const n = {}; for (let i = 0; i < 400; i++) { const t = pickTheme(); n[t] = (n[t] || 0) + 1; }
  return JSON.stringify(n);
});
