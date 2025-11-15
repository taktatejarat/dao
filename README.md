<p align="center">
  <img src="https://raw.githubusercontent.com/Erfan-s-s/DAO-VC/main/public/logo-light.svg" alt="RayanChain DAO Logo" width="400"/>
</p>

<h1 align="center">RayanChain DAO-VC Platform</h1>

<p align="center">
  <strong>A Decentralized, AI-Enhanced Venture Capital Platform</strong>
  <br />
  RayanChain DAO-VC is a next-generation platform designed to revolutionize the funding landscape for startups. By leveraging a hybrid <strong>AIPoX</strong> consensus mechanism on a secure blockchain architecture, the platform ensures transparent, efficient, and democratic investment decisions.
</p>

---

## 🚀 Full Server Setup Guide

This document provides a comprehensive guide for setting up the development and production environment from a clean server instance. Follow these steps to deploy the entire platform, including the application, AI Oracle, and database.

### **📋 Table of Contents**

1.  [**Step 1: 💻 System Preparation**](#-step-1--system-preparation)
2.  [**Step 2: 📂 Project Cloning**](#-step-2--project-cloning)
3.  [**Step 3: 🗄️ MongoDB Installation & Configuration**](#-step-3--mongodb-installation--configuration)
4.  [**Step 4: 🤖 AI Oracle Setup**](#-step-4--ai-oracle-setup)
5.  [**Step 5: 🌐 Node.js Environment Setup**](#-step-5--nodejs-environment-setup)
6.  [**Step 6: 📜 Smart Contract Deployment**](#-step-6--smart-contract-deployment)
7.  [**Step 7: ▶️ Running the Application**](#-step-7--running-the-application)

---

### **Step 1: 💻 System Preparation**

First, connect to your server and ensure the system is up-to-date.

```bash
# Connect to your server via SSH
ssh your_username@your_server_ip

# Update and upgrade system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools for the setup
sudo apt install -y git curl build-essential
```
> **✨ Result:** Your server is now updated and has the basic tools required for the next steps.

---

### **Step 2: 📂 Project Cloning**

Clone the project from its GitHub repository into a directory named `dao`.

```bash
# Navigate to your home directory
cd ~

# Clone the repository (replace with your actual repository URL)
git clone YOUR_GITHUB_REPOSITORY_URL dao

# Enter the newly created project directory
cd dao
```
> **✨ Result:** You now have the complete project source code locally in the `~/dao` directory.

---

### **Step 3: 🗄️ MongoDB Installation & Configuration**

Follow these steps to install and secure the MongoDB database.

#### **3.1 Install MongoDB Server**
*(This example uses pre-downloaded `.deb` packages. Adjust if using an official repository.)*

```bash
# (Assuming .deb files are in your home directory)
# Install MongoDB Server and the MongoDB Shell
sudo dpkg -i /home/errick/mongodb-org-server_*.deb
sudo dpkg -i /home/errick/mongodb-mongosh_*.deb

# If you encounter dependency issues, run:
sudo apt-get -f install

# Start and enable the MongoDB service to run on boot
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### **3.2 Create Database and Secure User**
Connect to the MongoDB shell to create the application database and a dedicated user.

```bash
mongosh
```

Inside the shell, run the following commands:

```javascript
// Switch to your application's database
use dao-vc;

// Create the admin user with read/write privileges
db.createUser({
  user: "daovc_admin",
  pwd: "YOUR_SECURE_PASSWORD", // IMPORTANT: Replace with a strong password
  roles: [ { role: "readWrite", db: "dao-vc" } ]
});

// Exit the shell
exit;
```

#### **3.3 Enable Authentication**
For security, enforce authentication in the MongoDB configuration file.

```bash
sudo nano /etc/mongod.conf
```

Find and uncomment the `#security:` section, then enable authorization like so:

```yaml
security:
  authorization: "enabled"
```
Save the file (`Ctrl+X`, `Y`, `Enter`) and restart the MongoDB service to apply the changes.

```bash
sudo systemctl restart mongod
```
> **✨ Result:** A secure MongoDB instance is now running, accessible only with the credentials you created.

---

### **Step 4: 🤖 AI Oracle Setup**

The AI Oracle is a critical component that runs as a separate Python service.

1.  **Install Python and Virtual Environment tool:**
    ```bash
    sudo apt install -y python3 python3.12-venv
    ```

2.  **Run the AI Oracle Startup Script:**
    The project includes a script to automate the setup of the Python environment and start the AI service.
    ```bash
    # Make sure you are in the project's root directory (`~/dao`)
    bash ./scripts/start_ai_oracle.sh
    ```
> **✨ Result:** The AI Oracle is now running in the background, ready to provide on-demand analysis.

---

### **Step 5: 🌐 Node.js Environment Setup**

We'll use NVM (Node Version Manager) for flexibility and to manage Node.js versions.

1.  **Install NVM and Node.js:**
    ```bash
    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Reload your shell configuration to apply NVM
    source ~/.bashrc

    # Install the latest Long-Term Support (LTS) version of Node.js
    nvm install --lts
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file from the example template and fill in the necessary values.
    ```bash
    # Make sure you are in the project's root directory (`~/dao`)
    cp .env.example .env
    nano .env
    ```
    Ensure your `MONGODB_URI` and other keys are set correctly:
    ```env
    MONGODB_URI=mongodb://daovc_admin:YOUR_SECURE_PASSWORD@127.0.0.1:27017/dao-vc
    PRIVATE_KEY=...
    POLYGONSCAN_API_KEY=...
    ```

3.  **Install Project Dependencies:**
    ```bash
    npm install
    ```
> **✨ Result:** The Node.js environment is configured, and all project dependencies are installed.

---

### **Step 6: 📜 Smart Contract Deployment**

Compile and deploy the smart contracts to your target blockchain network.

1.  **Compile Contracts:**
    ```bash
    npx hardhat compile
    ```

2.  **Run Deployment Script:**
    Deploy to your chosen network (e.g., `amoy`). Ensure your deployer wallet has enough funds for gas fees.
    ```bash
    npx hardhat run scripts/deploy.ts --network amoy
    ```
    **🚨 Important:** Save the deployment summary output, which contains the addresses of your new contracts. You will need to update your application's configuration with these addresses.

> **✨ Result:** All smart contracts are live on the blockchain.

---

### **Step 7: ▶️ Running the Application**

Finally, build and start the application server.

```bash
# Build the Next.js application for production
npm run build

# Start the application server (it's recommended to use a process manager like PM2)
npm start
```

Your RayanChain DAO-VC platform should now be accessible at `http://your_server_ip:3000`.

### 🎉 **Congratulations!** 🎉 
Your decentralized venture capital platform is fully deployed and operational.