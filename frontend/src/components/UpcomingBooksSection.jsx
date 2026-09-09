import React, { useState } from 'react';
import { Star, ChevronRight, Bell, Check } from 'lucide-react';

const UPCOMING_BOOKS = [
  {
    id: 51,
    title: 'Ao no Hako Season 2 (Chiếc Hộp Xanh)',
    author: 'Kouji Miura',
    rating: 9.6,
    releaseDate: '04-10-2026',
    countdown: '24d 4h 57m 38s',
    views: '114,874',
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
    category: 'Manga & Thể thao',
    desc: 'Tác phẩm truyện tranh thể thao học đường đình đám kết hợp cầu lông và bóng rổ. Phần tiếp theo khai thác giải đấu liên trường quốc gia và những cung bậc cảm xúc lãng mạn tuổi trẻ.'
  },
  {
    id: 52,
    title: 'Tensei Kizoku, Kantei Skill de Nariagaru',
    author: 'Miraijin A',
    rating: 8.8,
    releaseDate: '10-2026',
    views: '214,443',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    category: 'Light Novel & Kỳ ảo',
    desc: 'Hành trình phát triển lãnh địa của quý tộc Ars Louvent nhờ kỹ năng thẩm định thần thánh chiêu mộ hiền tài bảo vệ vương quốc.'
  },
  {
    id: 53,
    title: 'Ma Thuật Đặc Biệt Của Pháp Sư Tái Sinh',
    author: 'Yuusan',
    rating: 9.4,
    releaseDate: '10-2026',
    views: '85,746',
    cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=600&q=80',
    category: 'Kỳ ảo & Hành động',
    desc: 'Pháp sư tài ba thức tỉnh sau hàng thế kỷ trong thời đại ma thuật mới suy tàn và bắt đầu hành trình cải cách ma pháp học viện.'
  },
  {
    id: 54,
    title: 'Black Clover: Đại Chiến Ma Pháp',
    author: 'Yūki Tabata',
    rating: 9.6,
    releaseDate: '10-2026',
    views: '196,239',
    cover: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    category: 'Manga & Shounen',
    desc: 'Cuộc đại chiến ma pháp tối hậu của vương quốc Tam Diệp chống lại các thế lực cổ xưa. Asta tiếp tục bước đi trên con đường trở thành Ma Pháp Vương.'
  },
  {
    id: 55,
    title: 'Thám Tử Lừng Danh Conan - Tuyển Tập 2026',
    author: 'Gosho Aoyama',
    rating: 8.7,
    releaseDate: '11-2026',
    views: '226,521',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
    category: 'Trinh thám & Bí ẩn',
    desc: 'Tuyển tập những vụ án hóc búa nhất của thám tử Edogawa Conan và đối đầu kịch tính cùng Tổ chức Áo đen trong năm 2026.'
  },
  {
    id: 56,
    title: 'Thám Tử Đã Chết 2 (Tantei wa Mou, Shindeiru)',
    author: 'Nigojū',
    rating: 9.1,
    releaseDate: '11-2026',
    views: '641,147',
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    category: 'Light Novel & Trinh thám',
    desc: 'Kimizuka Kimihiko tiếp tục khám phá bí mật đằng sau sự ra đi của nữ thám tử thiên tài Siesta và cuộc chiến với tổ chức SPES.'
  },
  {
    id: 57,
    title: 'Chuyển Sinh Thành Kiếm - Đại Lộ Kiếm Vũ',
    author: 'Yuu Tanaka',
    rating: 9.6,
    releaseDate: '11-2026',
    views: '155,757',
    cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    category: 'Kỳ ảo & Phiêu lưu',
    desc: 'Hành trình vượt qua các đại lục mới của thanh ma kiếm thông minh và cô bé người mèo Fran.'
  },
  {
    id: 58,
    title: 'Dragon Ball Super: Bí Ẩn Đa Vũ Trụ Mới',
    author: 'Akira Toriyama & Toyotarou',
    rating: 9.1,
    releaseDate: '12-2026',
    views: '600,202',
    cover: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
    category: 'Hành động & Siêu nhiên',
    desc: 'Goku và Vegeta tiếp cận cảnh giới sức mạnh mới trước sự xuất hiện của những thực thể quyền năng bí ẩn từ vũ trụ xa xôi.'
  },
  {
    id: 59,
    title: 'Majo no Tabitabi: Hành Trình Elaina 2026',
    author: 'Jougi Shiraishi',
    rating: 9.6,
    releaseDate: '12-2026',
    views: '374,986',
    cover: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
    category: 'Light Novel & Du ký',
    desc: 'Những mẩu chuyện phiêu lưu lắng đọng và kỳ thú của Phù thủy Tro Tàn Elaina qua các vùng đất huyền bí.'
  },
  {
    id: 60,
    title: 'Jujutsu Kaisen: Kỷ Nguyên Hậu Phong Ấn',
    author: 'Gege Akutami',
    rating: 9.8,
    releaseDate: '12-2026',
    views: '890,120',
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    category: 'Shounen & Siêu nhiên',
    desc: 'Kỷ nguyên đỉnh cao của chú thuật sư và nguyền hồn sau khi phong ấn ngục môn cương được giải trừ.'
  }
];

export default function UpcomingBooksSection({ onSelectBook, onReserve }) {
  const [showAll, setShowAll] = useState(false);
  const [subscribedIds, setSubscribedIds] = useState([]);
  const [toastMsg, setToastMsg] = useState('');

  // Mặc định chỉ hiển thị 5 cuốn, khi click XEM THÊM sẽ hiển thị đủ cả 10 cuốn
  const displayedBooks = showAll ? UPCOMING_BOOKS : UPCOMING_BOOKS.slice(0, 5);

  const handleToggleNotify = (book, e) => {
    e.stopPropagation();
    if (subscribedIds.includes(book.id)) {
      setSubscribedIds(prev => prev.filter(id => id !== book.id));
      showToast('Đã hủy đặt trước/nhận tin: ' + book.title);
    } else {
      setSubscribedIds(prev => [...prev, book.id]);
      if (onReserve) {
        onReserve(book);
      } else {
        showToast('✓ Đã đăng ký vào hàng chờ đặt trước: ' + book.title);
      }
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px 28px 28px 28px',
        marginBottom: '32px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        color: '#0f172a',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #3b82f6',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header Tag màu xanh dương #2563eb đồng bộ thương hiệu SmartLib */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>SẮP CÓ</span>
            <ChevronRight size={15} strokeWidth={3} />
          </button>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
            Kho sách bản quyền & Light Novel chuẩn bị có mặt tại thư viện
          </span>
        </div>

        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
          {showAll ? 'Tất cả 10 tác phẩm sắp phát hành (2026)' : '5 / 10 tác phẩm sắp phát hành (2026)'}
        </span>
      </div>

      {/* Grid 5 cột chuẩn bố cục: Giãn đều 100% không để khoảng trống thừa bên phải */}
      <div className="upcoming-books-grid">
        {displayedBooks.map((item) => {
          const isSubscribed = subscribedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onSelectBook && onSelectBook(item)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
            >
              {/* Poster Container với các lớp Overlay đồng bộ */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '2 / 2.85',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
                  marginBottom: '10px',
                  border: '1px solid #e2e8f0'
                }}
              >
                {/* Ảnh bìa poster */}
                <img
                  src={item.cover}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';
                  }}
                  loading="lazy"
                />

                {/* Gradient tối che trên dưới để làm nổi chữ ngày phát hành */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.2) 0%, rgba(15,23,42,0.4) 45%, rgba(15,23,42,0.85) 100%)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Top-left: Huy hiệu ⭐ Rating */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.82)',
                    backdropFilter: 'blur(4px)',
                    color: '#fbbf24',
                    borderRadius: '20px',
                    padding: '3px 9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  <Star size={12} fill="#fbbf24" strokeWidth={0} />
                  <span>{item.rating}</span>
                </div>

                {/* Top-right: Nút chuông đăng ký nhận thông báo */}
                <button
                  type="button"
                  onClick={(e) => handleToggleNotify(item, e)}
                  title={isSubscribed ? 'Đã đăng ký vào hàng chờ' : 'Đặt trước vào hàng chờ'}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: isSubscribed ? '#16a34a' : 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isSubscribed ? <Check size={13} strokeWidth={3} /> : <Bell size={13} />}
                </button>

                {/* Chính giữa: Ngày phát hành chữ trắng lớn */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    width: '92%',
                    pointerEvents: 'none'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: item.releaseDate.length > 8 ? '20px' : '22px',
                      fontWeight: 900,
                      color: '#ffffff',
                      textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.85)',
                      letterSpacing: '0.5px',
                      lineHeight: 1.15
                    }}
                  >
                    {item.releaseDate}
                  </div>
                </div>

                {/* Banner đáy poster: Màu xanh dương đồng bộ hệ thống */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#2563eb',
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: item.countdown ? '3px 4px' : '5px 4px',
                    boxShadow: '0 -2px 10px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {item.countdown ? (
                    <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.4px' }}>
                      {item.countdown}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                      SẮP CÓ
                    </div>
                  )}
                </div>
              </div>

              {/* Tên sách dưới poster màu tối chuẩn SmartLib */}
              <div
                title={item.title}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: '3px'
                }}
              >
                {item.title}
              </div>

              {/* Số lượt xem / quan tâm */}
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                Lượt xem: {item.views}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút XEM THÊM.. ở đáy phong cách SmartLib */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setShowAll(prev => !prev)}
          style={{
            background: '#f8fafc',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '9px 40px',
            fontSize: '12.5px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#eff6ff';
            e.currentTarget.style.borderColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#bfdbfe';
          }}
        >
          {showAll ? 'THU GỌN' : 'XEM THÊM..'}
        </button>
      </div>
    </section>
  );
}
