// Weapon Mastery (Joseph, 2026-11-06: "Do weapon mastery as well"): the kinds picked on the card of a class that has it
// (only theirs), and the eight properties from the SRD 5.2: Topple, Sap, Vex, Graze, Push, Slow, Cleave, Nick.
const wmWall = "#".repeat(32), wmFloor = "#" + ".".repeat(30) + "#";
const WM = { format: "ordinate-survey-v1", title: "Mastery", ppm: 10, unit: "mi", party: 3,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "va", name: "Vala", cls: "Fighter", level: 16, hp: "120", hpMax: "120", ac: "18", str: 18, dex: 14, con: 16,
      attacks: [{ name: "Greataxe", hit: "+10", dmg: "1d12+4", dtype: "slashing" }, { name: "Battleaxe", hit: "+10", dmg: "1d8+4", dtype: "slashing" }, { name: "Longsword", hit: "+10", dmg: "1d8+4", dtype: "slashing" },
        { name: "Rapier", hit: "+8", dmg: "1d8+4", dtype: "piercing" }, { name: "Greatsword", hit: "+10", dmg: "2d6+4", dtype: "slashing" }, { name: "Warhammer", hit: "+10", dmg: "1d8+4", dtype: "bludgeoning" },
        { name: "Scimitar", hit: "+8", dmg: "1d6+2", dtype: "slashing" }, { name: "Shortsword (off-hand)", hit: "+8", dmg: "1d6", dtype: "piercing" }, { name: "Club", hit: "+10", dmg: "1d4+4", dtype: "bludgeoning" }] },
    { id: "vb", name: "Brakka", cls: "Barbarian", level: 4, hp: "45", hpMax: "45", ac: "15", str: 16, attacks: [{ name: "Greataxe", hit: "+5", dmg: "1d12+3" }] },
    { id: "vc", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12", attacks: [{ name: "Dagger", hit: "+4", dmg: "1d4+1" }] }],
  groups: [{ id: "g1", members: ["va", "vb", "vc"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "2" }] },
      bmap: { name: "The Hall", rows: [wmWall, wmFloor, wmFloor, wmFloor, wmFloor, wmFloor, wmFloor, wmFloor, wmFloor, wmWall], start: { party: [[4, 4], [2, 7], [2, 2]], enemy: [[5, 4], [5, 5]] } } }] } } };
const wmHall = () => (doc.nodes || []).find(n => n.id === "hall");
const wmFight = () => wmHall().site.combat;
const wmWho = nm => combatants(wmFight()).find(t => t.label.startsWith(nm));
const wmFoes = () => combatants(wmFight()).filter(t => t.kind === "foe");
const wmTurn = async t => { const c = wmFight(); c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const wmLast = () => ((wmFight().log || []).slice(-1)[0] || {}).text || "";
const wmRoll = (v, f) => { const r = Math.random; Math.random = () => v; try { return f(); } finally { Math.random = r; } };
let wmAsked = [];
const wmAsk = answers => { wmAsked = []; const q = answers.slice(); window.prompt = m => { wmAsked.push(m.split("\n")[0]); return q.length ? q.shift() : ""; }; window.confirm = m => { wmAsked.push(m); return q.length ? q.shift() : true; }; };
const wmHit = async (row, tgt, outcome, dmg, answers) => { const V = wmWho("Vala"); act = freshAct(V.id); act.what = `pca:${row}`; act.targets = [tgt.id]; act.outcome = outcome; act.dmg = String(dmg);
  act.addons = autoAddonKeys(wmFight(), V, actInfo(wmFight(), V), ""); renderBattlePanel(); await wait(20); wmAsk(answers || []); wmRoll(0.05, () => $("#ac-go").click()); await wait(30); return wmLast().replace(/ \(to hit[^)]*\)/, ""); };
step("the card: Fighter 16 masters 6 kinds (a 7th can't be ticked); a Barbarian's list has no bows; a Wizard's card has none", async () => {
  loadJSONNow(JSON.stringify(WM)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(wmHall()); await wait(150); beginBattle(wmHall().site); await wait(60);
  const V = wmWho("Vala"), host = document.createElement("div"); document.body.appendChild(host);
  for (const k of ["Greataxe", "Battleaxe", "Longsword", "Rapier", "Greatsword", "Warhammer", "Club"]) { host.innerHTML = masteryCardHtml(V.p); const b = host.querySelector(`[data-mast][data-k="${k}"]`); b.checked = true; b.dispatchEvent(new Event("change", { bubbles: true })); }
  host.innerHTML = masteryCardHtml(V.p); const sum = host.querySelector("summary").textContent.replace(/\s+/g, " ").trim(), clubOff = host.querySelector('[data-k="Club"]').disabled; host.remove();
  const barb = masteryKinds(wmWho("Brakka").p), wiz = masteryCardHtml(wmWho("Wren").p);
  return `${sum} | Club box disabled ${clubOff} | Brakka: ${masteryMax(wmWho("Brakka").p)} kinds from ${barb.length} (Longbow ${barb.includes("Longbow")}) | Wren's card: "${wiz}"`;
});
step("Topple (Battleaxe: Con save, failed, Prone), Sap (Longsword: the Fanatic's next attack at Disadvantage), Vex (Rapier: Advantage next, then used)", async () => {
  const c = wmFight(), V = wmWho("Vala"), [F1] = wmFoes(); await wmTurn(V);
  const chip = (() => { act = freshAct(V.id); act.what = "pca:1"; act.targets = [F1.id]; renderBattlePanel(); const b = document.querySelector('[data-addon="mastery"]'); return b ? b.textContent.trim() : "no chip"; })();
  const top = await wmHit(1, F1, "hit", 8); const sap = await wmHit(2, F1, "hit", 8), dis = rollAdvOf(c, F1, V, actInfo(c, F1)).why;
  condsOfT(F1).splice(0); const vex = await wmHit(3, F1, "hit", 8); act = freshAct(V.id); act.what = "pca:0"; act.targets = [F1.id]; const adv1 = rollAdvOf(c, V, F1, actInfo(c, V)).why;
  await wmHit(0, F1, "miss", 0, []); act = freshAct(V.id); act.what = "pca:0"; act.targets = [F1.id]; const adv2 = rollAdvOf(c, V, F1, actInfo(c, V)).why;
  return `chip "${chip}" || ${top} || ${sap} | the Fanatic attacking Vala: ${dis} || ${vex} | next: ${adv1} | after that attack: "${adv2}"`;
});
step("Graze (Greatsword miss: 4), Push (Warhammer: 10 ft away), Slow (Club: −10 ft, not −20 from two hits)", async () => {
  const c = wmFight(), V = wmWho("Vala"), [F1] = wmFoes(); c.round++; await wmTurn(V); c.pos[F1.id] = { ...c.pos[F1.id], x: 5, y: 4 }; c.pos[V.id] = { ...c.pos[V.id], x: 4, y: 4 };
  const hp0 = F1.x.hp, graze = await wmHit(4, F1, "miss", 0); const hp1 = F1.x.hp; const push = await wmHit(5, F1, "hit", 6); const at = `${c.pos[F1.id].x},${c.pos[F1.id].y}`;
  V.p.mastery = V.p.mastery.filter(k => k !== "Warhammer").concat("Club"); const s0 = speedOf(F1); await wmHit(8, F1, "hit", 5); await wmHit(8, F1, "hit", 5);
  return `${graze} (${hp0} → ${hp1}) || ${push} | now at ${at} || speed ${s0} → ${speedOf(F1)}`;
});
step("Cleave (Greataxe hit: one more attack at the second Fanatic, no Str bonus, no action spent; once a turn) and Nick (the off-hand Shortsword in the Attack action)", async () => {
  const c = wmFight(), V = wmWho("Vala"), [F1, F2] = wmFoes(); c.round++; await wmTurn(V); F1.x.hp = F1.x.max; F2.x.hp = F2.x.max; condsOfT(F1).splice(0);
  c.pos[V.id] = { ...c.pos[V.id], x: 4, y: 4 }; c.pos[F1.id] = { ...c.pos[F1.id], x: 5, y: 4 }; c.pos[F2.id] = { ...c.pos[F2.id], x: 5, y: 5 };
  const first = await wmHit(0, F1, "hit", 10, [true]); const asked = wmAsked.find(a => /Cleave/.test(a)) || "no offer";
  const set = `act: ${act.what}, targets ${act.targets.map(id => wmWho(combatants(c).find(o => o.id === id).label).label)}, dmgMod ${act.dmgMod}, free ${!!act.extraFree} | dice ${actDice(c, V, actInfo(c, V)).dmgLabel}`;
  const sw = () => JSON.stringify((c.acted || {})[V.id] || {});
  act.outcome = "hit"; act.dmg = "7"; renderBattlePanel(); await wait(20); const acted0 = sw(); wmAsk([]); $("#ac-go").click(); await wait(30); const second = wmLast().replace(/ \(to hit[^)]*\)/, "");
  const again = await wmHit(0, F1, "hit", 10, []); const offered = wmAsked.some(a => /Cleave/.test(a));
  V.p.mastery = ["Scimitar", "Greataxe"]; c.round++; await wmTurn(V); await wmHit(6, F1, "hit", 5); const left = sw();
  act = freshAct(V.id); act.what = "pca:7"; act.targets = [F1.id]; act.outcome = "hit"; act.dmg = "3"; renderBattlePanel(); await wait(20); wmAsk([true]); $("#ac-go").click(); await wait(30);
  const nick = `asked "${(wmAsked[0] || "no").slice(0, 60)}" | bonus used ${bonusUsed(c, V.id)}, the Attack action ${left} → ${sw()}`;
  return `${first} | ${asked.slice(0, 70)} || ${set} || ${second} | the Attack action ${acted0} → ${sw()} | Cleave again this turn: ${offered} || Nick: ${nick} | page errors ${__KIT.errors.length}`;
});
