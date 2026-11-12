// The Paladin (Joseph, 2026-11-12, the SRD walk-through: "Yes please"; text from his SRD 5.2.1): the uses and free casts,
// the always-prepared spells, Divine Smite on a hit, Radiant Strikes, the auras, Channel Divinity (Divine Sense, Abjure Foes,
// Sacred Weapon), Restoring Touch, and Holy Nimbus.
const paWall = "#".repeat(32), paFloor = "#" + ".".repeat(30) + "#";
const PA = { format: "ordinate-survey-v1", title: "Paladin", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [
    { id: "pp", name: "Pia", species: "Human", cls: "Paladin", subcls: "Oath of Devotion", level: 11, hp: "90", hpMax: "90", ac: "18", str: 18, dex: 10, con: 14, wis: 12, cha: 16,
      slots: [null, { max: 4, used: 0 }, { max: 3, used: 0 }, { max: 3, used: 0 }], attacks: [{ name: "Longsword", hit: "+8", dmg: "1d8+4", dtype: "slashing" }] },
    { id: "pb", name: "Bram", cls: "Fighter", level: 5, hp: "44", hpMax: "44", ac: "16", saves: "Strength +6, Constitution +5, Wisdom +1", attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+3", dtype: "slashing" }] }],
  groups: [{ id: "g1", members: ["pp", "pb"], at: { map: "h", node: "hall" } }],
  library: { npcs: [], foes: [], loot: [], encounters: [], shops: [] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Test House", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Hall", kind: "hall", x: 100, y: 100, w: 10, d: 8, site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright",
      foes: [{ id: "srd:cultist-fanatic", n: "1" }, { id: "srd:zombie", n: "1" }] },
      bmap: { name: "The Hall", rows: [paWall, paFloor, paFloor, paFloor, paFloor, paFloor, paFloor, paFloor, paFloor, paWall], start: { party: [[4, 4], [4, 6]], enemy: [[5, 4], [5, 5]] } } }] } } };
const paHall = () => (doc.nodes || []).find(n => n.id === "hall");
const paFight = () => paHall().site.combat;
const paWho = nm => combatants(paFight()).find(t => t.label.startsWith(nm));
const paTurn = async t => { const c = paFight(); c.round++; c.turn = t.id; ["moved", "acted", "bonused", "reacted"].forEach(k => { if (c[k]) delete c[k][t.id]; }); c.autoLast = null; act = freshAct(t.id); battleSel = t.id; renderBattle(); renderBattlePanel(); await wait(20); };
const paLast = () => ((paFight().log || []).slice(-1)[0] || {}).text || "";
const paAsk = answers => { const q = answers.slice(); window.prompt = () => q.length ? q.shift() : ""; window.confirm = () => q.length ? q.shift() : true; };
const paWhat = async v => { const w = $("#ac-what"); w.value = v; w.dispatchEvent(new Event("change", { bubbles: true })); await wait(20); };
const paPick = re => actionChoices(paWho("Pia")).flatMap(g => g.items).find(i => re.test(i.label));
const paCd = async (fx, targets, before) => { const P = paWho("Pia"); act = freshAct(P.id); renderBattlePanel(); await wait(20); act.cdFx = fx; await paWhat(paPick(/^Channel Divinity/).v); act.targets = targets; renderBattlePanel(); await wait(20); if (before) await before(); paAsk([]); $("#ac-go").click(); await wait(30); return paLast(); };
step("uses and lists: Pia (Paladin 11, Devotion): Lay on Hands, Channel Divinity 3, the free Divine Smite and Find Steed; the always-prepared spells; her Channel Divinity choices; her card", async () => {
  loadJSONNow(JSON.stringify(PA)); await wait(300); setDmMode(true); await wait(60); root.autoEnemies = false;
  enterPlan("h"); await wait(40); openBattle(paHall()); await wait(150); beginBattle(paHall().site); await wait(60);
  const P = paWho("Pia"), p = pcState(P.p), uses = p.res.map(r => `${r.name} ${r.max}`).join(", ");
  const spells = actionChoices(P).find(g => /spells/.test(g.group)).items.map(i => i.label.replace(/ \(.*$/, "")).join(", ");
  const h = document.createElement("div"); h.innerHTML = palCardHtml(p); const card = [...h.querySelectorAll(".chip")].map(x => x.textContent).join(" | ");
  return `${uses} || ${spells} || Channel Divinity: ${cdChoices(p).map(x => x[1].replace(/:.*$/, "")).join(", ")} || card: ${card}`;
});
step("Divine Smite on the Zombie: the chip (free: 3d8 with the Undead's +1d8; a 2nd-level slot: 4d8), Radiant Strikes on by itself; logged on a hit, the slot and the Bonus Action are spent", async () => {
  const c = paFight(), P = paWho("Pia"), Z = paWho("Zombie"), p = pcState(P.p); Z.x.hp = Z.x.max = 200; await paTurn(P);
  act = freshAct(P.id); renderBattlePanel(); await wait(20); act.targets = [Z.id]; await paWhat("pca:0"); const auto = (act.addons || []).join(", ");
  act.addons = [...(act.addons || []), "smite"]; renderBattlePanel(); await wait(20); const free = attackAddons(P).find(a => a.key === "smite").dice, sel = [...document.querySelectorAll("#ac-smite option")].map(o => o.value).join("/");
  const s = $("#ac-smite"); s.value = "2"; s.onchange(); await wait(20); const lv2 = attackAddons(P).find(a => a.key === "smite").dice;
  act.outcome = "hit"; act.dmg = "30"; renderBattlePanel(); await wait(20); paAsk([]); $("#ac-go").click(); await wait(30);
  return `auto ${auto} | smite ${free} (picks ${sel}), at 2nd ${lv2} || ${paLast()} || 2nd-level slots left ${p.slots[2].max - p.slots[2].used}, bonus used ${!!(c.bonused || {})[P.id]}`;
});
step("the aura (10 ft): Bram's Wisdom save +1 → +4, immune to Frightened (Courage) and Charmed (Devotion); out of it, none of that", async () => {
  const c = paFight(), B = paWho("Bram"), s = () => `Wis ${signed(saveBonusOf(B, "Wisdom"))}, Frightened immune ${condImmune(B, "Frightened")}, Charmed immune ${condImmune(B, "Charmed")}`;
  const near = s(), was = { ...c.pos[B.id] }; c.pos[B.id] = { ...was, x: 20, y: 7 }; const far = s(); c.pos[B.id] = was; return `in: ${near} || out: ${far}`;
});
step("Channel Divinity: Abjure Foes on both (a Wisdom save each, rolled 1s): Frightened; Sacred Weapon: +3 on the to-hit roll; Divine Sense", async () => {
  const c = paFight(), P = paWho("Pia"), F = paWho("Cultist"), Z = paWho("Zombie"); await paTurn(P);
  const ab = await paCd("abjure", [F.id, Z.id], async () => { const r = Math.random; Math.random = () => 0.01; try { for (const id of [F.id, Z.id]) { const b = document.querySelector(`[data-svroll="${id}"]`); if (b) b.click(); await wait(10); } } finally { Math.random = r; } });
  const fr = `${F.label} ${condsOfT(F).join(", ") || "none"}, ${Z.label} ${condsOfT(Z).join(", ") || "none"}`; condsOfT(F).length = 0; condsOfT(Z).length = 0; c.effects = []; if (c.holds) c.holds = {};
  await paTurn(P); const sw = await paCd("sacred", [P.id]); act = freshAct(P.id); act.what = "pca:0"; act.targets = [Z.id]; act.d20 = "10"; renderBattlePanel(); await wait(20); paAsk([]); document.querySelector('[data-acroll="hit"]').click(); await wait(20); const hit = ((act.toHit || {}).said || "").replace(/^To hit: /, "");
  await paTurn(P); const ds = await paCd("sense", [P.id]); const left = pcState(P.p).res.find(r => r.name === "Channel Divinity");
  return `${ab} | ${fr} || ${sw} | ${hit} || ${ds} | Channel Divinity ${left.max - left.used} left`;
});
step("Restoring Touch (14): Lay on Hands heals 5 and ends Bram's Stunned for 5 more; Holy Nimbus (20) burns the Fanatic starting its turn beside Pia", async () => {
  const c = paFight(), P = paWho("Pia"), B = paWho("Bram"), F = paWho("Cultist"), p = pcState(P.p); p.level = 14; pcState(p); await paTurn(P);
  pcState(B.p).hp = 30; pcState(B.p).conds = ["Stunned"]; const loh = p.res.find(r => /lay on hands/i.test(r.name)), u0 = loh.used;
  act = freshAct(P.id); act.what = paPick(/^Lay on Hands/).v; renderBattlePanel(); await wait(20); act.targets = [B.id]; act.heal = "5"; act.lohCure = ["Stunned"]; renderBattlePanel(); await wait(20); const chips = [...document.querySelectorAll("[data-lohcure]")].length;
  paAsk([]); $("#ac-go").click(); await wait(30); const lo = `${paLast()} | pool spent ${loh.used - u0}, chips ${chips}`;
  p.level = 20; pcState(p); await paTurn(P); act = freshAct(P.id); act.what = paPick(/^Holy Nimbus/).v; renderBattlePanel(); await wait(20); paAsk([]); $("#ac-go").click(); await wait(30); const hn = paLast();
  F.x.hp = F.x.max = 100; palTurnStart(c, F.id); const burn = `${paLast()} | Fanatic ${F.x.hp}`; delete p.nimbus; p.level = 11; pcState(p);
  return `${lo} || ${hn} || ${burn} | page errors ${__KIT.errors.length}`;
});
