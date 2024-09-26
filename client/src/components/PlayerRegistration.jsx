import React, { useState, useEffect, useCallback } from 'react';
import {useWallet} from '../components/ConnectWallet';
import { Box, Button, Input, VStack, Text, Heading, useToast } from '@chakra-ui/react';
import NFT from '../artifacts/CoreNFT.json';
import { ethers } from 'ethers'
import CardBattleGame from '../artifacts/CardBattleGame.json';
import { useNavigate } from 'react-router-dom';

const gameContractAddress = process.env.VITE_GAME_CONTRACT;
const nftContractAddress = process.env.VITE_NFT_CONTRACT;

const getFromLocalStorage = (LOCAL_STORAGE_KEY) => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

function PlayerRegistration() {
  const [playerName, setPlayerName] = useState('');
  const [hasNFT, setHasNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const { signer, account } = useWallet();
  const navigate = useNavigate();
  const toast = useToast();

  const isWalletConnected = getFromLocalStorage('walletConnected');
  const gameContract = new ethers.Contract(gameContractAddress, CardBattleGame.abi, signer);
  const nftContract = new ethers.Contract(nftContractAddress, NFT, signer);

  const checkPlayerStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const isPlayer = await gameContract.isPlayer(account);
      setIsRegistered(isPlayer);

      if (isPlayer) {
        navigate('/home');
      } else {
        const balance = await nftContract.balanceOf(account);
        setHasNFT(balance > 0);
      }
    } catch (error) {
      console.error("Error checking player status:", error);
      toast({
        title: "Error",
        description: "Failed to check player status. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [account, gameContract, nftContract, navigate, toast]);

  useEffect(() => {
    if (isWalletConnected && account) {
      checkPlayerStatus();
    }
  }, [isWalletConnected, account]);

  const registerPlayer = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a player name.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      const tx = await gameContract.registerPlayer(playerName);
      await tx.wait();
      toast({
        title: "Success",
        description: "Player registered successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/home');
      setIsLoading(false);
    } catch (error) {
      console.error("Error registering player:", error);
      toast({
        title: "Error",
        description: "Failed to register player. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Box textAlign="center" mt={10}>
      <Heading size="xl" color="yellow.300" textAlign="center">Loading...</Heading>
    </Box>;
  }

  if (isRegistered) {
    return null; // This will be handled by the useEffect that navigates to /home
  }

  return (
    <Box 
      width="100%" 
      height="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
    >
      <VStack 
        spacing={6} 
        align="stretch" 
        width="100%" 
        maxWidth="400px" 
        bg="rgba(0,0,0,1)" 
        p={8} 
        borderRadius="lg" 
        boxShadow="xl"
      >
        <Heading size="xl" color="yellow.300" textAlign="center">Register</Heading>
        
        {hasNFT ? (
          <>
            <Input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Enter player name" 
              bg="gray.600"
              color="white"
            />
            
            <Button 
              onClick={registerPlayer} 
              colorScheme="yellow" 
              size="lg"
              loadingText="Registering..."
              isLoading={isLoading}
            >
              Register
            </Button>
          </>
        ) : (
          <Text color="red.300" textAlign="center">
            You need to own at least one NFT to register as a player. 
            Please mint an NFT and try again.
          </Text>
        )}
      </VStack>
    </Box>
  );
}

export default PlayerRegistration;