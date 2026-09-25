import asyncHandler from '../utils/asyncHandler.js';
import { sendUserDailyDigest } from '../services/emailService.js';

export const NotificationController = {
  /**
   * POST /api/v1/notifications/send-digest
   * Cho phép người dùng bấm nút kích hoạt gửi email nhắc việc ngay lập tức
   */
  triggerDailyDigest: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const protocol = req.protocol;
    const host = req.get('host');
    const appUrl = `${protocol}://${host}`;

    const result = await sendUserDailyDigest(userId, appUrl);

    res.status(200).json({
      success: true,
      message: `Đã gửi bản tin nhắc việc thành công tới email ${result.userEmail}!`,
      data: result
    });
  })
};

export default NotificationController;
