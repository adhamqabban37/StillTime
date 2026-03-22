import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { AppContext } from "./context/AppContext.tsx";
import Header from "./components/Header.tsx";
import AddTaskForm from "./components/AddTaskForm.tsx";
import BottomNav from "./components/BottomNav.tsx";
import HomeScreen from "./screens/HomeScreen.tsx";
import TimelineScreen from "./screens/TimelineScreen.tsx";
import HabitTrackerScreen from "./screens/HabitTrackerScreen.tsx";
import InboxScreen from "./screens/InboxScreen.tsx";
import ReviewScreen from "./screens/ReviewScreen.tsx";
import MatrixScreen from "./screens/MatrixScreen.tsx";
import FocusScreen from "./screens/FocusScreen.tsx";
import TaskControlPanel from "./components/TaskControlPanel.tsx";
import ActionPanel from "./components/ActionPanel.tsx";
import Toast from "./components/Toast.tsx";
import Confetti from "./components/Confetti.tsx";
import {
  initializeNotifications,
  requestNotificationPermission,
} from "./logic/notifications.ts";

// Screen order for swipe navigation (matches BottomNav order)
const SCREENS = [
  "Home",
  "Timeline",
  "Matrix",
  "Habits",
  "Inbox",
  "Review",
] as const;

export default function App() {
  const { state, dispatch } = useContext(AppContext);
  const { activeModal, focusedTask } = state;

  // Swipe navigation state
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const isVerticalDrag = useRef(false);
  const swipeLockRef = useRef(false);

  // Initialize notifications on app start
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await initializeNotifications();
        await requestNotificationPermission();
      } catch (error) {
        console.log("Notifications setup:", error);
      }
    };
    setupNotifications();
  }, []);

  // Allow child components (timeline drag) to temporarily lock swipe navigation
  useEffect(() => {
    const handleLock = () => {
      swipeLockRef.current = true;
    };
    const handleUnlock = () => {
      swipeLockRef.current = false;
    };

    window.addEventListener("focusflow:lockSwipe", handleLock);
    window.addEventListener("focusflow:unlockSwipe", handleUnlock);
    return () => {
      window.removeEventListener("focusflow:lockSwipe", handleLock);
      window.removeEventListener("focusflow:unlockSwipe", handleUnlock);
    };
  }, []);

  const renderScreen = () => {
    switch (state.mode) {
      case "Home":
        return <HomeScreen />;
      case "Timeline":
        return <TimelineScreen />;
      case "Habits":
        return <HabitTrackerScreen />;
      case "Inbox":
        return <InboxScreen />;
      case "Review":
        return <ReviewScreen />;
      case "Matrix":
        return <MatrixScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Swipe navigation handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't swipe when modal is open or form is open
    if (focusedTask || activeModal || state.isAddTaskFormOpen) return;
    if (swipeLockRef.current) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    isVerticalDrag.current = false;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || activeModal || state.isAddTaskFormOpen) return;
    if (swipeLockRef.current) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    // Detect if this is primarily a vertical drag (for task dragging)
    const deltaX = Math.abs(touchEndX.current - touchStartX.current);
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);

    // If vertical movement is greater, this is likely a task drag - don't interfere
    if (deltaY > deltaX && deltaY > 10) {
      isVerticalDrag.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping || activeModal || state.isAddTaskFormOpen) return;
    setIsSwiping(false);
    if (swipeLockRef.current) {
      isVerticalDrag.current = false;
      swipeLockRef.current = false;
      return;
    }

    // Don't trigger screen swipe if this was a vertical drag (task rescheduling)
    if (isVerticalDrag.current) {
      isVerticalDrag.current = false;
      return;
    }

    const swipeDistance = touchStartX.current - touchEndX.current;
    const swipeDistanceY = Math.abs(touchStartY.current - touchEndY.current);
    const minSwipeDistance = 50; // Minimum swipe distance to trigger navigation

    // Only trigger horizontal swipe if horizontal movement is dominant
    if (Math.abs(swipeDistance) < minSwipeDistance) return;
    if (swipeDistanceY > Math.abs(swipeDistance) * 0.5) return; // Ignore diagonal swipes

    const currentIndex = SCREENS.indexOf(
      state.mode as (typeof SCREENS)[number]
    );
    if (currentIndex === -1) return;

    if (swipeDistance > 0 && currentIndex < SCREENS.length - 1) {
      // Swipe left - go to next screen
      dispatch({ type: "SET_MODE", payload: SCREENS[currentIndex + 1] });
    } else if (swipeDistance < 0 && currentIndex > 0) {
      // Swipe right - go to previous screen
      dispatch({ type: "SET_MODE", payload: SCREENS[currentIndex - 1] });
    }
  };

  // Android-like back button handling for modals
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we are in a modal state, prevent default back navigation and close the modal.
      if (activeModal) {
        event.preventDefault();
        dispatch({ type: "CLOSE_ACTIVE_MODAL" });
      }
    };

    const isModalOpen = !!activeModal;

    if (isModalOpen && window.history.state?.modal !== true) {
      window.history.pushState({ modal: true }, "");
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [activeModal, dispatch]);

  // Back button handling for focus screen
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (focusedTask) {
        event.preventDefault();
        if (
          window.confirm(
            "Are you sure you want to end this focus session early?"
          )
        ) {
          dispatch({ type: "END_FOCUS" });
        } else {
          // If user cancels, push the state back to keep the focus screen "locked"
          window.history.pushState({ focus: true }, "");
        }
      }
    };

    if (focusedTask && window.history.state?.focus !== true) {
      window.history.pushState({ focus: true }, "");
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [focusedTask, dispatch]);

  return (
    <div
      className="min-h-screen font-sans flex flex-col pb-16 bg-slate-50 dark:bg-[#0a0a0c] text-slate-800 dark:text-slate-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
        <div key={state.mode} className="screen-enter">
          {renderScreen()}
        </div>
      </main>

      <Toast />

      {state.showConfetti && (
        <Confetti onComplete={() => dispatch({ type: "HIDE_CONFETTI" })} />
      )}

      {!state.focusedTask && <BottomNav />}

      {state.isAddTaskFormOpen && <AddTaskForm />}
      {state.controlPanelTask && (
        <TaskControlPanel task={state.controlPanelTask} />
      )}
      {state.actionPanelItem && <ActionPanel item={state.actionPanelItem} />}
      {state.focusedTask && <FocusScreen task={state.focusedTask} />}
    </div>
  );
}
