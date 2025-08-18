# Team Management System

This module provides comprehensive team management functionality for the hackathon platform.

## Features

### 🏗️ Team Creation
- Users can create teams for specific events
- Team name validation and uniqueness checks per event
- Automatic leadership assignment to team creator
- Prevention of creating multiple teams for the same event

### 👥 Team Membership
- **Join Teams**: Users can join existing teams
- **Leave Teams**: Members can leave teams (with special rules for leaders)
- **Member Management**: Leaders can remove members
- **Role-based Access**: Leaders have additional privileges

### 🔍 Team Discovery
- **Get Team Details**: View team information with member list
- **Teams by Event**: Paginated list of all teams for an event
- **User's Teams**: View all teams a user is part of

### ⚙️ Team Administration
- **Update Team**: Leaders can modify team details
- **Delete Team**: Leaders can disband teams
- **Member Removal**: Leaders can remove members

## API Endpoints

### Authentication Required
All team endpoints require authentication via JWT token.

### POST /api/v1/teams
Create a new team for an event.

**Request Body:**
```json
{
  "teamName": "Team Alpha",
  "eventId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "TeamId": 1,
    "TeamName": "Team Alpha",
    "EventId": 123,
    "CreatedBy": 456,
    "CreatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### GET /api/v1/teams/my-teams
Get all teams the authenticated user is part of.

**Response:**
```json
{
  "success": true,
  "message": "User teams retrieved successfully",
  "data": [
    {
      "TeamId": 1,
      "TeamName": "Team Alpha",
      "EventId": 123,
      "Role": "Leader",
      "EventName": "Hackathon 2024",
      "MemberCount": 3
    }
  ]
}
```

### GET /api/v1/teams/event/:eventId
Get all teams for a specific event (paginated).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Teams per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Teams retrieved successfully",
  "data": [
    {
      "TeamId": 1,
      "TeamName": "Team Alpha",
      "CreatedBy": 456,
      "CreatedByName": "John Doe",
      "MemberCount": 3,
      "CreatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTeams": 50,
    "teamsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /api/v1/teams/:teamId
Get detailed information about a specific team.

**Response:**
```json
{
  "success": true,
  "message": "Team details retrieved successfully",
  "data": {
    "TeamId": 1,
    "TeamName": "Team Alpha",
    "EventId": 123,
    "EventName": "Hackathon 2024",
    "MaxTeamSize": 5,
    "CreatedBy": 456,
    "CreatedAt": "2024-01-01T10:00:00.000Z",
    "members": [
      {
        "Role": "Leader",
        "userid": 456,
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "Role": "Member",
        "userid": 789,
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ],
    "memberCount": 2
  }
}
```

### PUT /api/v1/teams/:teamId
Update team details (Leader only).

**Request Body:**
```json
{
  "teamName": "Team Alpha Updated"
}
```

### POST /api/v1/teams/:teamId/join
Join an existing team.

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined the team"
}
```

### POST /api/v1/teams/:teamId/leave
Leave a team.

**Response:**
```json
{
  "success": true,
  "message": "Successfully left the team"
}
```

### DELETE /api/v1/teams/:teamId/members/:memberId
Remove a member from the team (Leader only).

**Response:**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

### DELETE /api/v1/teams/:teamId
Delete/disband a team (Leader only).

**Response:**
```json
{
  "success": true,
  "message": "Team deleted successfully"
}
```

## Business Rules

### Team Creation
1. ✅ Users can only create one team per event
2. ✅ Team names must be unique within an event
3. ✅ Team creator automatically becomes the leader
4. ✅ Events must be active to create teams

### Team Joining
1. ✅ Users can only join one team per event
2. ✅ Teams cannot exceed the event's maximum team size
3. ✅ Users cannot join teams for events they already have a team in

### Leadership Rules
1. ✅ Only leaders can update team details
2. ✅ Only leaders can remove members
3. ✅ Only leaders can delete teams
4. ✅ Leaders cannot leave teams with other members (must transfer leadership or remove all members first)
5. ✅ When a leader leaves an empty team, the team is automatically disbanded

### Member Management
1. ✅ Leaders cannot remove themselves
2. ✅ Members can leave teams freely
3. ✅ Team members are ordered with leaders first

## Database Schema

### Teams Table
```sql
CREATE TABLE teams (
    TeamId INT IDENTITY(1,1) PRIMARY KEY,
    TeamName NVARCHAR(100) NOT NULL,
    EventId INT NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (EventId) REFERENCES events(EventID),
    FOREIGN KEY (CreatedBy) REFERENCES users(userid)
);
```

### Team Members Table
```sql
CREATE TABLE team_members (
    MemberId INT IDENTITY(1,1) PRIMARY KEY,
    TeamId INT NOT NULL,
    UserId INT NOT NULL,
    Role NVARCHAR(20) CHECK (Role IN ('Leader', 'Member')) DEFAULT 'Member',
    JoinedAt DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (TeamId) REFERENCES teams(TeamId) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES users(userid),
    UNIQUE(TeamId, UserId)
);
```

## Security Features

### SQL Injection Prevention
- ✅ All queries use parameterized statements
- ✅ Input validation with Zod schemas
- ✅ Type checking and sanitization

### Authorization
- ✅ JWT-based authentication required
- ✅ Role-based access control (Leader vs Member)
- ✅ User ownership validation

### Data Validation
- ✅ Team name length and format validation
- ✅ Numeric ID validation and bounds checking
- ✅ Pagination parameter validation
- ✅ Business rule enforcement

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "teamName",
      "message": "Team name must be at least 2 characters long"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Only team leader can update team details"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Team not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "You are already part of a team for this event"
}
```

## Dependencies

- **Express.js**: Web framework
- **Zod**: Input validation
- **mssql**: SQL Server database connectivity
- **JWT**: Authentication
- **Custom Middleware**: AsyncHandler, validation, authentication

## Files Structure

```
controllers/
├── team.controller.js      # Main team business logic
validators/
├── team.validators.js      # Zod validation schemas
routes/
├── team.routes.js         # Express route definitions
middlewares/
├── validation.middleware.js # Validation middleware
├── auth.middleware.js     # Authentication middleware
models/
├── team.model.js          # Database table creation
```

## Usage Examples

### Creating a Team
```javascript
// POST /api/v1/teams
const response = await fetch('/api/v1/teams', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    teamName: "Code Warriors",
    eventId: 123
  })
});
```

### Joining a Team
```javascript
// POST /api/v1/teams/1/join
const response = await fetch('/api/v1/teams/1/join', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});
```

### Getting Team Details
```javascript
// GET /api/v1/teams/1
const response = await fetch('/api/v1/teams/1', {
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});
```

This comprehensive team management system provides all the necessary functionality for users to create, join, manage, and participate in hackathon teams with proper security, validation, and business rule enforcement.
