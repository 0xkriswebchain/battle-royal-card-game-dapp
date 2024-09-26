import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, VStack, Heading, Text, Button, Flex, Modal, ModalOverlay, ModalContent, ModalBody, Image, keyframes } from '@chakra-ui/react';
import { FaExpand, FaCompress } from 'react-icons/fa';
import BattleGame from './BattleGame';
import CardBattleGame from '../artifacts/CardBattleGame.json';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import {useWallet} from '../components/ConnectWallet';


const BattleArea = () => {
  const { battleId } = useParams();
  const [battleData, setBattleData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [winner, setWinner] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [expGained, setExpGained] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [isBattleEnded, setIsBattleEnded] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const gameContainerRef = useRef(null);
  const navigate = useNavigate();
  const {provider, account } = useWallet();

  const gameContractAddress = process.env.VITE_GAME_CONTRACT;
  const privateKey = process.env.VITE_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);
  const contract = new ethers.Contract(gameContractAddress, CardBattleGame.abi, signer);

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  `;

  const pulse = keyframes`
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  `;

  useEffect(() => {
    if (isModalOpen && expGained > 0) {
      let start = 0;
      const interval = setInterval(() => {
        start += Math.ceil(expGained / 20); // Adjust the divisor to control animation speed
        if (start >= expGained) {
          clearInterval(interval);
          setCurrentXP(expGained);
        } else {
          setCurrentXP(start);
        }
      }, 30);
    }
  }, [isModalOpen, expGained]);

  useEffect(() => {
    const battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
    if (battleData) {
      setBattleData(battleData);
    } else {
      console.error("No such battle!");
    }
  }, [battleId]);

  const handleBattleEnd = async (battleId, winnerAddress, expGained) => {
    if (winnerAddress === null) {
      // Battle was ended manually
      setIsBattleEnded(true);
      setIsModalOpen(true);
    } else {
      // Battle was won
    const winner = winnerAddress === battleData.player1.address ? battleData.player1 : battleData.player2;
    const opponent = winnerAddress === battleData.player1.address ? battleData.player2 : battleData.player1;
    console.log(winnerAddress);
    setWinner(winner);
    setOpponent(opponent);
    setExpGained(expGained);
    setIsModalOpen(true);
  
    try {
      // Prepare the data for signing
      setIsResolving(true);
      const domain = {
        name: "CardBattleGame",
        version: "1",
        chainId: 1115,
        verifyingContract: gameContractAddress
      };

      const types = {
        ResolveBattle: [
          { name: "battleId", type: "uint256" },
          { name: "_player2", type: "address" },
          { name: "isComputer", type: "bool" },
          { name: "_player1TokenId", type: "uint256" },
          { name: "_player2TokenId", type: "uint256" },
          { name: "_winner", type: "address" },
          { name: "_winnerExp", type: "uint256" },
          { name: "_loserExp", type: "uint256" }
        ]
      };

      const value = {
        battleId: battleId.toString(),
        _player2: opponent.address,
        isComputer: battleData.player2.address === '0xEfC315AEbEe513b9E6963C997D18C4d79830D6d1',
        _player1TokenId: battleData.player1.tokenId.toString(),
        _player2TokenId: battleData.player2.tokenId.toString(),
        _winner: winner.address,
        _winnerExp: expGained.toString(),
        _loserExp: "0",  
      };

      console.log("Value object:", value);

      const signature = await signer.signTypedData(domain, types, value);
      const { v, r, s } = ethers.Signature.from(signature);

      const tx = await contract.resolveBattle(
        battleId.toString(),
        opponent.address,
        battleData.player2.address === '0xEfC315AEbEe513b9E6963C997D18C4d79830D6d1',
        battleData.player1.tokenId.toString(),
        battleData.player2.tokenId.toString(),
        winner.address,
        expGained.toString(),
        "0",  
        v,
        r,
        s
      );
      await tx.wait();
      localStorage.removeItem(`battle_${battleId}`)
      localStorage.removeItem(`battleGame_${battleId}`)
      setIsResolving(false);
      console.log("Battle resolved successfully");
    } catch (error) {
      console.error("Error resolving battle:", error);
      setIsResolving(false);
    } 
  }
}


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }



  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!battleData) return <Text>Loading...</Text>;

  return (
    <Box 
      ref={gameContainerRef}
      position="relative" 
      width="100%" 
      height="100vh"
      overflow="hidden"
    >
      <BattleGame
        battleId={battleId}
        player1={battleData.player1}
        player2={battleData.player2}
        isComputerOpponent={true}
        onBattleEnd={handleBattleEnd}
      />
      <Button
        position="absolute"
        top="10px"
        right="10px"
        onClick={toggleFullscreen}
        zIndex="1"
      >
        {isFullscreen ? <FaCompress /> : <FaExpand />}
      </Button>
  
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="gray.800"
          color="white"
          borderRadius="xl"
          boxShadow="0 0 20px rgba(0,0,0,0.4)"
          p={6}
          maxW="400px"
          textAlign="center"
        >
          <ModalBody>
            <VStack spacing={6}>
              {isBattleEnded ? (
                <>
                  <Heading
                    fontSize="4xl"
                    fontWeight="extrabold"
                    color="yellow.400"
                    animation={`${fadeIn} 0.5s ease-out`}
                  >
                    Battle Ended
                  </Heading>
                  <Text fontSize="xl">
                    The battle has been ended manually. No winner declared.
                  </Text>
                </>
              ) : (
                <>
                  <Heading
                    fontSize="4xl"
                    fontWeight="extrabold"
                    color="yellow.400"
                    animation={`${fadeIn} 0.5s ease-out`}
                  >
                    Battle Victory!
                  </Heading>
                  <Box 
                    width="200px" 
                    height="200px" 
                    borderRadius="full"
                    overflow="hidden"
                    boxShadow="0 0 20px rgba(255,255,0,0.5)"
                    animation={`${pulse} 2s infinite`}
                  >
                    <Image 
                      src={winner?.image} 
                      alt={winner?.name} 
                      objectFit="auto"
                      width="100%"
                      height="100%"
                      transform="translate(51%, 50%) scale(2.6)"
                    />
                  </Box>
                  <Text fontSize="2xl" fontWeight="bold" color="green.300">
                    {winner?.name} Wins!
                  </Text>
                  <Box>
                    <Text fontSize="xl" mb={2}>Experience Gained:</Text>
                    <Text
                      fontSize="4xl"
                      fontWeight="bold"
                      color="cyan.300"
                      textShadow="0 0 5px cyan"
                    >
                      {currentXP} XP
                    </Text>
                  </Box>
                </>
              )}
              <Button
                colorScheme="yellow"
                size="lg"
                onClick={() => {setIsModalOpen(false); navigate('/home');}}
                _hover={{ bg: "yellow.500" }}
                transition="all 0.2s"
                loadingText="Resolving Battle..."
                isLoading={isResolving}
              >
                Continue
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default BattleArea;