import { reddit } from '@devvit/web/server';

// Get today's date string for puzzle generation
function getTodayDateString(): string {
  const now = new Date();
  const parts = now.toISOString().split('T');
  return parts[0] ?? new Date().toDateString();
}

// Calculate day number from start date
function getDayNumber(): number {
  const startDate = new Date('2025-01-01');
  const today = new Date(getTodayDateString());
  return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export const createPost = async () => {
  const dayNumber = getDayNumber();
  
  return await reddit.submitCustomPost({
    title: `🔷 ShapeSwifter - Day #${dayNumber}`,
  });
};
