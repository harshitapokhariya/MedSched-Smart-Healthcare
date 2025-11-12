from sample_data import get_sample
from scheduler import fcfs, sjf, round_robin, severity
from utils.metrics import print_metrics
from utils.display import gantt_chart

def run_scheduler(algorithm, quantum=2):
    patients = get_sample()
    if algorithm == "fcfs":
        fcfs.schedule(patients)
    elif algorithm == "sjf":
        sjf.schedule(patients)
    elif algorithm == "rr":
        round_robin.schedule(patients, quantum)
    elif algorithm == "severity":
        severity.schedule(patients)
    print_metrics(patients)
    gantt_chart(patients, f"{algorithm.upper()} Scheduling")

if __name__ == "__main__":
    run_scheduler("fcfs")
    run_scheduler("sjf")
    run_scheduler("rr", quantum=2)
    run_scheduler("severity")