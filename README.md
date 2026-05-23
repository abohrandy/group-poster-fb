# SocialDiscovery - Facebook Automation & Group Discovery Engine

SocialDiscovery is a modern, high-performance control panel and task orchestration system designed for automated Facebook group discovery and post scraping. It utilizes a decoupled architecture where browser-automation workers (Playwright) execute tasks scheduled via a central Next.js dashboard.

---

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **ORM**: [Prisma ORM v6](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Security**: Custom session-based database cookies + password hashing (bcryptjs)
- **Automation** (Planned): Headless browser execution via Playwright

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.17.0 or higher.
- **PostgreSQL**: A running instance (local, Supabase, or Railway).

### 2. Environment Setup
Create a `.env` file in the project root:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/social_discovery?schema=public"
```

### 3. Installation
Install all dependencies:
```bash
npm install
```

### 4. Database Setup & Migrations
Sync the Prisma schema with your PostgreSQL instance and generate the local client:
```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Running the Application
Launch the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the landing homepage and console login.

---

## Architectural Documentation
Detailed descriptions of the design patterns and features can be found in the `/docs` directory:
- [01-Project Overview](file:///c:/Work/SHRC/Faecbook%20App%20-%20Copy/docs/01-project-overview.md): Goals, future modules, and system overview.
- [02-System Architecture](file:///c:/Work/SHRC/Faecbook%20App%20-%20Copy/docs/02-system-architecture.md): Decoding Scraper/Frontend flow sequence.
- [03-Database Schema](file:///c:/Work/SHRC/Faecbook%20App%20-%20Copy/docs/03-database-schema.md): Model structures and table configurations.
- [04-Authentication](file:///c:/Work/SHRC/Faecbook%20App%20-%20Copy/docs/04-authentication.md): Session security policies and middleware gates.
