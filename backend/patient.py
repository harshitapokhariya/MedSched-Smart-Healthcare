class Patient:
    def __init__(self, pid, arrival, severity, treatment):
        self.pid = pid
        self.arrival = arrival
        self.severity = severity
        self.treatment = treatment
        self.remaining = treatment
        self.start = None
        self.complete = None