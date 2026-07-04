import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Stethoscope, Video, Calendar, Shield, Users, Building2, HeartPulse } from 'lucide-react';
import Header from '../components/Header';
import DoctorSearchSection from '../components/home/DoctorSearchSection';
import HomeNewsCarousel from '../components/home/HomeNewsCarousel';
import PlatformRoleCard from '../components/home/PlatformRoleCard';
import logoImage from '../assets/DoctorBooking-removebg-preview.png';
import './Home.css';

const PLATFORM_ROLES = [
  { icon: Stethoscope, name: 'Bệnh nhân', desc: 'Đặt lịch, theo dõi hồ sơ sức khỏe' },
  { icon: Users, name: 'Bác sĩ', desc: 'Quản lý lịch hẹn & hồ sơ bệnh nhân' },
  { icon: Building2, name: 'Phòng khám', desc: 'Tích hợp lịch & thanh toán' },
  { icon: Video, name: 'Telehealth', desc: 'Tư vấn video mã hóa' },
  { icon: Calendar, name: 'Lịch thông minh', desc: 'Khung giờ thời gian thực' },
  { icon: Shield, name: 'Bảo mật', desc: 'Mã hóa dữ liệu y tế' },
];

const PARTNERS = ['City Medical', 'HealthPlus', 'Wellness Network', 'Pediatric Care', 'Family Clinic'];

const STATS = [
  { label: 'Bác sĩ tin cậy', value: '500+', sub: 'Đã xác minh' },
  { label: 'Lịch hẹn hoàn thành', value: '10k+', sub: 'Năm 2025' },
  { label: 'Hài lòng bệnh nhân', value: '96%', sub: 'Đánh giá 5 sao' },
  { label: 'Hỗ trợ trực tuyến', value: '24/7', sub: 'Mọi lúc' },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const Home = () => (
  <div className="home-wolverine min-h-screen bg-white text-neutral-900">
    <Header variant="editorial" />

    {/* HERO — inspired by Wolverine "Make. Every Day. Better." */}
    <section className="relative min-h-[90vh] flex items-end overflow-hidden bg-neutral-950 home-hero-bg">
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/30" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 pt-36">
        <motion.div {...fadeUp} className="max-w-4xl">
          <a
            href="#news"
            className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/60 hover:text-white transition-colors mb-8 group"
          >
            <span className="w-8 h-px bg-white/40 group-hover:bg-white transition-colors" />
            tin mới nhất · báo cáo 2026
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </a>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight">
            Make.<br />
            Every Day.<br />
            <span className="text-segesta-electric">Healthier.</span>
          </h1>

          <p className="mt-8 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed font-light">
            Chúng tôi xây dựng nền tảng đặt lịch thông minh, kết nối bệnh nhân với bác sĩ tin cậy —
            lấy sự đồng cảm làm nền tảng, đổi mới công nghệ làm động lực.
          </p>

          <a
            href="#about"
            className="inline-flex items-center gap-2 mt-10 text-sm font-semibold text-white border-b border-white/40 pb-1 hover:border-white transition-colors group"
          >
            Tìm hiểu về chúng tôi
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>

    {/* PLATFORM PORTFOLIO — "A portfolio built for every step" */}
    <section id="portfolio" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-neutral-900 leading-snug max-w-2xl">
            Một nền tảng<br />cho mọi vai trò.
          </h2>
          <a
            href="#services"
            className="home-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors group shrink-0"
          >
            Khám phá dịch vụ
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-5 items-stretch">
          {PLATFORM_ROLES.map(({ icon, name, desc }, i) => (
            <PlatformRoleCard
              key={name}
              icon={icon}
              name={name}
              desc={desc}
              motionProps={{
                ...fadeUp,
                transition: { ...fadeUp.transition, delay: i * 0.05 },
              }}
            />
          ))}
        </div>
      </div>
    </section>

    {/* ANNUAL REPORT BLOCK */}
    <section className="bg-neutral-100 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <motion.div {...fadeUp} className="py-16 sm:py-24 pr-0 lg:pr-16">
            <h2 className="font-display text-4xl sm:text-5xl text-neutral-900 leading-snug">
              Báo cáo<br />2026
            </h2>
            <p className="mt-6 text-neutral-600 leading-relaxed max-w-md text-sm sm:text-base">
              Báo cáo thường niên cung cấp tổng quan về hiệu suất nền tảng, tiến độ chiến lược
              và các thành tựu chăm sóc sức khỏe số trong năm qua.
            </p>
            <a
              href="#"
              className="home-btn inline-flex items-center gap-3 mt-8 text-sm font-bold uppercase tracking-wider text-neutral-900 group"
            >
              <span className="px-3 py-1 rounded-lg bg-neutral-900 text-white text-xs">PDF</span>
              Đọc báo cáo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
          <motion.div
            {...fadeUp}
            className="relative min-h-[280px] lg:min-h-full overflow-hidden rounded-2xl"
          >
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=1000"
              alt="Healthcare team"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>

    {/* ABOUT / CULTURE */}
    <section id="about" className="py-20 sm:py-28 bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="max-w-3xl">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-snug">
            Một sứ mệnh,<br />vô hạn đổi mới.
          </h2>
          <p className="mt-8 text-white/60 leading-relaxed text-sm sm:text-base">
            Văn hóa của chúng tôi thúc đẩy sự tò mò, sáng tạo và hợp tác. Các đội ngũ trên toàn hệ thống
            liên tục đẩy ranh giới trong thiết kế trải nghiệm bệnh nhân, công nghệ telehealth và quản lý lịch hẹn thông minh.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 mt-10 text-sm font-semibold text-white border-b border-white/30 pb-1 hover:border-white transition-colors group"
          >
            Tham gia cùng chúng tôi
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>

    {/* MARKET SNAPSHOT → Platform Stats */}
    <section id="stats" className="py-16 sm:py-20 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p {...fadeUp} className="text-xs uppercase tracking-[0.25em] text-neutral-500 mb-10">
          Tổng quan nền tảng
        </motion.p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <p className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{stat.label}</p>
              <p className="font-display text-4xl sm:text-5xl text-neutral-900">{stat.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* SERVICES + BOOKING */}
    <section id="services" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mb-12">
          <h2 className="font-display text-4xl sm:text-5xl text-neutral-900 leading-snug mb-4">
            Đặt lịch ngay hôm nay
          </h2>
          <p className="text-neutral-600 max-w-xl text-sm sm:text-base">
            Tìm bác sĩ theo chuyên khoa, xem lịch trống thời gian thực và xác nhận cuộc hẹn trong vài giây.
          </p>
        </motion.div>
        <motion.div {...fadeUp}>
          <DoctorSearchSection />
        </motion.div>
      </div>
    </section>

    {/* PARTNERS */}
    <section id="partners" className="py-16 bg-neutral-50 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 text-center mb-10">
          Được tin tưởng bởi các phòng khám & bệnh viện hàng đầu
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {PARTNERS.map((name) => (
            <div key={name} className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-colors">
              <HeartPulse className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-sm tracking-tight">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* NEWS CAROUSEL */}
    <section id="news" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HomeNewsCarousel />
      </div>
    </section>

    {/* CAREERS CTA */}
    <section className="relative py-24 sm:py-32 overflow-hidden bg-neutral-950 home-cta-bg">
      <div className="absolute inset-0 bg-neutral-950/70" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fadeUp}>
          <h2 className="font-display text-4xl sm:text-5xl text-white leading-snug">
            Tạo tương lai sức khỏe<br />cùng chúng tôi
          </h2>
          <p className="mt-6 text-white/60 max-w-lg mx-auto text-sm sm:text-base">
            Dù là bệnh nhân, bác sĩ hay đối tác phòng khám — cánh cửa luôn mở để bạn tạo ra thay đổi tích cực.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link to="/register" className="home-btn px-8 py-4 rounded-xl bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-100 transition-colors">
              Đăng ký ngay
            </Link>
            <Link to="/login" className="home-btn px-8 py-4 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
              Đăng nhập
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* CONTACT */}
    <section id="contact" className="py-20 sm:py-28 bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div {...fadeUp}>
            <h2 className="font-display text-4xl text-neutral-900 leading-snug mb-4">Liên hệ</h2>
            <p className="text-neutral-600 text-sm sm:text-base mb-8">
              Bạn là chủ phòng khám hoặc quản trị viên bệnh viện? Liên hệ đội ngũ đối tác của chúng tôi.
            </p>
            <div className="space-y-4 text-sm text-neutral-600">
              <a href="mailto:support@segesta.com" className="block hover:text-neutral-900 transition-colors">support@segesta.com</a>
              <p>+84 (028) 555-0199</p>
              <p>100 Health Plaza, Quận 1, TP. Hồ Chí Minh</p>
            </div>
          </motion.div>
          <motion.form {...fadeUp} className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Họ tên</label>
                <input type="text" required className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Email</label>
                <input type="email" required className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" placeholder="email@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Nội dung</label>
              <textarea required rows="4" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" placeholder="Chúng tôi có thể giúp gì?" />
            </div>
            <button type="submit" className="home-btn px-8 py-3 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors">
              Gửi tin nhắn
            </button>
          </motion.form>
        </div>
      </div>
    </section>

    {/* FOOTER — Wolverine-style */}
    <footer className="bg-neutral-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoImage} alt="Segesta" className="w-8 h-8 object-contain brightness-0 invert" />
              <span className="text-lg font-bold tracking-tight">SEGESTA</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Nền tảng đặt lịch bác sĩ thông minh — kết nối bệnh nhân với chuyên gia y tế tin cậy trong vài giây.
            </p>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-xs uppercase tracking-widest text-white/40 font-bold mb-4">Liên kết</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#about" className="hover:text-white transition-colors">Giới thiệu</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Dịch vụ</a></li>
              <li><a href="#news" className="hover:text-white transition-colors">Tin tức</a></li>
              <li><Link to="/doctors" className="hover:text-white transition-colors">Danh sách bác sĩ</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-widest text-white/40 font-bold mb-4">Pháp lý</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Điều khoản</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-widest text-white/40 font-bold mb-4">Tài khoản</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/login" className="hover:text-white transition-colors">Đăng nhập</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Đăng ký</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-2">
          <p>© 2026 Segesta – Doctor Booking. All rights reserved.</p>
          <p>Thiết kế cho chăm sóc sức khỏe hiện đại.</p>
        </div>
      </div>
    </footer>
  </div>
);

export default Home;
