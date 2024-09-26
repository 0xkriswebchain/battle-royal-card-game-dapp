import React, { useState, useEffect } from 'react';
import { VStack, Heading, Button, Box, Text, SimpleGrid, Input, InputGroup, InputRightElement, Flex, Image, Card, CardBody, Progress, IconButton, Container, useColorModeValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';
import CardBattleGame from '../artifacts/CardBattleGame.json';
import NFT from '../artifacts/CoreNFT.json';
import {useWallet} from '../components/ConnectWallet';
import { useNavigate } from 'react-router-dom';
import { useFetchCharacterStats } from '../components/CharacterStats';


function HomePage() {
    const [battles, setBattles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newBattleName, setNewBattleName] = useState('');
    const [playerNFTs, setPlayerNFTs] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [selectedNFT, setSelectedNFT] = useState(null);
    const [playerLevel, setPlayerLevel] = useState('');
    const [characterStats, setCharacterStats] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const {connectWallet, disconnectWallet, switchNetwork, account, signer} = useWallet();
    const navigate = useNavigate();
    const fetchCharacterStats = useFetchCharacterStats();

    const gameContractAddress = process.env.VITE_GAME_CONTRACT;
    const nftContractAddress = process.env.VITE_NFT_CONTRACT;

    const gameContract = new ethers.Contract(gameContractAddress, CardBattleGame.abi, signer);
    const nftContract = new ethers.Contract(nftContractAddress, NFT, signer);

    const bgColor = useColorModeValue('gray.800', 'gray.900');
    const cardBgColor = useColorModeValue('gray.700', 'gray.800');
    const textColor = useColorModeValue('white', 'gray.100');


    const saveToLocalStorage = (data, LOCAL_STORAGE_KEY) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    };
    
    const getFromLocalStorage = (LOCAL_STORAGE_KEY) => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    };

    const checkRegistration = async () => {
      const isPlayer = await gameContract.isPlayer(account);
      console.log('Fetching player', isPlayer);
      if (!isPlayer) {
        navigate('/');
      }
    }

    const handleConnect = async () => {
        await switchNetwork();
        connectWallet();
    }

    const tokenIDtoMetadata = async (tokenID) => {
      try {
        const data = await nftContract.tokenURI(tokenID);
        const response = await fetch(data);
        const metadata = await response.json();
        return metadata;
      } catch (error) {
        console.error("Error fetching token metadata:", error);
        return null;
      }
    };
    

    const NFTCard = ({ nft }) => (
      <Box 
          width="190px" 
          height="300px" 
          borderWidth={2} 
          borderRadius="lg" 
          overflow="hidden" 
          boxShadow="lg"
          bg="gray.800"
          color="white"
          position="relative"
      >
              <Image 
                  src={nft.image} 
                  alt={nft.name} 
                  position="absolute"
                  left="19"
                  top="0"
                  transform="translate(40%, 40%) scale(2.3)"
                  width="100%"
                  height="100%"
                  objectFit="auto"
              />
      </Box>
      
  );

  const NFTCarousel = ({ nfts, onSelect }) => {
      const nextSlide = () => {
          setCurrentSlide((prev) => (prev + 1) % nfts.length);
          onSelect(nfts[(currentSlide + 1) % nfts.length]);
      };

      const prevSlide = () => {
          setCurrentSlide((prev) => (prev - 1 + nfts.length) % nfts.length);
          onSelect(nfts[(currentSlide - 1 + nfts.length) % nfts.length]);
      };
        return (
          <Flex align="center" justify="center" width="100%">
              <IconButton 
                  icon={<ChevronLeftIcon />} 
                  onClick={prevSlide} 
                  aria-label="Previous NFT"
                  mr={4}
              />
              <Box width="220px" height="320px" position="relative">
                  {nfts.map((nft, index) => (
                      <Box
                          key={nft.tokenId}
                          position="absolute"
                          top={0}
                          left={0}
                          opacity={index === currentSlide ? 1 : 0}
                          transition="opacity 0.5s"
                      >
                          <NFTCard nft={nft} />
                      </Box>
                  ))}
              </Box>
              <IconButton 
                  icon={<ChevronRightIcon />} 
                  onClick={nextSlide} 
                  aria-label="Next NFT"
                  ml={4}
              />
          </Flex>
      );
  };
    
  
  useEffect(() => {
    const checkPlayerAndFetchData = async () => {
      if (account) {
        console.log("Account");
        try {
          await fetchPlayerData();
          await fetchBattles();
          await checkRegistration();
          
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
  
    checkPlayerAndFetchData();
  }, [account]);

  const CharacterStats = async () => {
  fetchCharacterStats(selectedNFT?.class).then(stats => {
    if (stats) {
      setCharacterStats(stats);
    }
  });
}

    useEffect(() => {
      if (selectedNFT) {
        CharacterStats();
      }
    }, [selectedNFT]);


    const fetchPlayerData = async () => {
        try {
            const player = await gameContract.players(account);
            setPlayerName(player[0]);
            setPlayerLevel(player[4]);
            await fetchPlayerNFTs();
        } catch (error) {
            console.error("Error fetching player data:", error);
        }
    };

    const fetchPlayerNFTs = async () => {
      const balance = await nftContract.balanceOf(account);
      const storedData = getFromLocalStorage('playerNFTs');

      //Check if the balance of the nft holding is same as the stored data
      if (storedData && storedData.balance === balance.toString() && storedData.account === account) {
        setPlayerNFTs(storedData.nfts);
        if (storedData.nfts.length > 0 && !selectedNFT) {
            setSelectedNFT(storedData.nfts[0]);
            CharacterStats();
          }
      } else {
        const nfts = [];
        for (let i = 0; i < balance; i++) {
          const tokenId = Number(await nftContract.tokenOfOwnerByIndex(account, i)) + 1;
          const metadata = await tokenIDtoMetadata(tokenId);
          if (metadata) {
            nfts.push({ tokenId: tokenId.toString(), name: metadata.name, class: metadata.attributes[1].value, image: metadata.image });
          }
        }
        setPlayerNFTs(nfts);
        if (nfts.length > 0 && !selectedNFT) {
            setSelectedNFT(nfts[0]);
            CharacterStats();
          }
        saveToLocalStorage({ nfts, balance: balance.toString(), account }, 'playerNFTs');
      }
    }

    const fetchBattles = async () => {
        setIsLoading(true);
        try {
            const battleCount = Number((await gameContract.totalBattle()).toString());
            const fetchedBattles = [];
            for (let i = 1; i <= battleCount; i++) {
                const battle = await gameContract.battles(i);
                fetchedBattles.push(battle);
            }
            setBattles(fetchedBattles);
        } catch (error) {
            console.error("Error fetching battles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const createBattle = async () => {
        if (!newBattleName.trim()) {
            alert("Please enter a battle name");
            return;
        }
        try {
            setIsLoading(true);
            const tx = await gameContract.registerBattle(newBattleName);
            await tx.wait();
            setNewBattleName(''); 
            fetchBattles();
            setIsLoading(false);
        } catch (error) {
            console.error("Error creating battle:", error);
            setIsLoading(false);
        }
    };

    const joinBattle = async (_battleID, _player1, _startTime, _player1TokenID) => {
      const player2stats = await fetchCharacterStats(playerNFTs[0].class)
      const battleData = {
        id: _battleID,
        player1: {name: playerName, address: _player1, tokenId: _player1TokenID, image: selectedNFT.image, class: selectedNFT.class, level: playerLevel.toString(), health: characterStats.baseHealth, mana: characterStats.baseMana },
        player2: {name: 'Computer', address: "0xEfC315AEbEe513b9E6963C997D18C4d79830D6d1", tokenId: playerNFTs[0].tokenId, image: playerNFTs[0].image, health: player2stats.baseHealth, mana: player2stats.baseMana, class: playerNFTs[0].class},
        startTime: _startTime,
        status: 'ready'
      };
      console.log(battleData)
      localStorage.setItem(`battle_${_battleID}`, JSON.stringify(battleData));
      navigate(`/battle/${_battleID}`);
    };

    return (
        <Box width="100vw" height="100vh" bgImage="url('/assets/background.jpg')" bgPosition="center" bgRepeat="no-repeat" bgSize="cover" color={textColor} overflowY="auto" overflowX="hidden" p={6}>
            <Flex justifyContent="space-between" alignItems="center" mb={6}>
                <Heading size="2xl" fontFamily="'Cinzel', serif" color="yellow.200">Block Quest</Heading>
                {signer ? (
                    <Flex alignItems="center">
                        <Text mr={4} fontWeight="bold">Connected: {account.slice(0, 6)}...{account.slice(-4)}</Text>
                        <Button onClick={disconnectWallet} colorScheme="red" size="lg">Disconnect</Button>
                    </Flex>
                ) : (
                    <Button onClick={handleConnect} colorScheme="blue" size="lg">Connect Wallet</Button>
                )}
            </Flex>

            {signer && (
                <VStack spacing={8} align="stretch">
                    <Heading size="xl" fontFamily="'Cinzel', serif" color="yellow.100">Welcome, {playerName}!</Heading>

                    <SimpleGrid columns={[1, null, 2]} spacing={8}>
                        <Box bg="rgba(0,0,0,0.7)" p={6} borderRadius="lg" boxShadow="dark-lg">
                            <Heading size="lg" mb={4} fontFamily="'Cinzel', serif" color="yellow.200">Your Champions</Heading>
                            <NFTCarousel nfts={playerNFTs} onSelect={setSelectedNFT} />
                        </Box>

                        <Box bg="rgba(0,0,0,0.7)" p={6} borderRadius="lg" boxShadow="dark-lg">
                            <Heading size="lg" mb={4} fontFamily="'Cinzel', serif" color="yellow.200">Champion Stats({selectedNFT?.class})</Heading>
                            {characterStats ? (
                                <>
                                    <StatBar label="HP" value={characterStats.baseHealth} max={120} color="green" />
                                    <StatBar label="MP" value={characterStats.baseMana} max={100} color="blue" />
                                    <StatBar label="ATK" value={characterStats.baseAttack} max={100} color="red" />
                                    <StatBar label="DEF" value={characterStats.baseDefense} max={100} color="yellow" />
                                </>
                            ) : (
                                <Text>No champion data available</Text>
                            )}
                        </Box>
                    </SimpleGrid>

                    <Box bg="rgba(0,0,0,0.7)" p={6} borderRadius="lg" boxShadow="dark-lg">
                        <Heading size="lg" mb={4} fontFamily="'Cinzel', serif" color="yellow.200">Battle Arena</Heading>
                        <InputGroup size="md" mb={4}>
                            <Input
                                pr="4.5rem"
                                type="text"
                                placeholder="Enter battle name"
                                value={newBattleName}
                                onChange={(e) => setNewBattleName(e.target.value)}
                                bg="gray.700"
                            />
                            <InputRightElement width="4.5rem">
                                <Button h="1.75rem" size="lg" p={5} onClick={createBattle} colorScheme="green" isLoading={isLoading}>
                                    Create
                                </Button>
                            </InputRightElement>
                        </InputGroup>
                        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                            {battles.map((battle, index) => (
                                <Box 
                                    key={index} 
                                    borderWidth={1} 
                                    borderRadius="lg" 
                                    p={4} 
                                    bg="gray.700"
                                    opacity={battle.resolved ? 0.6 : 1}
                                >
                                    <Text 
                                        fontWeight="bold" 
                                        mb={2}
                                        textDecoration={battle.resolved ? 'line-through' : 'none'}
                                    >
                                        {battle[0]}
                                    </Text>
                                    <Button 
                                        onClick={() => joinBattle(index+1, battle[1], battle[5].toString(), selectedNFT.tokenId)} 
                                        colorScheme="yellow" 
                                        width="100%"
                                        isDisabled={battle.resolved}
                                    >
                                        {battle.resolved ? 'Battle Ended' : 'Join Battle'}
                                    </Button>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </Box>
                </VStack>
            )}
        </Box>
    );
}

// Helper component for stat bars
const StatBar = ({ label, value, max, color }) => (
    <Flex alignItems="center" mb={2}>
        <Text width="40px" fontWeight="bold">{label}:</Text>
        <Progress value={value} max={max} size='sm' colorScheme={color} flex="1" mr={2} />
        <Text width="40px" textAlign="right">{value}</Text>
    </Flex>
);

export default HomePage;