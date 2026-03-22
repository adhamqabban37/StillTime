import React, { useState } from "react";
import { Habit, HabitLog, HabitLogStatus } from "../types.ts";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons.tsx";
import {
  getHabitStatusForDate,
  isHabitExpectedOnDate,
  getDateString,
} from "../logic/habitUtils.ts";

interface HabitCalendarProps {
  habit: Habit;
  logs: HabitLog[];
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habit, logs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = getDateString(new Date());

  const getDayStatus = (
    day: number
  ): {
    status: HabitLogStatus | null;
    isExpected: boolean;
    isFuture: boolean;
  } => {
    const date = new Date(year, month, day);
    const dateStr = getDateString(date);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const isFuture = date > todayDate;
    const isExpected = isHabitExpectedOnDate(habit, dateStr);

    // Don't show status for future dates
    if (isFuture) {
      return { status: null, isExpected, isFuture: true };
    }

    // Check if the habit existed on this date
    const habitCreatedAt = new Date(habit.createdAt);
    habitCreatedAt.setHours(0, 0, 0, 0);
    if (date < habitCreatedAt) {
      return { status: null, isExpected: false, isFuture: false };
    }

    const status = getHabitStatusForDate(habit.id, dateStr, logs);

    // If no log and was expected, it's missed (only for past dates)
    if (!status && isExpected) {
      return { status: "missed", isExpected, isFuture: false };
    }

    return { status, isExpected, isFuture: false };
  };

  const getStatusColor = (
    status: HabitLogStatus | null,
    isExpected: boolean,
    isFuture: boolean,
    isToday: boolean
  ) => {
    if (isFuture) {
      return isExpected
        ? "bg-slate-600/30 border border-dashed border-slate-500/50"
        : "bg-slate-700/20";
    }

    if (status === "done") {
      return "bg-green-500 text-white";
    }

    if (status === "missed") {
      return "bg-red-500/60 text-white";
    }

    if (!isExpected) {
      return "bg-slate-700/30 text-slate-500"; // Rest day
    }

    if (isToday) {
      return "bg-indigo-500/50 border border-indigo-400 text-white";
    }

    return "bg-slate-600/50 text-slate-400";
  };

  // Build calendar grid
  const calendarDays = [];

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
        </button>
        <h3 className="text-lg font-semibold text-white">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = getDateString(new Date(year, month, day));
          const isToday = dateStr === today;
          const { status, isExpected, isFuture } = getDayStatus(day);
          const colorClass = getStatusColor(
            status,
            isExpected,
            isFuture,
            isToday
          );

          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${colorClass} ${
                isToday
                  ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900"
                  : ""
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-slate-400">Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/60" />
          <span className="text-slate-400">Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-700/30" />
          <span className="text-slate-400">Rest day</span>
        </div>
      </div>
    </div>
  );
};

export default HabitCalendar;
