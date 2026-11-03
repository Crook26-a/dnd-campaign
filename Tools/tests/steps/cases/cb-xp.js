// an update from the Character Book (which keeps no XP) that raises the level brings the XP up to that level's start
// (Joseph, 2026-11-03: "I updated Gnick, but it didn't update the xp"); XP already past it stays
step("level 4 at 2,700 XP updated to level 5: 6,500; a level 5 with 7,000 XP stays at 7,000", () => {
  const a = { id: "t1", name: "Gnick", level: 4, xp: 2700 }, b = { id: "t2", name: "Wren", level: 5, xp: 7000 };
  cbIntoPc(a, { name: "Gnick", level: 5, cbId: "ch_gnick" }); cbIntoPc(b, { name: "Wren", level: 5, cbId: "ch_wren" });
  return `Gnick: level ${a.level}, ${a.xp} XP | Wren: level ${b.level}, ${b.xp} XP | page errors ${__KIT.errors.length}`;
});
