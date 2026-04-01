# BoardVerse

BoardVerse is a Web 2 project split into a React frontend and an Express backend.
This branch focuses on the UI shell owned by member 5: layouts, routing, theme flow,
home page content, and environment/setup notes.

## Project Structure

```text
project-backend/
project-frontend/
```

## Frontend

Location: `project-frontend`

Main responsibilities in this branch:
- client layout and admin layout
- navbar, footer, theme toggle
- browser routing shell
- home, unauthorized, and not-found pages

Setup:

```bash
cd project-frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend env:

```env
VITE_API_URL=https://localhost:3443/api/v1
VITE_API_KEY=boardverse-dev-key
```

## Backend

Location: `project-backend`

Setup:

```bash
cd project-backend
cp .env.example .env
npm install
npm run migrate
npm run seed
npm start
```

Important backend env values:

```env
PORT=3443
BASE_URL=https://localhost:3443/api/v1
API_KEY=boardverse-dev-key
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=postgres
```

## Demo Routes

- `/`
- `/games`
- `/profile`
- `/friends`
- `/messages`
- `/rankings`
- `/admin/statistics`
- `/admin/users`
- `/admin/games`

## Notes

- This repository is organized by member ownership to reduce merge conflicts.
- Member 5 owns the UI shell, routing, theme flow, and setup documentation.
