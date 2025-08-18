# Event Enrollment System

This module provides comprehensive event enrollment functionality for the hackathon platform, allowing users to enroll in events, manage their enrollments, and providing organizers with enrollment analytics.

## Features

### 🎯 Event Enrollment
- **Enroll to Events**: Users can enroll in active events before they start
- **Cancel Enrollment**: Users can cancel their enrollment before event starts
- **Re-enrollment**: Previously cancelled users can re-enroll
- **Enrollment Validation**: Prevents duplicate enrollments and late enrollments

### 📊 Enrollment Management
- **User Enrollments**: View all enrollments by status
- **Team Association**: Link enrollments with team memberships
- **Status Tracking**: Track enrollment status (Enrolled, Cancelled, Waitlisted)

### 👨‍💼 Organizer Tools
- **View Enrollments**: Paginated list of event enrollments
- **Enrollment Statistics**: Comprehensive enrollment and team analytics
- **Status Filtering**: Filter enrollments by status

## API Endpoints

### User Enrollment Operations

#### POST /api/v1/events/:eventId/enroll
Enroll in an event.

**Response:**
```json
{
  "success": true,
  "message": "Successfully enrolled to the event",
  "data": {
    "enrollmentId": 123,
    "eventName": "Tech Hackathon 2025",
    "enrollmentDate": "2025-08-18T10:00:00.000Z"
  }
}
```

#### POST /api/v1/events/:eventId/cancel
Cancel enrollment in an event.

**Response:**
```json
{
  "success": true,
  "message": "Event enrollment cancelled successfully"
}
```

#### GET /api/v1/events/my/enrollments
Get user's enrollments.

**Query Parameters:**
- `status` (optional): Filter by status ('Enrolled', 'Cancelled', 'Waitlisted')

**Response:**
```json
{
  "success": true,
  "message": "User enrollments retrieved successfully",
  "data": [
    {
      "EnrollmentID": 123,
      "EventID": 1,
      "EnrollmentDate": "2025-08-18T10:00:00.000Z",
      "Status": "Enrolled",
      "TeamID": 5,
      "EventName": "Tech Hackathon 2025",
      "Description": "Annual technology hackathon",
      "Theme": "AI & Machine Learning",
      "Mode": "Online",
      "StartDate": "2025-09-15T09:00:00.000Z",
      "EndDate": "2025-09-17T18:00:00.000Z",
      "SubmissionDeadline": "2025-09-17T17:00:00.000Z",
      "MaxTeamSize": 5,
      "TeamName": "Code Warriors"
    }
  ],
  "count": 1
}
```

#### PATCH /api/v1/events/:eventId/enrollment/team
Update team association for enrollment.

**Request Body:**
```json
{
  "teamId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team association updated successfully"
}
```

### Organizer Operations

#### GET /api/v1/events/:eventId/enrollments
Get event enrollments (Organizer only).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (default: 'Enrolled')

**Response:**
```json
{
  "success": true,
  "message": "Event enrollments retrieved successfully",
  "data": [
    {
      "EnrollmentID": 123,
      "EnrollmentDate": "2025-08-18T10:00:00.000Z",
      "Status": "Enrolled",
      "TeamID": 5,
      "userid": 456,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "TeamName": "Code Warriors"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalEnrollments": 50,
    "enrollmentsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  }
}
```

#### GET /api/v1/events/:eventId/enrollment-stats
Get enrollment statistics (Organizer only).

**Response:**
```json
{
  "success": true,
  "message": "Enrollment statistics retrieved successfully",
  "data": {
    "eventName": "Tech Hackathon 2025",
    "enrollmentStats": {
      "enrolled": 150,
      "cancelled": 10,
      "waitlisted": 5,
      "total": 165
    },
    "teamStats": {
      "totalTeams": 35,
      "averageTeamSize": 4.2
    }
  }
}
```

## Business Rules

### Enrollment Rules
1. ✅ Users can only enroll in active events
2. ✅ Cannot enroll in events that have already started
3. ✅ One enrollment per user per event
4. ✅ Can re-enroll if previously cancelled
5. ✅ Cannot cancel enrollment for started events

### Team Association
1. ✅ Users can associate their enrollment with a team
2. ✅ Team must belong to the same event
3. ✅ User must be a member of the team
4. ✅ Team association is optional

### Organizer Permissions
1. ✅ Only event organizers can view enrollments
2. ✅ Only event organizers can view enrollment statistics
3. ✅ Organizers can see all enrollment statuses

## Database Schema

### Event Enrollments Table
```sql
CREATE TABLE event_enrollments (
    EnrollmentID INT IDENTITY(1,1) PRIMARY KEY,
    EventID INT NOT NULL,
    UserID INT NOT NULL,
    EnrollmentDate DATETIME2 DEFAULT GETDATE(),
    Status NVARCHAR(20) CHECK (Status IN ('Enrolled', 'Cancelled', 'Waitlisted')) DEFAULT 'Enrolled',
    TeamID INT NULL,
    
    FOREIGN KEY (EventID) REFERENCES events(EventID),
    FOREIGN KEY (UserID) REFERENCES users(userid),
    FOREIGN KEY (TeamID) REFERENCES teams(TeamId),
    UNIQUE(EventID, UserID)
);
```

## Security Features

### SQL Injection Prevention
- ✅ All queries use parameterized statements
- ✅ Input validation with Zod schemas
- ✅ Type checking and bounds validation

### Authorization
- ✅ JWT-based authentication required
- ✅ Role-based access control for organizer features
- ✅ User ownership validation for enrollments

### Data Validation
- ✅ Event ID validation and bounds checking
- ✅ Status enumeration validation
- ✅ Pagination parameter validation
- ✅ Business rule enforcement

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Cannot enroll to an event that has already started"
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
  "message": "Only event organizer can view enrollments"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Event not found or inactive"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "You are already enrolled in this event"
}
```

## Usage Examples

### Enrolling in an Event
```javascript
// POST /api/v1/events/123/enroll
const response = await fetch('/api/v1/events/123/enroll', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});
```

### Getting User Enrollments
```javascript
// GET /api/v1/events/my/enrollments?status=Enrolled
const response = await fetch('/api/v1/events/my/enrollments?status=Enrolled', {
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});
```

### Organizer Viewing Enrollments
```javascript
// GET /api/v1/events/123/enrollments?page=1&limit=20&status=Enrolled
const response = await fetch('/api/v1/events/123/enrollments?page=1&limit=20&status=Enrolled', {
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});
```

### Updating Team Association
```javascript
// PATCH /api/v1/events/123/enrollment/team
const response = await fetch('/api/v1/events/123/enrollment/team', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <jwt_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    teamId: 5
  })
});
```

## Integration with Team System

The enrollment system integrates seamlessly with the team management system:

1. **Team Association**: Users can link their event enrollment with their team membership
2. **Team Statistics**: Organizers can see team formation statistics
3. **Enrollment Updates**: When users join/leave teams, their enrollment can be updated accordingly

## Dependencies

- **Express.js**: Web framework
- **Zod**: Input validation (if validation middleware is added)
- **mssql**: SQL Server database connectivity
- **JWT**: Authentication
- **Custom Middleware**: AsyncHandler, authentication

## Files Structure

```
controllers/
├── event.controller.js           # Enhanced with enrollment functions
models/
├── event-enrollment.model.js     # Enrollment table creation
routes/
├── event.route.js               # Enhanced with enrollment routes
validators/
├── event-enrollment.validators.js # Enrollment validation schemas
```

This comprehensive event enrollment system provides all the necessary functionality for users to participate in hackathons and for organizers to manage their events effectively, with proper security, validation, and business rule enforcement.
