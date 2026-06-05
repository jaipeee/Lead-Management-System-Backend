const { sendDailySummary } = require('./services/email.service');

function startScheduler() {
  const scheduleDailySummary = () => {
    const now = new Date();
    const scheduleTime = new Date();
    scheduleTime.setHours(9, 0, 0, 0);

    if (now > scheduleTime) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    const timeUntilSchedule = scheduleTime - now;

    setTimeout(() => {
      sendDailySummary();
      setInterval(sendDailySummary, 24 * 60 * 60 * 1000);
    }, timeUntilSchedule);

    console.log(`Daily summary scheduled for ${scheduleTime.toLocaleTimeString()}`);
  };

  scheduleDailySummary();
}

module.exports = { startScheduler };
