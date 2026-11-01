// uses: cb-file
// The Character Book, both ways (Joseph, 2026-11-01). cb-file is what the Character Book's steps test "to-survey"
// downloaded: Gnick (new here) and Ilsa (a made-up paladin, already in this party with a secret favor, XP, a crew role,
// DM notes and kills). It comes in twice (nothing doubles), then everyone goes back out; the Character Book's test
// "from-survey" takes that file (out\exchange\downloads\download-1.json).
const MAP = { format: "ordinate-survey-v1", title: "Character Book exchange", ppm: 10, unit: "mi", party: 2,
  nodes: [{ id: "h", name: "Test House", kind: "town", x: 0, y: 0 }], roads: [], shapes: [],
  roster: [{ id: "pa", name: "Ilsa Brightwater", player: "Test", cls: "Paladin", level: 5, xp: 6500, favor: 2, role: "Quartermaster", notes: "DM: her order wants her back.",
      stats: { kills: 3 }, hp: "44", hpMax: "44", ac: "18", inv: [{ id: "srd:potion-of-healing", qty: 1 }, { text: "Old map", qty: 1 }],
      attacks: [{ name: "Longsword", hit: "+5", dmg: "1d8+2", dtype: "slashing" }, { name: "Old club", hit: "+3", dmg: "1d4", dtype: "bludgeoning" }],
      res: [{ name: "Lay on Hands", max: 25, used: 0, rest: "long" }] },
    { id: "pb", name: "Wren", cls: "Wizard", level: 5, hp: "28", hpMax: "28", ac: "12" }],
  library: { npcs: [], foes: [], encounters: [], shops: [], loot: [], spells: [] }, plans: {} };
const P = () => root.roster, ilsa = () => P().find(c => c.name === "Ilsa Brightwater"), gnick = () => P().find(c => /Gnick/.test(c.name));
const shape = () => JSON.stringify(P().map(c => [c.name, (c.inv || []).length, (c.spells || []).length, (c.attacks || []).length, (c.res || []).length])) + lib().spells.length;

step("the party: Ilsa and Wren", async () => { loadJSONNow(JSON.stringify(MAP)); await wait(300); expect(P().length === 2, "two in the roster"); return P().map(c => c.name).join(", "); });
step("bring in the Character Book file", async () => {
  __KIT.answers.push(true); cbIn(JSON.stringify(FIX["cb-file"])); await wait(100);
  expect(P().length === 3 && partySize() === 3, "Gnick joined: three, and the party slider says 3", [P().length, partySize()]);
  return P().map(c => c.name).join(", ");
});
step("Ilsa updated, and the survey's own things kept", () => {
  const c = ilsa();
  expect(c.favor === 2 && c.xp === 6500 && c.role === "Quartermaster" && /order wants her back/.test(c.notes) && c.stats.kills === 3, "favor, XP, role, notes, kills kept");
  expect(c.hp === 30 && c.ac === "18" && c.cbId === "ch_test_ilsa", "the Character Book's HP, AC and id", [c.hp, c.ac, c.cbId]);
  expect(c.attacks.find(a => a.name === "Longsword").hit === "+6" && c.attacks.some(a => a.name === "Old club"), "Longsword updated, Old club still there");
  expect(c.inv.find(e => e.id === "srd:potion-of-healing").qty === 2 && c.inv.some(e => e.text === "Old map") && c.inv.some(e => e.text === "Ring of the Test Order" && e.attuned), "potions 2, old map kept, the ring attuned");
  expect(c.res.find(r => r.name === "Lay on Hands").used === 5, "Lay on Hands spent 5");
  return `hp ${c.hp}/${c.hpMax}, ${c.attacks.length} attacks, ${c.inv.length} items`;
});
step("Gnick joined with his numbers, his cart attuned", () => {
  const c = gnick();
  expect(c.level === 5 && c.ac === "17" && c.hp === 39 && c.dc === "15" && c.satk === "+7" && c.senses === "Darkvision 60 ft.", "level, AC, HP, DC, attack, senses", [c.ac, c.hp, c.dc, c.satk, c.senses]);
  expect(JSON.stringify(c.inv.find(e => /Cart/.test(e.text || ""))) === '{"text":"Auspicious Cart","qty":1,"attuned":true}', "the cart as an attuned line");
  expect(c.spells.length === 19 && c.spells.every(id => id.startsWith("spell:")), "his 19 spells are the SRD's", c.spells.filter(id => !id.startsWith("spell:")));
  return `${c.attacks.map(a => a.name + " " + a.hit).join(", ")}`;
});
step("the same file again: nothing doubles", async () => {
  const before = shape(); __KIT.answers.push(true); cbIn(JSON.stringify(FIX["cb-file"])); await wait(100);
  expect(shape() === before, "the same roster, items, spells, attacks and resources", [before, shape()]);
});
step("everyone out to the Character Book, without the survey's secrets", async () => {
  cbOut(partyRoster()); await wait(100);
  const f = __KIT.downloads.at(-1); expect(f && f.blob, "a file"); const text = await f.blob.text(), o = JSON.parse(text);
  expect(o.from === "Ordinate Survey" && o.db.chars.length === 3, "from the survey, three characters");
  const leaks = ['"favor"', "Quartermaster", "order wants her back", '"kills"', '"xp"'].filter(w => text.includes(w)); expect(!leaks.length, "nothing secret goes out", leaks);
  const g = o.db.chars.find(c => c.id === "ch_gnick"); expect(g && g.saveProf.join("+") === "wis+cha" && g.items.find(i => /Cart/.test(i.name)).attuned, "Gnick under his own id, Wis and Cha saves, the cart attuned");
  return o.db.chars.map(c => c.id).join(", ");
});
