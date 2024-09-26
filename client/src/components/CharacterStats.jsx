import { ethers } from 'ethers';
import CardBattleGame from '../artifacts/CardBattleGame.json';
import {useWallet} from '../components/ConnectWallet';

const gameContractAddress = process.env.VITE_GAME_CONTRACT

const CLASS_TO_ENUM = {
    "BARBARIAN": 0,
    "KNIGHT": 1,
    "RANGER": 2,
    "ROGUE": 3,
    "WIZARD": 4,
    "CLERIC": 5
  };


export function useFetchCharacterStats() {
  const {signer} = useWallet()

console.log(signer);
  const fetchCharacterStats = async (characterClass) => {
    if (!signer || !characterClass) {
      console.error("Contract, signer, or character class is missing");
      return null;
    }

    const classEnum = CLASS_TO_ENUM[characterClass.toUpperCase()];
    if (classEnum === undefined) {
      console.error("Invalid character class:", characterClass);
      return null;
    }

    try {
      const gameContract = new ethers.Contract(gameContractAddress, CardBattleGame.abi, signer);
      const baseHealth = await gameContract.getBaseHealth(classEnum);
      const baseMana = await gameContract.getBaseMana(classEnum);
      const baseAttack = await gameContract.getBaseAttack(classEnum);
      const baseDefense = await gameContract.getBaseDefense(classEnum);

      return {
        class: characterClass,
        baseHealth: baseHealth.toString(),
        baseMana: baseMana.toString(),
        baseAttack: baseAttack.toString(),
        baseDefense: baseDefense.toString()
      };
    } catch (error) {
      console.error("Error fetching character stats:", error);
      return null;
    }
  };

  return fetchCharacterStats;
}