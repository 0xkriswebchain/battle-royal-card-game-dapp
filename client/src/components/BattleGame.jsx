import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const BattleGame = ({ battleId, player1, player2, isComputerOpponent, onBattleEnd }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 1920,
      height: 1080,
      scene: {
        preload: preload,
        create: create,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);

    let gameState;
    let player1Card, player2Card;
    let actionButtons;
    let turnText, actionLogText;
    let animationLayer;
    let endGameButton;

    const classes = {
        Barbarian: {
          name: 'Barbarian',
          powers: [
            { name: 'Mighty Swing', description: 'Deal 12-18 damage', manaCost: 1, minDamage: 12, maxDamage: 18, type: 'attack' },
            { name: 'Battle Cry', description: 'Gain 5-10 shield and increase next attack damage by 5', manaCost: 2, minShield: 5, maxShield: 10, nextAttackBonus: 5, type: 'defend' },
            { name: 'Berserker Rage', description: 'Deal 25-35 damage, take 10 damage', manaCost: 3, minDamage: 25, maxDamage: 35, selfDamage: 10, type: 'special', cooldown: 2 }
          ]
        },
        Knight: {
          name: 'Knight',
          powers: [
            { name: 'Sword Slash', description: 'Deal 10-15 damage', manaCost: 1, minDamage: 10, maxDamage: 15, type: 'attack' },
            { name: 'Shield Wall', description: 'Gain 8-12 shield', manaCost: 2, minShield: 8, maxShield: 12, type: 'defend' },
            { name: 'Righteous Strike', description: 'Deal 20-30 damage and gain 5-10 shield', manaCost: 4, minDamage: 20, maxDamage: 30, minShield: 5, maxShield: 10, type: 'special', cooldown: 3 }
          ]
        },
        Ranger: {
          name: 'Ranger',
          powers: [
            { name: 'Quick Shot', description: 'Deal 8-14 damage, gain 1 mana', manaCost: 1, minDamage: 8, maxDamage: 14, manaGain: 1, type: 'attack' },
            { name: 'Evasive Maneuver', description: 'Gain 4-8 shield and 2 mana', manaCost: 1, minShield: 4, maxShield: 8, manaGain: 2, type: 'defend' },
            { name: 'Precise Shot', description: 'Deal 22-32 damage, ignore 50% of enemy shield', manaCost: 3, minDamage: 22, maxDamage: 32, shieldPenetration: 0.5, type: 'special', cooldown: 2 }
          ]
        },
        Rogue: {
          name: 'Rogue',
          powers: [
            { name: 'Backstab', description: 'Deal 9-15 damage, gain 1 mana', manaCost: 1, minDamage: 9, maxDamage: 15, manaGain: 1, type: 'attack' },
            { name: 'Smoke Screen', description: 'Gain 5-9 shield, next attack deals +4 damage', manaCost: 1, minShield: 5, maxShield: 9, nextAttackBonus: 4, type: 'defend' },
            { name: 'Assassinate', description: 'Deal 20-30 damage, ignore shield', manaCost: 4, minDamage: 20, maxDamage: 30, ignoreShield: true, type: 'special', cooldown: 3 }
          ]
        },
        Wizard: {
          name: 'Wizard',
          powers: [
            { name: 'Arcane Bolt', description: 'Deal 9-13 damage', manaCost: 1, minDamage: 9, maxDamage: 13, type: 'attack' },
            { name: 'Mana Shield', description: 'Gain 6-10 shield and 2 mana', manaCost: 2, minShield: 6, maxShield: 10, manaGain: 2, type: 'defend' },
            { name: 'Fireball', description: 'Deal 28-38 damage', manaCost: 5, minDamage: 28, maxDamage: 38, type: 'special', cooldown: 3 }
          ]
        },
        Cleric: {
          name: 'Cleric',
          powers: [
            { name: 'Holy Smite', description: 'Deal 8-12 damage, heal 2-4 HP', manaCost: 1, minDamage: 8, maxDamage: 12, minHeal: 2, maxHeal: 4, type: 'attack' },
            { name: 'Divine Protection', description: 'Gain 7-11 shield, heal 3-5 HP', manaCost: 2, minShield: 7, maxShield: 11, minHeal: 3, maxHeal: 5, type: 'defend' },
            { name: 'Blessing of Light', description: 'Deal 15-25 damage, heal 10-15 HP', manaCost: 4, minDamage: 15, maxDamage: 25, minHeal: 10, maxHeal: 15, type: 'special', cooldown: 3 }
          ]
        }
      };

      
      function preload() {
        this.load.setBaseURL('https://card-game-psi-ashen.vercel.app/');
        this.load.image('background', 'assets/background.jpg');
        this.load.image('card_frame', 'assets/card.png');
        this.load.image('card_mask', 'assets/card_mask.png');
        this.load.image('card_mask_1', 'assets/card_mask_1.png');
        this.load.image('battle_log', 'assets/oldpage.png');
        this.load.image('player1_image', player1.image, { frameWidth: 100, frameHeight: 100 });
        this.load.image('player2_image', player2.image, { frameWidth: 100, frameHeight: 100 });
        this.load.spritesheet('attack_effect', 'assets/attack_sprite.png', {frameWidth: 120, frameHeight: 120});
        this.load.image('defend_effect', 'assets/defence_sprite.png', { frameWidth: 200, frameHeight: 200 });
        this.load.spritesheet('special_effect', 'assets/special_sprite.png', {frameWidth: 200, frameHeight: 200});
      }
  
      function create() {
        const width = this.scale.width;
        const height = this.scale.height;
        const scaleRatio = Math.min(width / 1024, height / 768);
      
        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);
      
        createAnimations(this);
      
        gameState = loadGameState() || initializeGameState();
      
        player1Card = createPlayerCard(this, width * 0.25, height * 0.5, gameState.player1, 'player1_image', scaleRatio);
        player2Card = createPlayerCard(this, width * 0.75, height * 0.5, gameState.player2, 'player2_image', scaleRatio);

        // Add end game button
        endGameButton = createEndGameButton(this, width, height, scaleRatio);
        
        turnText = createTurnText(this, width, height, scaleRatio);
        actionLogText = createActionLogCard(this, width * 0.5, height * 0.5, scaleRatio);
        actionButtons = createActionButtons(this, width, height, scaleRatio);
      
        animationLayer = this.add.container(0, 0);
      
        updateUI();
        saveGameState();
      
        this.scale.on('resize', (gameSize) => resize(this, gameSize));
      }

      function createAnimations(scene) {
        // Create animations
        scene.anims.create({
          key: 'attack_anim',
          frames: scene.anims.generateFrameNumbers('attack_effect', { start: 0, end: 8 }),
          frameRate: 5,
          repeat: 0
        })
        scene.anims.create({
          key: 'special_anim',
          frames: scene.anims.generateFrameNumbers('special_effect', { start: 0, end: 8 }),
          frameRate: 10,
          repeat: 0
        })
      }
  
      function initializeGameState() {
        const initialState = {
          player1: {
            ...player1,
            health: player1.health,
            mana: player1.mana,
            shield: 0,
            class: classes[player1.class],
            cooldowns: (classes[player1.class])?.powers.map(() => 0),
          },
          player2: {
            ...player2,
            health: player2.health,
            mana: player2.mana,
            shield: 0,
            class: classes[player2.class],
            cooldowns: (classes[player2.class])?.powers.map(() => 0),
            // name: isComputerOpponent ? "Computer" : player2.name
          },
          currentTurn: 1,
          turnPlayer: 'player1',
          actionLog: [],
          roundNumber: 1,
          prevPlayer1State: null,
          prevPlayer2State: null
        };
      
        // Set initial previous states
        initialState.prevPlayer1State = { ...initialState.player1 };
        initialState.prevPlayer2State = { ...initialState.player2 };
      
        return initialState;
      }

      function createPlayerCard(scene, x, y, player, imageKey, scaleRatio) {

        const card = scene.add.container(x, y);
        const frame = scene.add.image(0, 0, 'card_frame').setScale(0.8 * scaleRatio);
        
        // Adjust these values to fit the image within the card frame
        const circleRadius = 45 * scaleRatio; // Increase the circle size
  
        // Add the character image 
        const characterImage = scene.add.image(90, -40, imageKey);
        characterImage.setDisplaySize(circleRadius * 6, circleRadius * 5);
        characterImage.setCrop(0,40, 450, 600);
        characterImage.setOrigin(0.5);
        characterImage.setScale(0.3 * scaleRatio)

        const nameText = scene.add.text(0, -150 * scaleRatio, player.name, {
          fontSize: `${26 * scaleRatio}px`,
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 4 * scaleRatio
        }).setOrigin(0.5);

        const classText = scene.add.text(0, 12 * scaleRatio, player.class.name, {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 2 * scaleRatio
        }).setOrigin(0.5);

  
        // Add stats to the card
        const healthText = scene.add.text(-40 * scaleRatio, 30 * scaleRatio, `HP: ${player.health}`, {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#000',
          stroke: '#fff',
          strokeThickness: 1 * scaleRatio
        });
        
        const manaText = scene.add.text(-40 * scaleRatio, 45 * scaleRatio, `MP: ${player.mana}`, {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#000',
          stroke: '#fff',
          strokeThickness: 1 * scaleRatio
        });
        
        const shieldText = scene.add.text(-40 * scaleRatio, 60 * scaleRatio, `Shield: ${player.shield}`, {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#000',
          stroke: '#fff',
          strokeThickness: 1 * scaleRatio
        });

        // Add change indicators
        const healthChange = scene.add.text(15 * scaleRatio, 30 * scaleRatio, '', {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#00ff00'
        });
        const manaChange = scene.add.text(12 * scaleRatio, 44 * scaleRatio, '', {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#00ff00'
        });
        const shieldChange = scene.add.text(35 * scaleRatio, 60 * scaleRatio, '', {
          fontSize: `${12 * scaleRatio}px`,
          fill: '#00ff00'
        });
  
        card.add([characterImage, frame, classText, nameText, healthText, manaText, shieldText, healthChange, manaChange, shieldChange]);
        
        // Store references to update later
        card.healthText = healthText;
        card.manaText = manaText;
        card.shieldText = shieldText;
        card.healthChange = healthChange;
        card.manaChange = manaChange;
        card.shieldChange = shieldChange;

  
        return card;
      }

      function createTurnText(scene, width, height, scaleRatio) {
        return scene.add.text(width / 2, height * 0.1, '', {
          fontSize: `${36 * scaleRatio}px`,
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 6 * scaleRatio
        }).setOrigin(0.5);
      }
  
      function createActionLogCard(scene, x, y, scaleRatio) {
        const card = scene.add.container(x, y);
        const frame = scene.add.image(0, 0, 'battle_log').setScale(0.305 * scaleRatio);

        const battleLogText = scene.add.text(0, -100 * scaleRatio, 'Battle Log', {
          fontSize: `${26 * scaleRatio}px`,
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 4 * scaleRatio
        }).setOrigin(0.5);

        const logText = scene.add.text(0, 0, '', {
          fontSize: `${14 * scaleRatio}px`,
          fill: '#000',
          stroke: '#fff',
          strokeThickness: 2 * scaleRatio,
          align: 'center',
          wordWrap: { width: 260 * scaleRatio },
          lineSpacing: 5
        }).setOrigin(0.5);
      
        card.add([frame, battleLogText, logText]);
        
        return logText;
      }
  
      function createActionButtons(scene, width, height, scaleRatio) {
        const currentPlayer = gameState[gameState.turnPlayer];
        const playerClass = currentPlayer.class; 
      
        return playerClass.powers.map((power, index) => {
          const button = scene.add.text(
            width * ((index + 1) / (playerClass.powers.length + 1)),
            height * 0.9,
            `${power.name} (${power.manaCost} MP)`,
            {
              fontSize: `${20 * scaleRatio}px`,
              fill: '#fff',
              stroke: '#000',
              strokeThickness: 3 * scaleRatio,
              backgroundColor: '#4b0082',
              padding: { x: 8 * scaleRatio, y: 4 * scaleRatio }
            }
          ).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
          button.on('pointerdown', () => handleAction(index));
          return button;
        });
      }
  
      function resize(scene, gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        const scaleRatio = Math.min(width / 1024, height / 768);
      
        scene.cameras.resize(width, height);
      
        if (player1Card && player2Card) {
          player1Card.setPosition(width * 0.25, height * 0.5);
          player2Card.setPosition(width * 0.75, height * 0.5);
        }
      
        if (turnText) {
          turnText.setPosition(width / 2, height * 0.1).setFontSize(`${36 * scaleRatio}px`);
        }
      
        if (actionLogText) {
          actionLogText.parentContainer.setPosition(width * 0.5, height * 0.5);
          actionLogText.setFontSize(`${16 * scaleRatio}px`);
        }
      
        if (actionButtons) {
          actionButtons.forEach((button, index) => {
            button.setPosition(width * ((index + 1) / (actionButtons.length + 1)), height * 0.9).setFontSize(`${20 * scaleRatio}px`);
          });
        }
      }

    function handleAction(powerIndex) {
      if (gameState.turnPlayer === 'player1') {
        const playerClass = gameState.player1.class || classes.BARBARIAN;
        executeAction(playerClass.powers[powerIndex], gameState.player1, gameState.player2, powerIndex);
      }
    }


    function executeAction(power, attacker, defender, powerIndex) {
      if (attacker.mana < power.manaCost || attacker.cooldowns[powerIndex] > 0) return;

      // Update previous states
      gameState.prevPlayer1State = { ...gameState.player1 };
      gameState.prevPlayer2State = { ...gameState.player2 };

      attacker.mana -= power.manaCost;
      attacker.cooldowns[powerIndex] = power.cooldown || 0;
      let actionResult = '';

      const attackerCard = attacker === gameState.player1 ? player1Card : player2Card;
      const defenderCard = defender === gameState.player1 ? player1Card : player2Card;

      switch (power.type) {
        case 'attack':
          actionResult = handleAttack(power, attacker, defender);
          playAnimation('attack_anim', defenderCard);
          break;
        case 'defend':
          actionResult = handleDefend(power, attacker);
          playAnimation('defend_effect', attackerCard);
          break;
        case 'special':
          actionResult = handleSpecial(power, attacker, defender);
          playAnimation('special_anim', defenderCard);
          break;
      }

      gameState.currentTurn++;
      gameState.turnPlayer = attacker === gameState.player1 ? 'player2' : 'player1';
      gameState.actionLog.unshift(actionResult);
      if (gameState.actionLog.length > 2) gameState.actionLog.length = 2;

      reduceCooldowns();

      if (defender.health <= 0) {
        onBattleEnd(battleId, attacker === gameState.player1 ? player1.address : player2.address, 100);
      } else {
        updateUI();
        saveGameState();

        if (gameState.turnPlayer === 'player2' && isComputerOpponent) {
          setTimeout(computerTurn, 1500);
        }
      }
    }

    function handleAttack(power, attacker, defender) {
      const damage = calculateDamage(power, attacker);
      const actualDamage = applyDamage(damage, defender, power.ignoreShield);
      let actionResult = `${attacker.name} uses ${power.name} for ${actualDamage} damage!`;
      
      if (power.manaGain) {
        attacker.mana = Math.min(100, attacker.mana + power.manaGain);
        actionResult += ` Gained ${power.manaGain} mana.`;
      }
      if (power.minHeal) {
        const healAmount = Phaser.Math.Between(power.minHeal, power.maxHeal);
        attacker.health = Math.min(100, attacker.health + healAmount);
        actionResult += ` Healed for ${healAmount} HP.`;
      }
      
      return actionResult;
    }

    function handleDefend(power, attacker) {
      const shield = Phaser.Math.Between(power.minShield, power.maxShield);
      attacker.shield += shield;
      let actionResult = `${attacker.name} uses ${power.name} and gains ${shield} shield!`;
      
      if (power.manaGain) {
        attacker.mana = Math.min(100, attacker.mana + power.manaGain);
        actionResult += ` Gained ${power.manaGain} mana.`;
      }
      if (power.nextAttackBonus) {
        attacker.nextAttackBonus = (attacker.nextAttackBonus || 0) + power.nextAttackBonus;
        actionResult += ` Next attack will deal +${power.nextAttackBonus} damage.`;
      }
      if (power.minHeal) {
        const healAmount = Phaser.Math.Between(power.minHeal, power.maxHeal);
        attacker.health = Math.min(100, attacker.health + healAmount);
        actionResult += ` Healed for ${healAmount} HP.`;
      }
      
      return actionResult;
    }

    function handleSpecial(power, attacker, defender) {
      const damage = calculateDamage(power, attacker);
      const actualDamage = applyDamage(damage, defender, power.ignoreShield, power.shieldPenetration);
      let actionResult = `${attacker.name} uses ${power.name} for ${actualDamage} damage!`;
      
      if (power.selfDamage) {
        attacker.health = Math.max(0, attacker.health - power.selfDamage);
        actionResult += ` ${attacker.name} takes ${power.selfDamage} self-damage.`;
      }
      if (power.minHeal) {
        const healAmount = Phaser.Math.Between(power.minHeal, power.maxHeal);
        attacker.health = Math.min(100, attacker.health + healAmount);
        actionResult += ` Healed for ${healAmount} HP.`;
      }
      
      return actionResult;
    }

    function calculateDamage(power, attacker) {
      return Phaser.Math.Between(power.minDamage, power.maxDamage) + (attacker.nextAttackBonus || 0);
    }

    function applyDamage(damage, defender, ignoreShield, shieldPenetration = 0) {
      const effectiveShield = ignoreShield ? 0 : defender.shield * (1 - shieldPenetration);
      const actualDamage = Math.max(0, damage - effectiveShield);
      defender.health = Math.max(0, defender.health - actualDamage);
      defender.shield = Math.max(0, defender.shield - (ignoreShield ? 0 : damage));
      return actualDamage;
    }

    function reduceCooldowns() {
      gameState.player1.cooldowns = gameState.player1.cooldowns.map(cd => Math.max(0, cd - 1));
      gameState.player2.cooldowns = gameState.player2.cooldowns.map(cd => Math.max(0, cd - 1));
    }

    function computerTurn() {
      const playerClass = gameState.player2.class || classes.BARBARIAN;
      const availableActions = playerClass.powers.filter((power, index) => 
        gameState.player2.mana >= power.manaCost && gameState.player2.cooldowns[index] === 0
      );
    
      if (availableActions.length === 0) {
        endTurn();
        return;
      }

      const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
      const powerIndex = playerClass.powers.indexOf(randomAction);
      executeAction(randomAction, gameState.player2, gameState.player1, powerIndex);
    }

    function endTurn() {
      // Update previous states
      gameState.prevPlayer1State = { ...gameState.player1 };
      gameState.prevPlayer2State = { ...gameState.player2 };
    
      gameState.turnPlayer = gameState.turnPlayer === 'player1' ? 'player2' : 'player1';
      gameState.currentTurn++;
    
      if (gameState.turnPlayer === 'player1') {
        gameState.roundNumber++;
      }
    
      replenishMana();
      updateUI();
      saveGameState();
    
      if (gameState.turnPlayer === 'player2' && isComputerOpponent) {
        setTimeout(computerTurn, 1500);
      }
    }

    function replenishMana() {
      gameState.player1.mana = Math.min(10, gameState.player1.mana + 1);
      gameState.player2.mana = Math.min(10, gameState.player2.mana + 1);
    }

    function createEndGameButton(scene, width, height, scaleRatio) {
      const button = scene.add.text(
        width * 0.95,
        height * 0.05,
        'End Game',
        {
          fontSize: `${24 * scaleRatio}px`,
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 3 * scaleRatio,
          backgroundColor: '#ff0000',
          padding: { x: 8 * scaleRatio, y: 4 * scaleRatio }
        }
      ).setOrigin(1, 0).setInteractive({ useHandCursor: true });

      button.on('pointerdown', handleEndGame);
      return button;
    }

    function handleEndGame() {
      // Determine the winner based on remaining health
      const winner = gameState.player1.health > gameState.player2.health ? player1.address : player2.address;
      // Call the onBattleEnd function with the determined winner
      onBattleEnd(battleId, winner, 50);
      
      // Destroy the game
      game.destroy(true);
    }

    function updateUI() {
      updatePlayerCard(player1Card, gameState.player1, gameState.prevPlayer1State);
      updatePlayerCard(player2Card, gameState.player2, gameState.prevPlayer2State);
      updateTurnText();
      updateActionButtons();
      updateActionLog();
    
      // After updating, set current state as previous state for next update
      gameState.prevPlayer1State = { ...gameState.player1 };
      gameState.prevPlayer2State = { ...gameState.player2 };
    }

    function updatePlayerCard(card, player, prevState) {
      const healthDiff = player.health - prevState.health;
      const manaDiff = player.mana - prevState.mana;
      const shieldDiff = player.shield - prevState.shield;
    
      card.healthText.setText(`HP: ${player.health}`);
      card.manaText.setText(`MP: ${player.mana}`);
      card.shieldText.setText(`Shield: ${player.shield}`);
    
      if (healthDiff !== 0) {
        card.healthChange.setText(healthDiff > 0 ? `+${healthDiff}` : healthDiff);
        card.healthChange.setFill(healthDiff > 0 ? '#00ff00' : '#ff0000');
        fadeOutText(card.scene, card.healthChange);
      }
    
      if (manaDiff !== 0) {
        card.manaChange.setText(manaDiff > 0 ? `+${manaDiff}` : manaDiff);
        card.manaChange.setFill(manaDiff > 0 ? '#00ff00' : '#ff0000');
        fadeOutText(card.scene, card.manaChange);
      }
    
      if (shieldDiff !== 0) {
        card.shieldChange.setText(shieldDiff > 0 ? `+${shieldDiff}` : shieldDiff);
        card.shieldChange.setFill(shieldDiff > 0 ? '#00ff00' : '#ff0000');
        fadeOutText(card.scene, card.shieldChange);
      }
    }
    
    function fadeOutText(scene, text) {
      scene.tweens.add({
        targets: text,
        alpha: 0,
        duration: 3000,
        ease: 'Power2',
        onComplete: () => {
          text.setText('');
          text.alpha = 1;
        }
      });
    }

    function updateTurnText() {
      turnText.setText(`${gameState[gameState.turnPlayer].name}'s Turn`);
    }

    function updateActionButtons() {
      const currentPlayer = gameState[gameState.turnPlayer];
      const playerClass = currentPlayer.class || classes.BARBARIAN;
      actionButtons.forEach((button, index) => {
        const power = playerClass.powers[index];
        button.setText(`${power.name} (${power.manaCost} MP)`);
        button.setColor(currentPlayer.mana >= power.manaCost && currentPlayer.cooldowns[index] === 0 ? '#fff' : '#888');
      });
    }

    function updateActionLog() {
      const formattedLog = gameState.actionLog.join('\n\n');
      actionLogText.setText(formattedLog);
      actionLogText.setLineSpacing(1);

      // Add a visual effect to the log
      actionLogText.setAlpha(0.5);
      actionLogText.scene.tweens.add({
        targets: actionLogText,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
      });
    }

    function saveGameState() {
      localStorage.setItem(`battleGame_${battleId}`, JSON.stringify(gameState));
    }

    function loadGameState() {
      const savedState = localStorage.getItem(`battleGame_${battleId}`);
      return savedState ? JSON.parse(savedState) : null;
    }

    function playAnimation(animKey, targetCard) {

      if (animKey === 'defend_effect') {
        const sprite = animationLayer.scene.add.image(targetCard.x, targetCard.y, 'defend_effect')
          .setOrigin(0.5, 0.5)
          .setScale(6)
          .setBlendMode(Phaser.BlendModes.SCREEN);
        
          animationLayer.scene.tweens.add({
          targets: sprite,
          alpha: { from: 1, to: 0 },
          scale: { from: 1, to: 6 },
          duration: 3000,
          onComplete: () => {
            sprite.destroy();
          }
        });
      } else {
      const sprite = animationLayer.scene.add.sprite(targetCard.x, targetCard.y, animKey.split('_')[0] + '_effect')
        .setOrigin(0.5, 0.7)
        .setScale(2)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      animationLayer.add(sprite);
    
      
      sprite.play(animKey);
      
      sprite.on('animationcomplete', () => {
        sprite.destroy();
      });
    }
    }

    return () => {
      game.destroy(true);
    };
  }, [battleId, player1, player2, isComputerOpponent, onBattleEnd]);

  return <div ref={gameRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default BattleGame;