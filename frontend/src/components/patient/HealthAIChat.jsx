import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Wallet, Users, MessageCircle, Send } from 'lucide-react';
import { patientService } from '../../services/patientService';
import AISymptomChecker from './AISymptomChecker';
import FamilyAccount from './FamilyAccount';
import ShellIcon from '../shell/ShellIcon';

const HealthAIChat = ({ onClose, isFullPage = false }) => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && activeMode === 'chat') inputRef.current.focus();
  }, [activeMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Logic điều hướng nhanh client-side
      const lowerInput = currentInput.toLowerCase();
      if (lowerInput.includes('ví') || lowerInput.includes('wallet')) {
        setIsTyping(false);
        navigate('/patient/wallet');
        if (onClose) onClose();
        return;
      }
      if (lowerInput.includes('gia đình') || lowerInput.includes('family')) {
        setTimeout(() => { setActiveMode('family'); setIsTyping(false); }, 500);
        return;
      }

      // Gọi AI Service với error handling tốt hơn
      let data;
      try {
        data = await patientService.checkSymptoms(currentInput);
      } catch (apiError) {
        console.error("API Error:", apiError);

        // Kiểm tra nếu response có data (có thể là error response từ server)
        if (apiError.response && apiError.response.data) {
          data = apiError.response.data;
        } else {
          // Tạo fallback response thông minh
          data = {
            suggestedSpecialization: 'Other',
            riskLevel: 'Low',
            advice: 'Xin lỗi, tôi gặp khó khăn trong việc kết nối với hệ thống. ' +
              'Vui lòng thử lại sau một chút hoặc mô tả lại câu hỏi/triệu chứng của bạn.',
            reason: 'Lỗi kết nối với hệ thống',
            homeRemedies: [
              'Kiểm tra kết nối mạng của bạn.',
              'Thử lại sau vài phút.',
              'Mô tả lại câu hỏi một cách chi tiết hơn.'
            ]
          };
        }
      }

      // Validate và đảm bảo data có đầy đủ thông tin
      if (!data || !data.advice) {
        data = {
          suggestedSpecialization: data?.suggestedSpecialization || 'Other',
          riskLevel: data?.riskLevel || 'Low',
          advice: data?.advice || 'Xin lỗi, tôi không thể xử lý câu hỏi này. Vui lòng thử lại hoặc mô tả rõ hơn.',
          reason: data?.reason || 'Không thể phân tích được thông tin',
          homeRemedies: data?.homeRemedies || ['Vui lòng thử lại với thông tin chi tiết hơn.']
        };
      }

      // Xử lý logic hiển thị
      // Nếu là 'Other' hoặc 'General' (khi không có khoa phù hợp), ta sẽ không hiện nút đặt lịch
      const isBookingAvailable = data.suggestedSpecialization &&
        data.suggestedSpecialization !== 'Other' &&
        data.suggestedSpecialization !== 'General';

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.advice || 'Xin lỗi, tôi không thể xử lý câu hỏi này.',
        homeRemedies: data.homeRemedies || [],
        reason: data.reason || '',
        timestamp: new Date(),
        // Chỉ tạo object suggestion nếu có khoa phù hợp
        suggestion: isBookingAvailable ? {
          specialty: data.suggestedSpecialization,
          risk: data.riskLevel
        } : null
      };

      setChatHistory(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error("Unexpected Error:", error);
      // Tạo response lỗi thân thiện hơn
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Xin lỗi, tôi gặp sự cố không mong đợi. Vui lòng thử lại sau một chút.',
        reason: 'Lỗi hệ thống',
        homeRemedies: [
          'Thử lại sau vài phút.',
          'Kiểm tra kết nối mạng.',
          'Liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.'
        ],
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickNavigate = (specialty) => {
    navigate(`/patient/doctors?search=${specialty}`);
    if (!isFullPage && onClose) onClose();
  };

  const quickActions = [
    { id: 'booking', label: 'Đặt lịch mới', icon: Calendar, action: () => { navigate('/patient/booking'); if (!isFullPage && onClose) onClose(); } },
    { id: 'wallet', label: 'Ví sức khỏe', icon: Wallet, action: () => { navigate('/patient/wallet'); if (!isFullPage && onClose) onClose(); } },
    { id: 'family', label: 'Hồ sơ gia đình', icon: Users, action: () => { navigate('/patient/family'); if (!isFullPage && onClose) onClose(); } },
  ];

  return (
    <div className={`flex flex-col bg-white ${isFullPage ? 'h-[calc(100vh-14rem)] min-h-[480px]' : 'h-[520px]'}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-neutral-700" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">Trợ lý sức khỏe</h3>
            <p className="text-xs text-neutral-500">Hỏi đáp nhanh — không thay thế tư vấn y khoa</p>
          </div>
        </div>
        {!isFullPage && (
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <ShellIcon name="x" className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeMode === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <MessageCircle className="w-10 h-10 text-neutral-200 mb-4" strokeWidth={1.25} />
                  <h2 className="text-lg font-bold text-neutral-900">Xin chào!</h2>
                  <p className="text-sm text-neutral-500 mt-2 max-w-sm">
                    Mô tả triệu chứng để nhận gợi ý xử lý và tìm bác sĩ phù hợp.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-6 w-full max-w-md">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.action}
                        className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 text-left text-sm font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                      >
                        <action.icon className="w-4 h-4 text-neutral-500 shrink-0" strokeWidth={1.75} />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.type === 'user' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {msg.type === 'user' ? 'Bạn' : 'AI'}
                      </div>
                      <div className={`max-w-[85%] space-y-1 ${msg.type === 'user' ? 'items-end' : ''}`}>
                        <div className={`rounded-2xl px-4 py-3 text-sm ${
                          msg.type === 'user'
                            ? 'bg-neutral-900 text-white rounded-tr-md'
                            : 'bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-md'
                        }`}>
                          <p className="whitespace-pre-line">{msg.content}</p>

                          {msg.type === 'ai' && msg.reason &&
                            msg.reason.trim() !== '' &&
                            !msg.reason.toLowerCase().includes('người dùng') &&
                            !msg.reason.toLowerCase().includes('cần thêm thông tin') &&
                            !msg.reason.toLowerCase().includes('chỉ nói') && (
                              <p className="text-xs text-neutral-500 italic mt-2 pt-2 border-t border-neutral-200/60">
                                Chẩn đoán gợi ý: {msg.reason}
                              </p>
                            )}

                          {msg.type === 'ai' && msg.homeRemedies?.length > 0 &&
                            msg.reason?.trim() &&
                            !msg.reason.toLowerCase().includes('người dùng') &&
                            !msg.reason.toLowerCase().includes('chỉ nói') && (
                              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs">
                                <p className="font-semibold mb-1">Lời khuyên tại nhà</p>
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {msg.homeRemedies.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>

                        {msg.type === 'ai' && msg.suggestion && (
                          <button
                            type="button"
                            onClick={() => handleQuickNavigate(msg.suggestion.specialty)}
                            className="text-xs font-semibold text-neutral-700 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
                          >
                            Đặt lịch khám {msg.suggestion.specialty}
                          </button>
                        )}

                        <p className="text-[10px] text-neutral-400 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">AI</div>
                      <div className="bg-neutral-50 border border-neutral-100 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-100 shrink-0">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
                  placeholder="Ví dụ: Đau đầu, chóng mặt, buồn nôn..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}

        {activeMode === 'symptom' && <div className="p-4 overflow-y-auto flex-1"><AISymptomChecker /></div>}
        {activeMode === 'family' && <div className="p-4 overflow-y-auto flex-1"><FamilyAccount /></div>}
      </div>
    </div>
  );
};

export default HealthAIChat;
