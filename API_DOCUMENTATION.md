# API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
All routes except user creation and login require authentication.
Include JWT token in Authorization header: `Bearer <token>`

---

## Users API

### Create User
```
POST /users/create
```
**Payload:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "authprovider": "email" | "google" | "github",
  "role": "participant" | "organizer" | "judge"
}
```

### Login User
```
POST /users/login
```
**Payload:**
```json
{
  "email": "string",
  "password": "string"
}
```

### Get All Users
```
GET /users/
```

### Search Users
```
GET /users/search?query=string&role=string
```

### Get User by ID
```
GET /users/:id
```

### Update User
```
PATCH /users/update/:userid
```
**Payload:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "participant" | "organizer" | "judge"
}
```

---

## Events API

### Create Event
```
POST /events/create
```
**Payload:**
```json
{
  "name": "string",
  "description": "string",
  "theme": "string",
  "mode": "Online" | "Offline",
  "startDate": "string (ISO datetime)",
  "endDate": "string (ISO datetime)",
  "submissionDeadline": "string (ISO datetime)",
  "resultDate": "string (ISO datetime)",
  "rules": "string",
  "timeline": "string",
  "tracks": "string",
  "prizes": "string",
  "maxTeamSize": "number",
  "sponsors": "string"
}
```

### Get All Events
```
GET /events/
```

### Search Events
```
GET /events/search?query=string&mode=string&theme=string
```

### Get Upcoming Events
```
GET /events/upcoming
```

### Get Event by ID
```
GET /events/:id
```

### Get Events by Organizer
```
GET /events/organizer/:organizerId
```

### Update Event
```
PATCH /events/update/:id
```
**Payload:**
```json
{
  "name": "string",
  "description": "string",
  "theme": "string",
  "mode": "Online" | "Offline",
  "startDate": "string (ISO datetime)",
  "endDate": "string (ISO datetime)",
  "submissionDeadline": "string (ISO datetime)",
  "resultDate": "string (ISO datetime)",
  "rules": "string",
  "timeline": "string",
  "tracks": "string",
  "prizes": "string",
  "maxTeamSize": "number",
  "sponsors": "string",
  "isActive": "boolean"
}
```

### Delete Event
```
DELETE /events/delete/:id
```

### Enroll in Event
```
POST /events/:eventId/enroll
```

### Cancel Enrollment
```
POST /events/:eventId/cancel
```

### Get User's Enrollments
```
GET /events/my/enrollments
```

### Get Event Enrollments
```
GET /events/:eventId/enrollments
```

### Get Enrollment Stats
```
GET /events/:eventId/enrollment-stats
```

### Update Enrollment Team
```
PATCH /events/:eventId/enrollment/team
```
**Payload:**
```json
{
  "teamId": "number"
}
```

---

## Teams API

### Create Team
```
POST /teams/
```
**Payload:**
```json
{
  "teamName": "string",
  "eventId": "number"
}
```

### Get User's Teams
```
GET /teams/my-teams
```

### Get Teams by Event
```
GET /teams/event/:eventId
```

### Get Team by ID
```
GET /teams/:teamId
```

### Update Team
```
PUT /teams/:teamId
```
**Payload:**
```json
{
  "teamName": "string"
}
```

### Delete Team
```
DELETE /teams/:teamId
```

### Join Team
```
POST /teams/:teamId/join
```

### Leave Team
```
POST /teams/:teamId/leave
```

### Remove Team Member
```
DELETE /teams/:teamId/members/:memberId
```

---

## Submissions API

### Create Submission
```
POST /submissions/
```
**Payload:**
```json
{
  "eventId": "number",
  "teamId": "number",
  "title": "string",
  "description": "string",
  "track": "string",
  "githubUrl": "string",
  "videoUrl": "string",
  "docs": ["string"],
  "round": "number"
}
```

### Get User's Submissions
```
GET /submissions/my-submissions
```

### Get Submissions by Event
```
GET /submissions/event/:eventId?round=number&track=string
```

### Get Submissions by Team
```
GET /submissions/team/:teamId
```

### Get Submission by ID
```
GET /submissions/:id
```

### Update Submission
```
PATCH /submissions/:id
```
**Payload:**
```json
{
  "title": "string",
  "description": "string",
  "track": "string",
  "githubUrl": "string",
  "videoUrl": "string",
  "docs": ["string"],
  "round": "number"
}
```

### Delete Submission
```
DELETE /submissions/:id
```

---

## Announcements API

### Create Announcement
```
POST /announcements/
```
**Payload:**
```json
{
  "eventId": "number",
  "message": "string",
  "isImportant": "boolean"
}
```

### Get Important Announcements
```
GET /announcements/my-important
```

### Get Announcements by Event
```
GET /announcements/event/:eventId?important=boolean
```

### Get Announcement by ID
```
GET /announcements/:id
```

### Update Announcement
```
PATCH /announcements/:id
```
**Payload:**
```json
{
  "message": "string",
  "isImportant": "boolean"
}
```

### Delete Announcement
```
DELETE /announcements/:id
```

---

## Certificates API

### Issue Certificate
```
POST /certificates/
```
**Payload:**
```json
{
  "eventId": "number",
  "userId": "number",
  "certificateUrl": "string"
}
```

### Bulk Issue Certificates
```
POST /certificates/bulk-issue
```
**Payload:**
```json
{
  "eventId": "number",
  "userIds": ["number"],
  "certificateUrl": "string"
}
```

### Get User's Certificates
```
GET /certificates/my-certificates
```

### Get Certificates by Event
```
GET /certificates/event/:eventId
```

### Get Certificate by ID
```
GET /certificates/:id
```

### Update Certificate
```
PATCH /certificates/:id
```
**Payload:**
```json
{
  "certificateUrl": "string"
}
```

### Delete Certificate
```
DELETE /certificates/:id
```

---

## Chat/QnA API

### Create Chat Message
```
POST /chat/
```
**Payload:**
```json
{
  "eventId": "number",
  "message": "string"
}
```

### Get Chat by Event
```
GET /chat/event/:eventId?page=number&limit=number
```

### Get Chat Message by ID
```
GET /chat/:id
```

### Update Chat Message
```
PATCH /chat/:id
```
**Payload:**
```json
{
  "message": "string"
}
```

### Delete Chat Message
```
DELETE /chat/:id
```

### Add Reply to Chat
```
POST /chat/:chatId/reply
```
**Payload:**
```json
{
  "message": "string"
}
```

### Update Chat Reply
```
PATCH /chat/:chatId/reply/:replyId
```
**Payload:**
```json
{
  "message": "string"
}
```

### Delete Chat Reply
```
DELETE /chat/:chatId/reply/:replyId
```
