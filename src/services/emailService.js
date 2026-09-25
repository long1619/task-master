import prisma from '../config/db.js';
import { sendEmail } from '../config/email.js';
import { buildDailyDigestHtml } from '../templates/dailyDigestTemplate.js';
import aiService from './aiService.js';

/**
 * Định dạng công việc với các cờ thời gian (quá hạn, hôm nay)
 */
const processUserTasks = (todos) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return todos.map(todo => {
    let isOverdue = false;
    let isToday = false;
    let formattedDueDate = null;

    if (todo.dueDate) {
      const due = new Date(todo.dueDate);
      if (!isNaN(due.getTime())) {
        if (due < now) {
          isOverdue = true;
        } else if (due >= startOfToday && due <= endOfToday) {
          isToday = true;
        }

        const pad = n => n.toString().padStart(2, '0');
        formattedDueDate = `${pad(due.getHours())}:${pad(due.getMinutes())} • ${pad(due.getDate())}/${pad(due.getMonth() + 1)}/${due.getFullYear()}`;
      }
    }

    return {
      ...todo,
      isOverdue,
      isToday,
      formattedDueDate
    };
  });
};

/**
 * Gửi email tóm tắt công việc cho một người dùng cụ thể
 */
export const sendUserDailyDigest = async (userId, appUrl = 'http://localhost:5000') => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId, 10) }
  });

  if (!user) {
    throw new Error('Không tìm thấy thông tin người dùng để gửi email!');
  }

  // Lấy các công việc chưa hoàn thành của user
  const rawTodos = await prisma.todo.findMany({
    where: {
      userId: user.id,
      status: { not: 'completed' }
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' }
    ]
  });

  const processedTasks = processUserTasks(rawTodos);

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  // Sinh thông điệp tóm tắt ngày mới từ Trợ lý AI (Gemini 2.5 Flash / Fallback)
  let aiBriefing = null;
  try {
    const briefingRes = await aiService.generateDailyBriefingContent({ user, todos: rawTodos });
    if (briefingRes && briefingRes.briefing) {
      aiBriefing = briefingRes.briefing;
    }
  } catch (aiErr) {
    console.warn('⚠️ [AI Email Briefing] Không thể tạo briefing từ AI:', aiErr.message);
  }

  const subject = `☀️ [TaskMaster Pro] Bản tin nhắc việc ngày mới: ${todayStr}`;
  const html = buildDailyDigestHtml({
    userName: user.name,
    tasks: processedTasks,
    dateStr: todayStr,
    appUrl,
    aiBriefing
  });

  const sendResult = await sendEmail({
    to: user.email,
    subject,
    html,
    text: `Chào ${user.name}, bạn có ${processedTasks.length} công việc chưa hoàn thành. Mở TaskMaster Pro để kiểm tra: ${appUrl}`
  });

  return {
    success: true,
    userEmail: user.email,
    tasksCount: processedTasks.length,
    overdueCount: processedTasks.filter(t => t.isOverdue).length,
    todayCount: processedTasks.filter(t => t.isToday).length,
    previewUrl: sendResult.previewUrl,
    isEthereal: sendResult.isEthereal
  };
};

/**
 * Gửi email tóm tắt hàng loạt cho tất cả người dùng có công việc cần xử lý
 */
export const sendAllUsersDailyDigest = async (appUrl = 'http://localhost:5000') => {
  // Lấy tất cả user có ít nhất 1 task chưa hoàn thành
  const usersWithTasks = await prisma.user.findMany({
    where: {
      todos: {
        some: {
          status: { not: 'completed' }
        }
      }
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  console.log(`⏰ [CRON DIGEST] Đang chuẩn bị gửi email nhắc việc cho ${usersWithTasks.length} người dùng...`);

  let sentCount = 0;
  const results = [];

  for (const user of usersWithTasks) {
    try {
      const res = await sendUserDailyDigest(user.id, appUrl);
      sentCount++;
      results.push({ userId: user.id, email: user.email, success: true, previewUrl: res.previewUrl });
    } catch (err) {
      console.error(`❌ [CRON DIGEST] Lỗi gửi email cho user ${user.email}:`, err.message);
      results.push({ userId: user.id, email: user.email, success: false, error: err.message });
    }
  }

  console.log(`✅ [CRON DIGEST] Hoàn tất gửi ${sentCount}/${usersWithTasks.length} email nhắc việc!`);
  return { total: usersWithTasks.length, sentCount, results };
};

/**
 * Gửi email thông báo khi công việc được phân công cho người khác (Task Assignment)
 */
export const sendTaskAssignmentEmail = async ({ assigneeId, task, assigner, appUrl = 'http://localhost:5000' }) => {
  try {
    if (!assigneeId) return null;

    const assignee = await prisma.user.findUnique({
      where: { id: parseInt(assigneeId, 10) }
    });

    if (!assignee || !assignee.email) return null;

    const { buildTaskAssignmentHtml } = await import('../templates/taskAssignmentTemplate.js');
    const html = buildTaskAssignmentHtml({ assignee, task, assigner, appUrl });
    const subject = `⚡ [TaskMaster Pro] Bạn được giao công việc: "${task.title}"`;

    const result = await sendEmail({
      to: assignee.email,
      subject,
      html
    });

    console.log(`📧 [TASK ASSIGN EMAIL] Đã gửi thông báo giao việc tới "${assignee.email}" cho task "${task.title}"`);
    return {
      ...result,
      assigneeEmail: assignee.email
    };
  } catch (err) {
    console.error('❌ [TASK ASSIGN EMAIL FAILED]:', err.message);
    return null;
  }
};

export default {
  sendUserDailyDigest,
  sendAllUsersDailyDigest,
  sendTaskAssignmentEmail
};
