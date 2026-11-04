// The roller, more variety for ships' crews (Joseph, 2026-11-04): shipboard kinds (bosun, cook, navigator, carpenter,
// sailmaker, lookout, surgeon, quartermaster, cabin hand, marine, naval officer, pirate, ship's captain), quirks, navy
// ranks, the smugglers' manner, and bigger nautical lists.
step("a crew of every new kind, nautical: quirks, ranks, the smuggler's note, and how many names repeat", async () => {
  await wait(300); setDmMode(true); await wait(60);
  const kinds = ["bosun","shipcook","navigator","shipwright","sailmaker","lookout","surgeon","quartermaster","cabinhand","marine","officer","pirate","shipcaptain","smuggler"];
  const all = []; for (let i = 0; i < 6; i++) for (const k of kinds) all.push(genPerson({ kind: k, theme: "nautical", level: 3 }));
  const names = all.map(g => g.name.replace(/ "[^"]*"/, "")), first = names.map(n => n.split(" ")[0]);
  const smug = all.filter(g => g.pkind === "smuggler"), off = all.filter(g => g.pkind === "officer");
  expect(all.every(g => g.quirk), "everyone has a quirk", all.filter(g => !g.quirk).map(g => g.pkind));
  expect(smug.every(g => /floor under your feet/.test(g.person.notes || "")), "every smuggler has the note", smug.map(g => g.person.notes));
  return `${all.length} rolled | first names ${new Set(first).size} different, full names ${new Set(names).size} | officers: ${[...new Set(off.map(g => g.occupation))].join(", ")} | e.g. ${all.slice(0, 4).map(g => `${g.name} (${g.occupation}): ${g.quirk}`).join(" / ")}`;
});
step("the quirk on the Roll tab's card and the Library page; the general list for other campaigns", async () => {
  const g = genPerson({ kind: "bosun", theme: "nautical" }), lf = document.createElement("div"); lf.innerHTML = libForm("npcs", g.person);
  const plain = genPerson({ theme: "neutral" });
  return `Library page has Quirk: ${/Quirk/.test(lf.innerText)} (${g.person.quirk}) | a neutral person's quirk: ${plain.quirk || "none"} | page errors ${__KIT.errors.length}`;
});
