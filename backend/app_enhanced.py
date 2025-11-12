from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid

# Import algorithms from scheduler folder
from scheduler.fcfs import fcfs
from scheduler.sjf import sjf
from scheduler.severity import priority_scheduling
from scheduler.round_robin import round_robin

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Root route - API info
@app.route('/')
def index():
    return jsonify({
        "message": "MedSched API Server",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/patients": "Get all patients and resources",
            "POST /api/patients": "Create new patient",
            "PUT /api/patients/<id>": "Update patient",
            "DELETE /api/patients/<id>": "Delete patient",
            "POST /api/patients/<id>/allocate": "Allocate resources to patient",
            "POST /api/scheduling": "Run scheduling algorithm",
            "POST /api/bankers": "Check safety state (Banker's algorithm)",
            "GET /api/resources": "Get current resource state"
        }
    })

# In-memory data store (replace with database in production)
patients_store = []
resources_state = {
    "total": {"OT": 2, "D": 3, "N": 5},
    "available": {"OT": 2, "D": 3, "N": 5}
}

def update_available_resources():
    """Update available resources based on current allocations"""
    total_allocated = {"OT": 0, "D": 0, "N": 0}
    for patient in patients_store:
        total_allocated["OT"] += patient.get("resourcesAllocated", {}).get("OT", 0)
        total_allocated["D"] += patient.get("resourcesAllocated", {}).get("D", 0)
        total_allocated["N"] += patient.get("resourcesAllocated", {}).get("N", 0)
    
    resources_state["available"] = {
        "OT": resources_state["total"]["OT"] - total_allocated["OT"],
        "D": resources_state["total"]["D"] - total_allocated["D"],
        "N": resources_state["total"]["N"] - total_allocated["N"]
    }

# Patient CRUD Operations
@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients and resources"""
    update_available_resources()
    return jsonify({
        "patients": patients_store,
        "resources": resources_state
    })

@app.route('/api/patients', methods=['POST'])
def create_patient():
    """Create a new patient"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'arrivalTime', 'severity', 'burstTime', 'resourcesNeeded']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate severity
    if data['severity'] not in ['P1', 'P2', 'P3']:
        return jsonify({"error": "Invalid severity. Must be P1, P2, or P3"}), 400
    
    # Create new patient
    new_patient = {
        "id": str(uuid.uuid4()),
        "name": data['name'],
        "arrivalTime": data['arrivalTime'],
        "severity": data['severity'],
        "burstTime": data['burstTime'],
        "resourcesNeeded": data['resourcesNeeded'],
        "resourcesAllocated": {"OT": 0, "D": 0, "N": 0},
        "status": "Waiting"
    }
    
    patients_store.append(new_patient)
    update_available_resources()
    
    return jsonify({"patient": new_patient}), 201

@app.route('/api/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Update a patient"""
    data = request.get_json()
    
    patient_index = next((i for i, p in enumerate(patients_store) if p['id'] == patient_id), None)
    if patient_index is None:
        return jsonify({"error": "Patient not found"}), 404
    
    # Update patient fields
    if 'status' in data and data['status'] == 'Treated':
        # Release resources when marking as treated
        patient = patients_store[patient_index]
        if 'resourcesAllocated' in patient:
            resources_state["available"]["OT"] += patient["resourcesAllocated"].get("OT", 0)
            resources_state["available"]["D"] += patient["resourcesAllocated"].get("D", 0)
            resources_state["available"]["N"] += patient["resourcesAllocated"].get("N", 0)
        patients_store[patient_index]["resourcesAllocated"] = {"OT": 0, "D": 0, "N": 0}
    
    # Update other fields
    for key, value in data.items():
        if key != 'id':  # Don't allow ID changes
            patients_store[patient_index][key] = value
    
    update_available_resources()
    return jsonify({"patient": patients_store[patient_index]})

@app.route('/api/patients/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    """Delete a patient"""
    patient_index = next((i for i, p in enumerate(patients_store) if p['id'] == patient_id), None)
    if patient_index is None:
        return jsonify({"error": "Patient not found"}), 404
    
    # Release resources
    patient = patients_store[patient_index]
    if 'resourcesAllocated' in patient:
        resources_state["available"]["OT"] += patient["resourcesAllocated"].get("OT", 0)
        resources_state["available"]["D"] += patient["resourcesAllocated"].get("D", 0)
        resources_state["available"]["N"] += patient["resourcesAllocated"].get("N", 0)
    
    del patients_store[patient_index]
    update_available_resources()
    
    return jsonify({"success": True})

@app.route('/api/patients/<patient_id>/allocate', methods=['POST'])
def allocate_resources(patient_id):
    """Allocate resources to a patient"""
    data = request.get_json()
    allocation = data.get('allocation', {})
    
    patient_index = next((i for i, p in enumerate(patients_store) if p['id'] == patient_id), None)
    if patient_index is None:
        return jsonify({"error": "Patient not found"}), 404
    
    # Check if resources are available
    current_allocation = patients_store[patient_index].get("resourcesAllocated", {"OT": 0, "D": 0, "N": 0})
    new_allocation = {
        "OT": allocation.get("OT", current_allocation.get("OT", 0)),
        "D": allocation.get("D", current_allocation.get("D", 0)),
        "N": allocation.get("N", current_allocation.get("N", 0))
    }
    
    # Calculate required resources
    current_total = {"OT": 0, "D": 0, "N": 0}
    for p in patients_store:
        if p['id'] != patient_id:
            alloc = p.get("resourcesAllocated", {"OT": 0, "D": 0, "N": 0})
            current_total["OT"] += alloc.get("OT", 0)
            current_total["D"] += alloc.get("D", 0)
            current_total["N"] += alloc.get("N", 0)
    
    required = {
        "OT": current_total["OT"] + new_allocation["OT"],
        "D": current_total["D"] + new_allocation["D"],
        "N": current_total["N"] + new_allocation["N"]
    }
    
    if (required["OT"] > resources_state["total"]["OT"] or
        required["D"] > resources_state["total"]["D"] or
        required["N"] > resources_state["total"]["N"]):
        return jsonify({"error": "Insufficient resources"}), 400
    
    # Update allocation
    patients_store[patient_index]["resourcesAllocated"] = new_allocation
    update_available_resources()
    
    return jsonify({
        "patient": patients_store[patient_index],
        "resources": resources_state
    })

# Scheduling endpoint
@app.route('/api/scheduling', methods=['POST'])
def schedule():
    """Run scheduling algorithm"""
    data = request.get_json()
    
    if not data or 'algorithm' not in data:
        return jsonify({"error": "Algorithm is required"}), 400
    
    algo = data['algorithm']
    quantum = data.get('quantum', 2)
    
    # Get patients from store or request
    patients_data = data.get('patients', patients_store)
    
    # Convert to format expected by algorithms
    patients_for_algo = []
    for p in patients_data:
        patients_for_algo.append({
            "name": p.get("name", ""),
            "arrival": p.get("arrivalTime", 0),
            "burst": p.get("burstTime", 0),
            "priority": {"P1": 1, "P2": 2, "P3": 3}.get(p.get("severity", "P2"), 2)
        })
    
    if not patients_for_algo:
        return jsonify({"error": "No patients available"}), 400
    
    # Map algorithm names to match frontend
    algo_map = {
        "FCFS": "FCFS",
        "SJF": "SJF",
        "RR": "RR",
        "PRIORITY": "Priority",
        "Priority": "Priority"
    }
    
    algo_key = algo_map.get(algo, "FCFS")
    
    # Run algorithm
    if algo_key == "FCFS":
        schedule_result = fcfs(patients_for_algo)
    elif algo_key == "SJF":
        schedule_result = sjf(patients_for_algo)
    elif algo_key == "Priority":
        schedule_result = priority_scheduling(patients_for_algo)
    elif algo_key == "RR":
        schedule_result = round_robin(patients_for_algo, quantum)
    else:
        schedule_result = fcfs(patients_for_algo)
    
    # Convert to frontend format
    # Create a mapping of patient names to IDs
    name_to_id = {p.get("name", ""): p.get("id", "") for p in patients_data}
    name_to_severity = {p.get("name", ""): p.get("severity", "P2") for p in patients_data}
    
    segments = []
    current_time = 0
    for item in schedule_result:
        patient_name = item.get("name", "")
        duration = item.get("duration", 0)
        start_time = current_time
        end_time = current_time + duration
        
        segments.append({
            "patientId": name_to_id.get(patient_name, ""),
            "patientName": patient_name,
            "severity": name_to_severity.get(patient_name, "P2"),
            "start": start_time,
            "end": end_time
        })
        current_time = end_time
    
    # Calculate metrics
    total_waiting = 0
    arrival_map = {p.get("name", ""): p.get("arrivalTime", 0) for p in patients_data}
    
    for seg in segments:
        waiting = max(0, seg["start"] - arrival_map.get(seg["patientName"], 0))
        total_waiting += waiting
    
    avg_waiting = total_waiting / len(patients_data) if patients_data else 0
    total_processed = len(patients_data)
    
    makespan = max([s["end"] for s in segments]) - min([s["start"] for s in segments]) if segments else 0
    throughput = (total_processed / makespan * 60) if makespan > 0 else 0
    
    # Build utilization points (simplified - would need more logic for actual resource utilization)
    utilization = []
    if segments:
        time_points = set()
        for seg in segments:
            time_points.add(seg["start"])
            time_points.add(seg["end"])
        for t in sorted(time_points):
            utilization.append({"time": t, "OT": 0, "D": 0, "N": 0})
    
    return jsonify({
        "result": {
            "segments": segments,
            "averageWaitingTime": round(avg_waiting, 2),
            "totalProcessed": total_processed,
            "throughput": round(throughput, 2),
            "utilization": utilization
        }
    })

# Banker's Algorithm endpoint
@app.route('/api/bankers', methods=['POST'])
def bankers_check():
    """Check if resource request is safe using Banker's algorithm"""
    data = request.get_json()
    
    patient_id = data.get('patientId')
    request_resources = data.get('request', {})
    
    if not patient_id or not request_resources:
        return jsonify({"error": "patientId and request are required"}), 400
    
    # Find patient
    patient = next((p for p in patients_store if p['id'] == patient_id), None)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
    # Build rows for Banker's algorithm
    rows = []
    for p in patients_store:
        max_need = p.get("resourcesNeeded", {"OT": 0, "D": 0, "N": 0})
        alloc = p.get("resourcesAllocated", {"OT": 0, "D": 0, "N": 0})
        need = {
            "OT": max(0, max_need.get("OT", 0) - alloc.get("OT", 0)),
            "D": max(0, max_need.get("D", 0) - alloc.get("D", 0)),
            "N": max(0, max_need.get("N", 0) - alloc.get("N", 0))
        }
        rows.append({
            "id": p["id"],
            "name": p.get("name", ""),
            "severity": p.get("severity", "P2"),
            "alloc": alloc,
            "max": max_need,
            "need": need
        })
    
    # Banker's Algorithm
    work = resources_state["available"].copy()
    
    # Check if request is valid
    patient_row = next((r for r in rows if r['id'] == patient_id), None)
    if not patient_row:
        return jsonify({"result": {"safe": False, "safeSequence": []}})
    
    # Check Request <= Need
    for resource in ["OT", "D", "N"]:
        if request_resources.get(resource, 0) > patient_row["need"].get(resource, 0):
            return jsonify({"result": {"safe": False, "safeSequence": []}})
        # Check Request <= Available
        if request_resources.get(resource, 0) > work.get(resource, 0):
            return jsonify({"result": {"safe": False, "safeSequence": []}})
    
    # Tentatively allocate
    work = {k: work[k] - request_resources.get(k, 0) for k in work}
    patient_row["alloc"] = {
        k: patient_row["alloc"].get(k, 0) + request_resources.get(k, 0)
        for k in ["OT", "D", "N"]
    }
    patient_row["need"] = {
        k: patient_row["need"].get(k, 0) - request_resources.get(k, 0)
        for k in ["OT", "D", "N"]
    }
    
    # Safety algorithm
    finished = {row["id"]: False for row in rows}
    safe_sequence = []
    progress = True
    
    while progress:
        progress = False
        for row in rows:
            if finished[row["id"]]:
                continue
            # Check if need <= work for all resources
            if all(row["need"].get(k, 0) <= work.get(k, 0) for k in ["OT", "D", "N"]):
                # Can finish this process
                for k in ["OT", "D", "N"]:
                    work[k] += row["alloc"].get(k, 0)
                finished[row["id"]] = True
                safe_sequence.append(row["id"])
                progress = True
    
    safe = all(finished.values())
    
    return jsonify({
        "result": {
            "safe": safe,
            "safeSequence": safe_sequence if safe else []
        }
    })

# Resources endpoint
@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get current resource state"""
    update_available_resources()
    return jsonify({"resources": resources_state})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

