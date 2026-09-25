import cron from 'node-cron';
import { sendAllUsersDailyDigest } from '../services/emailService.js';
import TodoModel from '../models/todoModel.js';

let scheduledTask = null;

/**
 * Khởi tạo Background Cron Worker lập lịch nhắc việc tự động & dọn dẹp thùng rác
 * Mặc định chạy vào lúc 08:00 sáng mỗi ngày: '0 8 * * *'
 */
export const initReminderCron = () => {
  const scheduleExpr = process.env.REMINDER_CRON_SCHEDULE || '0 8 * * *';

  if (!cron.validate(scheduleExpr)) {
    console.error(`❌ [CRON ERROR] Biểu thức Cron không hợp lệ: "${scheduleExpr}". Sử dụng mặc định: "0 8 * * *"`);
  }

  const validSchedule = cron.validate(scheduleExpr) ? scheduleExpr : '0 8 * * *';

  scheduledTask = cron.schedule(validSchedule, async () => {
    const timestamp = new Date().toLocaleString('vi-VN');
    console.log(`====================================================`);
    console.log(`⏰ [CRON TRIGGER - ${timestamp}] Bắt đầu tiến trình tự động gửi email nhắc việc 8:00 sáng...`);
    try {
      const result = await sendAllUsersDailyDigest();
      console.log(`🎉 [CRON SUCCESS] Đã gửi thông báo thành công cho ${result.sentCount} người dùng.`);
    } catch (err) {
      console.error(`💥 [CRON FAILED] Lỗi trong quá trình chạy cron nhắc việc:`, err);
    }

    // Tự động dọn dẹp các task trong thùng rác quá 30 ngày
    try {
      const purgeResult = await TodoModel.purgeOldTrash(30);
      if (purgeResult.count > 0) {
        console.log(`🗑️  [CRON CLEANUP] Đã tự động dọn sạch ${purgeResult.count} công việc trong thùng rác quá 30 ngày.`);
      }
    } catch (purgeErr) {
      console.error(`⚠️ [CRON CLEANUP FAILED] Lỗi khi dọn dẹp thùng rác cũ:`, purgeErr.message);
    }
    console.log(`====================================================`);
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  console.log(`⏱️  [Cron Worker] Lập lịch nhắc việc tự động đã kích hoạt: "${validSchedule}" (Mỗi sáng 8:00 AM)`);
  return scheduledTask;
};

export default {
  initReminderCron
};
