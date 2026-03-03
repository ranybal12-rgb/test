# Flashcards App

## Introduction
The Flashcards App is designed to help users learn and memorize information effectively through interactive flashcards.

## Features
- **Create Flashcards**: Users can create custom flashcards to suit their learning needs.
- **Review Flashcards**: The app offers a review mode to reinforce the memorization process.
- **Track Progress**: Users can track their progress and see which cards need more practice.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ranybal12-rgb/test.git
   ```
2. Navigate to the project directory:
   ```bash
   cd test
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Usage
1. To start the app, run:
   ```bash
   npm start
   ```
2. Follow the on-screen instructions to create and review flashcards.

## Contributing
If you wish to contribute to the development of this app:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`)  
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Thanks to the contributors and users of the Flashcards App.

## Dexscreener Bottom Scanner (Solana PumpSwap)
A helper script is included to scan Dexscreener for **Solana + PumpSwap** pairs that meet these filters:
- market cap >= 50k
- pair age >= 7 days
- "bottomed-out" behavior based on short-term price-change and activity heuristics

Run it with:
```bash
npm run scan:bottoms
```

Optional environment variables:
- `MIN_MARKET_CAP` (default: `50000`)
- `MIN_AGE_DAYS` (default: `7`)
- `PROFILE_LIMIT` (default: `120`)
- `MAX_TOKENS_TO_SCAN` (default: `80`)
- `MAX_RESULTS` (default: `20`)

Example:
```bash
MIN_MARKET_CAP=75000 MIN_AGE_DAYS=10 MAX_RESULTS=10 npm run scan:bottoms
```
