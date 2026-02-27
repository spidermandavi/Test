// calc.js
const Calc = {
  /**
   * Calculate payouts for all players
   * @param {Array} teamMembers - list of usernames
   * @param {Array} tournamentResults - array of { tournament, results }
   * @param {Object} ledger - ledger object with alreadyPaid
   */
  calculatePayouts(teamMembers, tournamentResults, ledger) {
    const players = {};
    teamMembers.forEach(u => {
      if (!players[u]) players[u] = {
        username: u,
        gamesCM: 0,
        gamesST: 0,
        winsCM: 0,
        winsST: 0,
        pointsCM: 0,
        pointsST: 0,
        earningsCM: 0,
        earningsST: 0,
        totalEarnings: 0,
        winrateCM: 0,
        winrateST: 0
      };
    });

    function processTournament(tournament, results, type) {
      const prizeTable = (type === "chessMood" && tournament.name.toLowerCase().includes("december"))
        ? CONFIG.tournamentTypes[type].december.prizes
        : CONFIG.tournamentTypes[type].default?.prizes || CONFIG.tournamentTypes[type].prizes;

      const totalPrize = prizeTable.reduce((a,b)=>a+b,0);
      const leaderCutAmount = totalPrize * CONFIG.leaderCut;
      let playerPool = totalPrize - leaderCutAmount;

      // Filter team members and sort by points
      const teamResults = results
        .filter(r => teamMembers.includes(r.username))
        .map(r => ({
          username: r.username,
          points: r.points || 0,
          wins: r.wins || 0,
          losses: r.losses || 0,
          draws: r.draws || 0,
          games: (r.wins + r.losses + r.draws)
        }))
        .sort((a,b) => b.points - a.points);

      // Save points and games
      teamResults.forEach(r => {
        const player = players[r.username];
        if (type === "chessMood") {
          player.pointsCM = r.points;
          player.gamesCM = r.games;
          player.winsCM = r.wins;
        } else {
          player.pointsST = r.points;
          player.gamesST = r.games;
          player.winsST = r.wins;
        }
      });

      // Tier slicing
      const tiers = [
        { start: 0, end: 20, percent: 0.50 },
        { start: 20, end: 50, percent: 0.30 },
        { start: 50, end: 100, percent: 0.20 }
      ];

      tiers.forEach((tier, tierIdx) => {
        const tierPlayers = teamResults.slice(tier.start, tier.end);
        if (!tierPlayers.length) return;

        let tierPool = playerPool * tier.percent;

        const maxPlayersInTier = tier.end - tier.start;

        // Handle missing slots → leader share
        if (tierPlayers.length < maxPlayersInTier) {
          const leftover = (maxPlayersInTier - tierPlayers.length) * (tierPool / maxPlayersInTier);
          tierPool -= leftover;
          // Leftover goes to leader
          if (!players["LEADER"]) players["LEADER"] = { earningsCM: 0, earningsST: 0 };
          if (type === "chessMood") players["LEADER"].earningsCM += leftover;
          else players["LEADER"].earningsST += leftover;
        }

        // Eligibility filter
        const eligiblePlayers = tierPlayers.filter(p => {
          const games = p.wins + p.losses + p.draws;
          const winrate = p.losses > 0 ? p.wins / (p.wins + p.losses) : 0;
          return games >= 10 && winrate >= 0.20;
        });

        // If no eligible players, skip tier
        if (!eligiblePlayers.length) return;

        // Total points of eligible players
        const totalPoints = eligiblePlayers.reduce((sum,p)=>sum+p.points,0);
        if (totalPoints === 0) return;

        // Distribute tierPool proportionally by points
        eligiblePlayers.forEach(p => {
          const share = tierPool * (p.points / totalPoints);
          const payout = Math.floor(share * 100)/100;
          const playerObj = players[p.username];
          if (type === "chessMood") playerObj.earningsCM += payout;
          else playerObj.earningsST += payout;
        });
      });

      // Apply ledger alreadyPaid
      teamMembers.forEach(u => {
        const player = players[u];
        if (type === "chessMood") player.earningsCM -= ledger.getPlayer(u).chessMood;
        else player.earningsST -= ledger.getPlayer(u).streamers;

        if (type === "chessMood" && player.earningsCM < 0) player.earningsCM = 0;
        if (type === "streamers" && player.earningsST < 0) player.earningsST = 0;
      });
    }

    // Process all tournaments
    tournamentResults.forEach(tmtObj => {
      const tmt = tmtObj.tournament;
      const type = tmt.name.toLowerCase().includes("chessmood") ? "chessMood" : "streamers";
      processTournament(tmt, tmtObj.results, type);
    });

    // Total earnings & winrates
    Object.values(players).forEach(p=>{
      p.totalEarnings = Math.floor((p.earningsCM + p.earningsST)*100)/100;
      p.winrateCM = p.gamesCM ? p.winsCM / (p.gamesCM - (p.gamesCM - (p.winsCM + (p.gamesCM - p.winsCM)))) : 0;
      p.winrateST = p.gamesST ? p.winsST / (p.gamesST - (p.gamesST - (p.winsST + (p.gamesST - p.winsST)))) : 0;
    });

    // Return leaderboard sorted by total earnings
    return Object.values(players).sort((a,b)=>b.totalEarnings - a.totalEarnings);
  }
};
