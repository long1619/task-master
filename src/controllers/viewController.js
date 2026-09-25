import asyncHandler from '../utils/asyncHandler.js';

/**
 * ViewController - Lớp Controller phụ trách render các trang giao diện (Server-Side View)
 * Sử dụng EJS làm View Engine (tương tự Blade của Laravel), tuân theo mô hình MVC:
 * Route -> Controller -> View (views/pages/*.ejs) trong layout chung (views/layouts/main.ejs)
 */
export const ViewController = {
  /**
   * GET / - Render trang chủ (Dashboard SPA của TaskMaster Pro)
   */
  renderHome: asyncHandler(async (req, res) => {
    res.render('pages/home', {
      title: 'TaskMaster Pro • Quản lý công việc hiện đại',
      description: 'Hệ thống quản lý công việc thế hệ mới với Prisma ORM, MySQL và Multer Uploads'
    });
  })
};

export default ViewController;
