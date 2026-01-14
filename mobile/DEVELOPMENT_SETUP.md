# Development Setup Guide

## Connecting Mobile App to Local Backend

### Quick Setup

1. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend runs on `http://localhost:8080`

2. **Start Mobile App:**
   ```bash
   cd mobile
   npm start
   ```

### API URL Configuration

The app automatically detects the environment and sets the API URL:

- **Android Emulator**: Uses `http://10.0.2.2:8080/api/v1` (automatically)
- **iOS Simulator**: Uses `http://localhost:8080/api/v1` (automatically)
- **Physical Device**: Requires manual configuration

### For Physical Devices

If you're testing on a physical device, you need to set your computer's IP address:

1. **Find your computer's IP address:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)

2. **Set environment variable:**
   ```bash
   # Windows PowerShell
   $env:EXPO_PUBLIC_API_URL="http://192.168.1.100:8080/api/v1"
   npm start
   
   # Or create .env file in mobile directory:
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080/api/v1
   ```

3. **Make sure your device and computer are on the same network**

4. **Check firewall**: Windows Firewall may block port 8080. Allow it if needed.

### Troubleshooting

#### No requests showing in backend logs

1. **Check API URL in app:**
   - Look for `[API] Base URL configured:` in console
   - Should show `http://10.0.2.2:8080/api/v1` (Android) or `http://localhost:8080/api/v1` (iOS)

2. **Check backend is running:**
   ```bash
   curl http://localhost:8080/api/v1/health
   ```

3. **Check CORS settings:**
   - Backend should have `CORS_ORIGIN=*` in `.env` for development

4. **Check network:**
   - Android emulator: Should automatically use 10.0.2.2
   - Physical device: Must use computer's IP address, not localhost

#### Connection refused errors

- Backend not running on port 8080
- Wrong port in API URL
- Firewall blocking connection

#### CORS errors

- Update backend `.env`: `CORS_ORIGIN=*`
- Restart backend server

### Debug Logging

The app logs API requests in development mode. Look for:
- `[API] Base URL configured:` - Shows which URL is being used
- `[API] POST /auth/login` - Shows requests being made
- `[API] Health check successful` - Confirms connection

### Testing Connection

1. **Check health endpoint:**
   - The app automatically checks `/health` on startup
   - Look for health check logs in console

2. **Test login:**
   - Try logging in with test credentials
   - Check backend logs for incoming requests
   - Check mobile console for API logs

### Common Issues

**Issue**: "Unable to connect to server"
- **Solution**: Check backend is running, check API URL, check network

**Issue**: Requests go to production URL
- **Solution**: Make sure `__DEV__` is true, check environment variables

**Issue**: Works on emulator but not physical device
- **Solution**: Use computer's IP address instead of localhost

