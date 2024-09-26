// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title CardBattleGame
/// @notice This contract allows players to register, create battles, and resolve them using NFTs as characters.
contract CardBattleGame is Ownable, EIP712 {
    IERC721Enumerable public nftCollection;

    uint256 public nextBattleId;

    /// @notice Enum representing different character classes.
    enum CharacterClass {
        BARBARIAN,
        KNIGHT,
        RANGER,
        ROGUE,
        WIZARD,
        CLERIC
    }

    /// @notice Struct representing a player.
    struct Player {
        string name;
        address playerAddress;
        uint256 totalWins;
        uint256 totalLosses;
        uint256 experience;
        mapping(uint256 => CharacterStats) characterStats;
    }

    /// @notice Struct representing character stats.
    struct CharacterStats {
        CharacterClass class;
        uint256 level;
        uint256 exp;
        uint256 health;
        uint256 mana;
        uint256 attack;
        uint256 defense;
        uint256 wins;
        uint256 losses;
    }

    /// @notice Struct representing a battle.
    struct Battle {
        string name;
        address player1;
        address player2;
        uint256 player1TokenId;
        uint256 player2TokenId;
        uint256 startTime;
        bool resolved;
    }

    bytes32 private constant RESOLVE_BATTLE_TYPEHASH = keccak256(
        "ResolveBattle(uint256 battleId,address _player2,bool isComputer,uint256 _player1TokenId,uint256 _player2TokenId,address _winner,uint256 _winnerExp,uint256 _loserExp)"
    );
    uint256 public totalBattle;
    mapping(address => Player) public players;
    mapping(uint256 => Battle) public battles;

    event PlayerRegistered(address indexed playerAddress, string name);
    event BattleRegistered(uint256 indexed battleId, string name, address indexed player1);
    event BattleResolved(
        uint256 indexed battleId, address indexed winner, address indexed loser, uint256 winnerExp, uint256 loserExp
    );

    /// @notice Constructor to initialize the contract with the NFT collection address.
    /// @param _nftCollectionAddress The address of the NFT collection.
    constructor(address _nftCollectionAddress) EIP712("CardBattleGame", "1") Ownable(msg.sender) {
        nftCollection = IERC721Enumerable(_nftCollectionAddress);
        totalBattle = 0;
        nextBattleId = 1;
    }

    /// @notice Register a new player.
    /// @param _name The name of the player.
    function registerPlayer(string memory _name) external {
        require(bytes(players[msg.sender].name).length == 0, "Player already registered");
        players[msg.sender].name = _name;
        players[msg.sender].playerAddress = msg.sender;

        emit PlayerRegistered(msg.sender, _name);
    }

    /// @notice Register a new battle.
    /// @param _battleName The name of the battle.
    /// @return The ID of the newly created battle.
    function registerBattle(string memory _battleName) external returns (uint256) {
        uint256 battleId = nextBattleId++;
        battles[battleId] = Battle({
            name: _battleName,
            player1: msg.sender,
            player2: address(0), // Initialize to zero address
            player1TokenId: 0, // Initialize to zero
            player2TokenId: 0, // Initialize to zero
            startTime: block.timestamp,
            resolved: false
        });

        totalBattle++;
        emit BattleRegistered(battleId, _battleName, msg.sender);
        return battleId;
    }

    /// @notice Resolve a battle.
    /// @param _battleId The ID of the battle to resolve.
    /// @param _player2 The address of the second player.
    /// @param isComputer Whether the second player is a computer.
    /// @param _player1TokenId The token ID of the first player's character.
    /// @param _player2TokenId The token ID of the second player's character.
    /// @param _winner The address of the winning player.
    /// @param _winnerExp The experience points awarded to the winner.
    /// @param _loserExp The experience points awarded to the loser.
    /// @param v The recovery id of the signature.
    /// @param r The r value of the signature.
    /// @param s The s value of the signature.
    function resolveBattle(
        uint256 _battleId,
        address _player2,
        bool isComputer,
        uint256 _player1TokenId,
        uint256 _player2TokenId,
        address _winner,
        uint256 _winnerExp,
        uint256 _loserExp,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        Battle storage battle = battles[_battleId];
        require(!battle.resolved, "Battle already resolved");
        require(battle.player2 == address(0), "Battle already has a second player");
        require(_player2 != address(0), "Invalid player2 address");
        require(nftCollection.ownerOf(_player1TokenId) == battle.player1, "Player1 must own the specified NFT");

        if (!isComputer) {
            require(nftCollection.ownerOf(_player2TokenId) == _player2, "Player2 must own the specified NFT");
        }

        bytes32 structHash = keccak256(
            abi.encode(
                RESOLVE_BATTLE_TYPEHASH,
                _battleId,
                _player2,
                isComputer,
                _player1TokenId,
                _player2TokenId,
                _winner,
                _winnerExp,
                _loserExp
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        require(ecrecover(hash, v, r, s) == owner(), "Invalid signature");

        // Update battle details
        battle.player2 = _player2;
        battle.player1TokenId = _player1TokenId;
        battle.player2TokenId = _player2TokenId;
        battle.resolved = true;

        _updateBattleStats(_battleId, _winner, _winnerExp, _loserExp);

        emit BattleResolved(
            _battleId, _winner, _winner == battle.player1 ? _player2 : battle.player1, _winnerExp, _loserExp
        );
    }

    /// @notice Update the battle stats for the winner and loser.
    /// @param _battleId The ID of the battle.
    /// @param _winner The address of the winning player.
    /// @param _winnerExp The experience points awarded to the winner.
    /// @param _loserExp The experience points awarded to the loser.
    function _updateBattleStats(uint256 _battleId, address _winner, uint256 _winnerExp, uint256 _loserExp) private {
        Battle storage battle = battles[_battleId];
        address loser = (_winner == battle.player1) ? battle.player2 : battle.player1;
        uint256 winnerTokenId = (_winner == battle.player1) ? battle.player1TokenId : battle.player2TokenId;
        uint256 loserTokenId = (_winner == battle.player1) ? battle.player2TokenId : battle.player1TokenId;

        // Update winner stats
        CharacterStats storage winnerStats = players[_winner].characterStats[winnerTokenId];
        winnerStats.exp += _winnerExp;
        winnerStats.wins++;
        players[_winner].totalWins++;
        players[_winner].experience += _winnerExp;

        // Update loser stats
        CharacterStats storage loserStats = players[loser].characterStats[loserTokenId];
        loserStats.exp += _loserExp;
        loserStats.losses++;
        players[loser].totalLosses++;
        players[loser].experience += _loserExp;

        // Level up logic
        _levelUp(winnerStats);
        _levelUp(loserStats);
    }

    /// @notice Level up the character if they have enough experience points.
    /// @param stats The character stats to update.
    function _levelUp(CharacterStats storage stats) private {
        while (stats.exp >= getRequiredExp(stats.level)) {
            stats.level++;
        }
    }

    /// @notice Check if an address is a registered player.
    /// @param addr The address to check.
    /// @return True if the address is a registered player, false otherwise.
    function isPlayer(address addr) public view returns (bool) {
        return bytes(players[addr].name).length > 0;
    }

    /// @notice Get the character stats for a specific player and token ID.
    /// @param _player The address of the player.
    /// @param _tokenId The token ID of the character.
    /// @return The character stats.
    function getCharacterStats(address _player, uint256 _tokenId) external view returns (CharacterStats memory) {
        require(nftCollection.ownerOf(_tokenId) == _player, "Player does not own this token");
        return players[_player].characterStats[_tokenId];
    }

    /// @notice Get the required experience points for a specific level.
    /// @param _level The level to check.
    /// @return The required experience points.
    function getRequiredExp(uint256 _level) public pure returns (uint256) {
        return _level * 100;
    }

    /// @notice Get the base health for a specific character class.
    /// @param _class The character class to check.
    /// @return The base health.
    function getBaseHealth(CharacterClass _class) public pure returns (uint256) {
        if (_class == CharacterClass.BARBARIAN) return 150;
        if (_class == CharacterClass.KNIGHT) return 120;
        if (_class == CharacterClass.RANGER) return 100;
        if (_class == CharacterClass.ROGUE) return 90;
        if (_class == CharacterClass.WIZARD) return 80;
        if (_class == CharacterClass.CLERIC) return 110;
        revert("Invalid class");
    }

    /// @notice Get the base mana for a specific character class.
    /// @param _class The character class to check.
    /// @return The base mana.
    function getBaseMana(CharacterClass _class) public pure returns (uint256) {
        if (_class == CharacterClass.BARBARIAN) return 50;
        if (_class == CharacterClass.KNIGHT) return 60;
        if (_class == CharacterClass.RANGER) return 70;
        if (_class == CharacterClass.ROGUE) return 60;
        if (_class == CharacterClass.WIZARD) return 100;
        if (_class == CharacterClass.CLERIC) return 90;
        return 70;
    }

    /// @notice Get the base attack for a specific character class.
    /// @param _class The character class to check.
    /// @return The base attack.
    function getBaseAttack(CharacterClass _class) public pure returns (uint256) {
        if (_class == CharacterClass.BARBARIAN) return 80;
        if (_class == CharacterClass.KNIGHT) return 70;
        if (_class == CharacterClass.RANGER) return 75;
        if (_class == CharacterClass.ROGUE) return 85;
        if (_class == CharacterClass.WIZARD) return 90;
        if (_class == CharacterClass.CLERIC) return 60;
        return 70;
    }

    /// @notice Get the base defense for a specific character class.
    /// @param _class The character class to check.
    /// @return The base defense.
    function getBaseDefense(CharacterClass _class) public pure returns (uint256) {
        if (_class == CharacterClass.BARBARIAN) return 60;
        if (_class == CharacterClass.KNIGHT) return 80;
        if (_class == CharacterClass.RANGER) return 55;
        if (_class == CharacterClass.ROGUE) return 50;
        if (_class == CharacterClass.WIZARD) return 40;
        if (_class == CharacterClass.CLERIC) return 70;
        return 60;
    }
}
