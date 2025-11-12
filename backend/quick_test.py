"""
Quick test script to verify backend is working
Run this while the Flask server is running
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_root():
    print("Testing root route...")
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        print("✅ Root route works!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Root route failed: {response.status_code}")
    print()

def test_get_patients():
    print("Testing GET /api/patients...")
    response = requests.get(f"{BASE_URL}/api/patients")
    if response.status_code == 200:
        print("✅ Get patients works!")
        data = response.json()
        print(f"Patients: {len(data.get('patients', []))}")
        print(f"Resources: {data.get('resources', {})}")
    else:
        print(f"❌ Get patients failed: {response.status_code}")
    print()

def test_create_patient():
    print("Testing POST /api/patients...")
    patient_data = {
        "name": "Test Patient",
        "arrivalTime": 0,
        "severity": "P1",
        "burstTime": 10,
        "resourcesNeeded": {"OT": 1, "D": 1, "N": 0}
    }
    response = requests.post(
        f"{BASE_URL}/api/patients",
        json=patient_data,
        headers={"Content-Type": "application/json"}
    )
    if response.status_code == 201:
        print("✅ Create patient works!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Create patient failed: {response.status_code}")
        print(response.text)
    print()

def test_get_resources():
    print("Testing GET /api/resources...")
    response = requests.get(f"{BASE_URL}/api/resources")
    if response.status_code == 200:
        print("✅ Get resources works!")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ Get resources failed: {response.status_code}")
    print()

if __name__ == "__main__":
    print("=" * 50)
    print("Backend API Test")
    print("=" * 50)
    print()
    
    try:
        test_root()
        test_get_patients()
        test_create_patient()
        test_get_resources()
        
        print("=" * 50)
        print("✅ All tests completed!")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to backend!")
        print("Make sure Flask server is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ ERROR: {e}")


