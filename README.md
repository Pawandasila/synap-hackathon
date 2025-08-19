# Synapse Hackathon Platform

A comprehensive hackathon management platform built with Node.js, Express, Azure SQL Database, and MongoDB.

## 🚀 Features

- **User Management**: Registration, authentication, and role-based access (Participants, Organizers, Judges)
- **Event Management**: Create, manage, and participate in hackathons
- **Team Formation**: Create teams, invite members, and manage team composition
- **Submission System**: Submit projects with GitHub links, videos, and documentation
- **Announcements**: Event-specific announcements with importance levels
- **Certificate Management**: Issue and manage certificates for participants
- **Real-time Chat**: Q&A system for event communication
- **Hybrid Database**: Azure SQL for core data, MongoDB for flexible content

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Databases**: 
  - Azure SQL Database (Users, Events, Teams)
  - MongoDB (Submissions, Announcements, Certificates, Chat)
- **Authentication**: JWT tokens
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, bcrypt password hashing

## 📋 Prerequisites

- Node.js (v18 or higher)
- Azure SQL Database
- MongoDB
- npm or yarn

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development
BASE_PATH=/api

# Frontend Configuration
FRONTEND_ORIGIN=http://localhost:3000

# Azure SQL Database
SQL_SERVER=your-server.database.windows.net
SQL_DB=your-database
SQL_USER=your-username
SQL_PASS=your-password

# MongoDB
MONGO_URI=mongodb://localhost:27017/synapse-hackathon

# JWT Secret
JWT_SECRET=your-jwt-secret-key
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pawandasila/synap-hackathon.git
   cd synap-hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your database credentials and configuration

4. **Start the server**
   ```bash
   npm start
   ```

5. **Development mode**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
Include JWT token in requests:
```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Schema

### SQL Database (Azure SQL)
- **users**: User accounts and authentication
- **events**: Hackathon events
- **teams**: Team information
- **team_members**: Team membership
- **event_enrollments**: Event participation

### MongoDB Collections
- **submissions**: Project submissions
- **announcements**: Event announcements
- **certificates**: Issued certificates
- **chatqnas**: Chat messages and Q&A

## 🔐 User Roles

- **Participant**: Can join events, create teams, submit projects
- **Organizer**: Can create/manage events, view all submissions, issue certificates
- **Judge**: Can view submissions and certificates, participate in discussions

## 📁 Project Structure

```
synap-hackathon/
├── config/
│   ├── database.config.js
│   ├── env.config.js
│   ├── Https.config.js
│   └── sql.config.js
├── controllers/
│   ├── announcement.controller.js
│   ├── certificate.controller.js
│   ├── chatQna.controller.js
│   ├── event.controller.js
│   ├── submission.controller.js
│   ├── team.controller.js
│   └── user.controller.js
├── middlewares/
│   ├── AsyncHandler.middleware.js
│   ├── auth.middleware.js
│   ├── ErrorHandler.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── announcement.model.js
│   ├── certificate.model.js
│   ├── chatQna.model.js
│   ├── event-enrollment.model.js
│   ├── event.model.js
│   ├── submission.model.js
│   ├── team.model.js
│   └── user.model.js
├── routes/
│   ├── announcement.routes.js
│   ├── certificate.routes.js
│   ├── chatQna.routes.js
│   ├── event.route.js
│   ├── submission.routes.js
│   ├── team.routes.js
│   └── user.routes.js
├── utils/
│   ├── AppError.js
│   ├── Bcrypt.util.js
│   ├── getEnv.util.js
│   ├── sql.util.js
│   └── validation.util.js
├── validators/
│   ├── announcement.validators.js
│   ├── certificate.validators.js
│   ├── chatQna.validators.js
│   ├── event.validators.js
│   ├── submission.validators.js
│   ├── team.validators.js
│   └── user.validators.js
├── index.js
└── package.json
```

## 🧪 Testing

Run the application and visit:
```
http://localhost:8000/
```

This endpoint provides database connection status and health check.

## 🚀 Deployment

1. **Environment Setup**
   - Set production environment variables
   - Configure Azure SQL firewall rules
   - Set up MongoDB Atlas or production MongoDB

2. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Pawan Dasila
- **Repository**: [synap-hackathon](https://github.com/Pawandasila/synap-hackathon)

## 🆘 Support

For support, email support@synapse-hackathon.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0**: Initial release with complete hackathon management features
- Full CRUD operations for all entities
- Role-based access control
- Hybrid database architecture
- Real-time chat and announcements
