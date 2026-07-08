import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import { adminService } from '../../../services/adminService';
import Loading from '../../../components/common/Loading';
import ErrorMessage from '../../../components/common/ErrorMessage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ShellIcon from '../../../components/shell/ShellIcon';
import { AppPage, PageHeader, AlertError, BtnPrimary } from '../../../components/shell/DashboardPrimitives';
import { CrudPagination, tableHeadClass, tableCellClass } from '../../../components/shell/AdminCrudUI';

const DoctorList = () => {
  const navigate = useNavigate();
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadAllDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (searchTerm.trim() === '') {
      return allDoctors;
    }
    const term = searchTerm.toLowerCase();
    return allDoctors.filter(doctor => 
      doctor.fullName?.toLowerCase().includes(term) ||
      doctor.specialization?.toLowerCase().includes(term) ||
      doctor.email?.toLowerCase().includes(term)
    );
  }, [searchTerm, allDoctors]);

  useEffect(() => {
    setDoctors(filteredDoctors);
    setCurrentPage(1); // Reset to page 1 when filter changes
  }, [filteredDoctors]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(doctors.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadAllDoctors = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllDoctors('');
      setAllDoctors(data);
      setError('');
    } catch (err) {
      setError('Không thể tải danh sách bác sĩ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/admin/doctors/create');
  };

  const handleView = (doctor) => {
    navigate(`/admin/doctors/${doctor.id}`);
  };

  const handleEdit = (doctor) => {
    navigate(`/admin/doctors/${doctor.id}/edit`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AppPage>
        <PageHeader
          title="Quản lý bác sĩ"
          subtitle={`Tổng số ${doctors.length} bác sĩ`}
          actions={
            <BtnPrimary onClick={handleCreate}>
              <ShellIcon name="user-plus" className="w-4 h-4" />
              Thêm bác sĩ
            </BtnPrimary>
          }
        />

        {error && <AlertError message={error} />}

        <div className="app-card p-4">
          <div className="relative">
            <ShellIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, chuyên khoa, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className={tableHeadClass}>ID</th>
                  <th className={tableHeadClass}>Họ và tên</th>
                  <th className={tableHeadClass}>Chuyên khoa</th>
                  <th className={tableHeadClass}>Email</th>
                  <th className={tableHeadClass}>SĐT</th>
                  <th className={tableHeadClass}>Trạng thái</th>
                  <th className={`${tableHeadClass} text-center`}>Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-100">
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-neutral-400 text-sm">
                      {searchTerm ? `Không tìm thấy bác sĩ khớp với "${searchTerm}"` : 'Không có bác sĩ'}
                    </td>
                  </tr>
                ) : (
                  currentDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-neutral-50/80">
                      <td className={tableCellClass}>{doctor.id}</td>
                      <td className={`${tableCellClass} font-medium text-neutral-900`}>{doctor.fullName}</td>
                      <td className={tableCellClass}>{doctor.specialization}</td>
                      <td className={tableCellClass}>{doctor.email}</td>
                      <td className={tableCellClass}>{doctor.phone || '—'}</td>
                      <td className={tableCellClass}>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${
                          doctor.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {doctor.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className={tableCellClass}>
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" onClick={() => handleView(doctor)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" title="Xem chi tiết">
                            <ShellIcon name="eye" className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => handleEdit(doctor)} className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" title="Chỉnh sửa">
                            <ShellIcon name="edit-2" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CrudPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={doctors.length}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          onPageChange={handlePageChange}
          itemLabel="bác sĩ"
        />
      </AppPage>
      <ToastContainer />
    </AdminLayout>
  );
};

export default DoctorList;
