// calc.js
const Calc = {
  /**
   * Calculate payouts for all players
   * @param {Array} teamMembers - list of usernames
   * @param {Array} tournamentResults - array of { tournament, results }
   * @param {Object} ledger - ledger object with alreadyPaid
   */
  calculatePayouts(teamMembers, tournamentResults, ledger) {
    // Initialize player stats
    const players = {};
    teamMembers.forEach(u => {
      if (!players[u]) players[u] = {
        username: u,
        netWinsCM: 0,
        netWinsST: 0,
        debtCM: 0, // negative netWins carried over
        debtST: 0,
        earningsCM: 0,
        earningsST: 0,
        winrateCM: 0,
        winrateST: 0,
        totalEarnings: 0
      };
    });

    // Helper to process a single tournament type
    function processTournament(tournament, results, type) {
      // Determine prize table
      let prizeTable = CONFIG.tournamentTypes[type].default.prizes;
      if (type === "chessMood" && tournament.name.toLowerCase().includes("december")) {
        prizeTable = CONFIG.tournamentTypes[type].december.prizes;
      }

      const totalPrize = prizeTable.reduce((a, b) => a + b, 0);
      const playerPool = totalPrize * (1 - CONFIG.leaderCut);
      const leaderCutAmount = totalPrize - playerPool;

      // Sort results by points (descending)
      const teamResults = results
        .filter(r => teamMembers.includes(r.username))
        .map(r => ({
          username: r.username,
          points: r.points || 0,
          wins: r.wins || 0,
          losses: r.losses || 0,
          draws: r.draws || 0
        }))
        .sort((a, b) => b.points - a.points);

      // Assign netWins and debt carryover
      teamResults.forEach((r, idx) => {
        const netWins = r.wins - r.losses;
        const player = players[r.username];
        if (type === "chessMood") {
          player.netWinsCM += netWins;
        } else {
          player.netWinsST += netWins;
        }
      });

      // Split playerPool into tiers
      const tiers = CONFIG.tiers.map(t => {
        const startRank = t.maxRank === 20 ? 0 : tiers.length === 1 ? 20 : 50;
        const endRank = Math.min(t.maxRank, teamResults.length);
        return {
          players: teamResults.slice(startRank, endRank),
          percent: t.percent
        };
      });

      // Calculate tier payouts
      tiers.forEach((tier, tierIdx) => {
        const tierPlayers = tier.players;
        if (!tierPlayers.length) return;

        let tierPool = playerPool * tier.percent;

        // Handle leftover if fewer players than max tier
        const maxPlayersInTier = tierIdx === 0 ? 20 : tierIdx === 1 ? 30 : 50;
        if (tierPlayers.length < maxPlayersInTier) {
          const leftover = (maxPlayersInTier - tierPlayers.length) * (tierPool / maxPlayersInTier);
          tierPool -= leftover;
          // Add leftover to leader cut (you)
          // Optional: could store separately
        }

        // Calculate total weight in tier
        const totalWeight = tierPlayers.reduce((sum, p) => {
          const player = players[p.username];
          const netWins = type === "chessMood"
            ? Math.max(0, player.netWinsCM + player.debtCM)
            : Math.max(0, player.netWinsST + player.debtST);
          return sum + netWins;
        }, 0);

        // If totalWeight = 0, skip payouts (everyone in debt)
        if (totalWeight === 0) return;

        // Distribute tierPool proportionally
        tierPlayers.forEach(p => {
          const player = players[p.username];
          const effectiveNetWins = type === "chessMood"
            ? Math.max(0, player.netWinsCM + player.debtCM)
            : Math.max(0, player.netWinsST + player.debtST);

          const share = tierPool * (effectiveNetWins / totalWeight);

          // Round down to cents
          const payout = Math.floor(share * 100) / 100;

          if (type === "chessMood") {
            player.earningsCM += payout;
          } else {
            player.earningsST += payout;
          }
        });

        // Update debts
        tierPlayers.forEach(p => {
          const player = players[p.username];
          const netWins = p.wins - p.losses;
          if (type === "chessMood") {
            player.debtCM = Math.min(0, player.debtCM + netWins);
          } else {
            player.debtST = Math.min(0, player.debtST + netWins);
          }
        });
      });

      // Apply ledger alreadyPaid
      teamMembers.forEach(u => {
        const player = players[u];
        if (type === "chessMood") player.earningsCM -= ledger.getPlayer(u).chessMood;
        else player.earningsST -= ledger.getPlayer(u).streamers;

        // Ensure non-negative
        if (type === "chessMood" && player.earningsCM < 0) player.earningsCM = 0;
        if (type === "streamers" && player.earningsST < 0) player.earningsST = 0;
      });
    }

    // Process each tournament
    tournamentResults.forEach(tmtObj => {
      const tmt = tmtObj.tournament;
      const type = tmt.name.toLowerCase().includes("chessmood") ? "chessMood" : "streamers";
      processTournament(tmt, tmtObj.results, type);
    });

    // Calculate total earnings and winrates
    Object.values(players).forEach(p => {
      p.totalEarnings = Math.floor((p.earningsCM + p.earningsST) * 100) / 100;
      p.winrateCM = p.netWinsCM / Math.max(1, p.netWinsCM + Math.abs(p.debtCM));
      p.winrateST = p.netWinsST / Math.max(1, p.netWinsST + Math.abs(p.debtST));
    });

    // Return sorted leaderboard
    return Object.values(players).sort((a, b) => b.totalEarnings - a.totalEarnings);
  }
};
