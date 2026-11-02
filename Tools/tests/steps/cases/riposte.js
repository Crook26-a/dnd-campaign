// Riposte (Joseph, 2026-11-02: "if a melee attack is missed he's supposed to be able to take a reactive opportunity"): a melee
// miss on Gawain offers it (his Reaction and a superiority die free); his attack back carries the die and spends it; the
// attacker's Multiattack picks up where it was; not for a ranged miss, nor with his Reaction gone; the autopilot waits.
const wall = "#".repeat(32), floor = "#" + ".".repeat(30) + "#";
const TC = { format: "ordinate-survey-v1", title: "Autopilot", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", res: [{ name: "Superiority Dice (d8)", max: 4, used: 0, rest: "short" }], notes: "Maneuvers: Riposte, Trip Attack. Great Weapon Master: a bonus-action attack after a critical hit or dropping a creature to 0; -5 to hit for +10 damage with a heavy weapon.", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5" }, { name: "Javelin (thrown 30/120)", hit: "+8", dmg: "1d6+5" }] },
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

const withR = async (v, f) => { const r = Math.random; Math.random = () => v; try { return await f(); } finally { Math.random = r; } };
const popText = () => { const p = $("#bt-pop"); return p.hidden ? "no pop-up" : p.innerText.replace(/\s+/g, " ").trim(); };
const sup = () => { const r = (who("Gawain").p.res || []).find(x => /superiority/i.test(x.name)); return `${r.max - r.used} of ${r.max}`; };
const fresh = t => { const c = fight(); c.turn = t.id; ["acted", "bonused", "reacted"].forEach(k => { if (c[k]) { delete c[k][t.id]; delete c[k][who("Gawain").id]; } }); };
step("the gargoyle's first claw misses Gawain: Riposte is offered; he takes it, with the die on his attack", async () => {
  loadJSONNow(JSON.stringify(TC)); await wait(300); setDmMode(true); await wait(60);
  enterPlan("h"); await wait(40); openBattle(hall()); await wait(150); beginBattle(hall().site); await wait(60); place();
  const c = fight(), G = who("Gawain"), gar = who("Gargoyle"); fresh(gar); act = freshAct(gar.id); act.targets = [G.id]; renderBattlePanel(); await wait(20);
  const s = document.querySelector("#ac-what"); s.value = "fa:Multiattack"; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(20);
  act.targets = [G.id]; act.outcome = "miss"; logAction(hall(), c); await wait(20);
  const offered = popText(), waiting = `${act.what} (${act.queue ? `${act.queue.i + 1} of ${act.queue.items.length}` : "no queue"})`;
  document.querySelector('#bt-pop [data-rip="yes"]').click(); await wait(20);
  const set = `${act.actor === G.id ? "Gawain" : act.actor} reacting ${act.reaction}, ${act.what}, add-ons ${JSON.stringify(act.addons)}`;
  act.outcome = "hit"; renderBattlePanel(); await withR(0.5, () => document.querySelector('[data-acroll="dmg"]').click()); await wait(20);
  document.querySelector("#ac-go").click(); await wait(20);
  return `${offered} | waiting: ${waiting} | set up: ${set} | logged: ${c.log.slice(-1)[0].text.replace(/^.*?(—)/, "$1")} | dice ${sup()} | back to: ${(all().find(x => x.id === act.actor) || {}).label} ${act.what} ${act.queue ? `${act.queue.i + 1} of ${act.queue.items.length}` : ""}`;
});
step("not for a ranged miss, and not once his Reaction is used this round", async () => {
  const c = fight(), G = who("Gawain"), sc = who("Scout"), gar = who("Gargoyle"); $("#bt-pop").hidden = true;
  c.turn = sc.id; act = freshAct(sc.id); act.what = "fa:Longbow"; act.targets = [G.id]; act.outcome = "miss"; logAction(hall(), c); const ranged = popText(); $("#bt-pop").hidden = true;
  c.turn = gar.id; act = freshAct(gar.id); act.what = "fa:Claw"; act.targets = [G.id]; act.outcome = "miss"; logAction(hall(), c); const again = popText(); $("#bt-pop").hidden = true;
  return `ranged miss: ${ranged} | melee miss, Reaction used: ${again}`;
});
step("the autopilot (step by step): a claw misses, it waits for the answer (No here), then the next claw", async () => {
  place(); const c = fight(), G = who("Gawain"), gar = who("Gargoyle"); if (c.reacted) delete c.reacted[G.id]; c.pos[gar.id] = { x: 3, y: 5 }; renderBattle();
  delete root.autoPace; Object.assign(AUTO_MS, { step: 30, beat: 30, say: 120, perChar: 0, sayMax: 120 }); fresh(gar); c.autoLast = null; act = freshAct(gar.id); renderBattlePanel();
  gar.x.tac = { aim: "nearest" }; const log0 = c.log.length; let asked = "";
  await withR(0.05, async () => { const run = autoTurn(c, gar);
    for (let ms = 0; ms < 4000 && !asked; ms += 30) { await wait(30); if (!$("#bt-pop").hidden) { asked = `asked after ${c.log.length - log0} attack(s): ${popText().slice(0, 60)}`; document.querySelector('#bt-pop [data-rip=""]').click(); } }
    await run; });
  return `${asked || "never asked"} | then logged: ${c.log.slice(log0).map(e => e.text.replace(/ — .*/, "")).join(" / ")} | page errors ${__KIT.errors.length}`;
});
