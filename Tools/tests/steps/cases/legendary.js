// Legendary actions (Joseph's autopilot list, item 5): after someone else's turn, one if it's worth it (autopilot on), the
// uses back at its own turn, "once until its next turn" kept; the reminder with Run one / Skip (autopilot off); the lair's
// fourth use; Legendary Resistance on a failed save that matters.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 9, hp: "48", hpMax: "48", ac: "12", int: 18, dc: "17", spells: ["spell:hold-monster"], slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }, { max: 1, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }], attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:adult-red-dragon", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = () => { const P = fight().pos; Object.assign(P, { [who("Gawain").id]: { x: 8, y: 4 }, [who("Wren").id]: { x: 4, y: 2 }, [who("Bram").id]: { x: 5, y: 6 }, [who("Adult").id]: { x: 10, y: 4 } }); renderBattle(); };
const D = () => who("Adult"), left = () => `${legLeft(D())} of ${legMax(D())}`;
const after = async (id, v) => { const c = fight(); c.turn = id; c.log = c.log || []; const n0 = c.log.length; await withRoll(v, async () => { nextTurn(c); renderBattle(); renderBattlePanel(); for (let k = 0; k < 20 && autoBusy; k++) await wait(50); await wait(50); }); if (root.autoEnemies) clearTimeout(autoTimer); return c.log.slice(n0).map(e => e.text.slice(0, 120)).join(" / ") || "nothing"; };
step("after Gawain's turn, the dragon takes a legendary action (it's worth it), as a legendary action", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now"; root.autoEnemies = true;
  legTurnStart(fight(), D().id); const said = await after(who("Gawain").id, 0.6);
  return `${said} | uses ${left()} | its action used: ${!!(fight().acted && fight().acted[D().id] && fight().acted[D().id].n)}`;
});
step("after the next two turns, two more (never one marked 'once' twice); then none left", async () => {
  const a = await after(who("Wren").id, 0.6), b = await after(who("Bram").id, 0.6), c3 = await after(who("Gawain").id, 0.6);
  return `${a} || ${b} || a fourth: ${c3} | uses ${left()} | once: ${JSON.stringify(D().x.legOnce)}`;
});
step("its own turn: all three back", async () => { legTurnStart(fight(), D().id); return `uses ${left()}`; });
step("autopilot off: the reminder (Run one / Skip); Skip clears it; in its lair: four", async () => {
  const c = fight(); root.autoEnemies = false; await after(who("Wren").id, 0.6); renderBattlePanel(); await wait(20);
  const box = [...document.querySelectorAll(".tacbox")].find(b => /legendary actions left/.test(b.textContent)); const txt = box ? box.innerText.replace(/\s+/g, " ").trim() : "no reminder";
  if (!document.querySelector("[data-legskip]")) return `${txt} | NO BUTTONS: turn ${(all().find(x => x.id === c.turn) || {}).label}, offer ${JSON.stringify(c.legOffer)}, now ${turnStamp(c)}, cands ${legCandidates(c).map(x => x.label)}, left ${left()}`;
  document.querySelector("[data-legskip]").click(); await wait(20); const gone = !document.querySelector("[data-legskip]");
  const lair = document.querySelector("[data-leglair]"); lair.checked = true; lair.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  return `${txt} | after Skip, offered: ${!gone} | in its lair: ${left()}`;
});
step("Wren's Hold Monster: the dragon fails its save and uses Legendary Resistance (a use gone)", async () => {
  const c = fight(), W = who("Wren"); c.turn = W.id; act = freshAct(W.id); renderBattlePanel(); await wait(20);
  const s = document.querySelector("#ac-what"); s.value = "sp:spell:hold-monster"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  act.targets = [D().id]; renderBattlePanel(); await wait(20); await withRoll(0.05, () => { document.querySelector(`[data-svroll="${D().id}"]`).click(); });
  return `${(act.saves || {})[D().id] ? act.saves[D().id].said : "no save"} | resistances used ${JSON.stringify((D().x.used || {})["Legendary Resistance"] || 0)} | page errors ${__KIT.errors.length}`;
});
