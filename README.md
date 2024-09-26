# CardGame

1v1 Card Game on Core Blockchain using Core

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

This project is a 1v1 card game built on the Core Blockchain. It leverages the unique features of the Core platform to provide a decentralized and secure gaming experience. The game is an extension of NFT collection and 10k NFT generator repositories.

## Features

- Decentralized gameplay
- Secure transactions using Core Blockchain
- Unique card collection and trading
- Real-time multiplayer battles

## Installation

To install and run this project locally, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/0xkriswebchain/battle-royal-card-game-dapp.git
   ```
2. Navigate to the project directory:
   ```sh
   cd battle-royal-card-dapp
   ```
3. Install dependencies:
   ```sh
   npm install
   ```

## Usage

To start the development server, run:

```sh
npm start
```

To install dependencies, run:

```sh
npm install
```

To deploy the contract CardGameBattle.sol, run:

```sh
npx hardhat ignition deploy ./ignition/modules/deploy.js --network core_testnet
```

To run frontend part, navigate to client and run:

```sh
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to see the application in action.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
