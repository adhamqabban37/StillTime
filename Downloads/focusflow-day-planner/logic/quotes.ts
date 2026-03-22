// Daily motivational quotes
export const DAILY_QUOTES = [
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    quote: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
  },
  {
    quote: "Do what you can, with what you have, where you are.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
  },
  {
    quote: "It's not about having time, it's about making time.",
    author: "Unknown",
  },
  {
    quote:
      "Small daily improvements are the key to staggering long-term results.",
    author: "Unknown",
  },
  {
    quote: "Your future is created by what you do today, not tomorrow.",
    author: "Robert Kiyosaki",
  },
  { quote: "Progress, not perfection.", author: "Unknown" },
  {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    quote: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
  },
  {
    quote:
      "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    quote:
      "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  { quote: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { quote: "What gets scheduled gets done.", author: "Michael Hyatt" },
  { quote: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  {
    quote:
      "Productivity is never an accident. It is always the result of commitment to excellence.",
    author: "Paul J. Meyer",
  },
  {
    quote:
      "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    author: "Stephen Covey",
  },
  {
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
  },
  {
    quote:
      "Motivation is what gets you started. Habit is what keeps you going.",
    author: "Jim Ryun",
  },
  {
    quote: "A goal without a plan is just a wish.",
    author: "Antoine de Saint-Exupéry",
  },
  {
    quote: "The future depends on what you do today.",
    author: "Mahatma Gandhi",
  },
  {
    quote: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
  },
  { quote: "Your only limit is your mind.", author: "Unknown" },
  { quote: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { quote: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
  {
    quote: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  { quote: "One day or day one. You decide.", author: "Unknown" },
  { quote: "Make each day your masterpiece.", author: "John Wooden" },
  { quote: "The harder you work, the luckier you get.", author: "Gary Player" },
];

export function getDailyQuote(): { quote: string; author: string } {
  // Use day of year to pick a consistent quote for the whole day
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}
