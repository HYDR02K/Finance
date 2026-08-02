import type { Moment } from "moment";

export interface Cycle {
  start: Moment;
  end: Moment;
}

/**
 * Returns the cycle (e.g. 26th of a month -> 25th of the next month) that
 * contains `date`, using `startDay` as the day of month the cycle begins on.
 */
export function getCycle(date: Moment, startDay: number): Cycle {
  const d = date.clone();
  let start: Moment;
  let end: Moment;

  if (d.date() >= startDay) {
    start = d.clone().startOf("day").date(startDay);
    end = d.clone().add(1, "month").date(startDay).subtract(1, "day").startOf("day");
  } else {
    start = d.clone().subtract(1, "month").date(startDay).startOf("day");
    end = d.clone().date(startDay).subtract(1, "day").startOf("day");
  }
  return { start, end };
}

export function cycleLabel(cycle: Cycle): string {
  return `${cycle.start.format("D MMM")} \u2013 ${cycle.end.format("D MMM YYYY")}`;
}

export function cycleKey(cycle: Cycle): string {
  return cycle.start.format("YYYY-MM-DD");
}

export function isInCycle(date: Moment, cycle: Cycle): boolean {
  return date.isSameOrAfter(cycle.start, "day") && date.isSameOrBefore(cycle.end, "day");
}
