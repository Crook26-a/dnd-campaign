// How long a condition lasts (Joseph's arena list, item 1): the Ghoul's claw paralyzes Wren "until the end of its next
// turn": still on through other turns, off as Wren's next turn ends; the Cultist Fanatic's Hold Person on Gawain: at the
// end of each of his turns he repeats the Wisdom save (fail: still Paralyzed; made: it ends, and the hold with it); and
// when the Fanatic stops concentrating, it ends; undo puts a made save back.
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
      foes: [{ id: "srd:ghoul", n: "1" }, { id: "srd:cultist-fanatic", n: "1" }] },
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
const ghoul = () => who("Ghoul"), fan = () => who("Cultist");
const place2 = () => { const c = fight(), P = c.pos; ["Gawain", "Wren", "Bram"].forEach(n => { const p = who(n).p; p.hp = p.hpMax; p.conds = []; });
  Object.assign(P, { [who("Gawain").id]: { x: 14, y: 4 }, [who("Wren").id]: { x: 10, y: 4 }, [who("Bram").id]: { x: 4, y: 8 }, [ghoul().id]: { x: 11, y: 4 }, [fan().id]: { x: 20, y: 4 } }); c.effects = []; c.holds = {}; renderBattle(); };
const goTo = id => { const c = fight(); let k = 0; while (c.turn !== id && k++ < 12) nextTurn(c); clearTimeout(autoTimer); };
const condsW = nm => JSON.stringify(condsOfT(who(nm)));
const lastLog = () => ((fight().log || []).slice(-1)[0] || {}).text || "";
step("the Ghoul claws Wren: Paralyzed, until the end of Wren's next turn", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); root.autoPace = "now"; root.autoEnemies = false;
  const c = fight(); all().forEach((t, k) => { c.init[t.id] = 20 - k; }); place2(); c.turn = ghoul().id; act = freshAct(ghoul().id); battleSel = ghoul().id; renderBattle(); renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); if (![...s.options].some(o => o.value === "fa:Claw")) return "options: " + [...s.options].map(o => o.value).join(", "); s.value = "fa:Claw"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); act.targets = [who("Wren").id]; renderBattlePanel(); await wait(20);
  await withRoll(0.6, () => { $('[data-acroll="hit"]').click(); }); renderBattlePanel(); await wait(20);
  const sv = document.querySelector(`[data-svroll="${who("Wren").id}"]`); await withRoll(0.05, async () => { $("#ac-go").click(); }); await wait(30);
  return `${lastLog().slice(0, 200)} | Wren ${condsW("Wren")} | effects ${(c.effects || []).map(e => `${e.cond}:${e.end}`).join(",")} | a save was offered: ${!!sv}`;
});
step("other turns go by: still Paralyzed; Wren's turn ends: it ends", async () => {
  const c = fight(), mid = []; goTo(who("Wren").id); mid.push(condsW("Wren")); nextTurn(c); clearTimeout(autoTimer);
  return `at the start of Wren's turn ${mid[0]} | after it: ${condsW("Wren")} | ${lastLog()}`;
});
step("Hold Person on Gawain: at the end of his turn he repeats the save; a fail keeps it, a made one ends it (and the hold)", async () => {
  const c = fight(); place2(); c.turn = fan().id; act = freshAct(fan().id); battleSel = fan().id; renderBattlePanel(); await wait(20);
  const s = $("#ac-what"); s.value = [...s.options].find(o => /hold-person|Hold Person/i.test(o.value + o.text)).value; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  act.targets = [who("Gawain").id]; renderBattlePanel(); await wait(20); await withRoll(0.05, () => { document.querySelector(`[data-svroll="${who("Gawain").id}"]`).click(); }); $("#ac-go").click(); await wait(30);
  const on = `${condsW("Gawain")} hold ${!!(c.holds || {})[who("Gawain").id]} effects ${(c.effects || []).map(e => `${e.cond}:${e.repeat ? e.repeat.abil + " " + e.repeat.dc : "-"}:${e.sp ? "conc" : ""}`).join(",")}`;
  goTo(who("Gawain").id); await withRoll(0.05, async () => { nextTurn(c); }); clearTimeout(autoTimer); const fail = `${lastLog()} → ${condsW("Gawain")}`;
  goTo(who("Gawain").id); await withRoll(0.95, async () => { nextTurn(c); }); clearTimeout(autoTimer); const made = `${lastLog()} → ${condsW("Gawain")}, hold ${!!(c.holds || {})[who("Gawain").id]}`;
  undoAction(c); const undone = `after undo: ${condsW("Gawain")}`;
  return `${on} || ${fail} || ${made} || ${undone}`;
});
step("the Fanatic stops concentrating: Hold Person ends on Gawain", async () => {
  const c = fight(); const h = hOfT(fan()); const had = !!(h.conc); delete h.conc; nextTurn(c); clearTimeout(autoTimer);
  return `was concentrating: ${had} | ${lastLog()} | Gawain ${condsW("Gawain")} | page errors ${__KIT.errors.length}`;
});