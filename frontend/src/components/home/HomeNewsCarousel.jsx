import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const NEWS_ITEMS = [
  {
    id: 1,
    tag: 'Tin mới',
    title: 'Segesta đạt chứng nhận Nền tảng Y tế Số 2026',
    excerpt: '96% bệnh nhân hài lòng với trải nghiệm đặt lịch. 95% bác sĩ đánh giá cao hệ thống quản lý lịch hẹn thông minh.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 2,
    tag: 'Công nghệ',
    title: 'AI Health Assistant ra mắt trên nền tảng',
    excerpt: 'Trợ lý AI hỗ trợ phân tích triệu chứng sơ bộ và gợi ý chuyên khoa phù hợp — an toàn, bảo mật, tuân thủ HIPAA.',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 3,
    tag: 'Đối tác',
    title: 'Mở rộng hợp tác với 50+ phòng khám tại Việt Nam',
    excerpt: 'Mạng lưới bác sĩ tin cậy tiếp tục mở rộng tại TP.HCM, Hà Nội và Đà Nẵng với lịch khám thời gian thực.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 4,
    tag: 'Telehealth',
    title: 'Tư vấn video HD mã hóa end-to-end',
    excerpt: 'Bệnh nhân có thể khám từ xa với bác sĩ đã xác minh — không cần tải ứng dụng riêng, ngay trên trình duyệt.',
    image: 'https://images.unsplash.com/photo-1504813184591-015556c5c50f?auto=format&fit=crop&q=80&w=1200',
  },
];

const HomeNewsCarousel = () => {
  const [active, setActive] = useState(0);
  const item = NEWS_ITEMS[active];

  const prev = () => setActive((i) => (i === 0 ? NEWS_ITEMS.length - 1 : i - 1));
  const next = () => setActive((i) => (i === NEWS_ITEMS.length - 1 ? 0 : i + 1));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
      <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[480px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={item.id}
            src={item.image}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <span className="text-xs uppercase tracking-[0.2em] text-white/70">{item.tag}</span>
          <h3 className="font-display text-2xl sm:text-3xl text-white mt-2 leading-tight">{item.title}</h3>
        </div>
      </div>

      <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-8">Tin tức mới nhất</h2>
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-neutral-600 leading-relaxed text-sm sm:text-base">{item.excerpt}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-10 pt-8 border-t border-neutral-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Tin trước"
              className="w-10 h-10 rounded-xl border border-neutral-300 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Tin sau"
              className="w-10 h-10 rounded-xl border border-neutral-300 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <span className="text-xs text-neutral-400 tabular-nums">
            {String(active + 1).padStart(2, '0')} / {String(NEWS_ITEMS.length).padStart(2, '0')}
          </span>
        </div>

        <a href="#news" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 mt-6 group">
          Xem tất cả
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
};

export default HomeNewsCarousel;
