🩺 MedSched
Smart Scheduling for Smarter Healthcare


🎯 1. Project Overview

MedSched is a modern web-app designed to streamline hospital operations — from patient admission and triage to resource scheduling and monitoring.

It simulates and manages hospital scheduling logic inspired by OS algorithms (like priority and deadlock prevention) to ensure fair and efficient patient treatment order.

Built with: Next.js, Tailwind CSS, shadcn/ui, TypeScript, and next-themes.

🧱 2. Key Features

🧍‍♀️ Patient Queue Management – Add, monitor, and manage patients with severity, burst time, and resource needs.

⚙️ Resource Allocation – Track and assign resources (OT slots, specialists, nurses).

🌗 Light / Dark Mode Toggle – Fully functional and customizable theme switcher.

💻 Responsive Interface – Seamlessly adapts to mobile and desktop screens.

🔐 Login System (Upcoming) – Email & password authentication with built-in validation.

📊 Future Integration – Real-time analytics, resource utilization, and patient throughput visualization.

⚡ 3. Recent Updates

Homepage Alignment

“MedSched” title and tagline moved to top-left corner (replacing old “HOSP-OS” heading).

Removed excessive spacing below header.

Navigation Buttons

Button text always visible (no hover dependency).

Subtle hover animation (hover:scale-105 transition-transform).

Consistent theme color in both light and dark modes.

Sign-In Form

Added login UI with Email and Password fields.

Email field validates @ and correct format.

Password must be at least 6 characters long.

Error messages displayed below invalid fields.

Light / Dark Mode

Implemented using next-themes.

Persistent theme preference across sessions.

Smooth transition animation between modes.

Uses two complementary color palettes:

Light mode → soft bluish-white (from-indigo-50 to-white)

Dark mode → deep navy/charcoal (from-gray-900 to-gray-800)

Footer Removed

Removed the line “Built with Next.js, Tailwind, shadcn/ui…” for a cleaner UI.

🧩 4. Technologies Used

Next.js – React-based framework for SSR & static sites

TypeScript – Strong typing for safer, scalable code

Tailwind CSS – Utility-first styling framework

shadcn/ui – Prebuilt accessible UI components

next-themes – Theme switching and persistence

Lucide-React – Icon library

Recharts (planned) – Data visualization for analytics

🛠️ 5. Project Setup
🧰 Prerequisites

Node.js (v16 or higher)

pnpm / npm / yarn

Git

⚙️ Installation Steps

Clone the repository

git clone https://github.com/harshitapokhariya/MedSched-Smart-Healthcare.git
cd MedSched-Smart-Healthcare


Install dependencies

pnpm install


(or use npm install / yarn install)

Start the development server

pnpm dev


The app will run on http://localhost:3000

(Optional) Deploy on Vercel

Connect your GitHub repo to Vercel

Push changes → automatic build and deployment

🧭 6. Folder Structure
MedSched/
│
├── app/                  # Next.js App Router pages
├── components/           # Reusable UI components
├── lib/                  # Utility and helper functions
├── public/               # Static assets
├── styles/               # Tailwind and global styles
│
├── next.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml

🎨 7. Theme & Styling Guidelines
Element	Light Mode	Dark Mode
Background	from-indigo-50 via-white to-blue-50	from-gray-900 via-gray-800 to-gray-900
Text	text-gray-800	text-gray-100
Buttons	bg-primary text-white hover:bg-primary/80	Same as Light
Cards	bg-white shadow-md	bg-gray-900 shadow-lg


🪪 8. License

This project is licensed under the MIT License.

⭐ If you found this project helpful, don’t forget to star the repo!
