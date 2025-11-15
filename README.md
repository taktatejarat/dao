RayanChain DAO-VC Platform

![alt text](https://raw.githubusercontent.com/Erfan-s-s/DAO-VC/main/public/logo-light.svg)

RayanChain DAO-VC is a decentralized, AI-enhanced venture capital platform designed to revolutionize the funding landscape for startups. By leveraging a hybrid AIPoX consensus mechanism on a blockchain architecture, the platform ensures transparent, secure, and democratic investment decisions.

This document provides a comprehensive guide for setting up the development and production environment from a clean server instance.
🚀 Getting Started: Full Server Setup Guide

This guide details the step-by-step process to deploy the entire RayanChain platform, including the Node.js backend, React frontend, AI Oracle, and MongoDB database on a fresh Ubuntu server.
Table of Contents

    Prerequisites

    Clone Project Repository

    Install & Configure MongoDB

    Setup AI Oracle (Python)

    Setup Node.js Environment

    Deploy Smart Contracts

    Run the Application

Step 1: Prerequisites and System Update

First, connect to your server via SSH and ensure the system is up-to-date.
code Bash

    
# Connect to your server
ssh your_username@your_server_ip

# Update and upgrade system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl build-essential

  

✨ Result: Your server is now updated and has the basic tools required for setup.
Step 2: Clone Project Repository

Clone the project from its GitHub repository into a directory named dao.
code Bash

    
# Navigate to your home directory
cd ~

# Clone the repository
git clone YOUR_GITHUB_REPOSITORY_URL dao

# Enter the project directory
cd dao

  

✨ Result: You now have the complete project source code in the ~/dao directory.
Step 3: Install & Configure MongoDB

We will install MongoDB and create a secure database with a dedicated user.

    Install MongoDB Server:
    (This example uses pre-downloaded .deb packages. Adjust if using a repository.)
    code Bash

    
# (Assuming .deb files are in the current directory)
sudo dpkg -i mongodb-org-server_x.x.x_amd64.deb
sudo dpkg -i mongodb-mongosh_x.x.x_amd64.deb

# Start and enable the MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

  

Create Database and User:
Connect to the MongoDB shell to create the application database and user.
code Bash

    
mongosh

  

Inside the shell, run the following commands:
code JavaScript

    
// Switch to your database (it will be created if it doesn't exist)
use dao-vc;

// Create the application user with read/write privileges
db.createUser({
  user: "daovc_admin",
  pwd: "YOUR_SECURE_PASSWORD", // Replace with your password
  roles: [
    { role: "readWrite", db: "dao-vc" }
  ]
});

// Exit the shell
exit;

  

Enable Authentication:
For security, enforce authentication in the MongoDB configuration file.
code Bash

    
sudo nano /etc/mongod.conf

  

Uncomment the security section and enable authorization:
code Yaml

    
security:
  authorization: "enabled"

  

Save the file (Ctrl+X, Y, Enter) and restart the MongoDB service.
code Bash

        
    sudo systemctl restart mongod

      

✨ Result: A secure MongoDB instance is now running, accessible only via the specified user and password.
Step 4: Setup AI Oracle (Python)

The AI Oracle is a critical component that runs as a separate Python service.

    Install Python and Virtual Environment:
    code Bash

    
sudo apt install -y python3 python3.12-venv

  

Run the AI Oracle Startup Script:
The project includes a script to automate the setup of the Python environment and start the AI service.
code Bash

        
    # Make sure you are in the project's root directory (`~/dao`)
    bash ./scripts/start_ai_oracle.sh

      

✨ Result: The AI Oracle is now running, ready to provide risk analysis and participation scores.
Step 5: Setup Node.js Environment

We'll use NVM (Node Version Manager) for flexibility.

    Install NVM and Node.js:
    code Bash

    
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Source NVM script (or restart your terminal)
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"

# Install the latest LTS version of Node.js
nvm install --lts

  

Configure Environment Variables:
Create a .env file from the example template and fill in the necessary values.
code Bash

    
# Make sure you are in the project's root directory (`~/dao`)
cp .env.example .env
nano .env
```    Ensure the following variables are set correctly:
```env
# Example .env configuration
MONGODB_URI=mongodb://daovc_admin:YOUR_SECURE_PASSWORD@127.0.0.1:27017/dao-vc
PRIVATE_KEY=YOUR_ETHEREUM_WALLET_PRIVATE_KEY
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY
PINATA_API_KEY=YOUR_PINATA_KEY
PINATA_SECRET_API_KEY=YOUR_PINATA_SECRET
# ... and other required variables

  

Install NPM Packages:
code Bash

        
    npm install

      

✨ Result: The Node.js environment is configured, and all project dependencies are installed.
Step 6: Deploy Smart Contracts

With the environment ready, compile and deploy the smart contracts to the blockchain.

    Compile Contracts:
    code Bash

    
npx hardhat compile

  

Run Deployment Script:
Deploy to your target network (e.g., amoy). Ensure your wallet has enough funds for gas fees.
code Bash

        
    npx hardhat run scripts/deploy.ts --network amoy

      

    Important: Save the deployment summary output, which contains the addresses of your new contracts. Update your .env or application config with these new addresses.

✨ Result: All smart contracts are live on the blockchain, and your backend is configured to interact with them.
Step 7: Run the Application

Finally, build and start the application server.
code Bash

    
# Build the Next.js application for production
npm run build

# Start the application server
npm start

  

Your RayanChain DAO-VC platform should now be accessible at http://your_server_ip:3000.

Congratulations! 🎉 Your decentralized venture capital platform is fully deployed and operational.