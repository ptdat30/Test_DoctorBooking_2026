import { useEffect, useState } from 'react';
import { Search, Mail, Phone, Calendar, Clock, FileText, User, X, CheckSquare, Square } from 'lucide-react';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { doctorService } from '../../services/doctorService';
import { formatDate } from '../../utils/formatDate';
import '../../pages/admin/AdminPages.css'; // Reuse admin table styles

const conditionToCategory = {
  'diabetes': 'Chronic Care',
  'hypertension': 'Cardiac Care',
  'asthma': 'Respiratory Care',
  'arthritis': 'Orthopedic Care',
  'depression': 'Mental Health',
  'pregnancy': 'Maternity Care',
  'pediatric': 'Pediatric Care',
  'elderly': 'Geriatric Care'
};

const PatientSearch = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [patientTreatments, setPatientTreatments] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
      setSuggestedCategories([]);
      setCurrentPage(1);
      return;
    }

    // Analyze search and suggest categories
    const lowerSearch = searchTerm.toLowerCase();
    const suggestions = [];

    Object.keys(conditionToCategory).forEach(condition => {
      if (lowerSearch.includes(condition)) {
        suggestions.push(conditionToCategory[condition]);
      }
    });

    setSuggestedCategories([...new Set(suggestions)]);

    // Filter patients based on search
    const filtered = patients.filter(patient => {
      const searchLower = searchTerm.toLowerCase();
      return (
        patient.fullName?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.id?.toString().includes(searchLower) ||
        patient.phone?.toLowerCase().includes(searchLower)
      );
    });

    // Calculate match scores
    const patientsWithScores = filtered.map(patient => {
      let score = 50; 
      if (suggestions.length > 0) score += 20;
      const treatmentCount = patient.treatmentCount || 0;
      if (treatmentCount > 5) score += 15;
      else if (treatmentCount > 2) score += 10;
      if (patient.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        if (age > 0 && age < 100) score += 5;
      }
      if (patient.lastVisit?.includes('days')) score += 10;
      else if (patient.lastVisit?.includes('week')) score += 5;

      return { ...patient, matchScore: Math.min(100, score) };
    });

    patientsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    setFilteredPatients(patientsWithScores);
    setCurrentPage(1);
  }, [searchTerm, patients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await doctorService.searchPatients('');

      // Enhance patients with mock data for demo
      const enhanced = data.map((patient, index) => ({
        ...patient,
        matchScore: 75 + Math.floor(Math.random() * 20),
        lastVisit: index % 3 === 0 ? '2 ngày trước' :
          index % 3 === 1 ? '1 tuần trước' : '3 tuần trước',
        treatmentCount: Math.floor(Math.random() * 10),
        videoStoryUrl: patient.videoStoryUrl ||
          (patient.id ? `/patient-${patient.id}.mp4` : null)
      }));

      setPatients(enhanced);
      setFilteredPatients(enhanced);
      setError('');
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setLoadingTreatments(true);
      const [patient, treatments] = await Promise.all([
        doctorService.getPatientById(id),
        doctorService.getPatientTreatments(id),
      ]);
      setSelectedPatient(patient);
      setPatientTreatments(treatments);
    } catch (err) {
      setError('Failed to load patient details');
      console.error(err);
    } finally {
      setLoadingTreatments(false);
    }
  };

  const toggleCompare = (patient) => {
    if (compareList.find(p => p.id === patient.id)) {
      setCompareList(compareList.filter(p => p.id !== patient.id));
    } else if (compareList.length < 3) {
      setCompareList([...compareList, patient]);
    } else {
      alert("Chỉ có thể so sánh tối đa 3 bệnh nhân.");
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <DoctorLayout>
      <div className="admin-main">
        <div className="main-content">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Danh sách Bệnh nhân</h1>
            
            {compareList.length > 0 && (
              <button 
                onClick={() => setShowCompareModal(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                <span>So sánh ({compareList.length})</span>
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {suggestedCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 flex items-center mr-2">Phân loại gợi ý:</span>
                  {suggestedCategories.map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">Chọn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bệnh nhân</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sinh</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lần khám cuối</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        <div className="flex justify-center items-center h-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentPatients.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        Không tìm thấy bệnh nhân nào
                      </td>
                    </tr>
                  ) : (
                    currentPatients.map((patient) => {
                      const isSelected = !!compareList.find(p => p.id === patient.id);
                      return (
                        <tr key={patient.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => toggleCompare(patient)}
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              {isSelected ? <CheckSquare className="h-5 w-5 text-indigo-600" /> : <Square className="h-5 w-5" />}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {patient.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                                {patient.fullName?.charAt(0) || 'P'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                                {patient.matchScore && (
                                  <div className="text-xs text-gray-500 mt-1">Độ khớp: {patient.matchScore}%</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" /> {patient.email || '-'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" /> {patient.phone || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {patient.lastVisit}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{patient.treatmentCount} lần điều trị</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetails(patient.id)}
                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                title="Hồ sơ chi tiết"
                              >
                                <User className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleViewDetails(patient.id)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                title="Lịch sử điều trị"
                              >
                                <FileText className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredPatients.length)}</span> của{' '}
                  <span className="font-medium">{filteredPatients.length}</span> bệnh nhân
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Trước
                  </button>
                  
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => paginate(idx + 1)}
                      className={`px-3 py-1 rounded border text-sm ${
                        currentPage === idx + 1
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded border text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">So sánh {compareList.length} Bệnh nhân</h2>
              <button 
                onClick={() => setShowCompareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Tiêu chí</th>
                    {compareList.map(patient => (
                      <th key={patient.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                            {patient.fullName?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{patient.fullName}</div>
                            <div className="text-xs text-gray-500">ID: {patient.id}</div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Ngày sinh</td>
                    {compareList.map(patient => (
                      <td key={patient.id} className="px-4 py-3 text-sm text-gray-500">
                        {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Email</td>
                    {compareList.map(patient => (
                      <td key={patient.id} className="px-4 py-3 text-sm text-gray-500">
                        {patient.email || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Số điện thoại</td>
                    {compareList.map(patient => (
                      <td key={patient.id} className="px-4 py-3 text-sm text-gray-500">
                        {patient.phone || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Lần khám cuối</td>
                    {compareList.map(patient => (
                      <td key={patient.id} className="px-4 py-3 text-sm text-gray-500">
                        {patient.lastVisit}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Lịch sử điều trị</td>
                    {compareList.map(patient => (
                      <td key={patient.id} className="px-4 py-3 text-sm text-gray-500">
                        {patient.treatmentCount} lần
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">Độ khớp (Gợi ý)</td>
                    {compareList.map(patient => (
                      <td key={patient.id} className="px-4 py-3 text-sm font-medium text-indigo-600">
                        {patient.matchScore}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setShowCompareModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  setCompareList([]);
                  setShowCompareModal(false);
                }}
                className="btn-primary bg-red-600 px-4 py-2"
              >
                Xóa tất cả so sánh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-6 w-6 text-indigo-600" />
                Chi tiết Bệnh nhân
              </h2>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div><strong className="text-gray-700 block text-xs uppercase">ID</strong> <span className="text-gray-900">{selectedPatient.id}</span></div>
                <div><strong className="text-gray-700 block text-xs uppercase">Họ và tên</strong> <span className="text-gray-900">{selectedPatient.fullName}</span></div>
                <div><strong className="text-gray-700 block text-xs uppercase">Email</strong> <span className="text-gray-900">{selectedPatient.email || '-'}</span></div>
                <div><strong className="text-gray-700 block text-xs uppercase">Số điện thoại</strong> <span className="text-gray-900">{selectedPatient.phone || '-'}</span></div>
                <div><strong className="text-gray-700 block text-xs uppercase">Ngày sinh</strong> <span className="text-gray-900">{selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : '-'}</span></div>
                <div><strong className="text-gray-700 block text-xs uppercase">Giới tính</strong> <span className="text-gray-900">{selectedPatient.gender || '-'}</span></div>
                <div className="col-span-2"><strong className="text-gray-700 block text-xs uppercase">Địa chỉ</strong> <span className="text-gray-900">{selectedPatient.address || '-'}</span></div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Lịch sử Điều trị
                </h3>
                {loadingTreatments ? (
                  <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
                ) : patientTreatments.length === 0 ? (
                  <p className="text-center text-gray-500 p-4">Chưa có lịch sử điều trị</p>
                ) : (
                  <div className="space-y-4">
                    {patientTreatments.map((treatment) => (
                      <div key={treatment.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm"><strong className="text-gray-700">Ngày:</strong> <span className="text-gray-900">{formatDate(treatment.createdAt)}</span></div>
                        {treatment.diagnosis && <div className="text-sm mt-1"><strong className="text-gray-700">Chẩn đoán:</strong> <span className="text-gray-900">{treatment.diagnosis}</span></div>}
                        {treatment.prescription && <div className="text-sm mt-1"><strong className="text-gray-700">Đơn thuốc:</strong> <span className="text-gray-900">{treatment.prescription}</span></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedPatient(null)} className="btn-secondary px-4 py-2">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default PatientSearch;
