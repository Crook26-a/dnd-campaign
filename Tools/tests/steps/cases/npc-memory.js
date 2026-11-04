// What a person remembers (Joseph, 2026-11-04): their own memories of the party and its members, fading by how they
// hold on to good things and slights (rollable), an impression of each member; memories from talking, a fight they
// survived or saw ("a survivor to warn the enemies"), a deed they saw, the log; a deed nobody saw or was told waits.
const MEMT = { format: "ordinate-survey-v1", title: "Memory", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Brindle", kind: "town", x: 0, y: 0, region: "r1", npcs: ["ln_cal"] }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [{ name: "Greatsword", hit: "+8", dmg: "2d6+5", dtype: "slashing" }] },
    { id: "pb", name: "Nevik Yar", cls: "Rogue", level: 5, hp: "43", hpMax: "43", ac: "17", attacks: [{ name: "Rapier", hit: "+8", dmg: "1d8+5", dtype: "piercing" }] }],
  groups: [{ id: "g1", members: ["pa", "pb"], at: { map: "h", node: "hall" } }],
  library: { foes: [], encounters: [], shops: [], loot: [], factions: [{ id: "fk", name: "The Knives", align: "Chaotic Evil", standing: -2, repDie: 8 }],
    npcs: [{ id: "ln_rook", name: "Rook Varra", role: "Knife boss", faction: "fk", fightsAs: "srd:bandit-captain" }, { id: "ln_mara", name: "Mara Quill", role: "Barmaid" }, { id: "ln_cal", name: "Captain Callomay", role: "Harbourmaster" }] },
  plans: { h: { format: "ordinate-plan-v1", of: "h", title: "Brindle", ppm: 5, unit: "yd", roads: [], shapes: [], nodes: [
    { id: "hall", name: "The Gull Tavern", kind: "hall", x: 100, y: 100, w: 10, d: 8, npcs: ["ln_mara"], site: { kind: "", level: 5, once: true, waves: 1, loot: { coin: 0 }, items: [], light: "bright", foes: [{ id: "npc:ln_rook", n: "1" }, { id: "srd:bandit", n: "2" }] },
      bmap: { name: "The Gull", rows: ["############", "#..........#", "#..........#", "#..........#", "############"], start: { party: [[1, 2], [2, 2]], enemy: [[8, 1], [8, 2], [8, 3]] } } }] } } };
const memP = id => libNpcById(id);
const memImp = p => partyRoster().map(c => { const I = memImpression(p, c.id); return `${c.name.split(" ")[0]} ${sgn(I.s)} ${MEM_WORDS[I.tier.key]}`; }).join(", ");
step("memories, impressions and fading (good things forgotten fast, slights never)", async () => {
  loadJSONNow(JSON.stringify(MEMT)); await wait(300); setDmMode(true); await wait(60); root.day = 10;
  const cal = memP("ln_cal"); cal.memHold = { good: "fast", bad: "never" };
  memAdd(cal, { text: "Gawain carried my crates in the rain", who: ["pa"], tone: 1, size: "small" }, true);
  memAdd(cal, { text: "Nevik pocketed my ring", who: ["pb"], tone: -1, size: "small" }, true);
  const d10 = memImp(cal); root.day = 50; const d50 = memImp(cal); root.day = 12;
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `day 10: ${d10} | day 50: ${d50} | rolled: ${[1, 2, 3].map(() => JSON.stringify(memRollHold())).join(" ")}`;
});
step("a big memory becomes a story; talking and the log make memories", async () => {
  const cal = memP("ln_cal"), n0 = repOf().deeds.length;
  memAdd(cal, { text: "Gawain pulled me out of the burning harbour", who: ["pa"], tone: 1, size: "big" }, true);
  const big = repOf().deeds[n0];
  __KIT.answers.push("promised to find the bell"); const tb = document.createElement("button"); tb.dataset.talk = "ln_cal"; document.body.appendChild(tb); tb.click(); tb.remove(); await wait(20);
  gameLog("check", "Nevik Yar: Sleight of Hand check 6 vs DC 15, fails (lifting the harbour seal off Captain Callomay)");
  const n = memFromLog(cal);
  return `story: ${big ? repDeedWords(big) : "none"} | talked: ${cal.mem.slice(-1 - n)[0].text} | from the log: ${n}`;
});
step("a fight: Rook gets away, a bandit dies, one flees, Mara watches", async () => {
  enterPlan("h"); await wait(40); const hall = doc.nodes.find(q => q.id === "hall"); openBattle(hall); await wait(150);
  const c = hall.site.combat; beginBattle(hall.site); await wait(60);
  const R0 = c.list.find(y => y.npc === "ln_rook"), B = c.list.filter(y => !y.npc);
  c.hurt = { [R0.id]: { pa: 12 } }; R0.fled = true; B[0].hp = 0; B[1].fled = true;
  endTheFight(hall.site, hall, c, true); await wait(30);
  return `Rook: ${(memP("ln_rook").mem || []).map(m => `${m.text} (${m.size}, ${m.tone})`).join("; ")} | Mara: ${(memP("ln_mara").mem || []).map(m => m.text).join("; ")} | log: ${root.gameLog.filter(l => /Witnesses/.test(l.text)).map(l => l.text).join("")}`;
});
step("the deed form: the fight's witnesses filled in; a deed nobody saw waits until it's told", async () => {
  pane = "party"; syncTabs(); openInv.add("party:rep"); renderPane(true); await wait(40);
  const seen = [...document.querySelectorAll(".rep-seen")].map(i => `${memP(i.value).name}${i.checked ? " ✓" : ""}`).join(", ");
  $("#rep-text").value = "Ran the Knives out of the Gull"; document.querySelector('[data-rep="record"]').click(); await wait(40);
  const dd = repOf().deeds.slice(-1)[0];
  repOf().lastWitness = null; renderPane(true); await wait(30);
  $("#rep-text").value = "Buried the smuggler in the dunes"; document.querySelector('[data-rep="record"]').click(); await wait(40);
  const q = repOf().deeds.slice(-1)[0], waited = !!q.quiet;
  document.querySelector(`[data-rep="tell"][data-d="${q.id}"]`).click(); await wait(30);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `seen: ${seen} | others: ${$("#rep-others") ? "box there" : "no box"} | Knives deed into: ${[...new Set(dd.writes.map(w => repTableLabel(w.key)))].join(", ")} | unseen waited: ${waited}, then told: ${!q.quiet}`;
});
step("on their card and their Library page", async () => {
  const cal = memP("ln_cal"), lf = document.createElement("div"); lf.innerHTML = libForm("npcs", cal);
  return `library page: ${/Remembers/.test(lf.innerText)} | place card: ${/Remembers/.test(whoYoullMeet(root.nodes[0]))} | page errors ${__KIT.errors.length}`;
});
