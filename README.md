# MPlace

A project inspired by Reddit's r/place, but with Minecraft map style.

**🌐 Live Demo**: [https://mplace.youneedto.work/](https://mplace.youneedto.work/) or [https://mplace.pikacnu.com/](https://mplace.pikacnu.com/)

> **Note**: This repository contains only the frontend code. The backend implementation is not open source.

## ✨ Features

- **🎮 Minecraft Style** - Uses Minecraft map display style and Minecraft blocks to create a canvas where players can draw
- **🎨 Paint Tools** - Simple paint tools to help users draw large images easily
- **🤖 Image Bots** - Use images or .nbt files to make bots automatically place blocks while you're offline
  - **Important**: Blocks are always placed on top of the block tower; you cannot place blocks above air

## 🏗️ Architecture

### 🎨 Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS v4
- **Realtime**: WebSocket
- **Image processing**: Web Workers

### ⚡ Core Features

- **📡 Real-time Pixel Updates** - WebSocket message broadcasting
- **🏗️ Block Height System** - 3D block stacking logic
- **🎨 Color Mapping** - Minecraft block color mapping
- **🖼️ Image-to-Blocks** - Automatically convert images into block compositions
- **💾 Caching System** - Intelligent chunk caching and updates

## 🚀 Quick Start

> **Important**: This repository only contains the frontend code. To run the complete application, you'll need your own backend implementation or access to the hosted service.

### 📋 Prerequisites
- Bun 1.0+
- A compatible backend server (not included in this repository)

### 🛠️ Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pikacnu/mplace.git
   cd mplace
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure backend connection**
   Update the frontend configuration to point to your backend server endpoint.

4. **Start the frontend development server**
   ```bash
   bun run dev
   ```

The frontend will be available at `http://localhost:3000`

## 🎮 How to Use

1. **🔐 Register/Sign in** - Use Discord or another supported OAuth provider
2. **🧱 Select a block** - Choose the texture you want from the block list
3. **🛠️ Choose a tool** - Brush, line, circle, rectangle, etc.
4. **🎨 Start drawing** - Click on the canvas to place blocks
5. **👥 Real-time collaboration** - Create together with other players

### 🎨 Drawing Tools
- **🖌️ Brush** - Place a single block
- **📏 Line** - Draw a straight line between two points
- **⭕ Circle** - Draw a circle or ellipse
- **⬜ Rectangle** - Draw a rectangle outline or fill it

### 🧱 Block System
- Each player has a limited block count
- Blocks are automatically replenished over time
- Blocks have 3D height and stack on top of existing blocks

## 🤝 Contributing

We welcome contributions to the frontend! Please feel free to submit a Pull Request.

> **Note**: This repository only contains the frontend code. Backend-related contributions cannot be accepted as the backend is not open source.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgements

- Inspired by Reddit r/place  
- Minecraft for the block texture concept

## 🐛 Bug Reports

If you find any issues, please report them on the project's Issues page: https://github.com/Pikacnu/mplace/issues

## 📞 Contact

- Author: [Pikacnu]  
- Email: pika@mail.pikacnu.com  
- Discord ID: pikacnu  
- Project: https://github.com/Pikacnu/mplace
