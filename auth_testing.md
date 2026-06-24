# Auth-Gated App Testing Playbook (CrowdMind AI)

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  auth_provider: 'google',
  role: 'user',
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  session_token: sessionToken,
  user_id: userId,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Cookie-based (Google session)
curl -X GET "$URL/api/auth/me" -H "Cookie: session_token=YOUR_SESSION_TOKEN"

# JWT-based (email/password)
curl -X POST "$URL/api/auth/register" -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","name":"Jane","password":"Secret123!"}'

curl -X POST "$URL/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Secret123!"}'

# Use returned token
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer YOUR_JWT"
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://your-app.com/dashboard")
```

## Checklist
- [ ] User document has `user_id` (custom UUID, separate from MongoDB `_id`)
- [ ] Session `user_id` matches user's `user_id` exactly
- [ ] All queries use `{"_id": 0}` projection
- [ ] `/api/auth/me` returns user data (both cookie and Bearer)
- [ ] Dashboard loads without redirect to login
