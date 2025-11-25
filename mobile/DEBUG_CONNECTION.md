# Debugging API Connection Issues

## Quick Checklist

1. **Backend is running** ✅ (You confirmed with `curl http://localhost:8080/api/v1/health`)
2. **Mobile app is running** - Make sure the app is actually loaded on the emulator/device
3. **Check console logs** - Look for these logs when the app starts:

## Expected Console Logs

When the app starts, you should see:

```
═══════════════════════════════════════
[CONFIG] API URL: http://10.0.2.2:8080/api/v1
[CONFIG] Festival: Big Fam Festival
═══════════════════════════════════════

[API] ===========================================
[API] Base URL configured: http://10.0.2.2:8080/api/v1
[API] Platform: android
[API] Development mode: true
[API] ===========================================

[STARTUP] Checking API health...
[STARTUP] ✅ API connection successful!
```

When you try to login/register, you should see:

```
[API] → POST http://10.0.2.2:8080/api/v1/auth/login
[API] ← POST http://10.0.2.2:8080/api/v1/auth/login [200]
```

## Troubleshooting Steps

### 1. Check if App is Actually Running

The Metro bundler says "No apps connected" - this means the app isn't running yet.

**Solution:**
- Make sure you've built and installed the development build on your emulator
- If using Expo Go, scan the QR code
- If using development build, make sure it's installed: `npx expo run:android`

### 2. Verify API URL

Check the console logs to see what URL is being used:
- **Android Emulator**: Should be `http://10.0.2.2:8080/api/v1`
- **Physical Device**: Should be `http://192.168.50.244:8080/api/v1` (your computer's IP)

### 3. Test Backend from Emulator

From your computer, test if the backend is accessible:
```powershell
# Test localhost (should work)
curl http://localhost:8080/api/v1/health

# Test with your IP (for physical devices)
curl http://192.168.50.244:8080/api/v1/health
```

### 4. Check Backend CORS Settings

Make sure your backend allows requests from the mobile app. Check `backend/src/main.ts`:
- CORS should allow your origin
- For development, you might need to allow all origins temporarily

### 5. Check Network Connection

The app checks network connectivity on startup. If you see:
```
[STARTUP] ⚠️ No network connection detected
```
This means the emulator/device doesn't have internet.

### 6. Check Backend Logs

When you try to login/register, check your backend terminal. You should see:
```
[Nest] POST /api/v1/auth/login
```

If you don't see this, the request isn't reaching the backend.

## Common Issues

### Issue: "No apps connected"
**Solution:** Build and install the app:
```bash
cd mobile
npx expo run:android
```

### Issue: API URL shows localhost on Android emulator
**Solution:** The `getApiUrl()` function should automatically use `10.0.2.2` for Android. If it doesn't, check:
- `mobile/src/utils/getApiUrl.ts` is being used
- `Platform.OS === 'android'` is working correctly

### Issue: Requests timeout
**Solution:** 
- Check if backend is running on port 8080
- Check if firewall is blocking connections
- For physical device, make sure device and computer are on same WiFi

### Issue: CORS errors
**Solution:** Update `backend/src/main.ts` to allow your origin:
```typescript
app.enableCors({
  origin: ['http://localhost:8081', 'exp://192.168.50.244:8081'],
  credentials: true,
});
```

## Next Steps

1. **Reload the app** - Press `r` in Metro bundler or shake device and select "Reload"
2. **Check console logs** - Look for the `[API]` and `[STARTUP]` logs
3. **Try login/register** - Watch both mobile console and backend logs
4. **Share the logs** - If it still doesn't work, share:
   - Mobile console logs (especially `[API]` logs)
   - Backend logs (when you try to login)
   - The exact error message you see

