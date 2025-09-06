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

### Paint Method

1. **Register/Sign in** - Use Discord or another supported OAuth provider
2. **Choose a tool** - None(default), line, circle, rectangle, etc.
3. **Select a block** - Choose the texture you want from the block list
4. **Start drawing** - Click on the canvas to place blocks (Details at info of the website on right top corner)
5. **Paint on Canvas** - Hit the Paint Button at Center

### Bot

1. **Uploading file** - Upload an image or nbt file
2. **Waiting processing** - Server will process your file you need to wait a second
3. **Set bot count** - Set Bot Count (Which means how many blocks will a bot place one time)
4. **Wait the canvas update** - Bot will place block after a while.

### Export Tool

1. **Select area** - use Paint Tools like rectangle to select area you want (The first Tool *None* will save pixels at your screen)
2. **Change Option(Image Only)** - you can make it combine pixels like minecraft done by slide the Combine Block bar
3. **Click button** - Click the Img / Nbt Button to get the result

### Drawing Tools Types
- **None** - Just place a single block
- **Line** - Draw a straight line between two points
- **Circle** - Draw a circle (with filled varient)
- **Rectangle** - Draw a rectangle outline or fill it

### Block System
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
