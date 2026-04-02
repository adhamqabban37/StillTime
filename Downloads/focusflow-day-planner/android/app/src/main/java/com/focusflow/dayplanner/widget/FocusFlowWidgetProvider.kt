package com.focusflow.dayplanner.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.focusflow.dayplanner.MainActivity
import com.focusflow.dayplanner.R
import org.json.JSONArray
import org.json.JSONObject

class FocusFlowWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val prefs: SharedPreferences = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
        val views = RemoteViews(context.packageName, R.layout.widget_layout)

        // Tapping anywhere on the widget opens the app
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

        // ── 1. Daily Tasks ────────────────────────────────────────────
        val tasksJsonString = prefs.getString("widget_tasks", "[]") ?: "[]"
        val tasksDisplay = buildString {
            append("Today's Tasks\n")
            try {
                val tasksArray = JSONArray(tasksJsonString)
                if (tasksArray.length() == 0) {
                    append("No tasks pending!")
                } else {
                    for (i in 0 until minOf(3, tasksArray.length())) {
                        val task = tasksArray.getJSONObject(i)
                        val check = if (task.optBoolean("completed", false)) "✔" else "○"
                        val title = task.optString("title", "Untitled")
                        append("$check $title\n")
                    }
                }
            } catch (e: Exception) {
                append("Error loading tasks")
            }
        }
        views.setTextViewText(R.id.widget_tasks_text, tasksDisplay)

        // ── 2. Habit Streaks ──────────────────────────────────────────
        val streaksJsonString = prefs.getString("widget_streaks", "[]") ?: "[]"
        val streaksDisplay = buildString {
            append("Habit Streaks\n")
            try {
                val streaksArray = JSONArray(streaksJsonString)
                if (streaksArray.length() == 0) {
                    append("No habits set")
                } else {
                    for (i in 0 until minOf(3, streaksArray.length())) {
                        val habit = streaksArray.getJSONObject(i)
                        val name = habit.optString("name", "Habit")
                        val streak = habit.optInt("streak", 0)
                        append("$name 🔥 $streak days\n")
                    }
                }
            } catch (e: Exception) {
                append("Error loading habits")
            }
        }
        views.setTextViewText(R.id.widget_habits_text, streaksDisplay)

        // ── 3. Focus Timer ────────────────────────────────────────────
        val focusJsonString = prefs.getString("widget_focus", null)
        val focusText = if (focusJsonString != null) {
            try {
                val focusObj = JSONObject(focusJsonString)
                val remaining = focusObj.optInt("remainingSeconds", 0)
                val title = focusObj.optString("title", "Session")
                val mins = remaining / 60
                val secs = (remaining % 60).toString().padStart(2, '0')
                "Focus: $title\n${mins}:${secs} remaining"
            } catch (e: Exception) {
                "Focus: Error"
            }
        } else {
            "Focus: Ready"
        }
        views.setTextViewText(R.id.widget_focus_text, focusText)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}

