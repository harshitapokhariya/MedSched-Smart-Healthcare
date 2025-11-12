def fcfs(patients):
    """
    First Come First Serve Scheduling:
    Processes patients in order of arrival time.
    """
    sorted_patients = sorted(patients, key=lambda x: x['arrival'])
    return [
        {
            "name": p["name"],
            "arrival": p["arrival"],
            "duration": p["burst"]
        }
        for p in sorted_patients
    ]