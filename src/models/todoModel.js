import prisma from '../config/db.js';

export const TodoModel = {
	/**
	 * Lấy danh sách todos của user kèm phân trang, tìm kiếm, lọc & sắp xếp (Level 3)
	 */
	async findAll(userId, {
		page = 1,
		limit = 10,
		search = '',
		status,
		priority,
		sortBy = 'createdAt:desc'
	} = {}) {
		const pageNumber = Math.max(1, parseInt(page, 10) || 1);
		const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
		const skip = (pageNumber - 1) * pageSize;
		const uid = parseInt(userId, 10);

		// Xây dựng điều kiện lọc: Người dùng thấy task họ tạo, task được giao, hoặc task trong dự án họ tham gia
		const where = {
			deletedAt: null,
			OR: [
				{ userId: uid },
				{ assigneeId: uid },
				{ workspace: { members: { some: { userId: uid } } } }
			]
		};

		if (status && status !== 'all') {
			where.status = status;
		}

		if (priority && priority !== 'all') {
			where.priority = priority;
		}

		if (search && search.trim()) {
			const keyword = search.trim();
			where.AND = [
				{
					OR: [
						{ title: { contains: keyword } },
						{ description: { contains: keyword } }
					]
				}
			];
		}

		// Xây dựng điều kiện sắp xếp (Order By clause)
		let orderBy = { createdAt: 'desc' };
		if (sortBy) {
			const [field, direction] = sortBy.split(':');
			const sortDirection = (direction && direction.toLowerCase() === 'asc') ? 'asc' : 'desc';

			if (['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'].includes(field)) {
				orderBy = { [field]: sortDirection };
			} else if (field === 'due_date') {
				orderBy = { dueDate: sortDirection };
			} else if (field === 'created_at') {
				orderBy = { createdAt: sortDirection };
			}
		}

		// Truy vấn song song dữ liệu và tổng số lượng bản ghi
		const [todos, totalItems] = await Promise.all([
			prisma.todo.findMany({
				where,
				skip,
				take: pageSize,
				orderBy,
				include: {
					attachments: {
						orderBy: { createdAt: 'desc' }
					},
					subtasks: {
						orderBy: { createdAt: 'asc' }
					},
					assignee: {
						select: { id: true, name: true, email: true }
					},
					workspace: {
						select: { id: true, name: true }
					},
					_count: {
						select: { comments: true }
					}
				}
			}),
			prisma.todo.count({ where })
		]);

		const totalPages = Math.ceil(totalItems / pageSize) || 1;

		return {
			todos,
			pagination: {
				totalItems,
				totalPages,
				currentPage: pageNumber,
				limit: pageSize,
				hasNextPage: pageNumber < totalPages,
				hasPrevPage: pageNumber > 1
			}
		};
	},

	/**
	 * Lấy toàn bộ todos còn hoạt động không phân trang (dùng cho thống kê stats, export & analytics)
	 */
	async findAllRaw(userId) {
		const uid = parseInt(userId, 10);
		return await prisma.todo.findMany({
			where: {
				deletedAt: null,
				OR: [
					{ userId: uid },
					{ assigneeId: uid },
					{ workspace: { members: { some: { userId: uid } } } }
				]
			},
			orderBy: { createdAt: 'desc' },
			include: {
				attachments: true,
				subtasks: {
					orderBy: { createdAt: 'asc' }
				},
				assignee: {
					select: { id: true, name: true, email: true }
				},
				workspace: {
					select: { id: true, name: true }
				},
				_count: {
					select: { comments: true }
				}
			}
		});
	},

	/**
	 * Lấy danh sách todos trong thùng rác của người dùng
	 */
	async findTrash(userId) {
		return await prisma.todo.findMany({
			where: {
				userId: parseInt(userId, 10),
				deletedAt: { not: null }
			},
			orderBy: { deletedAt: 'desc' },
			include: {
				attachments: true
			}
		});
	},

	/**
	 * Tìm một todo theo ID kèm danh sách tệp đính kèm, việc con, bình luận và nhật ký
	 */
	async findById(id) {
		return await prisma.todo.findUnique({
			where: { id: parseInt(id, 10) },
			include: {
				attachments: {
					orderBy: { createdAt: 'desc' }
				},
				subtasks: {
					orderBy: { createdAt: 'asc' }
				},
				assignee: {
					select: { id: true, name: true, email: true }
				},
				workspace: {
					select: { id: true, name: true }
				},
				comments: {
					include: {
						user: {
							select: { id: true, name: true, email: true, role: true }
						}
					},
					orderBy: { createdAt: 'asc' }
				},
				activities: {
					include: {
						user: {
							select: { id: true, name: true, email: true }
						}
					},
					orderBy: { createdAt: 'desc' }
				}
			}
		});
	},

	/**
	 * Thêm mới một todo gắn với user_id và tùy chọn workspace, assignee
	 */
	async create({ title, description = '', status = 'pending', priority = 'medium', dueDate = null, tags = [], userId, workspaceId = null, assigneeId = null }) {
		return await prisma.todo.create({
			data: {
				title: title.trim(),
				description: description ? description.trim() : null,
				status,
				priority,
				dueDate: dueDate ? new Date(dueDate) : null,
				tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
				userId: parseInt(userId, 10),
				workspaceId: workspaceId ? parseInt(workspaceId, 10) : null,
				assigneeId: assigneeId ? parseInt(assigneeId, 10) : null
			},
			include: {
				attachments: true,
				subtasks: true,
				assignee: {
					select: { id: true, name: true, email: true }
				},
				workspace: {
					select: { id: true, name: true }
				}
			}
		});
	},

	/**
	 * Cập nhật thông tin todo
	 */
	async update(id, userId, updateData) {
		const data = {};

		if (updateData.title !== undefined) data.title = updateData.title.trim();
		if (updateData.description !== undefined) data.description = updateData.description ? updateData.description.trim() : null;
		if (updateData.status !== undefined) data.status = updateData.status;
		if (updateData.priority !== undefined) data.priority = updateData.priority;
		if (updateData.dueDate !== undefined) data.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
		if (updateData.tags !== undefined) data.tags = Array.isArray(updateData.tags) ? updateData.tags : (updateData.tags ? [updateData.tags] : []);
		if (updateData.workspaceId !== undefined) data.workspaceId = updateData.workspaceId ? parseInt(updateData.workspaceId, 10) : null;
		if (updateData.assigneeId !== undefined) data.assigneeId = updateData.assigneeId ? parseInt(updateData.assigneeId, 10) : null;

		return await prisma.todo.update({
			where: { id: parseInt(id, 10) },
			data,
			include: {
				attachments: {
					orderBy: { createdAt: 'desc' }
				},
				subtasks: {
					orderBy: { createdAt: 'asc' }
				},
				assignee: {
					select: { id: true, name: true, email: true }
				},
				workspace: {
					select: { id: true, name: true }
				}
			}
		});
	},

	/**
	 * Xóa mềm một todo (chuyển vào thùng rác)
	 */
	async softDelete(id) {
		return await prisma.todo.update({
			where: { id: parseInt(id, 10) },
			data: { deletedAt: new Date() }
		});
	},

	/**
	 * Khôi phục một todo từ thùng rác
	 */
	async restore(id) {
		return await prisma.todo.update({
			where: { id: parseInt(id, 10) },
			data: { deletedAt: null }
		});
	},

	/**
	 * Xóa vĩnh viễn một todo khỏi cơ sở dữ liệu
	 */
	async delete(id) {
		return await prisma.todo.delete({
			where: { id: parseInt(id, 10) }
		});
	},

	/**
	 * Dọn sạch toàn bộ thùng rác của người dùng
	 */
	async emptyTrash(userId) {
		return await prisma.todo.deleteMany({
			where: {
				userId: parseInt(userId, 10),
				deletedAt: { not: null }
			}
		});
	},

	/**
	 * Tự động xóa các todo trong thùng rác đã quá 30 ngày (cho cron job dọn rác)
	 */
	async purgeOldTrash(olderThanDays = 30) {
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() - olderThanDays);

		return await prisma.todo.deleteMany({
			where: {
				deletedAt: {
					lte: thresholdDate
				}
			}
		});
	},

	/**
	 * Cập nhật trạng thái hàng loạt công việc
	 */
	async bulkUpdateStatus(ids, userId, status) {
		const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
		return await prisma.todo.updateMany({
			where: {
				id: { in: numericIds },
				userId: parseInt(userId, 10),
				deletedAt: null
			},
			data: { status }
		});
	},

	/**
	 * Cập nhật mức ưu tiên hàng loạt công việc
	 */
	async bulkUpdatePriority(ids, userId, priority) {
		const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
		return await prisma.todo.updateMany({
			where: {
				id: { in: numericIds },
				userId: parseInt(userId, 10),
				deletedAt: null
			},
			data: { priority }
		});
	},

	/**
	 * Xóa mềm hàng loạt công việc (chuyển vào thùng rác)
	 */
	async bulkSoftDelete(ids, userId) {
		const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
		return await prisma.todo.updateMany({
			where: {
				id: { in: numericIds },
				userId: parseInt(userId, 10),
				deletedAt: null
			},
			data: { deletedAt: new Date() }
		});
	},

	/**
	 * Nạp hàng loạt công việc từ file import Excel/CSV
	 */
	async bulkCreate(tasks, userId) {
		const data = tasks.map(t => ({
			title: t.title.trim(),
			description: t.description ? t.description.trim() : null,
			status: t.status || 'pending',
			priority: t.priority || 'medium',
			dueDate: t.dueDate ? new Date(t.dueDate) : null,
			tags: t.tags || [],
			userId: parseInt(userId, 10)
		}));

		return await prisma.todo.createMany({
			data
		});
	},

	/**
	 * Thêm file đính kèm mới vào Todo
	 */
	async addAttachment(todoId, { fileName, filePath, fileSize, mimeType }) {
		return await prisma.attachment.create({
			data: {
				todoId: parseInt(todoId, 10),
				fileName,
				filePath,
				fileSize: parseInt(fileSize, 10),
				mimeType
			}
		});
	},

	/**
	 * Tìm file đính kèm theo ID
	 */
	async findAttachmentById(attachmentId) {
		return await prisma.attachment.findUnique({
			where: { id: parseInt(attachmentId, 10) },
			include: {
				todo: true
			}
		});
	},

	/**
	 * Xóa một file đính kèm
	 */
	async deleteAttachment(attachmentId) {
		return await prisma.attachment.delete({
			where: { id: parseInt(attachmentId, 10) }
		});
	}
};

export default TodoModel;
