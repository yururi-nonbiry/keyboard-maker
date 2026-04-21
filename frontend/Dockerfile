FROM node:20-slim

WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

# Start Vite with --host to expose to Docker network
CMD ["npm", "run", "dev", "--", "--host"]
