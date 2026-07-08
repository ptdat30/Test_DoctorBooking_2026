const BookingModals = ({
  bookingModalOpen,
  setBookingModalOpen,
  selectedDoctor,
  bookingDate,
  handleDateChange,
  getLocalDateString,
  loadingSlots,
  availableSlots,
  selectedSlot,
  setSelectedSlot,
  patientName,
  setPatientName,
  patientPhone,
  setPatientPhone,
  bookingNotes,
  setBookingNotes,
  paymentMethod,
  setPaymentMethod,
  submittingBooking,
  handleConfirmBooking,
  bookingSuccessData,
  setBookingSuccessData,
}) => (
  <>
    {bookingModalOpen && selectedDoctor && (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div onClick={() => setBookingModalOpen(false)} className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm transition-opacity" aria-hidden="true" />
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white text-left overflow-hidden rounded-2xl shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-neutral-900 px-6 py-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Dr. {selectedDoctor.fullName}</h3>
                <p className="text-xs text-neutral-400">{selectedDoctor.specialization}</p>
              </div>
              <button onClick={() => setBookingModalOpen(false)} className="text-neutral-400 hover:text-white p-1 rounded-full transition-colors">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">1. Chọn ngày khám</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={handleDateChange}
                  min={getLocalDateString()}
                  required
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">2. Khung giờ khả dụng</label>
                {loadingSlots ? (
                  <div className="text-xs text-neutral-500 py-2">Đang tải khung giờ...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-xs text-rose-500 py-2 font-medium">Không có lịch trống. Vui lòng chọn ngày khác.</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          selectedSlot === slot
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">3. Thông tin bệnh nhân</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  placeholder="Họ và tên bệnh nhân"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                />
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  required
                  placeholder="Số điện thoại"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                />
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Ghi chú triệu chứng (tùy chọn)"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-segesta-electric"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">4. Thanh toán</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'CASH', label: 'Tiền mặt', sub: 'Tại phòng khám' },
                    { id: 'VNPAY', label: 'VNPAY', sub: 'ATM / QR online' },
                  ].map(({ id, label, sub }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <span className="text-sm font-semibold text-neutral-900">{label}</span>
                      <span className="block text-[10px] text-neutral-500 mt-1">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 border-t border-neutral-100">
              <button
                onClick={handleConfirmBooking}
                disabled={submittingBooking}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-sm disabled:opacity-50 hover:bg-neutral-800 transition-colors"
              >
                {submittingBooking ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
              </button>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {bookingSuccessData && (
      <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div onClick={() => setBookingSuccessData(null)} className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative bg-white p-8 text-center rounded-2xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-calendar-check text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Đặt lịch thành công!</h3>
            <p className="text-neutral-500 text-sm mb-6">Yêu cầu đã được ghi nhận. Kiểm tra email hoặc dashboard để xem chi tiết.</p>
            <div className="rounded-xl bg-neutral-50 p-4 mb-6 text-left text-sm space-y-2">
              <p><span className="font-semibold text-neutral-500">Bác sĩ:</span> Dr. {bookingSuccessData.doctorName}</p>
              <p><span className="font-semibold text-neutral-500">Ngày:</span> {bookingSuccessData.date}</p>
              <p><span className="font-semibold text-neutral-500">Giờ:</span> {bookingSuccessData.time}</p>
              <p><span className="font-semibold text-neutral-500">Bệnh nhân:</span> {bookingSuccessData.patientName}</p>
            </div>
            <button onClick={() => setBookingSuccessData(null)} className="w-full py-3 rounded-xl bg-neutral-900 text-white font-bold text-sm hover:bg-neutral-800 transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);

export default BookingModals;
