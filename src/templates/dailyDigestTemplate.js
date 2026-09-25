/**
 * Tạo nội dung HTML Email cho bản tin tóm tắt & nhắc việc hàng ngày
 */
export const buildDailyDigestHtml = ({ userName, tasks, stats, dateStr, appUrl = 'http://localhost:5000', aiBriefing = null }) => {
  const overdueTasks = tasks.filter(t => t.isOverdue);
  const todayTasks = tasks.filter(t => t.isToday);
  const upcomingTasks = tasks.filter(t => !t.isOverdue && !t.isToday);

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'high':
        return '<span style="background-color: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-block;">🔴 Cao</span>';
      case 'medium':
        return '<span style="background-color: #fef3c7; color: #b45309; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-block;">🟡 Vừa</span>';
      default:
        return '<span style="background-color: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; display: inline-block;">🟢 Thấp</span>';
    }
  };

  const getStatusBadge = (s) => {
    if (s === 'in_progress') {
      return '<span style="background-color: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; display: inline-block;">🚀 Đang làm</span>';
    }
    return '<span style="background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; display: inline-block;">⏳ Chờ làm</span>';
  };

  const renderTaskList = (taskList, emptyText) => {
    if (!taskList || taskList.length === 0) {
      return `<p style="color: #94a3b8; font-size: 13px; font-style: italic; margin: 4px 0 12px 0;">${emptyText}</p>`;
    }

    return taskList.map(t => `
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: #1e293b; font-size: 14px; text-decoration: none;">${t.title}</strong>
          <div>
            ${getPriorityBadge(t.priority)}
            ${getStatusBadge(t.status)}
          </div>
        </div>
        ${t.description ? `<p style="color: #64748b; font-size: 12px; margin: 0 0 6px 0; line-height: 1.4;">${t.description}</p>` : ''}
        <div style="font-size: 11px; color: ${t.isOverdue ? '#dc2626' : '#64748b'}; font-weight: ${t.isOverdue ? '700' : '500'};">
          ${t.isOverdue ? '⚠️ Đã quá hạn:' : '📅 Hạn hoàn thành:'} ${t.formattedDueDate || 'Không đặt'}
        </div>
      </div>
    `).join('');
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bản tin nhắc việc TaskMaster Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Container chính -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8b5cf6 100%); padding: 28px 30px; text-align: left; color: #ffffff;">
              <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;">
                <span>TaskMaster</span>
                <span style="background: rgba(255,255,255,0.25); font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 700;">PRO v3</span>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
                ☀️ Báo cáo công việc đầu ngày • ${dateStr}
              </p>
            </td>
          </tr>

          <!-- Lời chào & Thống kê nhanh -->
          <tr>
            <td style="padding: 24px 30px 16px 30px;">
              <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px;">
                Xin chào ${userName || 'bạn'}! 👋
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; color: #64748b; line-height: 1.5;">
                Đây là danh sách công việc cần xử lý theo lịch trình tự động 8:00 sáng. Hãy điểm qua để sắp xếp một ngày làm việc hiệu quả nhất nhé!
              </p>

              ${aiBriefing ? `
                <!-- AI Executive Briefing Box -->
                <div style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 12px; padding: 16px 18px; margin-bottom: 24px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 15px;">🤖</span>
                    <strong style="color: #4f46e5; font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.5px;">Bản tin thông minh từ Trợ lý AI</strong>
                  </div>
                  <div style="font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-line;">
                    ${aiBriefing}
                  </div>
                </div>
              ` : ''}

              <!-- Thống kê nhanh 3 khối màu -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="32%" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 12px; text-align: center;">
                    <div style="font-size: 22px; font-weight: 800; color: #e11d48;">${overdueTasks.length}</div>
                    <div style="font-size: 11.5px; font-weight: 600; color: #9f1239; margin-top: 2px;">⚠️ Đã quá hạn</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 12px; text-align: center;">
                    <div style="font-size: 22px; font-weight: 800; color: #ca8a04;">${todayTasks.length}</div>
                    <div style="font-size: 11.5px; font-weight: 600; color: #854d0e; margin-top: 2px;">📅 Hạn hôm nay</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px; text-align: center;">
                    <div style="font-size: 22px; font-weight: 800; color: #2563eb;">${tasks.length}</div>
                    <div style="font-size: 11.5px; font-weight: 600; color: #1e40af; margin-top: 2px;">📋 Tổng việc chờ</div>
                  </td>
                </tr>
              </table>

              <!-- Mục 1: Việc quá hạn (nếu có) -->
              ${overdueTasks.length > 0 ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="margin: 0 0 10px 0; color: #b91c1c; font-size: 14px; font-weight: 700;">
                    🚨 CÔNG VIỆC CẦN ƯU TIÊN XỬ LÝ GẤP (${overdueTasks.length})
                  </h3>
                  ${renderTaskList(overdueTasks, '')}
                </div>
              ` : ''}

              <!-- Mục 2: Việc đến hạn hôm nay -->
              <div style="margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #b45309; font-size: 14px; font-weight: 700;">
                  ⏳ HẠN CHÓT TRONG NGÀY HÔM NAY (${todayTasks.length})
                </h3>
                ${renderTaskList(todayTasks, 'Tuyệt vời! Bạn không có hạn chót nào rơi vào hôm nay.')}
              </div>

              <!-- Mục 3: Việc tiếp theo -->
              ${upcomingTasks.length > 0 ? `
                <div style="margin-bottom: 20px;">
                  <h3 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; font-weight: 700;">
                    📋 CÁC CÔNG VIỆC TIẾP THEO (${upcomingTasks.length})
                  </h3>
                  ${renderTaskList(upcomingTasks.slice(0, 5), '')}
                </div>
              ` : ''}

              <!-- Nút Call To Action -->
              <div style="text-align: center; margin: 30px 0 15px 0;">
                <a href="${appUrl}" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                  🚀 Mở TaskMaster Pro Để Xử Lý
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 30px; text-align: center; font-size: 11.5px; color: #64748b; border-top: 1px solid #e2e8f0;">
              Email này được gửi tự động bởi hệ thống <strong>TaskMaster Pro Background Cron Worker</strong>.<br>
              Lịch trình quét: 08:00 hàng ngày • Prisma ORM & MySQL 8.4
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
