
import { useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { getAIPoweredSuggestion } from '../logic/aiNextAction.ts';
import { useGemini } from './useGemini.ts';

export const useNextAction = () => {
    const { state, dispatch } = useContext(AppContext);
    const { tasks, activeTask, nextActionSuggestion } = state;
    const { getMotivation } = useGemini();

    const generateSuggestion = useCallback(async () => {
        // Don't generate a new suggestion if there's an active task or focus session
        if (activeTask || state.focusedTask) {
            if (nextActionSuggestion) {
                dispatch({ type: 'SET_NEXT_ACTION_SUGGESTION', payload: null });
            }
            return;
        }

        const candidate = getAIPoweredSuggestion(tasks);
        
        if (candidate) {
            // Avoid re-fetching if the suggestion is the same
            if (nextActionSuggestion?.task.id === candidate.task.id) return;

            const reason = await getMotivation(candidate.task.title, candidate.suggestionType);
            dispatch({
                type: 'SET_NEXT_ACTION_SUGGESTION',
                payload: {
                    task: candidate.task,
                    suggestionType: candidate.suggestionType,
                    reason: reason,
                },
            });
        } else {
            if (nextActionSuggestion) {
                dispatch({ type: 'SET_NEXT_ACTION_SUGGESTION', payload: null });
            }
        }
    }, [tasks, activeTask, state.focusedTask, getMotivation, dispatch, nextActionSuggestion]);

    useEffect(() => {
        // Generate suggestion on initial load and when tasks change
        generateSuggestion();

        // Periodically re-evaluate the suggestion
        const interval = setInterval(() => {
            generateSuggestion();
        }, 5 * 60 * 1000); // every 5 minutes

        return () => clearInterval(interval);
    }, [generateSuggestion]);

    return { suggestion: state.nextActionSuggestion };
};
