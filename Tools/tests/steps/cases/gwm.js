// Great Weapon Master's extra attack (Joseph, 2026-11-02: "Gawain is supposed to be able to attack a third time if he kills
// an enemy"): a melee crit or a creature dropped, on his own turn, with the Bonus Action free, offers one more attack with
// the same weapon as the Bonus Action; not for a thrown weapon, not for someone without the feat.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", notes: "Great Weapon Master: a bonus-action attack after a critical hit or dropping a creature to 0; -5 to hit for +10 damage with a heavy weapon.", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }, { name: "Javelin (thrown 30/120)", hit: "+8", dmg: "1d6+5" }] },
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

const offer = () => { const b = [...document.querySelectorAll(".tacbox")].find(x => /Great Weapon Master/.test(x.textContent)); return b ? b.textContent.replace(/\s+/g, " ").replace(" Make it", "").trim() : "no offer"; };
const hit = (who_, what, target, outcome, dmg) => { const c = fight(); act = freshAct(who_.id); act.what = what; act.targets = [target.id]; act.outcome = outcome; act.dmg = String(dmg); logAction(hall(), c); renderBattlePanel(); };
const myTurn = t => { const c = fight(); c.turn = t.id; ["acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.gwm = null; };
step("Gawain drops the goblin with his greatsword: one more attack is offered, and it's logged as his Bonus Action", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place();
  const G = who("Gawain"), gob = who("Goblin"), gar = who("Gargoyle"); myTurn(G); gob.x.hp = 3; hit(G, "pca:0", gob, "hit", 10); await wait(20);
  const shown = offer(); document.querySelector("[data-gwm]").click(); await wait(20); const set = `${act.what}, bonus ${act.bonus}`;
  act.targets = [gar.id]; act.outcome = "hit"; act.dmg = "9"; logAction(hall(), fight()); renderBattlePanel(); await wait(20);
  return `${shown} | set up: ${set} | logged: ${fight().log.slice(-1)[0].text.replace(/^.*?(—)/, "$1")} | offered again: ${offer()}`;
});
step("a critical hit offers it too; a thrown javelin's kill doesn't; Wren (no feat) doesn't", async () => {
  const G = who("Gawain"), W = who("Wren"), gar = who("Gargoyle"), sc = who("Scout"); myTurn(G); hit(G, "pca:0", gar, "crit", 12); const crit = offer();
  myTurn(G); sc.x.hp = 2; hit(G, "pca:1", sc, "hit", 8); const jav = offer();
  myTurn(W); const wolf = who("Winter"); wolf.x.hp = 1; hit(W, "pca:0", wolf, "hit", 3); const wren = offer();
  return `crit: ${crit} | javelin kill: ${jav} | Wren's kill: ${wren} | page errors ${__KIT.errors.length}`;
});
