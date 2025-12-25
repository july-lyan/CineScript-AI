# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CineScript AI is a video analysis and script generation platform that uses Google Gemini API to analyze video content (from YouTube/Bilibili/Xiaohongshu URLs or descriptions) and generate professional shooting scripts. It features a pay-per-use model with free trials.

## Development Commands

```bash
# Install dependencies
npm install

# Run frontend (port 3000)
npm run dev

# Run backend server (port 4000) - must run in separate terminal
npm run server

# Build for production
npm run build

# Preview production build
npm run preview
```

**Note:** Both frontend and backend must run simultaneously for the app to work. The frontend proxies `/api` requests to the backend.

## Architecture

### Frontend (Single-Page React App)
- **Entry:** `index.tsx` - Contains all React components, types, and UI logic in a single file
- **Bundler:** Vite with React plugin (`vite.config.ts`)
- **Styling:** TailwindCSS via CDN, supports dark/light theme switching
- **Icons:** Lucide React

### Backend (Express API Server)
- **Entry:** `server/index.js` - Complete backend in a single file
- **Port:** 4000 (configurable via `PORT` env var)

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze?tier=free\|paid` | POST | Analyze video, body: `{input: string}` |
| `/api/pay` | POST | Create payment order, body: `{channel, count}` |
| `/api/pay/status` | GET | Poll payment status, query: `orderId` |
| `/api/pay/callback` | POST | Payment gateway callback |
| `/health` | GET | Health check |

### Data Flow
1. User inputs video URL/description → Frontend calls `/api/analyze`
2. Backend validates usage quota (free: 3 uses, paid: credits)
3. Backend calls Gemini API with structured prompt
4. AI returns JSON with analysis + script → displayed in frontend

### State Management
- **Frontend:** React `useState` + `localStorage` for theme preference
- **Backend:** In-memory `Map` objects (not persistent - data lost on restart)
  - `orders`: Payment order tracking
  - `userState`: User quota/credits by session ID

## Environment Variables

Create `.env.local` in project root:

```bash
# Required
GEMINI_API_KEY=your_api_key

# Optional - defaults to GEMINI_API_KEY if not set
FREE_GENAI_KEY=key_for_free_tier
PAID_GENAI_KEY=key_for_paid_tier

# Payment config (test values included by default)
PAY_MCH_ID=merchant_id
PAY_SIGN_KEY=sign_key
PAY_NOTIFY_URL=https://your-domain.com/api/pay/callback
PAY_RETURN_URL=https://your-domain.com/pay/return
```

## Key Implementation Details

- **AI Models:** Free tier uses `gemini-2.5-flash`, paid tier uses `gemini-3-pro-preview`
- **Session tracking:** Uses `x-session-id` header or IP address
- **Payment integration:** Kuaizhifu/Easypay with MD5 signature verification
- **Developer mode:** Only visible when running on localhost on macOS
