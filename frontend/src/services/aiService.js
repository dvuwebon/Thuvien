import { AI_CONFIG, getActiveApiKey } from '../config/aiConfig';

/**
 * Tri thức tích hợp sẵn của Trợ lý Thư viện khi chưa có API Key
 */
const generateLocalSmartResponse = (question, books = []) => {
  const q = (question || '').toLowerCase().trim();

  // 1. Hỏi về quy định mượn / hạn trả sách
  if (q.includes('mượn') && (q.includes('hạn') || q.includes('bao lâu') || q.includes('quy định') || q.includes('thời gian'))) {
    return `Dạ, về quy định mượn sách thì siêu thoải mái bạn nhé! 📖✨

- **Thời hạn mượn:** Bạn được mượn sách về nhà tối đa **14 ngày** (tha hồ thời gian đọc nghiền ngẫm nha).
- **Số lượng:** Mỗi bạn được mượn cùng lúc **tối đa 3 cuốn** để sách luôn được luân chuyển đều đặn.
- **Gia hạn:** Nếu đọc chưa kịp xong, bạn chỉ cần báo thủ thư hoặc gia hạn trước 3 ngày là được nha.

Bạn đang tăm tia cuốn nào trong thư viện chưa nè? Cứ bảo mình nhé! 😊`;
  }

  // 2. Hỏi về cách trả sách
  if (q.includes('trả sách') || q.includes('cách trả') || q.includes('hoàn tất')) {
    return `Trả sách thì cực kỳ đơn giản chỉ mất 5 giây thôi nè! 🔄

1. Bạn vào mục **"Sách đang mượn & Chờ duyệt"** trên cổng độc giả.
2. Tại cuốn sách bạn muốn trả, bấm nút **[Trả sách]** màu xanh lá.
3. Hộp thoại hiện ra, bạn chỉ việc ấn **[Xác nhận]** là sách sẽ chuyển ngay sang mục **Lịch sử mượn trả** luôn!

Có cuốn nào bạn đọc xong rồi muốn trả để mượn cuốn mới không? 😉`;
  }

  // 3. Hỏi về gợi ý sách phát triển bản thân / kỹ năng
  if (q.includes('phát triển bản thân') || q.includes('kỹ năng') || q.includes('tư duy') || q.includes('đắc nhân tâm') || q.includes('sách hay')) {
    const matched = books.filter(b => 
      (b.category && (b.category.includes('Kỹ năng') || b.category.includes('Tâm lý') || b.category.includes('Kinh doanh'))) ||
      (b.title && (b.title.toLowerCase().includes('tư duy') || b.title.toLowerCase().includes('đắc nhân tâm') || b.title.toLowerCase().includes('thói quen')))
    ).slice(0, 3);

    let res = `U là trời, bạn hỏi đúng tủ của mình rồi! Đây là mấy cuốn phát triển bản thân đọc bao cuốn mà thư viện đang có sẵn nè: 🌟\n\n`;
    if (matched.length > 0) {
      matched.forEach((b, idx) => {
        res += `${idx + 1}. 📚 **${b.title}** - *${b.author || 'Tác giả nổi tiếng'}*\n   👉 Thể loại: ${b.category || 'Kỹ năng sống'} (Hiện còn ${b.quantity || 1} cuốn trong kho)\n\n`;
      });
    } else {
      res += `1. **Đắc Nhân Tâm** - Cuốn sách gối đầu giường về nghệ thuật thấu hiểu và giao tiếp.\n2. **Tư Duy Mở** - Giúp bạn bứt phá mọi giới hạn bản thân.\n3. **7 Thói Quen Của Bạn Trẻ Thành Đạt** - Xây dựng thói quen cực đỉnh.\n\n`;
    }
    res += `Bạn thích cuốn nào nhất? Chuyển sang tab **"Tra cứu sách"** bấm mượn luôn kẻo hết nha! 🚀`;
    return res;
  }

  // 4. Hỏi về sách công nghệ / lập trình / AI
  if (q.includes('công nghệ') || q.includes('lập trình') || q.includes('python') || q.includes('ai') || q.includes('cntt') || q.includes('khoa học')) {
    return `Dân mê công nghệ điểm danh! 💻🔥 Thư viện có mấy cuốn này dành riêng cho bạn:

1. **Lập Trình Python Cơ Bản Đến Nâng Cao** — Cực dễ hiểu cho ai muốn làm chủ ngôn ngữ hot nhất hiện nay.
2. **Trí Tuệ Nhân Tạo & Machine Learning** — Khám phá cách tạo ra những con bot xịn sò giống mình nè! 🤖
3. **Clean Code (Mã Sạch)** — Bí kíp để viết code đẹp như tranh vẽ.

Bạn đang theo hướng mảng nào (Web, AI hay Data) để mình lọc sách chuẩn hơn cho bạn nha?`;
  }

  // 5. Tìm kiếm trực tiếp tên sách trong kho
  const foundBooks = books.filter(b => 
    b.title && b.title.toLowerCase().includes(q)
  );
  if (foundBooks.length > 0) {
    const b = foundBooks[0];
    return `Ting ting! Mình tìm thấy cuốn này trong kho sách rồi nè bạn ơi: 🎉

- 📖 **Tên sách:** **${b.title}**
- ✍️ **Tác giả:** ${b.author || 'Đang cập nhật'}
- 🏷️ **Thể loại:** ${b.category || 'Tổng hợp'}
- 📦 **Kho còn:** ${b.quantity || 1} cuốn sẵn sàng cho mượn.
- 📝 **Nội dung:** ${b.desc || 'Cuốn sách cực kỳ bổ ích và được nhiều bạn đọc chấm 5 sao tại thư viện.'}

Bạn vào tab **Tra cứu sách** để ấn mượn về nhà đọc ngay nha! Chúc bạn đọc sách vui vẻ! ✨`;
  }

  // 6. Trả lời mặc định thông minh & phong phú
  const randomBooks = books.slice(0, 3).map(b => `• 📖 **${b.title}** (${b.author || 'Tác giả'})`).join('\n');
  return `Chào bạn nha! Cảm ơn câu hỏi rất thú vị của bạn: *"@question"* ✨

Hiện tại trong kho của chúng mình đang có hơn **${books.length || 20} đầu sách** cực hay. Mấy cuốn đang hot rần rần gồm có:
${randomBooks || '• Giáo Trình Triết Học Mác - Lênin\n• Đắc Nhân Tâm\n• Tư Duy Mở'}

Bạn có muốn mình gợi ý thêm sách theo gu riêng của bạn không? Cứ thoải mái chia sẻ với mình nhé! 😊`.replace('@question', question);
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
