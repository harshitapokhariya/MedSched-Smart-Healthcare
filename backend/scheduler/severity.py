def priority_scheduling(patients):
    time = 0
    completed = []
    remaining = patients.copy()

    while remaining:
        ready = [p for p in remaining if p['arrival'] <= time]
        if not ready:
            time += 1
            continue
        highest_priority = min(ready, key=lambda x: x['priority'])  # Lower = higher priority
        completed.append({
            "name": highest_priority['name'],
            "arrival": highest_priority['arrival'],
            "duration": highest_priority['burst']
        })
        time += highest_priority['burst']
        remaining.remove(highest_priority)
    return completed