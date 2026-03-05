# Leave Tracker - App Documentation & Memory

## Purpose
A simple and clean desktop application to track teammates' leaves. It is designed to run locally as a desktop application (specifically targeted for Windows) using SQLite for local data storage.

## Tech Stack
- **Frontend:** Angular (v20)
- **Desktop Framework:** Tauri (v2)
- **Language:** TypeScript (Frontend), Rust (Tauri backend)
- **Database:** SQLite (local database)
- **Package Manager:** Yarn

## Core Features
1. **Employee Management:** Create, Read, Update, and Delete (CRUD) employee profiles (names).
2. **Leave Tracking:** Update employee records with specific leave details including:
   - Leave Type (annual, sick, casual)
   - Date of leave
   - Reason for leave
3. **Leave Summary & Details:** View detailed leave history for any given employee, including calculating the total leave taken and the remaining leave balance.

## Project Structure
- `src/`: Contains the Angular frontend code.
- `src-tauri/`: Contains the Tauri backend code and configuration (Rust).
- `instruction.md`: Contains the initial, high-level project instructions and goals.
- `package.json` / `tauri.conf.json`: Configuration for frontend dependencies and Tauri build respectively.

## Notes for AI Agents
- **Maintain this document:** Update this `MEMORY.MD` file whenever significant architectural decisions, new features, or important context are added to the application.
- **Local specific:** The app is designed to be fully local. Do not introduce cloud dependencies or external API calls for data storage unless explicitly requested.
