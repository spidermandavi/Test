// lichess.js
const Lichess = {
  teamName: "final-rank-elite",

  async fetchTeamMembers() {
    const resp = await fetch(`https://lichess.org/api/team/${this.teamName}/users`);
    const data = await resp.json();
    return data.map(u => u.username);
  },

  async fetchTeamTournaments(manualIDs = []) {
    const resp = await fetch(`https://lichess.org/api/team/${this.teamName}/arena`);
    const tmtData = await resp.json();

    // Filter out tournaments that were manually added
    return tmtData.filter(t => !manualIDs.includes(t.id));
  },

  async fetchTournamentResults(tournaments) {
    const results = [];
    for (const tmt of tournaments) {
      const resp = await fetch(`https://lichess.org/api/tournament/${tmt.id}/results`);
      const data = await resp.json();
      results.push({ tournament: tmt, results: data });
    }
    return results;
  }
};
