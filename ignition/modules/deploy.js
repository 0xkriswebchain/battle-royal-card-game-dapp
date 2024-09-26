const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("card_battle_module", (m) => {
  const cardGame = m.contract("CardBattleGame", [
    "0xd652eb6B97B268489c5c4a95606E31eCaDE677f6",
  ]);

  return { cardGame };
});
