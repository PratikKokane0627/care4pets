export const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getVaccinationReminderState = (vaccination, today = startOfDay()) => {
  if (!vaccination?.nextDueDate) {
    return {
      calculatedStatus: "completed",
      dueLabel: "Vaccination completed",
      reminderLabel: "Disabled",
      canSendReminder: false,
      reminderKind: "disabled",
    };
  }

  const dueDate = startOfDay(vaccination.nextDueDate);
  const daysUntilDue = Math.round(
    (dueDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return {
      calculatedStatus: "overdue",
      dueLabel: `Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`,
      reminderLabel: "Send Overdue Reminder",
      canSendReminder: true,
      reminderKind: "overdue",
      overdueDays,
    };
  }

  if (daysUntilDue === 0) {
    return {
      calculatedStatus: "upcoming",
      dueLabel: "Due today",
      reminderLabel: "Send Due Reminder",
      canSendReminder: true,
      reminderKind: "due-today",
      daysRemaining: 0,
    };
  }

  if (daysUntilDue === 1) {
    return {
      calculatedStatus: "upcoming",
      dueLabel: "Next dose due tomorrow",
      reminderLabel: "Send Final Reminder",
      canSendReminder: true,
      reminderKind: "final",
      daysRemaining: 1,
    };
  }

  return {
    calculatedStatus: "upcoming",
    dueLabel: `Next dose due in ${daysUntilDue} days`,
    reminderLabel: daysUntilDue <= 7 ? "Send Reminder" : "Send Later",
    canSendReminder: daysUntilDue <= 7,
    reminderKind: daysUntilDue <= 7 ? "first" : "send-later",
    daysRemaining: daysUntilDue,
  };
};

export const getPetVaccinationState = (vaccinations = [], today = startOfDay()) => {
  const activeVaccinations = vaccinations.filter(Boolean);

  if (!activeVaccinations.length) {
    return {
      vaccinationStatus: "Pending",
      vaccinationSummary: "No vaccination record",
    };
  }

  const states = activeVaccinations.map((vaccination) =>
    getVaccinationReminderState(vaccination, today)
  );

  if (states.some((state) => state.calculatedStatus === "overdue")) {
    return {
      vaccinationStatus: "Overdue",
      vaccinationSummary: "Booster dose overdue",
    };
  }

  if (states.some((state) => state.calculatedStatus === "upcoming")) {
    const nearest = states
      .filter((state) => state.calculatedStatus === "upcoming")
      .sort((a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity))[0];

    return {
      vaccinationStatus: "Upcoming",
      vaccinationSummary: nearest?.dueLabel || "Next booster scheduled",
    };
  }

  return {
    vaccinationStatus: "Completed",
    vaccinationSummary: "Vaccination completed",
  };
};

export const withVaccinationState = (vaccination, today = startOfDay()) => {
  const raw = typeof vaccination.toObject === "function"
    ? vaccination.toObject()
    : vaccination;

  return {
    ...raw,
    vaccinationCompleted: Boolean(raw.vaccinationDate),
    ...getVaccinationReminderState(raw, today),
  };
};
