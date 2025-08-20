# Synapse Backend API

A robust RESTful API server for the Synapse hackathon management platform built with Node.js, Express, and hybrid database architecture.

## 🚀 Features

### 🎯 Core Functionality
- **User Management**: Registration, authentication, and role-based access control
- **Event Management**: Complete CRUD operations for hackathon events
- **Team Formation**: Create teams, invite members, and manage team composition
- **Submission System**: Submit projects with GitHub links, videos, and documentation
- **Enrollment System**: Track participant enrollments with real-time statistics
- **Certificate Management**: Generate and distribute digital certificates
- **Announcement System**: Event-specific announcements with priority levels
- **Real-time Chat**: Q&A system for event communication

### 🔐 Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Granular access control (Participants, Organizers, Judges)
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Zod schema validation for all endpoints
- **Security Headers**: Helmet.js for enhanced security
- **CORS Protection**: Configurable cross-origin resource sharing

### 📊 Database Architecture
- **Hybrid Database System**: 
  - **Azure SQL Database**: Core relational data (Users, Events, Teams, Enrollments)
  - **MongoDB**: Flexible document storage (Submissions, Announcements, Certificates, Chat)
- **Optimized Queries**: Parameterized queries to prevent SQL injection
- **Connection Pooling**: Efficient database connection management

## 🛠️ Tech Stack

### Core Framework
- **Node.js** - Runtime environment
- **Express.js 5.1.0** - Web application framework
- **ES6 Modules** - Modern JavaScript module system

### Databases
- **Azure SQL Database** - Primary relational database
- **Microsoft SQL Server** (mssql 11.0.1) - SQL Server client
- **MongoDB** - Document database for flexible content
- **Mongoose 8.17.1** - MongoDB object modeling

### Security & Validation
- **JSON Web Tokens** (jsonwebtoken 9.0.2) - Authentication
- **bcrypt 6.0.0** - Password hashing
- **Zod 3.23.8** - Schema validation
- **Helmet 8.1.0** - Security headers
- **CORS 2.8.5** - Cross-origin resource sharing

### Development Tools
- **Nodemon 3.1.10** - Development server with auto-restart
- **Morgan 1.10.1** - HTTP request logging
- **dotenv 17.2.1** - Environment variable management

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18.0 or later)
- **npm** or **yarn** package manager
- **Azure SQL Database** instance
- **MongoDB** database (local or cloud)
- **Git** for version control

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd synp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Azure SQL Database
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=synapse-db
SQL_USER=your-username
SQL_PASSWORD=your-password
SQL_ENCRYPT=true
SQL_TRUST_SERVER_CERTIFICATE=false

# MongoDB
MONGODB_URI=mongodb://localhost:27017/synapse
# or MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/synapse

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 4. Database Setup

#### Azure SQL Database Tables
The application will automatically create the required tables on first run:
- `users` - User accounts and profiles
- `events` - Hackathon events
- `teams` - Team information
- `event_enrollments` - Participant enrollments

#### MongoDB Collections
MongoDB collections are created automatically:
- `submissions` - Project submissions
- `announcements` - Event announcements
- `certificates` - Digital certificates
- `chatqnas` - Chat and Q&A messages

### 5. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📝 Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run db:migrate  # Run database migrations (if implemented)
npm run db:seed     # Seed database with sample data (if implemented)
```

## 🏗️ Project Structure

```
├── config/                 # Configuration files
│   ├── database.config.js  # Database connections
│   ├── env.config.js      # Environment configuration
│   ├── Https.config.js    # HTTP status codes
│   └── sql.config.js      # SQL Server configuration
├── controllers/           # Route handlers and business logic
│   ├── user.controller.js
│   ├── event.controller.js
│   ├── team.controller.js
│   ├── submission.controller.js
│   ├── announcement.controller.js
│   ├── certificate.controller.js
│   └── chatQna.controller.js
├── middlewares/          # Custom middleware functions
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   ├── ErrorHandler.middleware.js
│   └── AsyncHandler.middleware.js
├── models/              # Database models and schemas
│   ├── user.model.js
│   ├── event.model.js
│   ├── team.model.js
│   ├── submission.model.js
│   ├── announcement.model.js
│   ├── certificate.model.js
│   └── chatQna.model.js
├── routes/             # API route definitions
│   ├── user.routes.js
│   ├── event.route.js
│   ├── team.routes.js
│   ├── submission.routes.js
│   ├── announcement.routes.js
│   ├── certificate.routes.js
│   └── chatQna.routes.js
├── validators/         # Zod validation schemas
│   ├── user.validators.js
│   ├── event.validators.js
│   ├── team.validators.js
│   ├── submission.validators.js
│   ├── announcement.validators.js
│   ├── certificate.validators.js
│   └── chatQna.validators.js
├── utils/             # Utility functions
│   ├── AppError.js
│   ├── Bcrypt.util.js
│   ├── getEnv.util.js
│   ├── sql.util.js
│   └── validation.util.js
├── enums/            # Enumeration constants
│   └── error-code.enum.js
├── index.js          # Application entry point
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```

## 🔌 API Endpoints

### Authentication
```bash
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/logout       # User logout
GET    /api/auth/profile      # Get user profile
PUT    /api/auth/profile      # Update user profile
```

### Events
```bash
GET    /api/events           # Get all events
POST   /api/events           # Create new event (Organizer only)
GET    /api/events/:id       # Get event by ID
PUT    /api/events/:id       # Update event (Organizer only)
DELETE /api/events/:id       # Delete event (Organizer only)
POST   /api/events/:id/enroll # Enroll in event
GET    /api/events/:id/enrollments # Get event enrollments
```

### Teams
```bash
GET    /api/teams            # Get user's teams
POST   /api/teams            # Create new team
GET    /api/teams/:id        # Get team details
PUT    /api/teams/:id        # Update team
DELETE /api/teams/:id        # Delete team
POST   /api/teams/:id/join   # Join team
POST   /api/teams/:id/leave  # Leave team
```

### Submissions
```bash
GET    /api/submissions      # Get submissions
POST   /api/submissions      # Create submission
GET    /api/submissions/:id  # Get submission details
PUT    /api/submissions/:id  # Update submission
DELETE /api/submissions/:id  # Delete submission
```

### Announcements
```bash
GET    /api/announcements         # Get announcements
POST   /api/announcements         # Create announcement (Organizer only)
GET    /api/announcements/:id     # Get announcement details
PUT    /api/announcements/:id     # Update announcement (Organizer only)
DELETE /api/announcements/:id     # Delete announcement (Organizer only)
```

### Certificates
```bash
GET    /api/certificates          # Get user certificates
POST   /api/certificates          # Issue certificate (Organizer only)
GET    /api/certificates/:id      # Get certificate details
PUT    /api/certificates/:id      # Update certificate (Organizer only)
DELETE /api/certificates/:id      # Delete certificate (Organizer only)
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "userid": 123,
  "email": "user@example.com",
  "role": "participant",
  "iat": 1645123456,
  "exp": 1645209856
}
```

### Role-based Access
- **Participants**: Basic access to events, teams, and submissions
- **Organizers**: Full access to event management and participant data
- **Judges**: Access to submissions and evaluation features

### Protected Routes
All routes except authentication endpoints require valid JWT tokens in the Authorization header:
```bash
Authorization: Bearer <jwt-token>
```

## 🗃️ Database Schema

### Azure SQL Database Tables

#### Users Table
```sql
CREATE TABLE users (
    userid INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'participant',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
```

#### Events Table
```sql
CREATE TABLE events (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NTEXT,
    startDate DATETIME2 NOT NULL,
    endDate DATETIME2 NOT NULL,
    OrganizerID INT FOREIGN KEY REFERENCES users(userid),
    created_at DATETIME2 DEFAULT GETDATE()
);
```

### MongoDB Collections

#### Submissions Collection
```javascript
{
  _id: ObjectId,
  eventId: Number,
  teamId: Number,
  userId: Number,
  title: String,
  description: String,
  githubLink: String,
  videoLink: String,
  submissionDate: Date,
  status: String // 'draft', 'submitted', 'evaluated'
}
```

## 🧪 Testing

### Manual Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"participant"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Health Check
```bash
GET /api/health    # Check server status
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000

# Production Database URLs
SQL_SERVER=prod-server.database.windows.net
MONGODB_URI=mongodb+srv://user:pass@prod-cluster.mongodb.net/synapse

# Strong JWT Secret (use a random generator)
JWT_SECRET=your-production-jwt-secret-key

# CORS for production frontend
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000
CMD ["node", "index.js"]
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name "synapse-api"

# Monitor
pm2 monit

# View logs
pm2 logs synapse-api
```

## 🔧 Configuration

### CORS Configuration
```javascript
// config/cors.config.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### Rate Limiting
```javascript
// Implement rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check environment variables
   echo $SQL_SERVER
   echo $MONGODB_URI
   
   # Test connectivity
   npm run test:db
   ```

2. **JWT Token Issues**
   ```bash
   # Verify JWT secret is set
   echo $JWT_SECRET
   
   # Check token expiration
   jwt-cli decode <token>
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

## � Monitoring & Logging

### Request Logging
The application uses Morgan for HTTP request logging:
```javascript
// Development: detailed logs
app.use(morgan('dev'));

// Production: minimal logs
app.use(morgan('combined'));
```

### Error Handling
Centralized error handling with custom error classes:
```javascript
// Example usage
throw new AppError('Resource not found', 404);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a pull request

### Code Style Guidelines
- Use ES6+ features and modules
- Follow RESTful API conventions
- Add JSDoc comments for functions
- Validate all inputs with Zod schemas
- Handle errors gracefully with proper HTTP status codes

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Express.js** for the robust web framework
- **Microsoft Azure** for reliable cloud database services
- **MongoDB** for flexible document storage
- **JWT.io** for stateless authentication
- **Zod** for runtime type validation

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Contact the development team

---

Built with 💚 using Node.js and Express
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
