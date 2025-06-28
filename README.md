# Next.js + NestJS Monorepo Template

## 🚀 Overview
This template provides a **monorepo setup** for building scalable full-stack applications using **Next.js (Frontend)** and **NestJS (Backend)**. It includes **Turbo** for optimized task running and caching, making development faster and more efficient.

## 📂 Project Structure
```
📦 your-project/
 ├── 📦 apps/
 │   ├── backend/  (NestJS API)
 │   ├── web-next/  (Next.js Frontend)
 ├── 📦 packages/  (Shared Utilities)
 │   ├── api-client/  (Common API handling)
 │   ├── logging/  (Mouse activity tracking)
 │   ├── ui-components/  (ShadCN UI)
 ├── 📜 turbo.json  (Turbo monorepo config)
 ├── 📜 package.json  (Project dependencies & scripts)
 ├── 📜 README.md
```

## 🛠 Features
✅ **Monorepo with Turbo** – Optimized builds & task execution
✅ **Next.js (Frontend)** – SSR, Static Site Generation & API Routes
✅ **NestJS (Backend)** – Scalable API framework with decorators
✅ **Workspaces Support** – Shared packages for API calls, UI, logging
✅ **Full TypeScript Support**
✅ **Optional UI Components (ShadCN)**
✅ **Mouse Activity Logging (Optional)**
✅ **One-Click Deploy to Vercel**

## 🚀 Getting Started
### 1️⃣ Install Dependencies
```sh
pnpm install
```

### 2️⃣ Run the Development Servers
```sh
pnpm run dev
```
This will start both **Next.js** and **NestJS** concurrently using Turbo.

### 3️⃣ Build & Start the App
```sh
pnpm run build
pnpm run start
```

## ⚙️ Configuration
Modify **`config.json`** to enable/disable optional features:
```json
{
  "typescript": true,
  "tailwind": true,
  "shadcn": false,
  "logging": false
}
```

## 🔥 Deployment
### Deploy to **Vercel**
```sh
vercel --prod
```

## 🛠 Available Commands
| Command            | Description                                      |
|--------------------|--------------------------------------------------|
| `pnpm install`    | Install all dependencies in the monorepo         |
| `pnpm run dev`    | Start both backend (NestJS) & frontend (Next.js) |
| `pnpm run build`  | Build both frontend & backend                    |
| `pnpm run start`  | Start the production servers for all apps        |
| `pnpm run lint`   | Lint & check formatting                          |

## 🎯 Next Steps
- Configure **environment variables** in `.env` files.
- Integrate **authentication (OAuth, JWT, etc.)**.
- Enable **API caching with Redis**.
- Set up **database migrations**.

## 📜 License
This project is licensed under **MIT License**.

## 📞 Need Help?
For any issues, feel free to open a GitHub issue or reach out in the community!

