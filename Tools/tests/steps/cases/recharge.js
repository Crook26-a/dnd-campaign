// Recharges at the start of a creature's turn (Joseph, 2026-11-02): a d6 for each used "Recharge X–6" ability, back on X or
// higher; logged (and undone) with its die; the autopilot says it first, then uses what came back.
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
      foes: [{ id: "srd:goblin-warrior", n: "1" }, { id: "srd:gargoyle", n: "1" }, { id: "srd:scout", n: "1" }, { id: "srd:winter-wolf", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = () => { const P = fight().pos; Object.assign(P, { [who("Gawain").id]: { x: 2, y: 4 }, [who("Wren").id]: { x: 4, y: 4 }, [who("Bram").id]: { x: 5, y: 4 },
  [who("Goblin").id]: { x: 12, y: 4 }, [who("Gargoyle").id]: { x: 9, y: 2 }, [who("Scout").id]: { x: 20, y: 6 }, [who("Winter").id]: { x: 25, y: 7 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; if (c.moved) delete c.moved[t.id]; if (c.acted) delete c.acted[t.id]; c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(30); };
const run = async () => { const b = document.querySelector("[data-autorun]"); expect(b, "Run their turn is offered"); b.click(); await wait(40); return fight().autoLast; };

const breath = () => { const w = who("Winter"), k = Object.keys(w.x.spent || {}).find(k => /breath/i.test(k)); return k ? (w.x.spent[k] ? "used" : "ready") : "ready"; };
const startOf = (t, v) => withRoll(v, () => { const c = fight(); c.turn = t.id; fxTurnStart(c, t.id); });
step("its breath used: a 6 at the start of its turn brings it back; a 1 doesn't", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place();
  const w = who("Winter"), k = foeResources(foeById(w.x.foe)).find(r => r.kind === "recharge").key; w.x.spent = { [k]: true };
  await startOf(w, 0.95); const six = `${fight().log.slice(-1)[0].text} → ${breath()}`;
  w.x.spent[k] = true; await startOf(w, 0.05); const one = `${fight().log.slice(-1)[0].text} → ${breath()}`;
  return `${six} | ${one}`;
});
step("undo takes the roll back; a creature with nothing used rolls nothing", async () => {
  const c = fight(), w = who("Winter"); await startOf(w, 0.95); const before = breath(); undoAction(c); const after = breath();
  const n0 = c.log.length; await startOf(who("Gargoyle"), 0.95);
  return `rolled: ${before}, undone: ${after} | the gargoyle's turn start logged ${c.log.length - n0}`;
});
step("the autopilot, step by step: the recharge roll in its box first, then the breath on two of them", async () => {
  place(); const c = fight(), w = who("Winter"); c.pos[w.id] = { x: 7, y: 4 }; c.pos[who("Goblin").id] = { x: 12, y: 6 }; renderBattle();
  delete root.autoPace; Object.assign(AUTO_MS, { step: 20, beat: 20, say: 120, perChar: 0, sayMax: 120 });
  const k = foeResources(foeById(w.x.foe)).find(r => r.kind === "recharge").key; w.x.spent = { [k]: true }; await turnOf(w); delete c.autoLast;
  const says = []; await withRoll(0.95, async () => { fxTurnStart(c, w.id); const run = autoTurn(c, w);
    for (let ms = 0; ms < 3000; ms += 20) { await wait(20); const b = $("#auto-say"), s = b && !b.hidden ? b.querySelector("p").textContent : ""; if (s && says[says.length - 1] !== s) says.push(s); if (!autoBusy && ms > 40) break; } await run; });
  return `boxes: ${says.map(s => s.slice(0, 80)).join(" / ")} | breath now: ${breath()} | page errors ${__KIT.errors.length}`;
});
