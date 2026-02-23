// lib/goal-utils.ts
import {
  addDays,
  addWeeks,
  addMonths,
  isBefore,
  differenceInHours,
} from "date-fns";

type DateValue = Date | string;

const toDate = (value: DateValue): Date => {
  return value instanceof Date ? value : new Date(value);
};

// Pure functions for date calculations
export const getNextMonday = (fromDate: DateValue = new Date()): Date => {
  const date = new Date(toDate(fromDate));
  const day = date.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(9, 0, 0, 0); // Set to 9 AM
  return date;
};

export const calculateDailyDeadline = (hour: number = 21): Date => {
  const deadline = new Date();
  deadline.setHours(hour, 0, 0, 0);

  // If today's deadline already passed, set for tomorrow
  if (isBefore(deadline, new Date())) {
    deadline.setDate(deadline.getDate() + 1);
  }

  return deadline;
};

export const calculateNextCheckin = (
  targetDate: DateValue,
  recurrence: "none" | "daily" | "weekly" | "monthly",
): Date => {
  const now = new Date();

  switch (recurrence) {
    case "daily":
      return addDays(now, 1);
    case "weekly":
      return addWeeks(now, 1);
    case "monthly":
      return addMonths(now, 1);
    case "none":
    default:
      return new Date(targetDate);
  }
};

export const calculateTimeRemaining = (deadline: DateValue): string => {
  const now = new Date();
  const hours = differenceInHours(toDate(deadline), now);

  if (hours <= 0) return "Expired";
  if (hours < 24) return `${hours} hours`;

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
};

export const isGoalExpired = (targetDate: DateValue): boolean => {
  return isBefore(toDate(targetDate), new Date());
};

export const calculatePenaltyAmount = (
  baseAmount: number,
  daysLate: number,
  gracePeriod: number = 0,
): number => {
  if (daysLate <= gracePeriod) return 0;

  // Exponential penalty: 10% increase per day late
  const penaltyMultiplier = Math.pow(1.1, daysLate - gracePeriod);
  return Math.round(baseAmount * penaltyMultiplier);
};

// Immutable goal status updates
export const updateGoalStatus = (
  goal: any,
  newStatus: "active" | "completed" | "failed" | "cancelled",
) => ({
  ...goal,
  status: newStatus,
  updated_at: new Date().toISOString(),
});
