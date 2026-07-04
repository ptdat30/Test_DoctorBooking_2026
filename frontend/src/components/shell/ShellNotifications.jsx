import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';

const ShellNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest('[data-notifications-root]')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const markRead = async (id) => {
    await notificationService.markAsRead(id);
    load();
  };

  const markAllRead = async () => {
    await notificationService.markAllAsRead();
    load();
  };

  return (
    <div className="relative" data-notifications-root>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-neutral-500">{unreadCount} chưa đọc</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-neutral-500">Đang tải...</p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.isRead) markRead(n.id);
                    if (n.appointmentId) navigate('/patient/history');
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${
                    !n.isRead ? 'bg-sky-50/50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">{n.timeAgo || 'Vừa xong'}</p>
                </button>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={markAllRead}
                className="w-full py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShellNotifications;
