
import { AppState, AppAction, Task } from '../types.ts';
import { BADGES } from '../constants.ts';

export const checkAndAwardBadges = (state: AppState, dispatch: React.Dispatch<AppAction>, completedTask?: Task) => {
    Object.values(BADGES).forEach(badge => {
        if (!state.gamification.badges.includes(badge.id) && badge.condition(state, completedTask)) {
            dispatch({ type: 'AWARD_BADGE', payload: badge.id });
            dispatch({ type: 'SHOW_TOAST', payload: { message: `Badge Unlocked: ${badge.name}`, icon: badge.icon } });
        }
    });
};
