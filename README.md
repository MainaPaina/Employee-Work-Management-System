# Better Time Management

![Better Time Management Logo](public/img/logo.png)

A comprehensive time management application built with Node.js, Express.js, and Supabase that helps employees track work hours, manage breaks, and improve productivity.

## 📋 Table of Contents

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

### Admin Dashboard
- **User Management**: Create, edit, and deactivate user accounts
- **Timesheet Overview**: View all employee timesheets in one place
- **Data Export**: Export timesheet data for reporting
- **System Settings**: Configure application settings

### Responsive Design
- **Mobile-First Approach**: Works seamlessly on all devices
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
- **ESLint**: Code quality and style checking
- **Nodemon**: Development server with auto-reload

## 📥 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/PopeDrex/Better-Time-Management.git
   cd Better-Time-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials and other settings
   ```

4. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3005`

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
PORT=3005
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

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
   - Access system settings

2. **Manager**
   - View timesheets for team members
   - Approve time off requests
   - Generate reports

3. **Employee**
   - Clock in and out
   - Take breaks
   - View personal timesheet

### Time Tracking Workflow

1. **Clock In**: Start your workday
2. **Start Break**: Pause your work time for breaks
3. **End Break**: Resume work after breaks
4. **Go Unavailable**: Mark yourself as unavailable for meetings or focused work
5. **End Unavailable**: Return to active status
6. **Clock Out**: End your workday

## 📁 Project Structure

```
Better-Time-Management/
├── config/              # Configuration files
│   ├── supabaseClient.js # Supabase client configuration
│   └── jwtConfig.js     # JWT configuration
├── controllers/         # Route controllers
│   ├── authController.js # Authentication logic
│   ├── timesheetController.js # Timesheet management
│   └── adminController.js # Admin functionality
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication middleware
│   └── NFC.js           # NFC functionality
├── model/               # Database models
│   ├── TimeEntry.js     # Timesheet entry model
│   ├── User.js          # User model
│   └── Leave.js         # Leave management model
├── public/              # Static assets
│   ├── css/             # Stylesheets
│   ├── js/              # Client-side JavaScript
│   └── img/             # Images and icons
├── routes/              # Express routes
│   ├── auth.js          # Authentication routes
│   ├── api.js           # API endpoints
│   └── admin.js         # Admin routes
├── views/               # EJS templates
│   ├── partials/        # Reusable template parts
│   ├── login.ejs        # Login page
│   ├── dashboard.ejs    # Dashboard page
│   └── timesheet.ejs    # Timesheet page
├── .env                 # Environment variables (not in repo)
├── .gitignore           # Git ignore file
├── package.json         # Project dependencies
├── server.js            # Application entry point
└── README.md            # Project documentation
```

## 🔄 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Time Tracking
- `POST /api/clock-in` - Clock in
- `POST /api/clock-out` - Clock out
- `POST /api/start-break` - Start a break
- `POST /api/end-break` - End a break
- `POST /api/go-unavailable` - Mark as unavailable
- `POST /api/become-available` - Mark as available

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /admin/api/users` - Create a new user (admin only)
- `PUT /admin/api/users/:id` - Update a user (admin only)
- `DELETE /admin/api/users/:id` - Delete a user (admin only)

### Status
- `GET /api/status` - Get current user status

## 🔒 Authentication

The application uses a combination of JWT (JSON Web Tokens) and session-based authentication:

1. **Login Process**:
   - User submits username and password
   - Server validates credentials against Supabase
   - On success, JWT token is generated and returned
   - Token is stored in localStorage on the client
   - Session is also created on the server

2. **Request Authentication**:
   - JWT token is sent in the Authorization header
   - Server validates the token
   - User information is attached to the request object

3. **Logout Process**:
   - JWT token is removed from localStorage
   - Server session is destroyed

## 📊 Database Schema

### Users Table
- `id` (UUID, PK) - User identifier
- `username` (String) - Unique username
- `email` (String) - User email
- `role` (String) - User role (admin, manager, employee)
- `active` (Boolean) - Account status

### TimeEntries Table
- `id` (UUID, PK) - Entry identifier
- `employee_id` (UUID, FK) - Reference to Users table
- `date` (Date) - Entry date
- `start_time` (Timestamp) - Clock-in time
- `end_time` (Timestamp) - Clock-out time
- `status` (String) - Current status (active, on_break, unavailable, submitted)
- `hours_worked` (Decimal) - Total hours worked
- `total_break_duration` (Integer) - Break duration in minutes
- `total_unavailable_duration` (Integer) - Unavailable duration in minutes

## 🤝 Contributing

We welcome contributions to the Better Time Management project! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add some feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

Please make sure your code follows our coding standards and includes appropriate tests.

## ❓ Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your Supabase credentials in the `.env` file
   - Check that your JWT_SECRET is properly set
   - Clear browser cookies and localStorage

2. **Database Connection Issues**
   - Confirm your Supabase URL is correct
   - Check network connectivity
   - Verify database permissions

3. **Large File Issues with Git**
   - If you encounter issues with large files in Git, refer to the `COMPLETE_GIT_LARGE_FILE_REMOVAL_GUIDE.md` file

### Getting Help

If you encounter any issues not covered here, please:
1. Check the existing [GitHub Issues](https://github.com/PopeDrex/Better-Time-Management/issues)
2. Create a new issue with detailed information about your problem

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.io/) for the backend infrastructure
- [Bootstrap](https://getbootstrap.com/) for the UI framework
- [Font Awesome](https://fontawesome.com/) for the icons
- [Express.js](https://expressjs.com/) for the web framework

---

Made with ❤️ by the Better Time Management Team
