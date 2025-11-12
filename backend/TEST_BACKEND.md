# Testing the Backend

## Step 1: Stop Current Server
Press `CTRL+C` in the terminal where Flask is running

## Step 2: Restart the Server
```bash
python app_enhanced.py
```

## Step 3: Test the API

### Test 1: Root Route (Fix 404 Error)
Open your browser and go to:
```
http://localhost:5000/
```

You should see JSON with API information instead of 404.

### Test 2: Get Patients (Should return empty list)
Open browser and go to:
```
http://localhost:5000/api/patients
```

Or use curl:
```bash
curl http://localhost:5000/api/patients
```

Should return:
```json
{
  "patients": [],
  "resources": {
    "total": {"OT": 2, "D": 3, "N": 5},
    "available": {"OT": 2, "D": 3, "N": 5}
  }
}
```

### Test 3: Create a Patient
Use Postman or curl:

```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Patient\",\"arrivalTime\":0,\"severity\":\"P1\",\"burstTime\":10,\"resourcesNeeded\":{\"OT\":1,\"D\":1,\"N\":0}}"
```

Should return a patient object with ID.

### Test 4: Get Resources
```
http://localhost:5000/api/resources
```

---

## Expected Results

✅ Root route `/` - Returns API info (no more 404)
✅ GET `/api/patients` - Returns empty list initially
✅ POST `/api/patients` - Creates patient successfully
✅ GET `/api/resources` - Returns resource state

---

## If You Still Get 404:

1. **Check you're using `app_enhanced.py`** not `app.py`
2. **Make sure Flask restarted** (you should see "Restarting with stat" in terminal)
3. **Clear browser cache** or use incognito mode
4. **Check the terminal** for any error messages


