import prisma from '../src/config/db.js';
import WorkspaceService from '../src/services/workspaceService.js';
import ActivityService from '../src/services/activityService.js';
import AdminService from '../src/services/adminService.js';
import { sendTaskAssignmentEmail } from '../src/services/emailService.js';

async function runTest() {
  console.log('--- BẮT ĐẦU KIỂM THỬ BACKEND TEAM COLLABORATION & RBAC ---');

  // 1. Kiểm tra hoặc lấy 2 user mẫu
  let user1 = await prisma.user.findUnique({ where: { email: 'pro@taskmaster.dev' } });
  let admin = await prisma.user.findUnique({ where: { email: 'admin@taskmaster.dev' } });

  if (!admin) {
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    admin = await prisma.user.create({
      data: {
        name: 'Quản trị viên Hệ thống',
        email: 'admin@taskmaster.dev',
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('✅ Đã tạo tài khoản admin:', admin.email);
  }

  if (!user1) {
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash('Pro@123456', 12);
    user1 = await prisma.user.create({
      data: {
        name: 'Nguyễn Văn Pro',
        email: 'pro@taskmaster.dev',
        password: hashedPassword,
        role: 'user'
      }
    });
    console.log('✅ Đã tạo tài khoản user1:', user1.email);
  }

  // 2. Tạo Workspace
  const ws = await WorkspaceService.createWorkspace({
    name: 'Dự án Cổng Thanh Toán VNPay',
    description: 'Tích hợp cổng thanh toán trực tuyến cho toàn bộ ứng dụng',
    ownerId: user1.id
  });
  console.log('✅ Đã tạo Workspace:', ws.name, 'ID =', ws.id);

  // 3. Mời Admin vào Workspace
  const addRes = await WorkspaceService.addMember({
    workspaceId: ws.id,
    email: admin.email,
    role: 'admin',
    currentUserId: user1.id
  });
  console.log('✅ Đã mời thành viên:', addRes.message);

  // 4. Lấy danh sách thành viên workspace
  const members = await WorkspaceService.getWorkspaceMembers(ws.id, user1.id);
  console.log('✅ Danh sách thành viên workspace:', members.map(m => `${m.name} (${m.email}) [${m.workspaceRole}]`));

  // 5. Tạo công việc gán cho Admin trong Workspace
  const newTodo = await prisma.todo.create({
    data: {
      title: 'Thiết kế luồng thanh toán bảo mật với OTP',
      description: 'Đảm bảo tuân thủ tiêu chuẩn PCI-DSS khi giao dịch',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000),
      userId: user1.id,
      workspaceId: ws.id,
      assigneeId: admin.id
    },
    include: {
      assignee: true,
      workspace: true
    }
  });
  console.log('✅ Đã tạo task với Assignee:', newTodo.title, '-> Giao cho:', newTodo.assignee?.name);

  // Ghi activity
  await ActivityService.logActivity({
    todoId: newTodo.id,
    userId: user1.id,
    action: 'created',
    description: 'Đã tạo công việc mới'
  });
  await ActivityService.logActivity({
    todoId: newTodo.id,
    userId: user1.id,
    action: 'assigned',
    description: `Đã giao công việc cho "${admin.name}"`
  });

  // 6. Admin bình luận vào công việc
  const comment = await prisma.taskComment.create({
    data: {
      todoId: newTodo.id,
      userId: admin.id,
      content: 'Tôi đã xem tài liệu API và sẽ bắt đầu dựng luồng callback webhook ngay chiều nay!'
    },
    include: { user: true }
  });
  console.log('✅ Đã tạo bình luận:', comment.user.name, 'nói:', comment.content);

  await ActivityService.logActivity({
    todoId: newTodo.id,
    userId: admin.id,
    action: 'comment_added',
    description: 'Đã gửi bình luận trao đổi'
  });

  // 7. Lấy danh sách Activities
  const activities = await ActivityService.getTodoActivities(newTodo.id);
  console.log(`✅ Đã lấy được ${activities.length} dòng nhật ký hoạt động (Audit log):`);
  activities.forEach(a => console.log(`   - [${a.action}] ${a.user.name}: ${a.description}`));

  // 8. Test Admin Service
  const stats = await AdminService.getSystemStats();
  console.log('✅ Thống kê Admin:', JSON.stringify(stats, null, 2));

  // 9. Test toggle lock
  const lockRes = await AdminService.toggleUserLock(user1.id, admin.id);
  console.log('✅ Khóa user:', lockRes.message, 'isLocked =', lockRes.user.isLocked);
  const unlockRes = await AdminService.toggleUserLock(user1.id, admin.id);
  console.log('✅ Mở khóa user:', unlockRes.message, 'isLocked =', unlockRes.user.isLocked);

  console.log('--- TOÀN BỘ KIỂM THỬ BACKEND THÀNH CÔNG RỰC RỠ! ---');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Lỗi kiểm thử:', err);
  process.exit(1);
});
