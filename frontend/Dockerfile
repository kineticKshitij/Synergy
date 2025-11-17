# Frontend Dockerfile for React Router v7
FROM node:20-alpine AS development-dependencies-env
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS build-env
WORKDIR /app
COPY package*.json ./
COPY --from=development-dependencies-env /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built application
COPY --from=build-env /app/build ./build
COPY --from=build-env /app/public ./public

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start"]
