# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, MongoDB, and Socket.IO.

## Features

- User authentication (register/login)
- Real-time messaging with Socket.IO
- Private and group chat rooms
- Typing indicators
- Chat history persistence
- Media sharing with Cloudinary storage
- Responsive UI with Tailwind CSS

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Socket.IO Client
- Axios

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- JWT Authentication
- Cloudinary for media storage

## Project Structure

```
ChatAPPS/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   └── roomController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Message.js
│   │   ├── Room.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── message.js
│   │   └── room.js
│   ├── utils/
│   │   └── fileUpload.js
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Chat.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── RoomList.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Cloudinary account for media storage
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. Start backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start frontend development server:
   ```bash
   npm run dev
   ```

### Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com/)

2. Get your credentials from the Cloudinary dashboard:
   - Cloud name
   - API Key
   - API Secret

3. Add these credentials to your `.env` file in the backend directory

## Usage

1. Make sure MongoDB is running on your local machine or update MONGODB_URI in .env file to point to your MongoDB Atlas cluster.

2. Make sure you have added your Cloudinary credentials to the .env file.

3. Start both the backend and frontend servers as described above.

4. Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal).

5. Register a new account or log in with existing credentials.

6. Create a new chat room or join an existing one.

7. Start chatting in real-time with support for text messages and file uploads!

## Future Enhancements

- User profiles with avatars
- Message reactions
- Voice/video calling
- Message search functionality
- Online status indicators
- Push notifications
- Message editing and deletion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit and push your changes
5. Create a pull request

## License

This project is licensed under the MIT License.
