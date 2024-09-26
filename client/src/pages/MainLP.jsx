import React from 'react';
import { VStack, Heading, Text, Button, Flex, Box, Container, Image } from '@chakra-ui/react';
import PlayerRegistration from '../components/PlayerRegistration';
import {useWallet} from '../components/ConnectWallet';

function MainLP() {
    const {connectWallet, disconnectWallet, account, signer, switchNetwork, isConnected} = useWallet();


    const handleConnect = () => {
        switchNetwork();
        connectWallet();
    }

    return (
        <Box 
            bgImage="url('/assets/background.jpg')"
            bgPosition="center"
            bgRepeat="no-repeat"
            bgSize="cover"
            height="100vh"
            width="100vw"
            overflow="hidden"
        >
            <Flex 
                direction="column" 
                height="100%"
            >
                <Flex 
                    as="header" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    p={4} 
                    bg="rgba(0,0,0,0.7)"
                    boxShadow="0 2px 10px rgba(0,0,0,0.5)"
                >
                    <Flex alignItems="center">
                        <Heading size="lg" color="yellow.300">Block Quest</Heading>
                    </Flex>
                    <Box>
                        {signer ? (
                            <Flex alignItems="center">
                                <Text mr={4} fontWeight="bold" color="white">Connected: {account.slice(0, 6)}...{account.slice(-4)}</Text>
                                <Button onClick={disconnectWallet} colorScheme="red" size="sm">Disconnect</Button>
                            </Flex>
                        ) : (
                            <Button onClick={handleConnect} colorScheme="blue" size="sm">Connect Wallet</Button>
                        )}
                    </Box>
                </Flex>

                <Flex flex={1} alignItems="center" justifyContent="center" overflow="auto">
                    <Container maxW="container.xl">
                        <VStack spacing={8} align="stretch" w="full" maxW="600px" mx="auto">
                            {!signer ? (
                                <Box 
                                    textAlign="center" 
                                    bg="rgba(0,0,0,0.7)" 
                                    p={8} 
                                    borderRadius="lg" 
                                    boxShadow="xl"
                                >
                                    <Heading size="2xl" mb={6} color="yellow.300">Welcome to Block Quest</Heading>
                                    <Text fontSize="xl" mb={6} color="white">
                                        Embark on an epic blockchain adventure. Connect your wallet to begin your journey.
                                    </Text>
                                    <Button onClick={handleConnect} colorScheme="blue" size="lg">
                                        Start Your Adventure
                                    </Button>
                                </Box>
                            ) : (
                                <PlayerRegistration />
                            )}
                        </VStack>
                    </Container>
                </Flex>
            </Flex>
        </Box>
    );
}

export default MainLP;