// Healers heal, supports guard (Joseph's autopilot list, item 6): the Priest's Divine Aid casts Healing Word on a hurt bandit (a
// bonus action, then its action); the Deva walks over and touches one with Cure Wounds (its Divine Aid); a support with nobody
// to heal stands beside the one it looks after and goes for the enemy nearest them; nobody hurt, no healing.
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
      foes: [{ id: "srd:priest", n: "1" }, { id: "srd:bandit", n: "1" }, { id: "srd:deva", n: "1" }] },
      bmap: { name: "The Hall", rows: [wall, floor, floor, floor, floor, floor, floor, floor, floor, wall], start: { party: [[2, 4], [4, 4], [5, 4]], enemy: [[12, 4], [16, 2], [20, 6], [8, 4]] } } }] } } };
const hall = () => (doc.nodes || []).find(n => n.id === "hall");
const fight = () => hall().site.combat;
const all = () => combatants(fight());
const who = nm => all().find(t => t.label.startsWith(nm));
const hp = t => t.kind === "foe" ? t.x.hp : t.p.hp;
const at = t => { const p = fight().pos[t.id]; return p ? `(${p.x},${p.y})` : "off"; };
const party = () => ["Gawain", "Wren", "Bram"].map(n => `${n} ${hp(who(n))}`).join(", ");
const withRoll = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const place = () => { const P = fight().pos; Object.assign(P, { [who("Gawain").id]: { x: 6, y: 4 }, [who("Wren").id]: { x: 3, y: 2 }, [who("Bram").id]: { x: 4, y: 6 },
  [who("Priest").id]: { x: 14, y: 4 }, [who("Bandit").id]: { x: 7, y: 4 }, [who("Deva").id]: { x: 11, y: 6 } }); renderBattle(); };
const turnOf = async t => { const c = fight(); c.turn = t.id; ["moved", "acted", "bonused"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const BAN = () => who("Bandit"), hpTxt = t => `${t.x.hp}/${t.x.max}`, at2 = t => { const p = fight().pos[t.id]; return `(${p.x},${p.y})`; };
step("the bandit at 2 HP: the Priest's Divine Aid casts Healing Word on it (a bonus action), then it acts", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); root.autoPace = "now";
  BAN().x.hp = 2; const P = who("Priest"); await turnOf(P); const r = await withRoll(0.6, () => autoTurn(fight(), P));
  return `${r.said.slice(0, 330)} | bandit ${hpTxt(BAN())} | Divine Aid used ${JSON.stringify((P.x.used || {})["Divine Aid"] || 0)}`;
});
step("the Deva walks over and touches it with Cure Wounds (its Divine Aid), then fights", async () => {
  place(); BAN().x.hp = 2; const D = who("Deva"); await turnOf(D); const r = await withRoll(0.6, () => autoTurn(fight(), D));
  return `${r.said.slice(0, 300)} | bandit ${hpTxt(BAN())} | the Deva at ${at2(D)}`;
});
step("nobody hurt, the Priest as a support looking after the bandit: it stands beside it and goes for the enemy nearest it", async () => {
  place(); BAN().x.hp = BAN().x.max; const P = who("Priest"); P.x.tac = { role: "support", ward: BAN().id }; P.x.used = {}; await turnOf(P);
  const r = await withRoll(0.6, () => autoTurn(fight(), P)); const W = fight().pos[BAN().id], me = fight().pos[P.id];
  return `${r.said.slice(0, 260)} | beside the bandit: ${chebSq(me, W) <= 1} | healed: ${/Healing Word|Cure Wounds/.test(r.said)} | page errors ${__KIT.errors.length}`;
});
