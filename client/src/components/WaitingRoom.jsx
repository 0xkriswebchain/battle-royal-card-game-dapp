import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, VStack, Heading, Text, Button, useToast } from '@chakra-ui/react';
import {useWallet} from '../components/ConnectWallet';

const WaitingRoom = () => {
  const { battleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [battle, setBattle] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const { account } = useWallet();

  useEffect(() => {
    const checkBattleStatus = () => {
      const battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
      if (battleData) {
        setBattle(battleData);
        setIsCreator(battleData.player1.toLowerCase() === account.toLowerCase());
        
        if (battleData.player2) {
          navigate(`/battle/${battleId}`);
        }
      } else {
        toast({
          title: "Error",
          description: "Battle not found",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    checkBattleStatus();
    const interval = setInterval(checkBattleStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [battleId, account, navigate, toast]);

  const joinBattle = () => {
    const battleData = JSON.parse(localStorage.getItem(`battle_${battleId}`));
    if (battleData && !battleData.player2) {
      battleData.player2 = account;
      localStorage.setItem(`battle_${battleId}`, JSON.stringify(battleData));
      toast({
        title: "Success",
        description: "You've joined the battle!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to join battle",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!battle) return <Text>Loading...</Text>;

  return (
    <VStack spacing={4} align="stretch">
      <Heading>Waiting Room</Heading>
      <Text>{`Battle ID: ${battleId}`}</Text>
      <Box borderWidth={1} borderRadius="lg" p={4}>
        <Text>{`Creator: ${battle.player1}`}</Text>
        <Text>{`Opponent: ${battle.player2 || 'Waiting for opponent...'}`}</Text>
      </Box>
      {!isCreator && !battle.player2 && (
        <Button colorScheme="blue" onClick={joinBattle}>Join Battle</Button>
      )}
    </VStack>
  );
};

export default WaitingRoom;