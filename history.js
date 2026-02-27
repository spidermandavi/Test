// history.js
(async function() {
  const pastList = document.getElementById("pastTournaments");
  const upcomingList = document.getElementById("upcomingTournaments");

  // Fetch tournaments
  const tournaments = await Lichess.fetchTeamTournaments(CONFIG.manualTournamentIDs);

  // Separate past and upcoming by date
  const now = new Date();
  tournaments.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)); // earliest first

  tournaments.forEach(t => {
    const li = document.createElement("li");
    const tDate = new Date(t.startedAt);
    li.innerHTML = `<a href="${t.url}" target="_blank">${t.name}</a> — ${tDate.toLocaleDateString()}`;
    
    if (tDate < now) pastList.appendChild(li);
    else upcomingList.appendChild(li);
  });
})();
