// Enemy spells (Joseph's autopilot list, item 2): each spell it can cast now weighed against its weapons: the Mage's
// Fireball on three bunched together (a use spent); the Cultist Fanatic's Hold Person on the most dangerous, concentrating, and
// no second one while it holds; spread out, no Fireball; step by step, the box says what's cast.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:mage", n: "1" }, { id: "srd:cultist-fanatic", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = (spread) => { const P = fight().pos; Object.assign(P, { [who("Gawain").id]: spread ? { x: 2, y: 1 } : { x: 3, y: 4 }, [who("Wren").id]: spread ? { x: 10, y: 8 } : { x: 4, y: 4 }, [who("Bram").id]: spread ? { x: 22, y: 1 } : { x: 4, y: 5 },
  [who("Mage").id]: { x: 16, y: 4 }, [who("Cultist").id]: { x: 12, y: 7 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const used = t => JSON.stringify(t.x.used || {});
step("the Mage's turn, the party bunched: Fireball on all three (one of its two uses)", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  const M = who("Mage"); await turnOf(M); const r = await withRoll(0.5, () => autoTurn(fight(), M));
  return `${r.said.slice(0, 260)} | uses: ${used(M)} | ${party()}`;
});
step("the Cultist Fanatic: Hold Person on the most dangerous of them, and it concentrates", async () => {
  place(); const F = who("Cultist"); await turnOf(F); const r = await withRoll(0.3, () => autoTurn(fight(), F));
  const held = Object.entries(fight().holds || {}).map(([id, H]) => `${(all().find(x => x.id === id) || {}).label}: ${H.name} (${CTRL_SAY[H.tier]})`).join(", ");
  return `${r.said.slice(0, 260)} | held: ${held || "nobody"} | concentrating: ${JSON.stringify(F.x.conc && F.x.conc.name || F.x.conc || null)}`;
});
step("its next turn: still concentrating, so no second Hold Person", async () => {
  const F = who("Cultist"); fight().round = (fight().round || 1) + 1; await turnOf(F); const r = await withRoll(0.6, () => autoTurn(fight(), F));
  return `${r.said.slice(0, 220)} | Hold Person again: ${/casts Hold Person|Hold Person on/i.test(r.said)}`;
});
step("spread out, a Fireball catches only one, so the Mage does something else", async () => {
  place(true); const M = who("Mage"); fight().round = 1; await turnOf(M); const r = await withRoll(0.5, () => autoTurn(fight(), M));
  return `${r.said.slice(0, 220)} | Fireball: ${/Fireball/.test(r.said)} | uses: ${used(M)}`;
});
step("step by step: the box says what's cast before the saves", async () => {
  place(); ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; }); fight().holds = {}; const M = who("Mage"); M.x.used = {}; fight().round = 1; delete root.autoPace; Object.assign(AUTO_MS, { step: 20, beat: 20, say: 120, perChar: 0, sayMax: 120 }); await turnOf(M);
  const says = []; await withRoll(0.5, async () => { const run = autoTurn(fight(), M);
    for (let ms = 0; ms < 3000; ms += 20) { await wait(20); const b = $("#auto-say"), s = b && !b.hidden ? b.querySelector("p").textContent : ""; if (s && says[says.length - 1] !== s) says.push(s); if (!autoBusy && ms > 40) break; } await run; });
  return `boxes: ${says.map(s => s.slice(0, 70)).join(" / ")} | the turn: ${((fight().autoLast || {}).said || "none").slice(0, 120)} | page errors ${__KIT.errors.length}`;
});
