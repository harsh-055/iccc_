# Railway Deployment Guide

## 🚀 Quick Start

1. **Connect your repository to Railway**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment Variables**
   Add these environment variables in Railway dashboard:

   ```bash
   # Required Environment Variables
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=your_postgres_connection_string
   
   # Authentication
   JWT_SECRET=your_jwt_secret
   
   # External Services
   LENSCLOUD_API=your_lenscloud_api_url
   LENS_SMS_URL=your_sms_service_url
   LENS_MAIL_URL=your_mail_service_url
   LENS_WHATSAPP_URL=your_whatsapp_service_url
   
   # Verification URLs
   LENS_VERIFICATION_MAIL_URL=your_verification_mail_url
   LENS_VERIFICATION_SMS_URL=your_verification_sms_url
   LENS_VERIFICATION_WHATSAPP_URL=your_verification_whatsapp_url
   LENS_VERIFY_MAIL_URL=your_verify_mail_url
   LENS_VERIFY_SMS_URL=your_verify_sms_url
   LENS_VERIFY_WHATSAPP_URL=your_verify_whatsapp_url
   
   # Redis (if using)
   REDIS_HOST=your_redis_host
   REDIS_PORT=6379
   
   # CORS
   CORS_ORIGIN=your_frontend_url
   ```

3. **Deploy**
   - Railway will automatically detect the configuration files
   - The build process will install dependencies and build the application
   - Database migrations will run automatically
   - The application will start on the configured port

## 📁 Configuration Files

- `railway.json` - Railway deployment configuration
- `start.sh` - Custom startup script with migrations
- `Dockerfile` - Docker configuration for containerized deployment

## 🔧 Build Process

1. **Install Dependencies**: `npm install` in the backend directory
2. **Run Migrations**: Database migrations are executed automatically
3. **Build Application**: `npm run build` creates the production build
4. **Start Application**: `npm run start:prod` starts the server

## 🏥 Health Check

The application includes a health check endpoint at `/api/v1/health` that Railway uses to monitor the service.

## 🐛 Troubleshooting

### Common Issues:

1. **Missing Environment Variables**
   - Ensure all required environment variables are set in Railway dashboard
   - Check the logs for validation errors

2. **Database Connection Issues**
   - Verify your `DATABASE_URL` is correct
   - Ensure the database is accessible from Railway's network

3. **Build Failures**
   - Check that all dependencies are properly listed in `package.json`
   - Verify the Node.js version is compatible

4. **Port Issues**
   - Railway automatically assigns a `PORT` environment variable
   - The application listens on this port

## 📊 Monitoring

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Automatic health monitoring via `/api/v1/health`

## 🔄 Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Railway will automatically trigger a new deployment
3. The new version will be deployed with zero downtime

## 📞 Support

If you encounter issues:
1. Check the Railway logs for error messages
2. Verify all environment variables are set correctly
3. Ensure your database is accessible and properly configured 