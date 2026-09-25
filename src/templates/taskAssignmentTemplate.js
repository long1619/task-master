/**
 * Tạo nội dung HTML email thông báo khi người dùng được giao công việc mới (Task Assignment)
 * Thiết kế giao diện Glassmorphism hiện đại, responsive, sang trọng.
 */
export const buildTaskAssignmentHtml = ({ assignee, task, assigner, appUrl = 'http://localhost:5000' }) => {
  const priorityMap = {
    high: { label: 'Ưu tiên Cao', color: '#ef4444', bg: '#fee2e2' },
    medium: { label: 'Ưu tiên Trung bình', color: '#f59e0b', bg: '#fef3c7' },
    low: { label: 'Ưu tiên Thấp', color: '#10b981', bg: '#d1fae5' }
  };

  const priorityMeta = priorityMap[task.priority] || priorityMap.medium;

  let dueDateFormatted = 'Không có hạn chót';
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    if (!isNaN(d.getTime())) {
      const pad = n => n.toString().padStart(2, '0');
      dueDateFormatted = `${pad(d.getHours())}:${pad(d.getMinutes())} • Ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
  }

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bạn có công việc mới được giao - TaskMaster Pro</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 28px;
      color: #ffffff;
      text-align: center;
    }
    .header-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .task-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 5px solid #4f46e5;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .task-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
    }
    .task-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;
    }
    .meta-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .task-desc {
      font-size: 14px;
      color: #475569;
      line-height: 1.5;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
    }
    .btn-container {
      text-align: center;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .action-btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .footer {
      background: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">⚡ TaskMaster Pro</div>
      <p class="header-subtitle">Thông báo phân công công việc (Task Assignment)</p>
    </div>

    <div class="content">
      <p class="greeting">
        Xin chào <strong>${assignee.name || 'bạn'}</strong>,<br>
        <strong>${assigner.name || 'Một thành viên trong nhóm'}</strong> (${assigner.email}) vừa phân công một công việc mới cho bạn trong hệ thống:
      </p>

      <div class="task-card">
        <h3 class="task-title">${task.title}</h3>
        <div class="task-meta-row">
          <span class="meta-badge" style="background: ${priorityMeta.bg}; color: ${priorityMeta.color};">
            ${priorityMeta.label}
          </span>
          <span class="meta-badge" style="background: #e0f2fe; color: #0284c7;">
            ⏰ Hạn: ${dueDateFormatted}
          </span>
          ${task.workspaceName ? `
            <span class="meta-badge" style="background: #ede9fe; color: #7c3aed;">
              📁 Dự án: ${task.workspaceName}
            </span>
          ` : ''}
        </div>

        ${task.description ? `
          <div class="task-desc">
            ${task.description.replace(/\n/g, '<br>')}
          </div>
        ` : ''}
      </div>

      <div class="btn-container">
        <a href="${appUrl}" target="_blank" class="action-btn">
          Truy cập và xem chi tiết công việc &rarr;
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">
        Hãy đăng nhập vào TaskMaster Pro để bắt đầu thực hiện, trao đổi bình luận hoặc chia nhỏ việc con.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">TaskMaster Pro &bull; Nền tảng quản lý công việc và cộng tác nhóm thông minh 2026</p>
    </div>
  </div>
</body>
</html>
  `;
};

export default buildTaskAssignmentHtml;
