import matplotlib.pyplot as plt

def gantt_chart(patients, title):
    fig, ax = plt.subplots()
    for p in patients:
        ax.barh(y=f"P{p.pid}", left=p.start, width=p.treatment)
    ax.set_xlabel("Time")
    ax.set_ylabel("Patient ID")
    ax.set_title(title)
    plt.show()