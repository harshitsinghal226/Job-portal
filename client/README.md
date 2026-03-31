# Job Portal Client

A React + Vite frontend for the job portal application.

## Environment Setup

Before running the application, you need to create a `.env` file in the client directory with the following variables:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the `.env` file with your configuration

3. Start the development server:
   ```bash
   npm run dev
   ```

## Building for Production

```bash
npm run build
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
