# Better Time Management

![Better Time Management Logo](public/img/logo.png)

A comprehensive time management application built with Node.js, Express.js, and Supabase that helps employees track work hours, manage breaks, and improve productivity.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 📝 Overview

Better Time Management is a web-based application designed to help organizations track employee work hours, manage breaks, and streamline timesheet management. The application provides role-based access control with different features for employees, managers, and administrators.

## Wireframe & Design

Our pictures of our Wireframe stored in a google drive folder. [Click here](https://drive.google.com/drive/folders/1IjGixqCw1XO6SGw3HjePybzLAEChsx5r?usp=sharing) for a preivew

Our Figma design. [click here](https://www.figma.com/proto/ZwdNLJc6DwWglFVEjYbfZ6/TimeManagement-Design?node-id=0-1&t=q41nd7CR70m6a272-1) for a preview.

## ✨ Features

### User Authentication
- **Secure Login System**: Username-based authentication with JWT tokens
- **Role-Based Access Control**: Admin, Manager, and Employee roles
- **Session Management**: Persistent sessions with secure cookies

### Time Tracking
- **Clock In/Out**: Track daily work hours with precise timestamps
- **Break Management**: Start and end breaks with automatic duration calculation
- **Unavailable Status**: Track periods when employees are unavailable
- **Real-Time Status**: View current status (active, on break, unavailable)
- **Continuous Tracking**: Timer maintains continuity across sessions and days

### Leave Management
- **Leave Application**: Apply for different types of leave
- **Leave Approval Workflow**: Managers can approve or reject leave requests
- **Leave Balance**: Track remaining leave quota
- **Leave History**: View past leave requests and their status

### Admin Dashboard
- **User Management**: Create, edit, and deactivate user accounts
- **Role Management**: Assign and manage user roles
- **Department Management**: Organize users by departments
- **Policy Management**: Configure system policies
- **Timesheet Overview**: View all employee timesheets in one place

### Responsive Design
- **Mobile-First Approach**: Works seamlessly on all devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Intuitive Interface**: Clean, modern UI with Bootstrap 5
- **Accessibility**: WCAG compliant design elements

## 🛠️ Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Supabase**: Backend-as-a-Service for database and authentication
- **JWT**: JSON Web Tokens for secure authentication
- **bcrypt**: Password hashing

### Frontend
- **HTML5/CSS3**: Modern markup and styling
- **JavaScript (ES6+)**: Client-side scripting
- **Bootstrap 5**: Responsive UI framework
- **EJS**: Embedded JavaScript templates
- **Font Awesome**: Icon library

### Database
- **PostgreSQL**: Relational database (via Supabase)

### DevOps
- **Git**: Version control
- **Nodemon**: Development server with auto-reload

## 📥 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Better-Time-Management.git
   cd Better-Time-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

4. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3001` (or the port you configured)

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# Session Configuration
SESSION_SECRET=your_session_secret
```

## 🖥️ Usage

### User Roles and Permissions

1. **Admin**
   - Manage all users and their permissions
   - View and edit all timesheets
   - Configure system settings
   - Manage departments and roles

2. **Manager**
   - View timesheets for team members
   - Approve time off requests
   - Generate reports

3. **Employee**
   - Clock in and out
   - Take breaks
   - Apply for leave
   - View personal timesheet

### Time Tracking Workflow

1. **Clock In**: Start your workday
2. **Start Break**: Pause your work time for breaks
3. **End Break**: Resume work after breaks
4. **Go Unavailable**: Mark yourself as unavailable for meetings or focused work
5. **End Unavailable**: Return to active status
6. **Clock Out**: End your workday

### Leave Management Workflow

1. **Apply for Leave**: Submit a leave request with dates and reason
2. **Manager Review**: Manager approves or rejects the request
3. **Leave Status**: Track the status of your leave requests
4. **Leave Balance**: View your remaining leave quota

## 📁 Project Structure

```
Better-Time-Management/
├── config/              # Configuration files
│   ├── supabase/        # Supabase configuration
│   │   ├── client.js    # Supabase client (anon key)
│   │   └── admin.js     # Supabase admin client (service role key)
│   ├── session.js       # Session configuration
│   └── viewEngine.js    # EJS view engine configuration
├── controllers/         # Route controllers
│   ├── authController.js       # Authentication logic
│   ├── timesheetController.js  # Timesheet management
│   ├── leaveController.js      # Leave management
│   ├── employeeController.js   # Employee management
│   └── adminController.js      # Admin functionality
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication middleware
│   ├── verifyRoles.js   # Role verification middleware
│   └── viewLocals.js    # View locals middleware
├── model/               # Database models
│   ├── TimeEntry.js     # Timesheet entry model
│   ├── User.js          # User model
│   ├── Leave.js         # Leave management model
│   ├── Employee.js      # Employee model
│   └── Role.js          # Role model
├── public/              # Static assets
│   ├── css/             # Stylesheets
│   │   ├── theme/       # Theme stylesheets
│   │   └── style.css    # Main stylesheet
│   ├── js/              # Client-side JavaScript
│   │   ├── dashboard.js # Dashboard functionality
│   │   ├── timesheet.js # Timesheet functionality
│   │   └── main.js      # Main JavaScript file
│   └── img/             # Images and icons
├── routes/              # Express routes
│   ├── admin/           # Admin routes
│   │   ├── usermanagement.js # User management routes
│   │   ├── departments.js    # Department management routes
│   │   └── roles.js          # Role management routes
│   ├── api.js           # API endpoints
│   ├── auth.js          # Authentication routes
│   ├── dashboard.js     # Dashboard routes
│   ├── employee.js      # Employee routes
│   ├── index.js         # Main router
│   ├── leave.js         # Leave routes
│   └── timesheet.js     # Timesheet routes
├── views/               # EJS templates
│   ├── admin/           # Admin views
│   │   ├── usermanagement/ # User management views
│   │   ├── departments/    # Department management views
│   │   └── roles/          # Role management views
│   ├── account/         # Account views
│   │   └── login.ejs    # Login page
│   ├── partials/        # Reusable template parts
│   │   ├── navbar.ejs   # Navigation bar
│   │   └── footer.ejs   # Footer
│   ├── dashboard.ejs    # Dashboard page
│   ├── timesheet.ejs    # Timesheet page
│   ├── layout.ejs       # Main layout
│   └── index.ejs        # Home page
├── app.js               # Express application setup
├── server.js            # Server entry point
├── .env                 # Environment variables (not in repo)
├── .gitignore           # Git ignore file
└── package.json         # Project dependencies
```

## 🔄 API Endpoints

### Authentication
- `POST /account/login` - User login
- `GET /account/logout` - User logout

### Timesheet
- `GET /api/clock-in` - Clock in
- `GET /api/clock-out` - Clock out
- `GET /api/start-break` - Start break
- `GET /api/end-break` - End break
- `GET /api/go-unavailable` - Go unavailable
- `GET /api/end-unavailable` - End unavailable status

### Leave Management
- `POST /leave/apply` - Apply for leave
- `GET /leave` - View leave history
- `PUT /leave/:id/approve` - Approve leave request (Admin/Manager)
- `PUT /leave/:id/reject` - Reject leave request (Admin/Manager)

### Admin
- `GET /admin/usermanagement` - User management
- `GET /admin/roles` - Role management
- `GET /admin/departments` - Department management
- `GET /admin/policies` - Policy management

## 🔒 Authentication

The application uses a combination of Supabase Authentication and session-based authentication:

1. **Login Process**:
   - User submits username and password
   - System looks up the user by username to get their email
   - Authenticates with Supabase Auth using email and password
   - Fetches user profile data from the database
   - Stores essential user info in session

2. **Session Management**:
   - Express-session is used for session management
   - Session data is stored server-side
   - Session ID is stored in a cookie

3. **Authorization**:
   - Role-based access control using middleware
   - Routes are protected based on user roles

## 📊 Database Schema

### Users Table
- `id` (UUID, PK) - User identifier
- `username` (String) - Unique username
- `email` (String) - User email
- `name` (String) - User's full name
- `profile_image` (String) - URL to profile image
- `role` (String) - User role (admin, manager, employee)
- `active` (Boolean) - Account status
- `lastlogin_at` (Timestamp) - Last login timestamp

### Timesheets Table
- `id` (UUID, PK) - Entry identifier
- `employee_id` (UUID, FK) - Reference to Users table
- `date` (Date) - Entry date
- `start_time` (Timestamp) - Clock-in time
- `end_time` (Timestamp) - Clock-out time
- `status` (String) - Current status (active, on_break, unavailable, submitted)
- `hours_worked` (Decimal) - Total hours worked
- `total_break_duration` (Integer) - Break duration in minutes
- `total_unavailable_duration` (Integer) - Unavailable duration in minutes

### Leaves Table
- `id` (UUID, PK) - Leave request identifier
- `employee_id` (UUID, FK) - Reference to Users table
- `leave_type` (String) - Type of leave
- `start_date` (Date) - Leave start date
- `end_date` (Date) - Leave end date
- `reason` (String) - Reason for leave
- `days` (Integer) - Number of leave days
- `status` (String) - Status of leave request (pending, approved, rejected)

### Departments Table
- `id` (UUID, PK) - Department identifier
- `name` (String) - Department name
- `manager_id` (UUID, FK) - Reference to Users table for department manager

### Roles Table
- `id` (UUID, PK) - Role identifier
- `name` (String) - Role name
- `permissions` (JSON) - Role permissions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ❓ Troubleshooting

### Common Issues

1. **Connection to Supabase fails**
   - Check your Supabase URL and API keys in the `.env` file
   - Ensure your Supabase project is active

2. **Authentication issues**
   - Clear browser cookies and try logging in again
   - Check if the user exists in both Supabase Auth and the users table

3. **Time tracking not updating in real-time**
   - Check browser console for JavaScript errors
   - Ensure the client-side timer script is running

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
