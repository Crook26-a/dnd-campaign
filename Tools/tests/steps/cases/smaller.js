// The smaller ones (Joseph's arena list, item 5): Wren casts Hold Person at the Mage within 60 feet; with the autopilot
// on, the Mage Counterspells (Protective Magic): Wren fails the Constitution save, the spell fails, the slot isn't spent;
// made, it goes ahead. Bram's Rapier hits a goblin with Gawain beside it: Sneak Attack ticks itself; alone, it doesn't;
// on a Prone goblin within 5 ft (Advantage) it does; his Club never does. Surprised enemies roll initiative with Disadvantage.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", con: 12, int: 18, dc: "15", spells: ["spell:hold-person"], slots: [{ max: 0, used: 0 }, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 2, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }, { max: 0, used: 0 }], attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] },
    { id: "pc", name: "Bram", cls: "Rogue", level: 5, hp: "33", hpMax: "33", ac: "14", attacks: [{ name: "Rapier", hit: "+6", dmg: "1d8+3" }, { name: "Club", hit: "+6", dmg: "1d4+3" }, { name: "Sneak Attack (once a turn)", hit: "", dmg: "3d6" }] }],
  groups: [{ id: "g1", members: ["pa", "pb", "pc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:goblin-warrior", n: "1" }, { id: "srd:mage", n: "1" }] },
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
const mage = () => who("Mage"), last = () => ((fight().log || []).slice(-1)[0] || {}).text || "";
const castHP = async v => { window.confirm = () => true; const c = fight(), W = who("Wren"); c.turn = W.id; ["acted", "reacted"].forEach(k => { if (c[k]) { delete c[k][W.id]; delete c[k][mage().id]; } }); act = freshAct(W.id); battleSel = W.id; renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); s.value = [...s.options].find(o => /hold-person/.test(o.value)).value; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [mage().id]; renderBattlePanel(); await wait(20);
  const slots0 = pcState(W.p).slots[2].used; await withRoll(v, async () => { $("#ac-go").click(); }); await wait(20);
  return `${last().slice(0, 230)} | slot used ${pcState(W.p).slots[2].used - slots0} | Mage's Protective Magic used ${(mage().x.used || {})["Protective Magic"] || 0}`; };
const swing = async (what, tg) => { const c = fight(), B = who("Bram"); c.turn = B.id; c.onceUsed = {}; act = freshAct(B.id); battleSel = B.id; renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); s.value = [...s.options].find(o => o.text.startsWith(what) || o.value === what).value; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [tg.id]; renderBattlePanel(); await wait(20);
  await withRoll(0.7, () => { $('[data-acroll="hit"]').click(); }); return act.toHit ? act.toHit.said.replace(/^.*?: (hit|miss|a hit.*?crit)/, "$1") : "not rolled"; };
step("Wren's Hold Person at the Mage: it Counterspells; Wren fails the save: the spell fails, no slot spent", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now"; root.autoEnemies = true;
  const c = fight(); Object.assign(c.pos, { [who("Wren").id]: { x: 6, y: 4 }, [mage().id]: { x: 14, y: 4 }, [who("Gawain").id]: { x: 2, y: 8 }, [who("Bram").id]: { x: 3, y: 8 }, [gob(0).id]: { x: 25, y: 8 } }); renderBattle();
  return await castHP(0.05);
});
step("again, and Wren makes the save: Hold Person goes ahead (slot spent)", async () => { const c = fight(); c.round = (c.round || 1) + 1; return await castHP(0.95); });
step("Sneak Attack: Gawain beside the goblin: it ticks itself; alone, no; a Prone goblin within 5 ft, yes; the Club, never", async () => {
  root.autoEnemies = false; const c = fight(), g = gob(0), B = who("Bram"), G = who("Gawain"); g.x.conds = [];
  Object.assign(c.pos, { [g.id]: { x: 20, y: 4 }, [B.id]: { x: 19, y: 4 }, [G.id]: { x: 21, y: 4 } }); renderBattle(); const a = await swing("Rapier", g);
  c.pos[G.id] = { x: 2, y: 8 }; renderBattle(); const b = await swing("Rapier", g);
  g.x.conds = ["Prone"]; const d = await swing("Rapier", g); c.pos[G.id] = { x: 21, y: 4 }; g.x.conds = []; renderBattle(); const e = await swing("Club", g);
  return `ally beside: ${a} || alone: ${b} || Prone: ${d} || Club: ${e}`;
});
step("the enemies are surprised: their initiative rolls are the lower of two d20s", async () => {
  const c = fight(); c.surprise = "enemy"; renderBattlePanel(); await wait(20); const sel = document.querySelector("[data-surprise]");
  await withRoll(0.5, async () => { document.querySelector('[data-ba="init"]').click(); }); await wait(20);
  const L = gameLogList().slice(-1)[0]; return `select shows: ${sel ? sel.options[sel.selectedIndex].text : "none"} | ${L ? L.text.slice(0, 200) : ""} | page errors ${__KIT.errors.length}`;
});