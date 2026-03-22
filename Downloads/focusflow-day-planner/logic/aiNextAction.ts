
import { Task, SuggestionType } from '../types.ts';

interface SuggestionCandidate {
    task: Task;
    suggestionType: SuggestionType;
}

export const getAIPoweredSuggestion = (tasks: Task[]): SuggestionCandidate | null => {
    const now = new Date();
    const currentHour = now.getHours();
    
    const upcomingTasks = tasks.filter(t => !t.completed);
    if (upcomingTasks.length === 0) {
        return null; // No tasks left to suggest
    }

    // Time-based heuristics
    if (currentHour >= 8 && currentHour < 12) { // Morning: Deep work
        const deepWorkTask = upcomingTasks.find(t => t.duration >= 45 && t.type === 'Task');
        if (deepWorkTask) {
            return { task: deepWorkTask, suggestionType: 'deep_work' };
        }
    }

    if (currentHour >= 13 && currentHour < 16) { // Afternoon: Low energy
        const lowEnergyTask = upcomingTasks.find(t => t.duration <= 20);
        if (lowEnergyTask) {
            return { task: lowEnergyTask, suggestionType: 'low_energy' };
        }
        const habit = upcomingTasks.find(t => t.type === 'Habit');
        if (habit) {
            return { task: habit, suggestionType: 'habit' };
        }
    }

    if (currentHour >= 16 && currentHour < 18) { // Evening: Wrap up
        const wrapUpTask = upcomingTasks.find(t => t.duration < 30);
        if (wrapUpTask) {
            return { task: wrapUpTask, suggestionType: 'wrap_up' };
        }
    }

    // Default fallback: suggest the very next available task
    const nextTask = upcomingTasks.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    if (nextTask) {
        return { task: nextTask, suggestionType: nextTask.type === 'Habit' ? 'habit' : 'deep_work' };
    }

    return null;
};
