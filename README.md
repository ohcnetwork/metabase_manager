# Metabase Manager

Metabase Manager is a tool that helps you synchronize your Metabase instances. You can copy question cards from source instances to destination instances with ease.

![image](https://github.com/coronasafe/metabase_manager/assets/3626859/828941b6-967b-4187-be0e-f20be4d48291)

![License](https://img.shields.io/github/license/coronasafe/metabase_manager)
![GitHub issues](https://img.shields.io/github/issues/coronasafe/metabase_manager)
![GitHub pull requests](https://img.shields.io/github/issues-pr/coronasafe/metabase_manager)
![GitHub forks](https://img.shields.io/github/forks/coronasafe/metabase_manager)
![GitHub stars](https://img.shields.io/github/stars/coronasafe/metabase_manager)


## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

- Add and manage multiple source and destination instances
- Copy question cards between instances
- Synchronize instances with ease

## Preview

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+

## Installation

1. Clone the repository:

```bash
git clone https://github.com/coronasafe/metabase_manager.git
```

2. Change the current directory to the project root:

```bash
cd metabase_manager
```

3. Install dependencies:

```bash
npm install
```

## Usage

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000` to view the application.

3. Add source and destination instances as needed.

4. Copy question cards between instances.

## Scripts

- `dev`: Start the development server
- `prod`: Lint, build, and start the production server
- `build`: Build the application using Vite
- `server`: Start the server using ts-node
- `server:prod`: Start the production server using ts-node and cross-env
- `lint`: Lint the project with ESLint

## Contributing

1. Fork the project.
2. Create a new branch for your feature.
3. Make your changes and commit them.
4. Push your changes to your fork.
5. Create a pull request to the `main` branch.

## License

This project is licensed under the [MIT License](LICENSE).
