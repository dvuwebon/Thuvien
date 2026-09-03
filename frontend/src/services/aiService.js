import { AI_CONFIG, getActiveApiKey } from '../config/aiConfig';

/**
 * Tri thức tích hợp sẵn của Trợ lý Thư viện khi chưa có API Key
 */
const generateLocalSmartResponse = (question, books = []) => {
  const q = (question || '').toLowerCase().trim();

  // 1. Hỏi về quy định mượn / hạn trả sách
  if (q.includes('mượn') && (q.includes('hạn') || q.includes('bao lâu') || q.includes('quy định') || q.includes('thời gian'))) {
    return `📖 **Quy định mượn sách tại Thư viện:**
- **Thời hạn mượn:** Mỗi độc giả được mượn tối đa **14 ngày** cho mỗi cuốn sách.
- **Số lượng tối đa:** Tối đa **3 cuốn** cùng lúc để đảm bảo sách được luân chuyển đều đặn.
- **Hình thức mượn:** Bạn có thể chọn *"Mượn về nhà"* hoặc *"Đọc tại chỗ tại thư viện"*.
- **Gia hạn:** Bạn có thể liên hệ thủ thư hoặc gia hạn trước ngày hết hạn 3 ngày nếu chưa có bạn đọc khác đặt trước.

*Chúc bạn có những giờ phút đọc sách thật bổ ích!*`;
  }

  // 2. Hỏi về cách trả sách
  if (q.includes('trả sách') || q.includes('cách trả') || q.includes('hoàn tất')) {
    return `🔄 **Hướng dẫn Trả sách về thư viện:**
1. Truy cập vào mục **"Sách đang mượn & Chờ duyệt"** trên cổng độc giả của bạn.
2. Tại cuốn sách bạn muốn trả (đang có trạng thái **Đang mượn**), nhấn nút **[Trả sách]**.
3. Một hộp thoại xác nhận sẽ hiện ra, nhấn **[Xác nhận]** để hoàn tất việc trả sách.
4. Cuốn sách sẽ ngay lập tức được chuyển sang mục **"Lịch sử mượn trả"** và ghi nhận thời gian trả thực tế.`;
  }

  // 3. Hỏi về gợi ý sách phát triển bản thân / kỹ năng
  if (q.includes('phát triển bản thân') || q.includes('kỹ năng') || q.includes('tư duy') || q.includes('đắc nhân tâm')) {
    const matched = books.filter(b => 
      (b.category && (b.category.includes('Kỹ năng') || b.category.includes('Tâm lý') || b.category.includes('Kinh doanh'))) ||
      (b.title && (b.title.toLowerCase().includes('tư duy') || b.title.toLowerCase().includes('đắc nhân tâm') || b.title.toLowerCase().includes('thói quen')))
    ).slice(0, 3);

    let res = `🌟 **Gợi ý sách Phát triển bản thân & Kỹ năng xuất sắc nhất trong thư viện:**\n\n`;
    if (matched.length > 0) {
      matched.forEach((b, idx) => {
        res += `${idx + 1}. 📚 **${b.title}**\n   - Tác giả: *${b.author || 'Nhiều tác giả'}*\n   - Thể loại: ${b.category || 'Kỹ năng sống'}\n   - Tình trạng: ${b.quantity > 0 ? 'Có sẵn trong kho' : 'Tạm hết'}\n\n`;
      });
    } else {
      res += `1. **Đắc Nhân Tâm** - Dale Carnegie: Nghệ thuật thu phục lòng người và giao tiếp đỉnh cao.\n2. **Tư Duy Mở** - Carol S. Dweck: Khai phóng tiềm năng tư duy phát triển.\n3. **7 Thói Quen Của Bạn Trẻ Thành Đạt** - Sean Covey: Xây dựng nền tảng tư duy vững chắc.\n\n`;
    }
    res += `👉 Bạn có thể chuyển sang tab **"Tra cứu sách"** để ấn mượn ngay hôm nay!`;
    return res;
  }

  // 4. Hỏi về sách công nghệ / lập trình / AI
  if (q.includes('công nghệ') || q.includes('lập trình') || q.includes('python') || q.includes('ai') || q.includes('cntt') || q.includes('khoa học')) {
    return `💻 **Sách Công nghệ thông tin & Khoa học nổi bật:**
1. **Lập Trình Python Cơ Bản Đến Nâng Cao**: Cẩm nang nhập môn lập trình hiện đại.
2. **Trí Tuệ Nhân Tạo & Machine Learning Hiện Đại**: Khám phá thế giới AI thế hệ mới.
3. **Clean Code - Mã Sạch**: Nghệ thuật viết code chuẩn mực của Robert C. Martin.

Thư viện liên tục cập nhật các tài liệu mới nhất về Khoa học dữ liệu, AI và Lập trình phần mềm để phục vụ nhu cầu học tập của bạn!`;
  }

  // 5. Tìm kiếm trực tiếp tên sách trong kho
  const foundBooks = books.filter(b => 
    b.title && b.title.toLowerCase().includes(q)
  );
  if (foundBooks.length > 0) {
    const b = foundBooks[0];
    return `🔍 **Tìm thấy sách trong kho thư viện:**
- 📖 **Tựa đề:** **${b.title}**
- ✍️ **Tác giả:** ${b.author || 'Chưa cập nhật'}
- 🏷️ **Thể loại:** ${b.category || 'Chung'}
- 📦 **Số lượng trong kho:** ${b.quantity || 1} cuốn
- 📝 **Mô tả:** ${b.desc || 'Cuốn sách giá trị đang được nhiều độc giả quan tâm tại thư viện.'}

👉 Bạn có thể vào tab **Tra cứu sách** để đăng ký mượn cuốn sách này ngay nhé!`;
  }

  // 6. Trả lời mặc định thông minh & phong phú
  const randomBooks = books.slice(0, 3).map(b => `• **${b.title}** (${b.author || 'Tác giả'})`).join('\n');
  return `Chào bạn! Tôi là **Trợ lý AI Thư viện SmartLib** 🤖.

Cảm ơn bạn đã đặt câu hỏi: *"@question"*

Một số thông tin hữu ích dành cho bạn:
- Thư viện hiện đang có hơn **${books.length || 20} đầu sách** phong phú thuộc các thể loại: *Kỹ năng sống, Công nghệ thông tin, Kinh tế, Văn học và Khoa học*.
- Một vài cuốn sách đang được độc giả yêu thích nhất:
${randomBooks || '• Giáo Trình Triết Học Mác - Lênin\n• Đắc Nhân Tâm\n• Tư Duy Mở'}

💡 *Mẹo: Bạn có thể hỏi tôi về quy định mượn trả, gợi ý sách theo chủ đề yêu thích, hoặc điền Google Gemini API Key vào tệp cấu hình để tôi giải đáp chuyên sâu mọi câu hỏi học thuật khác nhé!*`.replace('@question', question);
};

/**
 * Hàm gửi câu hỏi tới AI với thời gian chờ tối thiểu 5 giây và hiệu ứng mượt mà
 */
export const askLibraryAI = async (userQuestion, books = []) => {
  const startTime = Date.now();
  const apiKey = getActiveApiKey();
  let aiAnswer = '';

  // NẾU CÓ API KEY -> GỌI API THẬT
  if (apiKey) {
    try {
      if (AI_CONFIG.PROVIDER === 'gemini') {
        const catalogContext = (books || []).slice(0, 25).map(b => 
          `- "${b.title}" (${b.author || 'Khuyết danh'} - Thể loại: ${b.category || 'Chung'})`
        ).join('\n');

        const systemPrompt = `Bạn là Trợ lý AI Thông minh của Thư viện SmartLib.
Nhiệm vụ của bạn là:
- Trả lời độc giả bằng tiếng Việt thân thiện, lịch thiệp, thông minh, truyền cảm hứng đọc sách.
- Trả lời các câu hỏi về tra cứu sách, gợi ý sách hay, phương pháp đọc sách hiệu quả, quy trình mượn sách 14 ngày tại thư viện.
- Danh mục một số đầu sách hiện có trong kho thư viện:
${catalogContext}
Hãy định dạng câu trả lời bằng Markdown (dùng in đậm, danh sách gạch đầu dòng) rõ ràng, súc tích.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nCâu hỏi của độc giả: ${userQuestion}` }]
                }
              ]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            aiAnswer = candidateText;
          }
        }
      } else if (AI_CONFIG.PROVIDER === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: AI_CONFIG.MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Bạn là Trợ lý AI Thư viện SmartLib thân thiện, trả lời độc giả bằng tiếng Việt với định dạng Markdown ngắn gọn, hữu ích.'
              },
              { role: 'user', content: userQuestion }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          aiAnswer = data?.choices?.[0]?.message?.content || '';
        }
      }
    } catch (err) {
      console.warn('Lỗi khi gọi API AI, chuyển sang hệ thống tri thức tích hợp:', err);
    }
  }

  // Nếu không có API Key hoặc API trả về rỗng -> dùng hệ thống tri thức thông minh tích hợp
  if (!aiAnswer) {
    aiAnswer = generateLocalSmartResponse(userQuestion, books);
  }

  // ĐẢM BẢO CHỜ ĐỦ 5 GIÂY (5000ms) THEO YÊU CẦU CỦA NGƯỜI DÙNG ĐỂ HIỆN DẤU 3 CHẤM NHỊP NHÀNG
  const elapsed = Date.now() - startTime;
  const targetDelay = AI_CONFIG.MIN_RESPONSE_DELAY_MS || 5000;
  const remainingDelay = Math.max(0, targetDelay - elapsed);

  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }

  return aiAnswer;
};
