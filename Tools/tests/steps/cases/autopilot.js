// Enemies run their own turns (Joseph, 2026-11-02, "option 1"): the tactics pick the target; it moves, attacks (its
// Multiattack in a row), keeps its distance with a bow, breathes on two, flees when its courage breaks; "Undo their
// turn" takes it all back; and the setting runs every enemy's turn, one after another, until a party member's.
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

step("Run their turn: the goblin walks up to the weakest it can reach and swings", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place();
  const g = who("Goblin"); await turnOf(g); const box = (document.querySelector(".tacbox") || {}).innerText || "no box";
  const L = await withRoll(0.6, run);
  return `box: ${box.replace(/\s+/g, " ").trim()} || after: ${L.said} | at ${at(g)} | ${party()}`;
});
step("Undo their turn: back where it was, the hit taken back", async () => {
  const g = who("Goblin"), b = document.querySelector("[data-autoundo]"); expect(b, "Undo is offered"); b.click(); await wait(30);
  return `at ${at(g)} | ${party()} | log ${(fight().log || []).length} | Run offered again: ${!!document.querySelector("[data-autorun]")}`;
});
step("the gargoyle's Multiattack: its attacks one after another", async () => {
  place(); const t = who("Gargoyle"); await turnOf(t); const L = await withRoll(0.6, run);
  return `${L.said} | at ${at(t)} | ${party()}`;
});
step("the scout keeps its distance: both attacks with the bow, from where it stands", async () => {
  place(); const t = who("Scout"); t.x.tac = { role: "ranged" }; await turnOf(t); const L = await withRoll(0.6, run);
  return `${L.said} | at ${at(t)} (didn't move: ${at(t) === "(20,6)"}) | ${party()}`;
});
step("an archer next to the fighter steps out of reach first, and the fighter is offered the opportunity attack", async () => {
  place(); const t = who("Scout"); fight().pos[t.id] = { x: 2, y: 5 }; renderBattle(); await turnOf(t); const L = await withRoll(0.6, run);
  const pop = $("#bt-pop"); const said = pop.hidden ? "no pop-up" : pop.innerText.replace(/\s+/g, " ").trim(); pop.hidden = true;
  return `${L.said} | at ${at(t)} | pop-up: ${said}`;
});
step("the winter wolf breathes on two of them rather than biting one", async () => {
  place(); const t = who("Winter"); fight().pos[t.id] = { x: 7, y: 4 }; fight().pos[who("Goblin").id] = { x: 12, y: 6 }; renderBattle(); await turnOf(t);
  const L = await withRoll(0.3, run);
  return `${L.said} | ${party()} | its breath spent: ${!!(t.x.spent && Object.values(t.x.spent).some(Boolean))}`;
});
step("a cowardly goblin, hurt, Dashes away and flees", async () => {
  place(); const g = who("Goblin"); g.x.tac = { courage: 1 }; g.x.hp = 3; fight().pos[g.id] = { x: 6, y: 4 }; renderBattle(); await turnOf(g); const L = await withRoll(0.6, run);
  const p = $("#bt-pop"); if (!p.hidden) p.hidden = true;
  return `${L.said} | at ${at(g)} | fled ${!!g.x.fled}`;
});
step("the setting: every enemy's turn runs by itself, one after another, until a party member's", async () => {
  place(); const c = fight(); const t0 = who("Gawain"); c.turn = t0.id; act = freshAct(t0.id); renderBattlePanel(); root.autoEnemies = true; c.autoLast = null;
  const log0 = (c.log || []).length, turns = [], label = () => (all().find(x => x.id === c.turn) || {}).label || "?";
  // the party's turns pressed through by hand (as the DM would), then the enemies' left to run themselves
  for (let k = 0; k < 6 && !autoFor(all().find(x => x.id === c.turn)); k++) { nextTurn(c); renderBattle(); renderBattlePanel(); turns.push(label()); }
  await withRoll(0.6, async () => { for (let ms = 0; ms < 12000; ms += 100) { await wait(100); const p = $("#bt-pop"); if (!p.hidden) { p.hidden = true; turns.push("(an opportunity attack offered: the run waits)"); break; }
    if (label() !== turns[turns.length - 1]) turns.push(label()); const t = all().find(x => x.id === c.turn); if (t && t.side === "party") break; } });
  root.autoEnemies = false;
  return `turns came to: ${turns.join(" → ")} | logged: ${(c.log || []).slice(log0).map(e => e.text.slice(0, 60)).join(" / ")} | page errors ${__KIT.errors.length}`;
});
