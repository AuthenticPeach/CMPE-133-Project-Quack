# Quack Chat

Quack Chat is a real-time chat application that allows users to communicate through text messages, images, PDFs, and text files. It features user authentication, profile management, and supports both group and private messaging. The application is built with Node.js, Express, Socket.IO, and MongoDB, and utilizes Cloudinary for file storage.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application Locally](#running-the-application-locally)
- [Deployment](#deployment)
  - [Deploying to Railway](#deploying-to-railway)
  - [Setting Up MongoDB Atlas](#setting-up-mongodb-atlas)
  - [Configuring Cloudinary](#configuring-cloudinary)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- **Real-Time Messaging**: Instant messaging using Socket.IO.
- **File Sharing**: Send and receive images, PDFs, and text files.
- **User Authentication**: Sign up and sign in with secure password handling.
- **Profile Management**: Upload profile pictures and update personal information.
- **Group Chat**: Join chat rooms and communicate with multiple users.
- **Private Chat**: Engage in one-on-one conversations.
- **Offline Messaging**: Receive messages sent while offline upon reconnection.
- **Responsive Design**: User-friendly interface compatible with various devices.

## Demo

A live demo of Quack Chat is available at [https://your-app-url.railway.app](https://your-app-url.railway.app)

*(Replace `https://your-app-url.railway.app` with your actual deployed application URL.)*

## Prerequisites

- **Node.js** (version 14.x or higher)
- **MongoDB Atlas Account**
- **Cloudinary Account**
- **Git** (for version control)
- **Railway Account** (for deployment)

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

## Configuration

### Environment Variables

Create a `.env` file in the root directory of your project and add the following environment variables:

```env
# MongoDB Atlas Connection String
MONGODB_URI=your_mongodb_connection_string

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Session Secret (for session management, if applicable)
SESSION_SECRET=your_session_secret
```

**Note**: Replace the placeholder values with your actual credentials.

### `.gitignore` File

Ensure that your `.gitignore` file includes the following entries to prevent sensitive information and unnecessary files from being committed:

```
node_modules/
.env
uploads/
temp_uploads/
```

## Running the Application Locally

1. **Start the Server**

   ```bash
   npm start
   ```

2. **Access the Application**

   Open your web browser and navigate to `http://localhost:3000`.

## Deployment

### Deploying to Railway

1. **Create a Railway Account**

   Sign up at [Railway.app](https://railway.app/) and log in.

2. **Create a New Project**

   - Click on **"New Project"**.
   - Select **"Deploy from GitHub repo"**.
   - Connect your GitHub account and select your repository.

3. **Configure Environment Variables**

   In your project dashboard, navigate to **"Variables"** and add the following:

   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `SESSION_SECRET`

4. **Deploy the Application**

   Railway will automatically build and deploy your application. Monitor the logs for any errors.

### Setting Up MongoDB Atlas

1. **Create a MongoDB Atlas Account**

   Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).

2. **Create a Free Cluster**

   - Choose the shared cluster option.
   - Select a region close to your deployment server.

3. **Configure Network Access**

   - Whitelist all IP addresses or specific ones as needed.

4. **Get the Connection String**

   - Navigate to **"Connect"** and select **"Connect your application"**.
   - Copy the connection string and replace `<password>` with your database user's password.

5. **Update Environment Variables**

   - Set `MONGODB_URI` in your `.env` file or Railway variables.

### Configuring Cloudinary

1. **Create a Cloudinary Account**

   Sign up at [Cloudinary](https://cloudinary.com/users/register/free).

2. **Get API Credentials**

   - Navigate to **"Dashboard"** to find your `Cloud Name`, `API Key`, and `API Secret`.

3. **Update Environment Variables**

   - Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

## Usage

### Sign Up

1. **Navigate to the Sign-Up Page**

   - Visit `http://localhost:3000/signup` or your deployed URL.

2. **Create an Account**

   - Fill out the registration form with your details.

### Sign In

1. **Navigate to the Sign-In Page**

   - Visit `http://localhost:3000/signin` or your deployed URL.

2. **Log In**

   - Enter your username and password.

### Join a Chat Room

1. **Select or Create a Room**

   - Choose an existing room or create a new one.

2. **Start Chatting**

   - Send messages, images, PDFs, or text files.

### Profile Management

1. **Access Your Profile**

   - Click on the **"Profile"** link.

2. **Update Profile Picture**

   - Upload a new profile picture.

3. **Edit Bio**

   - Update your bio information.

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**

   Click the **"Fork"** button on the top right corner of the repository page.

2. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add your commit message"
   ```

4. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**

   Submit a pull request to the original repository.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
- **Socket.IO**: Enables real-time, bidirectional communication between web clients and servers.
- **MongoDB Atlas**: Cloud-hosted MongoDB service.
- **Cloudinary**: Cloud-based image and video management service.
- **Multer**: Node.js middleware for handling `multipart/form-data`.
- **Railway.app**: Cloud hosting platform used for deployment.
