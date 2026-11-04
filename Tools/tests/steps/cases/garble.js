// Reputation, stage 3 (Joseph, 2026-11-04): word changes as it travels. Numbers grow, a monster becomes a similar or
// bigger one (by sea bigger still); the garbled telling goes in at once and waits in the DM's review list.
const garbW = "#".repeat(12), garbF = "#" + ".".repeat(10) + "#";
const GARB = { format: "ordinate-survey-v1", title: "Garble", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "ta", name: "Amberly", kind: "town", x: 0, y: 0, region: "r1" }, { id: "tb", name: "Brackenford", kind: "town", x: 40, y: 0, region: "r1" }, { id: "tc", name: "Coldharbour", kind: "town", x: 0, y: 80, region: "r2" }],
  roads: [{ id: "rab", from: "ta", to: "tb", miles: 10, density: "dense" }], shapes: [],
  roster: [{ id: "pa", name: "Gawain", cls: "Fighter", level: 5, hp: "53", hpMax: "53", ac: "17", attacks: [] }],
  groups: [{ id: "g1", members: ["pa"], at: { map: "survey", node: "ta" } }],
  library: { foes: [], npcs: [], loot: [], encounters: [], shops: [], factions: [] }, plans: {} };
const garbSeed = s => { let x = s; Math.random = () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
step("garbling the words: numbers, a monster, by land and by sea; nothing to change, nothing changes", async () => {
  loadJSONNow(JSON.stringify(GARB)); await wait(300); setDmMode(true); await wait(60); garbSeed(3);
  const t = "Killed three ogres at the mill and saved 4 children";
  return `land: ${garbleText(t, false)} | land again: ${garbleText(t, false)} | sea: ${garbleText(t, true)} | plain: ${garbleText("Bought a round for everyone", false)}`;
});
step("travelling, every telling garbled: the copies wait for review, and what they've heard shows it", async () => {
  garbSeed(7); delete root.rep; const R = repOf(); R.garbleRoad = 100; R.garbleSea = 100; R.carryBy = { notable: 100 };
  R.lanes = [{ id: "sl", from: "ta", to: "tc", traffic: "dense" }];
  root.day = 1; gossipCatchUp(); repRecord({ text: "Killed three ogres at the mill", who: "party", fame: "fame", size: "notable", place: "ta" });
  root.day = 60; gossipCatchUp();
  const V = repToReview(), h = repHear("tb", null);
  expect(__KIT.errors.length === 0, "no page errors", __KIT.errors);
  return `to review: ${V.map(v => `"${v.t}"${v.sea ? " (sea)" : ""} in ${v.where.join("/")}`).join("; ")} | Brackenford hears: ${h.filter(l => l.d).map(l => repEntryWords(l.e, l.d)).join(" / ") || "(nothing this roll)"}`;
});
step("the review list: keep one, rewrite one, put one back", async () => {
  pane = "party"; syncTabs(); openInv.add("party:rep"); renderPane(true); await wait(40);
  const n0 = repToReview().length, btn = k => [...document.querySelectorAll(`[data-rep="${k}"]`)][0];
  if (btn("revok")) { btn("revok").click(); await wait(30); }
  const box = document.querySelector("[data-revtext]"); if (box) { box.value = "Killed a troll or two at the mill, they say"; btn("revmine").click(); await wait(30); }
  if (btn("revback")) { btn("revback").click(); await wait(30); }
  const words = Object.values(repOf().tables).flatMap(T => Object.values(T.slots)).map(e => e.t ? `${e.t}${e.rev ? "" : " (unreviewed)"}` : "(as it was)");
  return `review list ${n0} -> ${repToReview().length} | the tellings now: ${[...new Set(words)].join(" / ")} | page errors ${__KIT.errors.length}`;
});
