// config.js

const CONFIG = {
  leaderCut: 0.20, // 20% goes to leader

  // Tournament types
  tournamentTypes: {
    chessMood: {
      default: {
        prizes: [500, 250, 125, 75, 50] // top 5
      },
      december: {
        prizes: [2500, 1800, 1500, 1200, 1000, 700, 500, 350, 250, 200] // top 10
      }
    },
    streamers: {
      prizes: [100, 70, 40, 20] // top 4
    }
  },

  // Placement tier percentages of player pool
  tiers: [
    { maxRank: 20, percent: 0.50 },  // Top 20
    { maxRank: 50, percent: 0.30 },  // Next 30
    { maxRank: 100, percent: 0.20 }  // Next 50
  ],

  // Manual tournament IDs to avoid duplication
  manualTournamentIDs: [
    // e.g., "abc123", "def456"
  ],

  // Placement multipliers (top 20 more valuable than lower ranks)
  placementMultiplier: {
    top20: 1.0,
    top50: 0.6,
    top100: 0.35
  },

  rounding: {
    cents: true,     // true → round down to cents
    method: "floor"  // always round down
  }
};
