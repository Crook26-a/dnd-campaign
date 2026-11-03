// the leaderboards fit the panel (Joseph, 2026-11-03: "This is being cut off"): a long name shortens instead of
// pushing the second column past the edge
step("two columns of cards with a long name stay inside a 330px panel", () => {
  const box = document.createElement("div"); box.style.cssText = "width:330px;position:fixed;left:0;top:0;overflow:hidden"; document.body.appendChild(box);
  const card = (t, n, v) => `<div class="lb-card"><div class="lb-t">${t}</div><div class="lb-row top"><span class="lb-p">★</span><span class="lb-n">${n}</span><span class="lb-v">${v}</span></div></div>`;
  box.innerHTML = `<div class="lb-grid">${card("Most damage dealt", "Gawain", "204")}${card("Most spells cast", 'Gnickgnick "Gnick" Gnomeson', "3")}${card("Best aim", "Gawain", "87%<small>13 of 15</small>")}${card("Most experience", "Thomas Salmine", "7,450")}</div>`;
  const g = box.firstChild, cards = [...g.children], right = Math.max(...cards.map(c => c.getBoundingClientRect().right));
  const out = `grid ${g.scrollWidth}px in a ${box.clientWidth}px box; cards' right edge ${Math.round(right)}px; the long name ${cards[1].querySelector(".lb-n").scrollWidth > cards[1].querySelector(".lb-n").clientWidth ? "shortened with …" : "fits"}`;
  box.remove(); return out;
});
