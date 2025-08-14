# Kanban Board - Project Management Tool

A modern, full-stack Kanban board application built with Next.js, TypeScript, Express.js, and AWS DSQL (PostgreSQL). This application allows you to create projects, manage boards within projects, and organize tasks using a drag-and-drop Kanban interface similar to Jira.

## Features

### ✨ Core Features

- **Project Management**: Create and manage multiple projects with custom colors
- **Board Organization**: Create multiple boards within each project
- **Task Management**: Add, edit, and delete tasks with detailed information
- **Drag & Drop**: Intuitive task movement between columns (To Do, In Progress, In Review, Done)
- **Priority System**: Set task priorities (Low, Medium, High, Urgent)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🛠 Technical Features

- **Full-stack TypeScript**: Type-safe development across frontend and backend
- **Modern UI**: Built with Tailwind CSS for responsive design
- **RESTful API**: Express.js backend with structured API endpoints
- **Database**: AWS DSQL (PostgreSQL) for scalable, managed database service
- **Real-time Updates**: Efficient state management and data synchronization

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **@dnd-kit** - Drag and drop functionality

### Backend

- **Express.js** - Web application framework
- **AWS DSQL (PostgreSQL)** - Managed PostgreSQL database service
- **PostgreSQL (pg)** - Database client
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation

### Development

- **ESLint** - Code linting
- **Nodemon** - Auto-restart development server
- **Concurrently** - Run multiple npm scripts

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Account with DSQL access
- AWS CLI configured (optional, for AWS SDK)

### Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd core-team-kanban
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   Copy `.env.example` to `.env` and configure your AWS DSQL settings:

   ```bash
   cp .env.example .env
   ```

   Update the following environment variables:

   ```bash
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

   # AWS DSQL Configuration
   DSQL_ENDPOINT=your-dsql-endpoint.dsql.us-east-1.on.aws
   DSQL_PORT=5432
   DSQL_DATABASE=kanban
   DSQL_USER=your_dsql_user
   DSQL_PASSWORD=your_dsql_password
   DSQL_CLUSTER_ARN=arn:aws:dsql:us-east-1:your-account:cluster/your-cluster-id
   DSQL_SECRET_ARN=arn:aws:secretsmanager:us-east-1:your-account:secret:your-secret-name
   ```

4. **Database Setup**

   The database tables will be automatically created when the backend starts. To add sample data:

   ```bash
   npm run ts-node backend/database/migrate.ts
   ```

5. **Start the development servers**

   ```bash
   # Start both frontend and backend
   npm run dev:full

   # Or start them separately:
   npm run backend    # Backend only (port 3001)
   npm run dev        # Frontend only (port 3000)
   ```

6. **Open the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## Project Structure

```
core-team-kanban/
├── backend/                 # Express.js backend
│   ├── database/           # PostgreSQL database and schema
│   ├── routes/            # API route handlers
│   ├── types/             # TypeScript type definitions
│   └── server.ts          # Express server setup
├── src/                   # Next.js frontend
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions and API client
│   └── types/           # Frontend type definitions
├── public/              # Static assets
└── .vscode/            # VS Code tasks and settings
```

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Boards

- `GET /api/boards/project/:projectId` - Get all boards for a project
- `GET /api/boards/:id` - Get a specific board
- `POST /api/boards` - Create a new board
- `PUT /api/boards/:id` - Update a board
- `DELETE /api/boards/:id` - Delete a board

### Tasks

- `GET /api/tasks/board/:boardId` - Get all tasks for a board
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `PUT /api/tasks/reorder/positions` - Reorder tasks (drag & drop)
- `DELETE /api/tasks/:id` - Delete a task

## Development

### Available Scripts

- `npm run dev` - Start Next.js frontend development server
- `npm run backend` - Start Express.js backend development server
- `npm run dev:full` - Start both frontend and backend concurrently
- `npm run build` - Build the application for production
- `npm run start` - Start the production build
- `npm run lint` - Run ESLint

### Database

The SQLite database is automatically created and initialized when the backend starts. The database file is located at `backend/database/kanban.db`.

### VS Code Tasks

The project includes VS Code tasks for easy development:

- **Start Full Development Server** - Runs both frontend and backend
- **Start Frontend Only** - Runs just the Next.js dev server
- **Start Backend Only** - Runs just the Express.js server

Access these via VS Code: `Terminal > Run Task...`

## Usage

1. **Create a Project**: Start by creating your first project with a name, description, and color
2. **Add Boards**: Within each project, create boards to organize different areas of work
3. **Manage Tasks**: Add tasks to boards and move them through the workflow stages
4. **Organize**: Use drag-and-drop to reorder tasks and change their status
5. **Prioritize**: Set priorities and assign team members to tasks

## Deployment

### Vercel Deployment (Frontend)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Deploy

### Backend Deployment

The backend can be deployed to services like Railway, Render, or any Node.js hosting provider. Make sure to:

1. Set `NODE_ENV=production`
2. Configure CORS for your frontend domain
3. Ensure SQLite file persistence

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Next.js, TypeScript, and Express.js

# kanban
