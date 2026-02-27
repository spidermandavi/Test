// ledger.js
// Persistent payouts ledger using localStorage
let ledger = JSON.parse(localStorage.getItem("ledger") || "{}");

ledger.getPlayer = function(username) {
  if (!this[username]) {
    this[username] = { chessMood: 0, streamers: 0 };
  }
  return this[username];
};

ledger.addEarnings = function(username, type, amount) {
  const player = this.getPlayer(username);
  player[type] += amount;
  this.save();
};

ledger.resetEarnings = function(username, type) {
  const player = this.getPlayer(username);
  player[type] = 0;
  this.save();
};

ledger.save = function() {
  localStorage.setItem("ledger", JSON.stringify(this));
};
