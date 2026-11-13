# Micro Travel Planner

A small travel-planning web application built with Node.js, Express and MongoDB. It includes account registration and login, trip management and photo uploads.

## Technology
- Node.js and Express 5
- MongoDB with Mongoose
- HTML, CSS and JavaScript
- bcrypt for password hashing and Multer for uploads

## Run locally
1. Install Node.js and make a local or hosted MongoDB database available.
2. Run `npm install`.
3. Create a local `.env` file with `MONGODB_URI` pointing to your database. Keep credentials out of Git.
4. Run `npm run dev`.
5. Open `http://localhost:3000/login.html` or `http://localhost:3000/signup.html`.

The server currently uses port 3000. Its front-end CORS allowlist also includes localhost on port 5500.

## Repository guide
| Path | Purpose |
| --- | --- |
| [index.js](index.js) | Express server, authentication endpoints and route mounting |
| [db.js](db.js) | MongoDB connection |
| [public/](public/) | Browser pages, styles and scripts |
| [models/](models/) | Data models |
| [routs/](routs/) | Trip and photo API routes |
| [middleware/](middleware/) | Upload handling |

## Project status
Academic project. The login endpoint returns user information but does not issue a session or JWT; production authentication and access-control review are still needed. The current `npm test` command is a placeholder.

**Author:** Rudra Joyti Maitra Soham
