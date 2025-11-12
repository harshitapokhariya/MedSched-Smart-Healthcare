def round_robin(patients, quantum):
    """
    Round Robin Scheduling:
    Rotates patients in fixed time slices (quantum).
    """
    time = 0
    remaining = {p['name']: p['burst'] for p in patients}
    arrival_map = {p['name']: p['arrival'] for p in patients}
    completed = []
    queue = [p for p in patients if p['arrival'] <= time]

    while any(remaining.values()):
        if not queue:
            time += 1
            queue = [p for p in patients if p['arrival'] <= time and remaining[p['name']] > 0]
            continue

        for p in queue:
            name = p['name']
            if remaining[name] > 0:
                slice_time = min(quantum, remaining[name])
                completed.append({
                    "name": name,
                    "arrival": arrival_map[name],
                    "duration": slice_time
                })
                remaining[name] -= slice_time
                time += slice_time

        queue = [p for p in patients if p['arrival'] <= time and remaining[p['name']] > 0]
    return completed