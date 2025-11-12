def print_metrics(patients):
    print(f"{'PID':<5}{'Arrival':<8}{'Severity':<9}{'Treatment':<10}{'Start':<7}{'Complete':<9}{'Waiting':<9}{'Turnaround':<11}")
    for p in patients:
        wait = p.start - p.arrival
        tat = p.complete - p.arrival
        print(f"{p.pid:<5}{p.arrival:<8}{p.severity:<9}{p.treatment:<10}{p.start:<7}{p.complete:<9}{wait:<9}{tat:<11}")