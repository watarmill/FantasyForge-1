# Architecture Overview

## 1. Overview

This application is a real estate platform called "Estate Hub" built with a modern full-stack JavaScript/TypeScript architecture. It follows a client-server model with a React frontend and Node.js Express backend. The application provides functionality for property listings, user management (with different roles like admin, agent, user), property search and filtering, messaging between users, and favoriting properties.

## 2. System Architecture

The application follows a monorepo structure with clear separation between client and server code:

```
/
├── client/            # Frontend React application
├── server/            # Express backend server
├── db/                # Database setup and migrations
├── shared/            # Shared code between client and server
```

### Core Technologies

- **Frontend**: React with TypeScript, using the ShadCN UI component library built on Radix UI primitives
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL accessed through Drizzle ORM
- **API**: RESTful API design
- **Authentication**: Session-based authentication using Passport.js
- **Styling**: Tailwind CSS
- **Build Tools**: Vite, ESBuild

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built with React and follows a component-based architecture. Key aspects include:

- **Component Organization**: 
  - UI components in `client/src/components/ui/`
  - Feature-specific components in dedicated folders like `components/properties/`
  - Layout components for consistent page structure

- **Routing**: Uses the `wouter` router library with a centralized route configuration in `App.tsx`

- **State Management**: 
  - React Query for server state (API data)
  - React Context for authentication state
  - Local component state for UI elements

- **Component Library**: Leverages ShadCN UI built on top of Radix UI primitives

- **Styling**: Tailwind CSS with theme customization

### 3.2 Backend Architecture

The backend uses Express.js and is organized as follows:

- **Server Setup**: Main Express application initialization in `server/index.ts`
- **Authentication**: Custom auth implementation in `server/auth.ts` using Passport.js
- **API Routes**: Defined in `server/routes.ts`  
- **Data Storage**: Abstracted through a storage service in `server/storage.ts`

### 3.3 Database Architecture

The application uses PostgreSQL with Drizzle ORM:

- **Schema Definition**: Defined in `shared/schema.ts` using Drizzle schema builders
- **Database Connection**: Managed through the Neon serverless PostgreSQL driver
- **Migration Management**: Uses Drizzle Kit for migrations
- **Seed Data**: Initial data seeding through `db/seed.ts`

The main entities in the database schema are:
- Users (with role-based access control)
- Properties
- Favorites
- Messages

### 3.4 Authentication and Authorization

- **Authentication**: Session-based using `express-session` with PostgreSQL session storage
- **Password Security**: Hashed using scrypt with random salt
- **Authorization**: Role-based access control with three roles:
  - Admin: Complete access to all features
  - Agent: Can create and manage property listings
  - User: Can browse properties, mark favorites, send messages

- **Protected Routes**: Client-side route protection using a custom `ProtectedRoute` component

## 4. Data Flow

### 4.1 Client-Server Communication

1. The frontend makes RESTful API calls to the backend using the React Query library
2. The backend processes requests, interacts with the database, and returns JSON responses
3. Authentication is maintained through HTTP-only cookies containing session IDs

### 4.2 Database Interaction

1. The backend interacts with the database through the Drizzle ORM
2. Database operations are abstracted through the storage service (`server/storage.ts`)
3. Data validation is performed using Zod schemas derived from the Drizzle schema

### 4.3 Real-time Features

- Messaging between users (agents and clients)
- Property status updates

## 5. External Dependencies

### 5.1 Core Libraries

- **UI Components**: Radix UI primitives with ShadCN UI
- **Data Fetching**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Database ORM**: Drizzle ORM
- **Database Provider**: Neon Postgres (serverless)
- **Authentication**: Passport.js
- **Session Management**: express-session with connect-pg-simple

### 5.2 Development Tools

- **Bundling**: Vite
- **Server Bundling**: ESBuild
- **Type Checking**: TypeScript
- **Database Migration**: Drizzle Kit

## 6. Deployment Strategy

The application is configured for deployment on Replit with:

- **Development Mode**: Using `npm run dev`
- **Production Build**: Using `npm run build` and `npm run start`
- **Database Management**: Environment variables for database configuration
- **Asset Serving**: Static assets served from the `dist/public` directory

The deployment process uses:
1. Build step: `npm run build` (compiles both client and server)
2. Start command: `NODE_ENV=production node dist/index.js`
3. Database connection via the `DATABASE_URL` environment variable

The app supports autoscaling through Replit's deployment configuration.

## 7. Security Considerations

- **Password Security**: Uses scrypt with random salt for secure password hashing
- **Session Security**: HTTP-only cookies with secure flag in production
- **CSRF Protection**: Uses appropriate sameSite cookie settings
- **Input Validation**: Zod schema validation for all user inputs
- **Database Security**: Prepared statements via Drizzle ORM to prevent SQL injection

## 8. Performance Considerations

- **Server-Side Rendering**: Not implemented, using client-side rendering
- **API Caching**: React Query provides client-side caching of API responses
- **Database Optimization**: Relational schema design with appropriate indexes
- **Asset Optimization**: Static assets built and optimized by Vite

## 9. Future Scalability

The architecture is designed to support future enhancements:

- **Microservices**: Could be split into separate services if needed
- **Cloud Deployment**: Compatible with various cloud hosting providers
- **Feature Expansion**: Clear component and module structure allows for adding new features