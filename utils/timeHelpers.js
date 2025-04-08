// Format time in HH:MM format
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Improved time difference calculation that handles overnight shifts
const calculateTimeDiff = (startTime, endTime) => {
  let start = new Date(`2025-03-21T${startTime}`);
  let end = new Date(`2025-03-21T${endTime}`);
  
  // If end time is earlier than start time, assume it's the next day
  if (end < start) {
    end = new Date(`2025-03-22T${endTime}`);
  }
  
  return Math.round((end - start) / (1000 * 60));
};

// Format minutes as HH:MM
const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

module.exports = { formatTime, calculateTimeDiff, formatMinutes };