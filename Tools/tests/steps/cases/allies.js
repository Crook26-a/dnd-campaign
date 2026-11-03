// The party's side too (Joseph's autopilot list, item 12): a companion (Mara, from the library) and a goblin that's come
// over get the tactics box and "Run their turn"; Mara's bow (its range from the SRD's Shortbow) shoots the enemy from out
// of reach; the goblin ally goes for the goblins, not the party; with "Allies and companions run their own turns" ticked,
// an ally's turn runs by itself and the turn passes on; off (the default), it waits.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [{ id: "mara", name: "Mara Fenwick", hp: "22", hpMax: "22", ac: "14", speed: "30", attacks: [{ name: "Shortbow", hit: "+5", dmg: "1d6+3", dtype: "piercing" }, { name: "Shortsword", hit: "+5", dmg: "1d6+3", dtype: "piercing" }], tac: { role: "ranged", aim: "nearest", courage: 4 } }], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "3" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const gob = k => all().filter(t => t.label.startsWith("Goblin"))[k];
const place = () => { const c = fight(), P = c.pos; c.stealth = {}; c.disengaged = {}; c.holds = {}; ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; });
  [0, 1, 2].forEach(k => { const x = gob(k).x; x.conds = []; x.hp = x.max; x.fled = false; x.tac = { role: "front", aim: "nearest" }; });
  Object.assign(P, { [who("Gawain").id]: { x: 14, y: 4 }, [who("Wren").id]: { x: 10, y: 1 }, [who("Bram").id]: { x: 4, y: 8 }, [gob(0).id]: { x: 15, y: 4 }, [gob(1).id]: { x: 20, y: 6 }, [gob(2).id]: { x: 26, y: 8 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const run1 = async (t, v) => { $("#bt-pop").hidden = true; await turnOf(t); const r = await withRoll(v, () => autoTurn(fight(), t)); const pop = !$("#bt-pop").hidden; $("#bt-pop").hidden = true; return { r, pop }; };
const mara = () => who("Mara"), at2 = t => { const p = fight().pos[t.id]; return `(${p.x},${p.y})`; };
const setup = () => { root.companions = ["mara"]; const c = fight(); place(); const g1 = gob(1); g1.x.ally = true; g1.x.tac = { role: "front", aim: "nearest" };
  Object.assign(c.pos, { [mara().id]: { x: 6, y: 4 }, [gob(0).id]: { x: 15, y: 4 }, [gob(1).id]: { x: 12, y: 6 }, [gob(2).id]: { x: 20, y: 6 } }); renderBattle(); };
step("Mara (a companion) and a goblin that came over: on their side, with the tactics box and its new setting", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60); root.companions = ["mara"];
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now"; root.autoEnemies = false; root.autoAllies = false; setup();
  await turnOf(mara()); const box = [...document.querySelectorAll(".tacbox")].map(b => b.innerText.replace(/\s+/g, " ").trim()).join(" / ").slice(0, 300);
  return `sides: ${mara().side}, ${gob(1).label} ${gob(1).side} | autopilot for them: ${autoFor(mara())}, ${autoFor(gob(1))}; for Gawain: ${autoFor(who("Gawain"))} | box: ${box}`;
});
step("Run their turn on Mara: the Shortbow (80 ft, from the SRD) on a goblin, from out of reach", async () => {
  setup(); const r = autoReachOf(fight(), mara(), "pca:0"); const { r: R } = await run1(mara(), 0.6);
  return `shortbow reach ${JSON.stringify({ melee: r.melee, range: r.range })} | ${R.said.slice(0, 220)} | at ${at2(mara())}`;
});
step("the goblin that came over goes for the goblins, not the party", async () => {
  setup(); const { r } = await run1(gob(1), 0.6); return `${r.said.slice(0, 220)} | at ${at2(gob(1))}`;
});
step("allies off (the default): Mara's turn waits; ticked: it runs by itself and the turn passes on", async () => {
  setup(); const c = fight(); c.log = []; await turnOf(mara()); autoNext(c); await wait(1200); const off = `turn still Mara's: ${c.turn === mara().id}, logged ${c.log.length}`;
  root.autoAllies = true; await turnOf(mara()); autoNext(c); for (let k = 0; k < 40 && (autoBusy || c.turn === mara().id); k++) await wait(100);
  const on = `logged: ${(c.log || []).map(e => e.text.slice(0, 70)).join(" / ")} | turn now ${(all().find(x => x.id === c.turn) || {}).label}`; root.autoAllies = false; clearTimeout(autoTimer);
  return `${off} || ${on} | page errors ${__KIT.errors.length}`;
});