import asyncHandler from '../utils/asyncHandler.js';
import TodoModel from '../models/todoModel.js';
import AiService from '../services/aiService.js';
import { sendUserDailyDigest } from '../services/emailService.js';

export const aiController = {
  /**
   * POST /api/v1/ai/chat - Trò chuyện và nhờ AI Co-pilot tư vấn công việc
   */
  chatWithCoPilot: asyncHandler(async (req, res) => {
    const { message, history } = req.body;
    const user = req.user;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tin nhắn không được để trống!'
      });
    }

    // Lấy toàn bộ danh sách công việc hiện tại của người dùng để làm ngữ cảnh
    const userTodos = await TodoModel.findAllRaw(user.id);

    // Gọi AI Service
    const aiResult = await AiService.generateChatReply({
      user,
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      todos: userTodos
    });

    res.status(200).json({
      success: true,
      message: 'Nhận phản hồi từ AI Co-pilot thành công!',
      data: {
        reply: aiResult.reply,
        actions: aiResult.actions || [],
        model: aiResult.model
      }
    });
  }),

  /**
   * POST /api/v1/ai/voice-task - Phân tích giọng nói tiếng Việt và tự động tạo công việc
   */
  parseVoiceTask: asyncHandler(async (req, res) => {
    const { transcript } = req.body;
    const user = req.user;

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Văn bản giọng nói không được để trống!'
      });
    }

    // Bóc tách giọng nói qua Gemini / Fallback
    const parseResult = await AiService.parseVoiceToTask({
      transcript: transcript.trim(),
      now: new Date()
    });

    const taskData = parseResult.data;

    // Tự động lưu công việc vào cơ sở dữ liệu
    const newTodo = await TodoModel.create({
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      tags: taskData.tags,
      userId: user.id
    });

    res.status(201).json({
      success: true,
      message: `✨ AI đã tạo việc thành công: "${newTodo.title}"`,
      data: {
        todo: newTodo,
        parsedMeta: taskData,
        source: parseResult.source
      }
    });
  }),

  /**
   * POST /api/v1/ai/send-briefing-email - Kích hoạt gửi email tóm tắt AI ngày mới ngay lập tức
   */
  sendBriefingEmail: asyncHandler(async (req, res) => {
    const user = req.user;
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const appUrl = `${protocol}://${host}`;

    const emailResult = await sendUserDailyDigest(user.id, appUrl);

    res.status(200).json({
      success: true,
      message: 'Đã tạo và gửi bản tin tóm tắt AI thành công tới email của bạn!',
      data: emailResult
    });
  })
};

