# Task Dependency Tracker

> A full-stack web application for managing tasks with dependencies, featuring automatic circular dependency detection and real-time status updates.



##  Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [System Architecture](#system-architecture)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Configuration](#configuration)
* [Running the Application](#running-the-application)
* [API Documentation](#api-documentation)
* [Testing](#testing)
* [Project Structure](#project-structure)
* [Algorithm Implementation](#algorithm-implementation)
* [Performance Considerations](#performance-considerations)
* [Future Enhancements](#future-enhancements)
* [Contributing](#contributing)
* [License](#license)

##  Overview

Task Dependency Tracker is a sophisticated project management tool that helps teams manage tasks with complex dependencies. The system automatically detects circular dependencies using graph algorithms, prevents invalid task relationships, and cascades status updates through the dependency chain.



**Demo Video:** [Link to demonstration video]

##  Features

### Core Functionality

*  **Task Management**
  - Create, read, update, and delete tasks
  - Support for multiple task statuses (pending, in_progress, completed, blocked)
  - Rich task descriptions and metadata
  - Real-time status updates

*  **Dependency Management**
  - Create dependencies between tasks (Task A depends on Task B)
  - Support for multiple dependencies per task
  - Visual dependency relationship tracking
  - Batch dependency creation

*  **Circular Dependency Detection**
  - Automatic detection using Depth-First Search (DFS) algorithm
  - Returns exact circular path when detected
  - Prevents invalid dependency creation
  - O(V + E) time complexity for optimal performance

*  **Automatic Status Updates**
  - Intelligent status cascading through dependency tree
  - Rules-based status determination:
    - All dependencies completed → Task status: `in_progress`
    - Any dependency blocked → Task status: `blocked`
    - Dependencies pending → Task status: `pending`
  - Bi-directional update propagation

*  **Graph Visualization Support**
  - RESTful API endpoint for graph data
  - Nodes and edges format for frontend rendering
  - Support for interactive dependency graphs
  - Real-time graph updates

### Advanced Features

*  **Filtering & Search**
  - Filter tasks by status
  - Search tasks by title
  - Combined filtering support

*  **Analytics & Insights**
  - Track blocking tasks
  - Identify blocked tasks
  - Dependency chain analysis

*  **Performance Optimized**
  - Efficient database queries
  - Optimized circular detection algorithm
  - Handles 20-30+ tasks smoothly

*  **Data Integrity**
  - Transaction-safe operations
  - Cascade delete protection
  - Validation at multiple layers

##  Tech Stack

### Backend
* **Django 4.2+** - High-level Python web framework
* **Django REST Framework 3.14+** - Powerful toolkit for building Web APIs
* **SQLite/MySQL** - Database (configurable)
* **Python 3.8+** - Programming language

### Database Design
* **Relational Database** - PostgreSQL/MySQL/SQLite support
* **ORM** - Django's built-in ORM for database abstraction
* **Migrations** - Version-controlled schema changes

### API Design
* **RESTful Architecture** - Standard HTTP methods
* **JSON** - Data interchange format
* **CORS** - Cross-Origin Resource Sharing enabled

### Development Tools
* **Git** - Version control
* **Virtual Environment** - Dependency isolation
* **Django Admin** - Built-in admin interface

##  System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                          (React)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Django Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Views      │  │ Serializers  │  │   Models     │      │
│  │  (API Logic) │◄─┤  (Validation)│◄─┤ (Business    │      │
│  │              │  │              │  │   Logic)     │      │
│  └──────────────┘  └──────────────┘  └──────┬───────┘      │
│                                              │               │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                    ┌──────────▼────────────┐
                                    │     Database          │
                                    │  ┌──────────────┐     │
                                    │  │   Task       │     │
                                    │  │   Model      │     │
                                    │  └──────┬───────┘     │
                                    │         │             │
                                    │  ┌──────▼───────┐     │
                                    │  │ TaskDependency│    │
                                    │  │   Model      │     │
                                    │  └──────────────┘     │
                                    └───────────────────────┘
```

### Data Flow

1. **Request** → Client sends HTTP request to Django API
2. **Routing** → URLs route to appropriate ViewSet
3. **Validation** → Serializers validate incoming data
4. **Business Logic** → Models process and update data
5. **Circular Check** → DFS algorithm validates dependencies
6. **Database** → ORM commits changes to database
7. **Response** → Serialized data returned to client

##  Prerequisites

Before you begin, ensure you have the following installed:

* **Python 3.8 or higher**
  ```bash
  python --version
  ```

* **pip** (Python package manager)
  ```bash
  pip --version
  ```

* **Git** (for version control)
  ```bash
  git --version
  ```



* **Virtual Environment** (Recommended)
  ```bash
  python -m venv --help
  ```

##  Installation
### For Frontend
```bash
git clone https://github.com/yourusername/task-dependency-tracker.git

cd task-dependency-tracker
cd Frontend
npm install
npm run dev
```

### For Backend
### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/task-dependency-tracker.git

cd task-dependency-tracker
cd Backend
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Verify activation (you should see (venv) in your terminal)
```

### Step 3: Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 4: Database Setup

#### Option A: Using SQLite (Default - Easiest)

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Database file (db.sqlite3) will be created automatically
```

#### Option B: Using MySQL (Production)

```bash
# 1. Create MySQL database
mysql -u root -p
CREATE DATABASE task_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'taskuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON task_tracker.* TO 'taskuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. Install MySQL client
pip install mysqlclient

# 3. Update config/settings.py (see Configuration section)

# 4. Run migrations
python manage.py makemigrations
python manage.py migrate
```

### Step 5: Create Superuser

```bash
# Create admin account
python manage.py createsuperuser

# Follow the prompts:
# Username: admin
# Email: admin@example.com
# Password: ********
# Password (again): ********
```


##  Configuration


### Django Settings

Key settings in `config/settings.py`:

```python
# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('DB_NAME', BASE_DIR / 'db.sqlite3'),
        # ... additional database settings
    }
}

# CORS
CORS_ALLOW_ALL_ORIGINS = True  # For development only
```

##  Running the Application

### Development Server

```bash
# Start Django development server
python manage.py runserver

# Server will start at http://127.0.0.1:8000/
# API available at http://127.0.0.1:8000/api/
# Admin panel at http://127.0.0.1:8000/admin/
```

### Custom Port

```bash
# Run on different port
python manage.py runserver 8080
```

### Access Points

* **API Root:** http://localhost:8000/api/
* **Admin Panel:** http://localhost:8000/admin/
  - Login with superuser credentials
  - Manage tasks, dependencies, and users

* **API Documentation:** http://localhost:8000/api/docs/ (if configured)

##  API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
Currently using session authentication. For production, implement JWT or Token authentication.

### Endpoints

#### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/` | List all tasks |
| POST | `/tasks/` | Create new task |
| GET | `/tasks/{id}/` | Get task details |
| PUT | `/tasks/{id}/` | Update task |
| PATCH | `/tasks/{id}/` | Partial update |
| DELETE | `/tasks/{id}/` | Delete task |
| PATCH | `/tasks/{id}/update_status/` | Update task status |
| PATCH | `/tasks/bulk_update_status/` | Bulk update status |
| GET | `/tasks/{id}/blocking/` | Get blocking tasks |
| GET | `/tasks/{id}/blocked_by/` | Get blocked tasks |
| GET | `/tasks/graph/` | Get graph data |

#### Dependencies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dependencies/` | List all dependencies |
| POST | `/dependencies/` | Create dependency |
| DELETE | `/dependencies/{id}/` | Delete dependency |
| POST | `/dependencies/check_circular/` | Check circular dependency |
| POST | `/dependencies/batch_create/` | Batch create dependencies |

### Request/Response Examples

#### Create Task
```bash
POST /api/tasks/
Content-Type: application/json

{
  "title": "Design Database Schema",
  "description": "Create ERD and design tables",
  "status": "pending"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "Design Database Schema",
  "description": "Create ERD and design tables",
  "status": "pending",
  "dependencies": [],
  "dependents": [],
  "created_at": "2024-01-20T10:00:00Z",
  "updated_at": "2024-01-20T10:00:00Z"
}
```

#### Create Dependency
```bash
POST /api/dependencies/
Content-Type: application/json

{
  "task": 2,
  "depends_on": 1
}
```

**Response:**
```json
{
  "id": 1,
  "task": 2,
  "task_title": "Build API",
  "depends_on": 1,
  "depends_on_title": "Design Database Schema",
  "created_at": "2024-01-20T11:00:00Z"
}
```

#### Check Circular Dependency
```bash
POST /api/dependencies/check_circular/
Content-Type: application/json

{
  "task": 3,
  "depends_on": 1
}
```

**Response (No Cycle):**
```json
{
  "is_circular": false,
  "message": "No circular dependency detected"
}
```

**Response (Cycle Detected):**
```json
{
  "is_circular": true,
  "path": [1, 2, 3, 1],
  "path_titles": ["Task A", "Task B", "Task C", "Task A"]
}
```

#### Get Graph Data
```bash
GET /api/tasks/graph/
```

**Response:**
```json
{
  "nodes": [
    {
      "id": 1,
      "title": "Task A",
      "status": "completed",
      "description": "First task",
      "dependencies": []
    },
    {
      "id": 2,
      "title": "Task B",
      "status": "in_progress",
      "description": "Second task",
      "dependencies": [1]
    }
  ],
  "edges": [
    {
      "from": 1,
      "to": 2
    }
  ]
}
```

### Query Parameters

#### Filter Tasks
```bash
# Filter by status
GET /api/tasks/?status=pending

# Search by title
GET /api/tasks/?title=database

# Combined filters
GET /api/tasks/?status=in_progress&title=api
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Circular dependency detected",
  "path": [1, 3, 5, 1],
  "path_titles": ["Task A", "Task C", "Task E", "Task A"]
}
```

#### 404 Not Found
```json
{
  "detail": "Not found."
}
```

#### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

##  Testing

### Run All Tests
```bash
# Run Django test suite
python manage.py test

# Run with verbose output
python manage.py test --verbosity=2

# Run specific test file
python manage.py test tasks.tests
```

### Manual API Testing

#### Using cURL
```bash
# Create task
curl -X POST http://localhost:8000/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","status":"pending"}'

# Get all tasks
curl http://localhost:8000/api/tasks/

# Check circular dependency
curl -X POST http://localhost:8000/api/dependencies/check_circular/ \
  -H "Content-Type: application/json" \
  -d '{"task":1,"depends_on":2}'
```


##  Backend Project Structure

```
task-dependency-tracker/
│
├── config/                      # Django project configuration
│   ├── __init__.py
│   ├── settings.py             # Main settings file
│   ├── urls.py                 # Root URL configuration
│   ├── asgi.py                 # ASGI configuration
│   └── wsgi.py                 # WSGI configuration
│
├── tasks/                       # Main application
│   ├── migrations/             # Database migrations
│   │   └── __init__.py
│   ├── __init__.py
│   ├── admin.py                # Django admin configuration
│   ├── apps.py                 # App configuration
│   ├── models.py               # Database models (Task, TaskDependency)
│   ├── serializers.py          # DRF serializers
│   ├── views.py                # API views and business logic
│   ├── urls.py                 # App URL routing
│   └── tests.py                # Unit tests
│
├── venv/                        # Virtual environment (not in git)
│
├── db.sqlite3                   # SQLite database (not in git)
├── manage.py                    # Django management script
├── requirements.txt             # Python dependencies
├── README.md                    # This file
├── DECISIONS.md                 # Architecture decisions
├── test_api.py                  # API test script
├── .env                         # Environment variables (not in git)
├── .gitignore                   # Git ignore rules
└── LICENSE                      # License file
```

##  Algorithm Implementation

### Circular Dependency Detection

The system uses **Depth-First Search (DFS)** to detect cycles in the dependency graph.

#### Algorithm Explanation


#### Why DFS?

1. **Optimal Time Complexity:** O(V + E) - visits each vertex and edge once
2. **Early Detection:** Stops as soon as cycle is found
3. **Path Tracking:** Can return exact circular path
4. **Space Efficient:** Uses recursion stack efficiently

#### Example Scenarios

**Scenario 1: Valid Dependencies**
```
A → B → C
D → C
```
Result:  No cycle, all dependencies valid

**Scenario 2: Circular Dependency**
```
A → B → C → A
```
Result:  Cycle detected: [A, B, C, A]

**Scenario 3: Complex Graph**
```
A → B → D
A → C → D
D → E
```
Result:  No cycle, DAG (Directed Acyclic Graph)





##  Performance Considerations

### Database Optimization

1. **Indexes**
   - Primary keys indexed by default
   - Foreign keys indexed for faster joins
   - Consider adding index on `status` field for frequent filtering

2. **Query Optimization**
   - Use `select_related()` for foreign key relationships
   - Use `prefetch_related()` for reverse relationships
   - Avoid N+1 queries with proper eager loading

3. **Caching Strategy**
   - Cache graph data for read-heavy operations
   - Invalidate cache on dependency changes
   - Use Django's caching framework

### Algorithm Performance

* **Circular Detection:** O(V + E) time complexity
* **Status Updates:** O(D) where D = number of dependents
* **Graph Generation:** O(V + E) to traverse all nodes and edges

### Scalability

Current system handles:
*  20-30 tasks smoothly (as per requirements)
*  Complex dependency chains (5+ levels deep)
*  Multiple dependencies per task (10+)

For larger scale:
* Consider graph database (Neo4j) for 1000+ tasks
* Implement pagination for large task lists
* Add background jobs for bulk operations
* Use database connection pooling

##  Future Enhancements

### Phase 1 (Near-term)
* [ ] User authentication and authorization
* [ ] Task assignment to team members
* [ ] Email notifications for status changes
* [ ] Task priority levels (P0, P1, P2, P3)
* [ ] Due dates and deadline tracking
* [ ] Task comments and activity log
* [ ]  AI-powered task estimation
* [ ]  Drag-and-drop task reordering




##  Author

**Your Name**
* GitHub: [Rishabh Gupta](https://github.com/RishabhGupta19/Task-Tracker-Management)
* LinkedIn: [Rishabh Gupta](https://www.linkedin.com/in/rishabh-gupta-b8832b311/)
* Email: rishabh134we@gmail.com
* Portfolio : www.rishabhs.xyz



**Made with ❤️ for the SDE Intern Assignment**

