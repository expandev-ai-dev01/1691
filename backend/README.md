# WeatherNow Backend API

Backend API for WeatherNow - Weather information service application.

## Description

App que consulta uma API de clima e exibe temperatura, umidade e previsão do dia.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Architecture**: REST API

## Project Structure

```
src/
├── api/                    # API controllers
│   └── v1/                 # API Version 1
│       ├── external/       # Public endpoints
│       └── internal/       # Authenticated endpoints
├── routes/                 # Route definitions
│   └── v1/                 # Version 1 routes
├── middleware/             # Express middleware
├── services/               # Business logic services
├── utils/                  # Utility functions
├── constants/              # Application constants
├── instances/              # Service instances
├── config/                 # Configuration management
├── tests/                  # Global test utilities
└── server.ts               # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`

### Development

Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

### Production

Start production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - API health status

### API Version 1
- Base URL: `/api/v1`
- External (public) routes: `/api/v1/external/...`
- Internal (authenticated) routes: `/api/v1/internal/...`

## Environment Variables

See `.env.example` for all available configuration options.

## Features

- [ID: 1] Exibir Temperatura: O sistema deve apresentar a temperatura atual de forma clara e destacada na interface principal, permitindo que o usuário visualize rapidamente a condição térmica da localização consultada.

## Development Guidelines

- Follow TypeScript strict mode
- Use path aliases (@/) for imports
- Implement proper error handling
- Write comprehensive tests
- Document all public APIs

## License

ISC