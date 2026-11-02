// Enemies run their own turns, step by step (Joseph, 2026-11-02: "movement happens one space at a time, actions happen and
// there's a text box that pops up with the result"): the walk a square at a time, each result in a box on the map, the
// walk stopping for an opportunity attack until it's answered, and Stop.
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

const quick = () => Object.assign(AUTO_MS, { step: 40, beat: 40, say: 300, perChar: 0, sayMax: 300 });
const watch = async (t, f) => { const seen = [], says = []; f(); for (let ms = 0; ms < 8000; ms += 20) { await wait(20); const p = at(t); if (seen[seen.length - 1] !== p) seen.push(p);
  const b = $("#auto-say"); const s = b && !b.hidden ? b.querySelector("p").textContent : ""; if (s && says[says.length - 1] !== s) says.push(s); if (!autoBusy && ms > 60) break; } return { seen, says }; };
step("step by step: the gargoyle walks a square at a time, and each claw's result pops up in a box", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place(); quick();
  const t = who("Gargoyle"); await turnOf(t); const pace = (document.querySelector("[data-autopace]") || {}).value;
  const r = await withRoll(0.6, () => watch(t, () => document.querySelector("[data-autorun]").click()));
  return `the pace starts as "${pace === "" ? "step by step" : pace}" | squares: ${r.seen.join(" → ")} | boxes: ${r.says.map(s => s.slice(0, 70)).join(" / ")} | ${party()}`;
});
step("leaving the fighter's reach, the walk stops for his opportunity attack, and goes on once it's answered", async () => {
  place(); quick(); const t = who("Scout"); t.x.tac = { role: "ranged" }; fight().pos[t.id] = { x: 2, y: 5 }; renderBattle(); await turnOf(t); const log0 = (fight().log || []).length;
  let mid = ""; await withRoll(0.6, () => watch(t, () => { document.querySelector("[data-autorun]").click();
    const poll = setInterval(() => { const p = $("#bt-pop"); if (!p.hidden && !mid) { mid = `asked at ${at(t)}, ${(fight().log || []).length - log0} attacks logged so far, the turn still going: ${!!autoBusy}`;
      setTimeout(() => { const no = p.querySelector('[data-oa=""]'); if (no) no.click(); clearInterval(poll); }, 150); } }, 20); }));
  return `${mid || "never asked"} | after: at ${at(t)}, ${(fight().log || []).length - log0} attacks logged`;
});
step("Stop ends the turn where it is, and turns off the run of turns", async () => {
  place(); quick(); AUTO_MS.step = 200; const t = who("Gargoyle"); fight().pos[t.id] = { x: 20, y: 2 }; root.autoEnemies = true; renderBattle(); await turnOf(t);
  const r = await watch(t, () => { document.querySelector("[data-autorun]").click(); setTimeout(() => { const b = document.querySelector("[data-autostop]"); if (b) b.click(); }, 450); });
  return `walked ${r.seen.length - 1} square(s) before stopping | the run of turns: ${root.autoEnemies ? "on" : "off"} | attacks logged this turn: ${(fight().autoLast || {}).n}`;
});
