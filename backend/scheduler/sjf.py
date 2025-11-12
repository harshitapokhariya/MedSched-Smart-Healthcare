def sjf(patients):
    time = 0
    completed = []
    remaining = patients.copy()

    while remaining:
        ready = [p for p in remaining if p['arrival'] <= time]
        if not ready:
            time += 1
            continue
        shortest = min(ready, key=lambda x: x['burst'])
        completed.append({"name": shortest['name'], "arrival": shortest['arrival'], "duration": shortest['burst']})
        time += shortest['burst']
        remaining.remove(shortest)
    return completed