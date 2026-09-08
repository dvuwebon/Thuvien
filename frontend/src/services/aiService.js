import { AI_CONFIG, getActiveApiKey } from '../config/aiConfig';

/**
 * Tri thức tích hợp sẵn của Trợ lý Thư viện khi chưa có API Key
 * Chuẩn hóa schema output theo đúng đặc tả Word Chương 2:
 * {
 *   found: boolean,
 *   answer: string,
 *   suggested_books: [{ book_id: number, title: string, author: string, reason: string }],
 *   intent: string
 * }
 */
const generateLocalSmartResponse = (question, books = []) => {
  const q = (question || '').toLowerCase().trim();

  // 1. Hỏi về quy định mượn / hạn trả sách
  if (q.includes('mượn') && (q.includes('hạn') || q.includes('bao lâu') || q.includes('quy định') || q.includes('thời gian') || q.includes('tối đa'))) {
    return {
      found: true,
      answer: `Dạ, về quy định mượn sách thì siêu rõ ràng và thuận tiện bạn nhé! 📖✨

- **Thời hạn mượn:** Bạn được mượn sách về nhà tối đa **14 ngày** (mượn tại chỗ trong ngày).
- **Số lượng:** Mỗi độc giả được mượn cùng lúc **tối đa 5 cuốn** theo quy định thư viện.
- **Phí trễ hạn:** Nếu trả quá hạn, phí phạt là **2.000 đ/ngày/cuốn**. Bạn nhớ trả đúng hạn nha!
- **Hàng chờ đặt trước:** Nếu sách hết, bạn có thể Đặt trước để giữ chỗ ưu tiên FIFO (48h).

Bạn đang muốn tìm đọc cuốn sách nào không? Cứ nhắn mình nhé! 😊`,
      suggested_books: [],
      intent: 'inquiry'
    };
  }

  // 2. Hỏi về cách trả sách
  if (q.includes('trả sách') || q.includes('cách trả') || q.includes('hoàn tất') || q.includes('phạt')) {
    return {
      found: true,
      answer: `Trả sách thì cực kỳ đơn giản chỉ mất vài giây thôi nè! 🔄

1. Bạn vào mục **"Sách đang mượn & Chờ duyệt"** trên Cổng Độc giả.
2. Tại cuốn sách bạn muốn trả, bấm nút **[Trả sách]** màu xanh lá.
3. Hộp thoại xác nhận hiện ra, bạn chỉ việc ấn **[Xác nhận]** là sách sẽ được cập nhật sang **Lịch sử mượn trả**.
4. Nếu trả đúng hạn, bạn sẽ nhận được huy hiệu **✓ Đúng hạn**!

Có cuốn nào bạn đọc xong rồi muốn trả để mượn cuốn mới không? 😉`,
      suggested_books: [],
      intent: 'inquiry'
    };
  }

  // 3. Hỏi về gợi ý sách phát triển bản thân / kỹ năng
  if (q.includes('phát triển bản thân') || q.includes('kỹ năng') || q.includes('tư duy') || q.includes('đắc nhân tâm') || q.includes('sách hay') || q.includes('gợi ý')) {
    const matched = books.filter(b => 
      (b.category && (b.category.includes('Kỹ năng') || b.category.includes('Tâm lý') || b.category.includes('Kinh doanh'))) ||
      (b.title && (b.title.toLowerCase().includes('tư duy') || b.title.toLowerCase().includes('đắc nhân tâm') || b.title.toLowerCase().includes('thói quen') || b.title.toLowerCase().includes('tâm')))
    ).slice(0, 3);

    const fallbackMatched = matched.length > 0 ? matched : books.slice(0, 3);
    const suggested = fallbackMatched.map(b => ({
      book_id: b.id,
      title: b.title,
      author: b.author || 'Tác giả nổi tiếng',
      reason: `Sách thể loại ${b.category || 'Kỹ năng sống'} được bạn đọc đánh giá rất cao về tính ứng dụng.`
    }));

    return {
      found: true,
      answer: `U là trời, bạn hỏi đúng tủ của mình rồi! Dưới đây là những cuốn sách phát triển bản thân và tư duy cực kỳ bổ ích đang có sẵn trong kho thư viện SmartLib: 🌟

Bạn có thể bấm vào thẻ sách gợi ý bên dưới để xem chi tiết hoặc đăng ký mượn ngay nhé!`,
      suggested_books: suggested,
      intent: 'recommendation'
    };
  }

  // 4. Hỏi về sách công nghệ / lập trình / AI
  if (q.includes('công nghệ') || q.includes('lập trình') || q.includes('python') || q.includes('ai') || q.includes('cntt') || q.includes('khoa học')) {
    const matched = books.filter(b => 
      (b.category && (b.category.includes('Công nghệ') || b.category.includes('Khoa học'))) ||
      (b.title && (b.title.toLowerCase().includes('python') || b.title.toLowerCase().includes('code') || b.title.toLowerCase().includes('trí tuệ') || b.title.toLowerCase().includes('lập trình')))
    ).slice(0, 3);

    const fallbackMatched = matched.length > 0 ? matched : books.slice(0, 3);
    const suggested = fallbackMatched.map(b => ({
      book_id: b.id,
      title: b.title,
      author: b.author || 'Chuyên gia CNTT',
      reason: `Tài liệu chuẩn mực giúp nâng cao tư duy thuật toán và kỹ năng lập trình thực chiến.`
    }));

    return {
      found: true,
      answer: `Dân mê công nghệ điểm danh! 💻🔥 SmartLib có những đầu sách công nghệ và lập trình chất lượng cao dành riêng cho bạn:`,
      suggested_books: suggested,
      intent: 'recommendation'
    };
  }

  // 5. Tìm kiếm trực tiếp tên sách trong kho
  const foundBooks = books.filter(b => 
    b.title && b.title.toLowerCase().includes(q)
  );
  if (foundBooks.length > 0) {
    const b = foundBooks[0];
    return {
      found: true,
      answer: `Ting ting! Mình tìm thấy cuốn này trong kho sách SmartLib rồi nè bạn ơi: 🎉

- 📖 **Tên sách:** **${b.title}**
- ✍️ **Tác giả:** ${b.author || 'Đang cập nhật'}
- 🏷️ **Thể loại:** ${b.category || 'Tổng hợp'}
- 📦 **Tình trạng:** Sẵn sàng cho mượn tại thư viện.
- 📝 **Mô tả:** ${b.desc || 'Tác phẩm hay và bổ ích, được nhiều bạn đọc yêu thích.'}

Bạn có thể bấm vào thẻ sách bên dưới để xem chi tiết hoặc mượn về nhà đọc ngay nha! ✨`,
      suggested_books: [
        {
          book_id: b.id,
          title: b.title,
          author: b.author || 'Tác giả',
          reason: 'Khớp chính xác với từ khóa bạn vừa tìm kiếm.'
        }
      ],
      intent: 'search_exact'
    };
  }

  // 6. Trả lời mặc định kèm gợi ý
  const randomBooks = books.slice(0, 3).map(b => ({
    book_id: b.id,
    title: b.title,
    author: b.author || 'Tác giả',
    reason: `Đầu sách thể loại ${b.category || 'Hay'} đang được mượn nhiều trong tuần.`
  }));

  return {
    found: books.length > 0,
    answer: `Chào bạn nha! Cảm ơn câu hỏi của bạn. ✨

Hiện tại trong kho thư viện SmartLib đang có **${books.length || 50} đầu sách**. Dưới đây là một số cuốn sách tiêu biểu bạn có thể tham khảo mượn đọc:`,
    suggested_books: randomBooks,
    intent: 'general'
  };
};

/**
 * Hàm gửi câu hỏi tới AI với schema đầu ra chuẩn hóa
 */
export const askLibraryAI = async (userQuestion, books = []) => {
  const startTime = Date.now();
  const apiKey = getActiveApiKey();
  let aiResult = null;

  // NẾU CÓ API KEY -> GỌI API THẬT
  if (apiKey) {
    try {
      if (AI_CONFIG.PROVIDER === 'gemini') {
        const catalogContext = (books || []).slice(0, 30).map(b => 
          `ID: ${b.id} | "${b.title}" (${b.author || 'Khuyết danh'} - ${b.category || 'Chung'})`
        ).join('\n');

        const systemPrompt = `Bạn là Trợ lý AI Thông minh của Thư viện SmartLib.
Nhiệm vụ: Trả lời độc giả bằng tiếng Việt thân thiện, lịch thiệp, hỗ trợ tra cứu sách và quy định thư viện.
DANH MỤC SÁCH TRONG THƯ VIỆN:
${catalogContext}

YÊU CẦU ĐẶC BIỆT: Hãy trả về DUY NHẤT một JSON hợp lệ (không kèm markdown \`\`\`json) với schema sau:
{
  "found": true,
  "answer": "Câu trả lời thân thiện định dạng markdown ngắn gọn",
  "suggested_books": [
    { "book_id": 1, "title": "Tên sách", "reason": "Lý do gợi ý sách này" }
  ],
  "intent": "recommendation"
}`;

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
            try {
              const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed.answer) {
                aiResult = {
                  found: parsed.found ?? true,
                  answer: parsed.answer,
                  suggested_books: Array.isArray(parsed.suggested_books) ? parsed.suggested_books : [],
                  intent: parsed.intent || 'general'
                };
              }
            } catch (e) {
              aiResult = {
                found: true,
                answer: candidateText,
                suggested_books: [],
                intent: 'general'
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi khi gọi API AI, chuyển sang hệ thống tri thức tích hợp:', err);
    }
  }

  // Fallback nếu không có API key hoặc lỗi mạng
  if (!aiResult) {
    aiResult = generateLocalSmartResponse(userQuestion, books);
  }

  // Đảm bảo nhịp chờ tự nhiên
  const elapsed = Date.now() - startTime;
  const targetDelay = AI_CONFIG.MIN_RESPONSE_DELAY_MS || 1200;
  const remainingDelay = Math.max(0, targetDelay - elapsed);

  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }

  return aiResult;
};
