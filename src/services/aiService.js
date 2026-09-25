import { GoogleGenAI } from '@google/genai';

/**
 * TaskMaster Pro - AI Productivity Service (Google Gemini 2.5 Flash)
 */
class AiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  /**
   * Khởi tạo client Gemini nếu có API Key
   */
  getClient() {
    const key = process.env.GEMINI_API_KEY || this.apiKey;
    if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
      return null;
    }
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Tạo prompt ngữ cảnh tổng thể dựa trên danh sách Todo thực tế của người dùng
   */
  buildSystemContext(user, todos = []) {
    const now = new Date();
    const currentDateStr = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const total = todos.length;
    const completed = todos.filter(t => t.status === 'completed');
    const inProgress = todos.filter(t => t.status === 'in_progress');
    const pending = todos.filter(t => t.status === 'pending');
    
    // Tính toán công việc quá hạn
    const overdue = todos.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });

    // Tính toán công việc cần làm hôm nay
    const dueToday = todos.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.toDateString() === now.toDateString();
    });

    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const todoSummaryList = todos.slice(0, 30).map((t, idx) => {
      const due = t.dueDate ? new Date(t.dueDate).toLocaleString('vi-VN') : 'Không có';
      const isOver = t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now ? ' [QUÁ HẠN!]' : '';
      return `${idx + 1}. [ID: ${t.id}] "${t.title}" | Trạng thái: ${t.status} | Ưu tiên: ${t.priority} | Hạn: ${due}${isOver}`;
    }).join('\n');

    return `Bạn là "Trợ lý AI" của TaskMaster Pro - một trợ lý thông minh, chuyên nghiệp và thân thiện về quản lý công việc và tối ưu năng suất làm việc cá nhân cho người dùng Việt Nam.

THÔNG TIN NGƯỜI DÙNG & NGỮ CẢNH HIỆN TẠI:
- Tên người dùng: ${user?.name || 'Bạn'}
- Thời gian hiện tại: ${currentTimeStr}, ${currentDateStr}
- Tổng số công việc: ${total} (Đã xong: ${completed.length}, Đang làm: ${inProgress.length}, Chờ làm: ${pending.length})
- Tỷ lệ hoàn thành: ${completionRate}%
- Số việc quá hạn: ${overdue.length}
- Số việc có hạn trong hôm nay: ${dueToday.length}

DANH SÁCH CÔNG VIỆC THỰC TẾ CỦA NGƯỜI DÙNG:
${todoSummaryList || '(Chưa có công việc nào trong danh sách)'}

NGUYÊN TẮC PHẢN HỒI:
1. Luôn trả lời bằng tiếng Việt chuẩn xác, văn phong tích cực, ngắn gọn, súc tích và mạch lạc (dùng bullet points, in đậm khi cần).
2. Khi người dùng hỏi về công việc của họ (như việc gấp, việc hôm nay, việc quá hạn), hãy dựa vào DANH SÁCH THỰC TẾ ở trên để trả lời cụ thể tên việc và mức ưu tiên.
3. Nếu người dùng nhờ lập kế hoạch hoặc chia nhỏ một mục tiêu, hãy phân rã thành 3-5 bước hành động rõ ràng.
4. QUAN TRỌNG VỀ ĐỀ XUẤT TẠO CÔNG VIỆC: Nếu người dùng yêu cầu tạo việc (hoặc câu trả lời của bạn có đề xuất một công việc cụ thể mới cần thêm vào danh sách), hãy kèm theo khối JSON ở cuối tin nhắn theo cú pháp:
\`\`\`action_create_todo
{
  "title": "Tiêu đề công việc ngắn gọn",
  "priority": "high" | "medium" | "low",
  "dueDate": "YYYY-MM-DDTHH:mm" (tùy chọn hoặc để trống)
}
\`\`\`
Hệ thống sẽ tự động chuyển khối này thành nút bấm 1-click cho người dùng.`;
  }

  /**
   * Xử lý trò chuyện với AI Co-pilot
   */
  async generateChatReply({ user, message, history = [], todos = [] }) {
    const client = this.getClient();

    if (client) {
      try {
        const systemPrompt = this.buildSystemContext(user, todos);
        
        // Chuẩn bị nội dung hội thoại
        let promptContent = `${systemPrompt}\n\n`;
        
        if (history && history.length > 0) {
          promptContent += 'LỊCH SỬ ĐÀM THOẠI TRƯỚC ĐÓ:\n';
          history.slice(-6).forEach(h => {
            promptContent += `${h.role === 'user' ? 'Người dùng' : 'Trợ lý AI'}: ${h.content}\n`;
          });
          promptContent += '\n';
        }

        promptContent += `Người dùng hỏi: "${message}"\n\nTrợ lý AI trả lời:`;

        const response = await client.models.generateContent({
          model: this.modelName,
          contents: promptContent
        });

        const replyText = response.text || 'Xin lỗi, tôi chưa thể xử lý câu trả lời lúc này.';
        const { cleanedReply, actions } = this.extractActions(replyText);

        return {
          success: true,
          reply: cleanedReply,
          actions,
          model: this.modelName
        };
      } catch (err) {
        console.warn('⚠️ [Gemini API Warning] Lỗi gọi Gemini, chuyển sang Smart Rule Fallback:', err.message);
      }
    }

    // Fallback: Trợ lý thông minh phân tích dữ liệu trực tiếp khi chưa gắn API Key
    return this.generateSmartFallbackReply({ user, message, todos });
  }

  /**
   * Trích xuất các khối action_create_todo từ câu trả lời của AI
   */
  extractActions(text) {
    const actions = [];
    const actionRegex = /```action_create_todo\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = actionRegex.exec(text)) !== null) {
      try {
        const actionData = JSON.parse(match[1]);
        if (actionData && actionData.title) {
          actions.push({
            type: 'create_todo',
            data: {
              title: actionData.title,
              priority: actionData.priority || 'medium',
              dueDate: actionData.dueDate || null
            }
          });
        }
      } catch (e) {
        console.warn('Không thể parse action JSON từ AI:', e.message);
      }
    }

    const cleanedReply = text.replace(/```action_create_todo[\s\S]*?```/g, '').trim();

    return { cleanedReply, actions };
  }

  /**
   * Bộ quy tắc phân tích thông minh khi chưa có Gemini API Key
   */
  generateSmartFallbackReply({ user, message, todos = [] }) {
    const lower = (message || '').toLowerCase();
    const now = new Date();
    const userName = user?.name || 'Bạn';

    const total = todos.length;
    const completed = todos.filter(t => t.status === 'completed');
    const inProgress = todos.filter(t => t.status === 'in_progress');
    const pending = todos.filter(t => t.status === 'pending');
    const overdue = todos.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now);
    const highPriority = todos.filter(t => t.status !== 'completed' && t.priority === 'high');

    let reply = '';
    const actions = [];

    // 1. Yêu cầu tạo việc nhanh bằng ngôn ngữ tự nhiên
    if (lower.includes('tạo việc') || lower.includes('thêm việc') || lower.includes('nhắc tôi') || lower.includes('tạo task')) {
      const cleanTitle = message.replace(/(tạo việc mới|tạo việc|thêm việc mới|thêm việc|nhắc tôi|tạo task|giúp tôi)/gi, '').trim();
      const taskTitle = cleanTitle ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : 'Công việc mới theo đề xuất của bạn';
      
      reply = `✨ Tôi đã nhận diện yêu cầu tạo việc của bạn: **"${taskTitle}"**.\n\nBấm nút bên dưới để tạo công việc này ngay lập tức vào danh sách của bạn:`;
      actions.push({
        type: 'create_todo',
        data: {
          title: taskTitle,
          priority: lower.includes('gấp') || lower.includes('cao') ? 'high' : 'medium',
          dueDate: null
        }
      });
    }
    // 2. Hỏi về việc gấp / việc quá hạn / việc hôm nay
    else if (lower.includes('gấp') || lower.includes('quá hạn') || lower.includes('hôm nay') || lower.includes('deadline')) {
      if (overdue.length > 0) {
        reply = `⚠️ Chào **${userName}**, bạn có **${overdue.length} công việc đã quá hạn** cần xử lý khẩn cấp:\n\n` +
          overdue.map(t => `• 🔴 **${t.title}** (Hạn: ${new Date(t.dueDate).toLocaleDateString('vi-VN')})`).join('\n') +
          `\n\n💡 *Lời khuyên:* Hãy tập trung xử lý hoặc cập nhật lại hạn chót cho các việc trên nhé!`;
      } else if (highPriority.length > 0) {
        reply = `🔥 Chào **${userName}**, bạn hiện không có việc quá hạn, nhưng có **${highPriority.length} việc Ưu tiên Cao** cần giải quyết trước:\n\n` +
          highPriority.map(t => `• ⚡ **${t.title}** (${t.status === 'in_progress' ? 'Đang làm' : 'Chờ thực hiện'})`).join('\n');
      } else {
        reply = `🎉 Tuyệt vời **${userName}**! Bạn không có công việc nào bị quá hạn hay khẩn cấp vào lúc này. Danh sách đang trong tầm kiểm soát tốt!`;
      }
    }
    // 4. Lập kế hoạch
    else if (lower.includes('kế hoạch') || lower.includes('học') || lower.includes('các bước')) {
      reply = `📝 **Gợi ý kế hoạch hành động 3 bước dành cho bạn:**\n\n` +
        `1. **Chuẩn bị & Phân tích yêu cầu**: Xác định rõ mục tiêu cần đạt được và chuẩn bị tài liệu liên quan.\n` +
        `2. **Thực hiện theo từng giai đoạn**: Chia nhỏ mục tiêu lớn thành các đầu việc nhỏ từ 30-45 phút tập trung.\n` +
        `3. **Đánh giá & Kiểm thử**: Rà soát lại kết quả, đánh dấu hoàn thành và rút kinh nghiệm.\n\n` +
        `Bạn có thể tạo các đầu việc con này vào TaskMaster Pro để tiện theo dõi nhé!`;
    }
    // 5. Mặc định
    else {
      reply = `👋 Chào **${userName}**! Tôi là **Trợ lý AI**.\n\n` +
        `Tôi có thể giúp bạn:\n` +
        `• 📅 Kiểm tra các công việc gấp, sắp tới hạn hoặc quá hạn\n` +
        `• 📊 Báo cáo tiến độ và năng suất làm việc trong ngày\n` +
        `• 💡 Lập kế hoạch và phân rã các bước thực hiện mục tiêu\n` +
        `• ⚡ Đề xuất tạo việc mới siêu tốc bằng ngôn ngữ tự nhiên\n\n` +
        `*(💡 Mẹo: Bạn có thể thêm \`GEMINI_API_KEY\` vào file \`.env\` để kích hoạt toàn bộ sức mạnh mô hình Google Gemini 2.5 Flash nhé!)*`;
    }

    return {
      success: true,
      reply,
      actions,
      model: 'TaskMaster Smart Rule Engine (Fallback Mode)'
    };
  }

  /**
   * 1. Voice-to-Task: Phân tích giọng nói tiếng Việt thành thuộc tính Task
   */
  async parseVoiceToTask({ transcript, now = new Date() }) {
    if (!transcript || !transcript.trim()) {
      throw new Error('Văn bản giọng nói không được để trống!');
    }

    const client = this.getClient();
    const currentDate = new Date(now);
    const dateStr = currentDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = currentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (client) {
      try {
        const prompt = `Bạn là hệ thống AI phân tích giọng nói tiếng Việt chuyên nghiệp của TaskMaster Pro.
THỜI ĐIỂM HIỆN TẠI: ${timeStr}, ${dateStr} (ISO: ${currentDate.toISOString()}).

Hãy phân tích câu nói của người dùng:
"${transcript.trim()}"

Nhiệm vụ: Bóc tách câu nói thành một đối tượng JSON chuẩn mô tả công việc (Task).
Định dạng JSON yêu cầu (CHỈ TRẢ VỀ JSON, không thêm lời dẫn giải):
{
  "title": "Tiêu đề công việc ngắn gọn, rõ ràng, viết hoa chữ cái đầu",
  "description": "Mô tả bổ sung hoặc ghi chú từ câu nói",
  "priority": "high" | "medium" | "low",
  "dueDate": "ISO 8601 string theo múi giờ địa phương +07:00 (ví dụ: 2026-09-21T09:00:00+07:00) hoặc null nếu không nói đến thời gian",
  "tags": ["mảng", "các", "tag", "ngắn"]
}

Quy tắc phân tích:
1. Nếu câu có từ 'gấp', 'khẩn cấp', 'quan trọng', 'ngay', 'ưu tiên cao' -> priority = 'high'.
2. Nếu câu có 'khi nào rảnh', 'thong thả', 'ưu tiên thấp' -> priority = 'low'. Mặc định: 'medium'.
3. Tính toán chính xác thời gian tương đối:
   - 'sáng mai', '9h sáng mai' -> 09:00 ngày mai.
   - 'chiều mai', '3h chiều mai', '15h mai' -> 15:00 ngày mai.
   - 'hôm nay', 'tối nay 8h' -> 20:00 hôm nay.
   - 'thứ 2 tuần sau', 'trong 2 tiếng nữa'... hãy cộng dồn từ thời điểm hiện tại (${currentDate.toISOString()}).
4. Loại bỏ các từ thừa như 'nhắc tôi', 'tạo việc', 'thêm việc', 'nhớ làm' khỏi tiêu đề title.`;

        const response = await client.models.generateContent({
          model: this.modelName,
          contents: prompt
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: {
              title: parsed.title || transcript.trim(),
              description: parsed.description || `Nhận diện từ giọng nói: "${transcript.trim()}"`,
              priority: ['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'medium',
              dueDate: parsed.dueDate || null,
              tags: Array.isArray(parsed.tags) ? parsed.tags : []
            },
            source: 'gemini'
          };
        }
      } catch (err) {
        console.warn('⚠️ [Voice Parser] Gemini lỗi, chuyển sang bộ phân tích quy tắc dự phòng:', err.message);
      }
    }

    // Smart Rule-based Fallback Parser
    return this.parseVoiceFallback({ transcript, now: currentDate });
  }

  /**
   * Bộ bóc tách giọng nói dự phòng bằng quy tắc từ khóa tiếng Việt
   */
  parseVoiceFallback({ transcript, now }) {
    const text = transcript.trim();
    const lower = text.toLowerCase();

    // 1. Xác định mức ưu tiên
    let priority = 'medium';
    if (lower.includes('gấp') || lower.includes('khẩn') || lower.includes('ưu tiên cao') || lower.includes('quan trọng')) {
      priority = 'high';
    } else if (lower.includes('ưu tiên thấp') || lower.includes('rảnh làm') || lower.includes('khi nào tiện')) {
      priority = 'low';
    }

    // 2. Tính toán ngày giờ tương đối
    let dueDate = null;
    const targetDate = new Date(now);

    if (lower.includes('mai')) {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(9, 0, 0, 0); // Mặc định 9h sáng mai
      if (lower.includes('chiều') || lower.includes('tối')) {
        targetDate.setHours(15, 0, 0, 0);
      }
      dueDate = targetDate.toISOString();
    } else if (lower.includes('hôm nay') || lower.includes('tối nay')) {
      targetDate.setHours(18, 0, 0, 0);
      dueDate = targetDate.toISOString();
    } else if (lower.includes('tuần sau')) {
      targetDate.setDate(targetDate.getDate() + 7);
      targetDate.setHours(9, 0, 0, 0);
      dueDate = targetDate.toISOString();
    }

    // 3. Làm sạch tiêu đề
    let cleanTitle = text
      .replace(/^(nhắc tôi|tạo việc mới|tạo việc|thêm việc mới|thêm việc|tạo task|nhớ|giúp tôi)\s*/gi, '')
      .replace(/\s*(mức ưu tiên cao|ưu tiên cao|gấp lắm|gấp|ưu tiên thấp|nhé|nha)$/gi, '')
      .trim();

    cleanTitle = cleanTitle ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : text;

    return {
      success: true,
      data: {
        title: cleanTitle,
        description: `Nhận diện từ giọng nói: "${text}"`,
        priority,
        dueDate,
        tags: ['voice-note']
      },
      source: 'rule-fallback'
    };
  }

  /**
   * 2. Smart Subtasks: Tự động chia nhỏ công việc thành 3-6 bước cụ thể
   */
  async generateSubtasks({ title, description = '' }) {
    if (!title || !title.trim()) {
      throw new Error('Tiêu đề công việc không được để trống!');
    }

    const client = this.getClient();

    if (client) {
      try {
        const prompt = `Bạn là chuyên gia phân tích công việc và quản trị dự án thông minh.
Công việc cần thực hiện: "${title.trim()}"
Chi tiết/mô tả: "${(description || '').trim() || 'Không có'}"

Hãy chia nhỏ công việc trên thành từ 3 đến 5 bước công việc con (Subtasks / Checklist) cụ thể, thực tế, hành động được ngay.
Mỗi bước là một câu ngắn gọn dưới 70 ký tự tiếng Việt.

ĐỊNH DẠNG ĐẦU RA: CHỈ TRẢ VỀ DUY NHẤT MỘT MẢNG JSON HỢP LỆ (Không có markdown hay văn bản ngoài):
[
  { "title": "Bước 1: Tiêu đề bước cụ thể" },
  { "title": "Bước 2: Tiêu đề bước cụ thể" },
  { "title": "Bước 3: Tiêu đề bước cụ thể" }
]`;

        const response = await client.models.generateContent({
          model: this.modelName,
          contents: prompt
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const items = JSON.parse(jsonMatch[0]);
          if (Array.isArray(items) && items.length > 0) {
            return {
              success: true,
              subtasks: items.map(it => ({ title: String(it.title || it).trim() })),
              source: 'gemini'
            };
          }
        }
      } catch (err) {
        console.warn('⚠️ [Subtask Generator] Gemini lỗi, chuyển sang mẫu thông minh dự phòng:', err.message);
      }
    }

    // Mẫu phân rã thông minh dự phòng
    return {
      success: true,
      subtasks: [
        { title: `Chuẩn bị tài liệu & phân tích yêu cầu cho: ${title.trim()}` },
        { title: `Thực hiện và xây dựng các hạng mục cốt lõi` },
        { title: `Kiểm tra, rà soát kết quả và nghiệm thu hoàn thành` }
      ],
      source: 'smart-fallback'
    };
  }

  /**
   * 3. AI Daily Briefing: Soạn thảo thư thông tin tóm tắt ngày mới chuyên nghiệp
   */
  async generateDailyBriefingContent({ user, todos = [] }) {
    const userName = user?.name || 'Bạn';
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const overdue = todos.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now);
    const dueToday = todos.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return new Date(t.dueDate).toDateString() === now.toDateString();
    });
    const highPriority = todos.filter(t => t.status !== 'completed' && t.priority === 'high');

    const client = this.getClient();

    if (client) {
      try {
        const prompt = `Bạn là Trợ lý AI cao cấp của TaskMaster Pro.
Hôm nay là: ${dateStr}.
Người dùng: ${userName}.
Tình trạng công việc:
- Tổng số việc cần làm: ${todos.filter(t => t.status !== 'completed').length} việc.
- Việc quá hạn: ${overdue.length} việc (${overdue.map(t => t.title).slice(0, 3).join(', ')}).
- Việc đến hạn hôm nay: ${dueToday.length} việc (${dueToday.map(t => t.title).slice(0, 3).join(', ')}).
- Việc ưu tiên cao: ${highPriority.length} việc.

Nhiệm vụ: Hãy viết một đoạn thông điệp "Bản tin buổi sáng (Executive Morning Briefing)" bằng tiếng Việt:
1. Lời chúc buổi sáng năng lượng, ấm áp gửi tới ${userName}.
2. Lời khuyên trọng tâm cho ngày hôm nay: Chỉ rõ việc nào nên giải quyết đầu tiên trong ngày để đạt hiệu quả cao nhất.
3. Câu châm ngôn hoặc thông điệp truyền cảm hứng ngắn gọn.
Văn phong: Lịch thiệp, tinh tế, truyền cảm hứng, độ dài 2-3 đoạn ngắn (khoảng 150-200 từ).`;

        const response = await client.models.generateContent({
          model: this.modelName,
          contents: prompt
        });

        const briefingText = response.text || '';
        if (briefingText.trim()) {
          return {
            success: true,
            briefing: briefingText.trim(),
            source: 'gemini'
          };
        }
      } catch (err) {
        console.warn('⚠️ [Briefing Generator] Gemini lỗi, sử dụng bản tin dự phòng:', err.message);
      }
    }

    // Dự phòng chuẩn
    let advice = 'Hôm nay danh sách công việc của bạn rất thoáng đãng. Hãy dành thời gian để hoàn thiện các mục tiêu dài hạn nhé!';
    if (overdue.length > 0) {
      advice = `Bạn đang có ${overdue.length} công việc đã quá hạn (đặc biệt là "${overdue[0].title}"). Hãy dành 1 giờ đầu ngày để xử lý dứt điểm các mục này nhé.`;
    } else if (dueToday.length > 0) {
      advice = `Trọng tâm hôm nay là ${dueToday.length} công việc cần hoàn thành đúng hạn. Ưu tiên giải quyết trước các việc có mức độ quan trọng cao.`;
    }

    return {
      success: true,
      briefing: `Chào buổi sáng ${userName}! Chúc bạn một ngày làm việc tràn đầy năng lượng và hiệu suất cao.\n\n💡 Lời khuyên ngày mới: ${advice}\n\n"Thành công là tổng hòa của những nỗ lực nhỏ được lặp đi lặp lại mỗi ngày." - Chúc bạn có một ngày tuyệt vời cùng TaskMaster Pro!`,
      source: 'smart-fallback'
    };
  }
}

export default new AiService();

