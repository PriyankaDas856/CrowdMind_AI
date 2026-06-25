# Here are your Instructions
# 🧠 CrowdMind AI

> **An AI-powered collaborative brainstorming platform that helps individuals and teams generate, organize, and refine ideas using Google Gemini AI.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Overview

CrowdMind AI is an intelligent brainstorming platform that enables individuals and teams to generate, organize, and refine ideas with the assistance of Google's Gemini AI.

Whether you're a student, startup founder, developer, or researcher, CrowdMind AI helps transform raw thoughts into structured, actionable ideas through AI-powered collaboration.

---

## ✨ Features

- 🤖 AI-powered idea generation
- 💡 AI-assisted idea refinement
- 📝 Automatic brainstorming summaries
- 📂 Smart categorization of ideas
- 👥 Collaborative workspace
- 🔍 Search and filter previous ideas
- 📊 Interactive analytics dashboard
- 🔐 Secure authentication
- 📱 Responsive design

---

## 🏗️ System Architecture

```text
                +----------------------+
                |      React App       |
                +----------+-----------+
                           |
                           |
                    REST API Calls
                           |
                +----------▼-----------+
                |   Express Backend    |
                +----------+-----------+
                           |
             +-------------+-------------+
             |                           |
      Google Gemini API             MongoDB
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| AI | Google Gemini API |
| Styling | Tailwind CSS |
| Authentication | JWT |
| Version Control | Git & GitHub |

---

## 📂 Project Structure

```text
CrowdMind_AI/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
├── tests/
├── README.md
└── .gitignore
```

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/PriyankaDas856/CrowdMind_AI.git
cd CrowdMind_AI
```

### Install Frontend

```bash
cd frontend
npm install
npm run dev
```

### Install Backend

```bash
cd backend
npm install
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root.

```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
MONGODB_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_JWT_SECRET
```

---

## 📸 Screenshots

> Add screenshots after completing the project.

| Home Page | Dashboard |
|-----------|-----------|
| ![](screenshots/home.png) | ![](screenshots/dashboard.png) |

| AI Workspace | Collaboration |
|---------------|---------------|
| ![](screenshots/workspace.png) | ![](screenshots/collaboration.png) |

---

## 🎯 Future Enhancements

- 🎤 Voice brainstorming
- 🧠 AI-generated mind maps
- 📄 PDF & DOCX export
- 📅 Calendar integration
- 👥 Team workspaces
- ⚡ Real-time collaboration
- 📊 Advanced analytics
- 🔗 Slack & Discord integration

---

## 🤝 Contributing

Contributions are welcome!

1. Fork this repository
2. Create a new feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## 👩‍💻 Author

**Priyanka Das**

- GitHub: https://github.com/PriyankaDas856

---

## 📄 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!
