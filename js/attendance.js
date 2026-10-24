/**
 * AMC Tech - Attendance Management Module
 * Handles live clock, daily check-in, check-out, late arrivals, work hours, webcam capture, and CSV export.
 */

const AttendanceModule = {
  // Initialize user context, clock, event bindings, and UI rendering
  init(user) {
    this.user = user || Storage.getSession();
    this.isAdmin = this.user && this.user.role === 'admin';

    this.startLiveClock();
    this.bindEvents();
    this.render();
  },

  startLiveClock() {
    const clockEl = document.getElementById('live-clock');
    const dateEl = document.getElementById('live-date');

    const update = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
        });
      }
    };

    update();
    setInterval(update, 1000);
  },

  bindEvents() {
    // Employee Check In & Check Out buttons
    const checkInBtn = document.getElementById('btn-check-in');
    const checkOutBtn = document.getElementById('btn-check-out');
    const cameraCheckInBtn = document.getElementById('btn-camera-check-in');

    if (checkInBtn) {
      checkInBtn.addEventListener('click', () => this.handleCheckIn());
    }

    if (checkOutBtn) {
      checkOutBtn.addEventListener('click', () => this.handleCheckOut());
    }

    if (cameraCheckInBtn) {
      cameraCheckInBtn.addEventListener('click', () => this.openCameraModal());
    }

    // Camera Modal events
    const closeCamBtn = document.getElementById('btn-close-cam');
    const snapBtn = document.getElementById('btn-snap-checkin');
    if (closeCamBtn) closeCamBtn.addEventListener('click', () => this.closeCameraModal());
    if (snapBtn) snapBtn.addEventListener('click', () => this.captureAndCheckIn());

    // Filter by date on Admin page
    const dateFilter = document.getElementById('attendance-filter-date');
    if (dateFilter) {
      dateFilter.value = Storage.getTodayString();
      dateFilter.addEventListener('change', () => this.render());
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-attendance-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCSV());
    }
  },

  handleCheckIn(extra = {}) {
    if (!this.user) return;
    try {
      const record = Storage.checkIn(this.user.id, extra);
      const isLate = record.status === 'late';
      const msg = isLate
        ? `Checked in at ${record.checkIn}. Note: This was marked as LATE based on office schedule.`
        : `Successfully checked in at ${record.checkIn}! Have a productive day!`;
      alert(msg);
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  handleCheckOut() {
    if (!this.user) return;
    try {
      const record = Storage.checkOut(this.user.id);
      alert(`Checked out at ${record.checkOut}! Total working hours: ${record.workHours} hrs. Status: ${record.status.toUpperCase()}`);
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  // ----------------------------------------------------
  // Camera Check-In with Live Webcam Stream
  // ----------------------------------------------------
  openCameraModal() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    if (!modal || !video) return;

    modal.classList.remove('hidden');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          this.cameraStream = stream;
          video.srcObject = stream;
          video.play();
        })
        .catch(err => {
          console.warn('Webcam error:', err);
          alert('Could not access camera. Please allow camera permissions in your browser or use standard Check In.');
          this.closeCameraModal();
        });
    } else {
      alert('Camera API not supported in this browser.');
      this.closeCameraModal();
    }
  },

  closeCameraModal() {
    const modal = document.getElementById('camera-modal');
    if (modal) modal.classList.add('hidden');
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
  },

  captureAndCheckIn() {
    // Optional geolocation check
    let locationData = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.finalizeCameraCheckIn(locationData);
        },
        () => {
          // If denied, still proceed with camera verification
          this.finalizeCameraCheckIn(null);
        },
        { timeout: 5000 }
      );
    } else {
      this.finalizeCameraCheckIn(null);
    }
  },

  finalizeCameraCheckIn(loc) {
    this.closeCameraModal();
    this.handleCheckIn({ camera: true, location: loc });
  },

  // ── RENDER ATTENDANCE ──
  render() {
    // If on Employee Dashboard
    if (!this.isAdmin && this.user) {
      this.renderEmployeeStatus();
      this.renderEmployeeHistory();
    }

    // If on Admin Attendance view
    if (this.isAdmin) {
      this.renderAdminAttendanceTable();
    }
  },

  renderEmployeeStatus() {
    const todayRecord = Storage.getEmployeeTodayAttendance(this.user.id);
    const checkInBtn = document.getElementById('btn-check-in');
    const checkOutBtn = document.getElementById('btn-check-out');
    const cameraCheckInBtn = document.getElementById('btn-camera-check-in');
    const statusText = document.getElementById('today-status-text');
    const inTimeEl = document.getElementById('stat-check-in-time');
    const outTimeEl = document.getElementById('stat-check-out-time');
    const hoursEl = document.getElementById('stat-work-hours');

    if (!todayRecord) {
      if (checkInBtn) checkInBtn.disabled = false;
      if (cameraCheckInBtn) cameraCheckInBtn.disabled = false;
      if (checkOutBtn) checkOutBtn.disabled = true;
      if (statusText) statusText.innerHTML = `<span class="badge badge-warning">Not Checked In</span>`;
      if (inTimeEl) inTimeEl.textContent = '—';
      if (outTimeEl) outTimeEl.textContent = '—';
      if (hoursEl) hoursEl.textContent = '0 hrs';
    } else {
      if (checkInBtn) checkInBtn.disabled = true;
      if (cameraCheckInBtn) cameraCheckInBtn.disabled = true;
      if (inTimeEl) inTimeEl.textContent = todayRecord.checkIn;

      if (!todayRecord.checkOut) {
        if (checkOutBtn) checkOutBtn.disabled = false;
        if (statusText) {
          const badgeClass = todayRecord.status === 'late' ? 'badge-danger' : 'badge-success';
          statusText.innerHTML = `<span class="badge ${badgeClass}">Active (Checked in ${todayRecord.checkIn})</span>`;
        }
        if (outTimeEl) outTimeEl.textContent = 'In Progress...';
        if (hoursEl) hoursEl.textContent = 'Recording...';
      } else {
        if (checkOutBtn) checkOutBtn.disabled = true;
        if (outTimeEl) outTimeEl.textContent = todayRecord.checkOut;
        if (hoursEl) hoursEl.textContent = `${todayRecord.workHours} hrs`;
        if (statusText) {
          const badgeClass = todayRecord.status === 'late' ? 'badge-danger' :
            (todayRecord.status === 'half_day' ? 'badge-warning' : 'badge-success');
          statusText.innerHTML = `<span class="badge ${badgeClass}">${todayRecord.status.replace('_', ' ').toUpperCase()}</span>`;
        }
      }
    }
  },

  renderEmployeeHistory() {
    const tableBody = document.getElementById('employee-attendance-history');
    if (!tableBody || !this.user) return;

    const myRecords = Storage.getAttendance()
      .filter(r => String(r.employeeId) === String(this.user.id))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (myRecords.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No attendance records yet. Check in to begin!</td></tr>`;
      return;
    }

    tableBody.innerHTML = myRecords.map(r => {
      const badgeClass = r.status === 'present' ? 'badge-success' :
        (r.status === 'late' ? 'badge-danger' : 'badge-warning');
      return `
        <tr>
          <td><strong>${r.date}</strong></td>
          <td>${r.checkIn}</td>
          <td>${r.checkOut || '<span class="text-muted">Missing checkout</span>'}</td>
          <td>${r.workHours ? `${r.workHours} hrs` : '—'}</td>
          <td>
            <span class="badge ${badgeClass}">${r.status.replace('_', ' ').toUpperCase()}</span>
            ${r.verifiedByCamera ? '<i class="fa-solid fa-camera small text-info ml-1" title="Camera Verified"></i>' : ''}
          </td>
        </tr>
      `;
    }).join('');
  },

  renderAdminAttendanceTable() {
    const tableBody = document.getElementById('admin-attendance-table-body');
    if (!tableBody) return;

    const dateFilter = document.getElementById('attendance-filter-date');
    const selectedDate = dateFilter ? dateFilter.value : Storage.getTodayString();

    const records = Storage.getAttendance().filter(r => r.date === selectedDate);
    const employees = Storage.getUsers().filter(u => u.role === 'employee');

    if (employees.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-muted">No employees registered yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = employees.map(emp => {
      const rec = records.find(r => String(r.employeeId) === String(emp.id));
      const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      let statusBadge = '<span class="badge badge-secondary">ABSENT / NOT IN</span>';
      let inTime = '—';
      let outTime = '—';
      let hours = '0';

      if (rec) {
        inTime = rec.checkIn;
        outTime = rec.checkOut || '<span class="text-muted">Pending</span>';
        hours = rec.workHours ? `${rec.workHours} hrs` : 'In progress';
        const badgeClass = rec.status === 'present' ? 'badge-success' :
          (rec.status === 'late' ? 'badge-danger' : 'badge-warning');
        statusBadge = `<span class="badge ${badgeClass}">${rec.status.replace('_', ' ').toUpperCase()}</span>`;
        if (rec.verifiedByCamera) {
          statusBadge += ' <i class="fa-solid fa-camera text-info ml-1" title="Camera Verified"></i>';
        }
      }

      return `
        <tr>
          <td>
            <div class="user-cell">
              <span class="avatar-badge">${initials}</span>
              <div>
                <strong>${emp.name}</strong>
                <div class="text-muted small">${emp.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-dept">${emp.department}</span></td>
          <td>${inTime}</td>
          <td>${outTime}</td>
          <td>${hours}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  },

  exportCSV() {
    const records = Storage.getAttendance();
    if (records.length === 0) {
      alert('No attendance data available to export.');
      return;
    }

    const headers = ['Date', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Hours', 'Status', 'Camera Verified'];
    const rows = records.map(r => {
      const emp = Storage.getUserById(r.employeeId);
      return [
        r.date,
        `"${emp ? emp.name.replace(/"/g, '""') : 'Unknown'}"`,
        `"${emp ? emp.department.replace(/"/g, '""') : ''}"`,
        r.checkIn,
        r.checkOut || 'N/A',
        r.workHours || 0,
        r.status,
        r.verifiedByCamera ? 'Yes' : 'No'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_report_${Storage.getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.AttendanceModule = AttendanceModule;
