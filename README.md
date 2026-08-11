# 💬 TikTalkk — Real-Time AI-Powered Chat Application

**TikTalkk** is a modern, full-stack real-time chat application built to provide fast, secure, and seamless communication. It supports one-to-one messaging with instant updates, user authentication, and a clean, responsive UI. Built with a modern tech stack, it also integrates Generative AI features for a smarter chatting experience.

🚀 **Live Demo:** [tiktalkk](https://tiktalkk.netlify.app)

---

## ✨ Main Features

### 🤖 AI-Powered Capabilities (Google Gemini)
- **Smart Replies:** Context-aware, AI-generated short replies are dynamically suggested when you receive a message, allowing for one-tap responses.
- **Chat Summarizer:** Instantly summarize long chat histories. Generates a concise 3-sentence summary of the last 30 messages in both individual and group chats.

### 👥 Advanced Group Management
- **Create & Manage Groups:** Seamlessly create group chats with your friends.
- **Admin Roles:** Group creators are automatically assigned the "Creator" role. Admins can promote other members, remove users, and manage the group.
- **Dynamic Group Photos:** Admins can effortlessly upload and update the group's profile photo in real-time.

### 💬 Real-Time Messaging Engine
- **Instant Delivery:** Powered by Socket.IO for zero-latency message broadcasting.
- **Edit & Delete Messages:** Sent a typo? Hover over any message you've sent to instantly edit the text inline or permanently delete it. Updates sync live for all participants.
- **Image Sharing:** Fully integrated with Cloudinary for fast and secure image uploads within chats.

### 🔐 Secure & Engaging User Experience
- **Friend System:** Send, accept, or reject friend requests to build your network securely.
- **Online/Offline Status & Last Seen:** Track the real-time presence of your friends.
- **JWT Authentication:** Robust and secure user authentication flow (Signup / Login).
- **Responsive UI:** A beautifully crafted, mobile-friendly interface built with Tailwind CSS and DaisyUI.

---

## 🛠 Tech Stack

### Frontend
- **React + TypeScript:** For a robust, type-safe, and scalable UI architecture.
- **Tailwind CSS & DaisyUI:** For rapid, customizable, and elegant styling.
- **Zustand:** Lightweight and fast global state management.
- **Socket.IO Client:** For listening and emitting real-time events.

### Backend
- **Node.js & Express.js:** Scalable server architecture.
- **MongoDB & Mongoose:** NoSQL database for flexible data modeling of users, messages, and groups.
- **Socket.IO:** Real-time bi-directional communication.
- **Google Generative AI SDK:** Integrates Gemini 2.5 Flash for smart replies and chat summarization.
- **Cloudinary:** Cloud-based image management and CDN.

---

## 🧠 How It Works Under the Hood

1. **Authentication:** Users securely authenticate via JWT tokens. Private routes protect sensitive data.
2. **Real-time Syncing:** Once authenticated, the server maps the user's ID to their active Socket session.
3. **Dedicated Rooms:** Group chats utilize Socket.IO rooms. Messages and edits are broadcast exclusively to connected members of that specific room.
4. **AI Processing:** AI requests are safely offloaded to the backend controllers, ensuring your API keys remain secure while delivering smart context-aware text generation.

---

## 👨‍💻 Author

**Tanmay Bansal**  
*3rd Year Student, IIIT Allahabad*  
🔗 [GitHub Profile](https://github.com/tanmaybansal012)
