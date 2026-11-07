// Stops at a set time on a set day (Joseph, 2026-11-07: "pause day 2 dawn, then day 2 dusk"): two stops added on the
// voyage bar, then she sails and pauses at each, crossing it off.
const VS_MAP = { format: "ordinate-survey-v1", title: "Voyage stops", ppm: 10, unit: "mi", party: 1, day: 1, hour: 22, timeOfDay: "night",
  nodes: [{ id: "vship", name: "Test Ship", kind: "ship", x: 0, y: 0 }, { id: "vport", name: "Far Port", kind: "town", port: true, x: 30000, y: 0 }],
  roads: [], shapes: [], roster: [], library: { npcs: [], foes: [], encounters: [], shops: [], loot: [], spells: [] }, plans: {} };
const vsShip = () => nodeById("vship");
const vsWhen = () => `day ${campaignDay()}, ${hourWord(clockHour())} (${timeOfDay()})`;
// the headless page runs no animation frames, so the test steps her along itself, a quarter second at a time
const vsSail = async () => { playCourse(vsShip()); for (let i = 0; i < 5000 && voyagePlay; i++) stepCourse(voyagePlay.last + 250); expect(!voyagePlay, "she paused"); };
step("a ship with a course, at night on day 1", async () => {
  loadJSONNow(JSON.stringify(VS_MAP)); await wait(300);
  const s = vsShip(); s.course = { to: "vport", pts: [{ x: 30000, y: 0 }], mps: 2 }; renderVoyageBar();
  expect(document.querySelector("[data-vb='sadd']"), "the bar's Stop on day controls");
  return vsWhen();
});
step("add day 2 dawn and day 2 dusk on the bar", () => {
  const add = (d, at) => { document.querySelector("[data-vb='sday']").value = d; document.querySelector("[data-vb='stime']").value = at; document.querySelector("[data-vb='sadd']").click(); };
  add(2, "dawn"); add(2, "dusk"); add(1, "noon");     // the last is already past: refused
  return stopsOf(vsShip()).map(stopWord).join(", ");
});
step("sail: she pauses at dawn on day 2", async () => { await vsSail(); return `${vsWhen()} · left: ${stopsOf(vsShip()).map(stopWord).join(", ") || "none"}`; });
step("sail again: she pauses at dusk on day 2", async () => { await vsSail(); return `${vsWhen()} · left: ${stopsOf(vsShip()).map(stopWord).join(", ") || "none"}`; });
step("no page errors", () => { expect(!__KIT.errors.length, "no page errors", __KIT.errors); return "ok"; });
