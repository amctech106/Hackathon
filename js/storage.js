/**
 * HCM Lite - Storage & Data Management Module
 * Uses browser localStorage for zero-backend architecture.
 * Starts completely clean without dummy data.
 */

const STORAGE_KEYS = {
  COMPANY: 'hcm_company',
  USERS: 'hcm_users',
  ATTENDANCE: 'hcm_attendance',
  LEAVES: 'hcm_leaves',
  SESSION: 'hcm_session',
  ANNOUNCEMENTS: 'hcm_announcements',
  THEME: 'hcm_theme'
};

const Storage = {
  // ── COMPANY SETTINGS ──
  getCompany() {
    const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
    return data ? JSON.parse(data) : null;
  },

  saveCompany(settings) {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(settings));
    return settings;
  },

  isSetupComplete() {
    const comp = this.getCompany();
    const admin = this.getUsers().find(u => u.role === 'admin');
    return !!(comp && admin);
  },

  // ── USERS (Admin & Employees) ──
  getUsers() {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getUserById(id) {
    return this.getUsers().find(u => String(u.id) === String(id)) || null;
  },

  getUserByEmail(email) {
    if (!email) return null;
    return this.getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  addUser(userData) {
    const users = this.getUsers();
    if (this.getUserByEmail(userData.email)) {
      throw new Error('An employee with this email already exists.');
    }
    const newUser = {
      id: Date.now(),
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'employee',
      department: userData.department || 'General',
      designation: userData.designation || 'Staff',
      salary: parseFloat(userData.salary) || 0,
      phone: userData.phone || '',
      address: userData.address || '',
      joinedDate: userData.joinedDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const index = users.findIndex(u => String(u.id) === String(id));
    if (index === -1) throw new Error('User not found');

    // Email uniqueness check if changed
    if (updates.email && updates.email.toLowerCase() !== users[index].email.toLowerCase()) {
      const exists = users.find(u => u.email.toLowerCase() === updates.email.toLowerCase() && String(u.id) !== String(id));
      if (exists) throw new Error('Email already in use by another user.');
    }

    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);

    // Update session if editing currently logged-in user
    const session = this.getSession();
    if (session && String(session.id) === String(id)) {
      this.setSession({ ...session, ...updates });
    }
    return users[index];
  },

  deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => String(u.id) !== String(id));
    this.saveUsers(users);
  },

  // ── ATTENDANCE ──
  getAttendance() {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },

  saveAttendance(records) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getTodayAttendance() {
    const today = this.getTodayString();
    return this.getAttendance().filter(r => r.date === today);
  },

  getEmployeeTodayAttendance(employeeId) {
    const today = this.getTodayString();
    return this.getAttendance().find(r => String(r.employeeId) === String(employeeId) && r.date === today) || null;
  },

  /**
   * Rule:
   * Late if check-in is after office start + grace minutes (e.g. 09:00 + 15 min = 09:15)
   * One check-in per day (second check-in = error)
   */
  checkIn(employeeId, extra = {}) {
    const today = this.getTodayString();
    const records = this.getAttendance();
    const existing = records.find(r => String(r.employeeId) === String(employeeId) && r.date === today);

    if (existing) {
      throw new Error('You have already checked in today.');
    }

    const company = this.getCompany() || { startTime: '09:00', graceMinutes: 15 };
    const now = new Date();
    const checkInTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // Calculate late status
    const [startH, startM] = (company.startTime || '09:00').split(':').map(Number);
    const graceMin = Number(company.graceMinutes || 15);
    const officeThreshold = startH * 60 + startM + graceMin;
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const isLate = currentMin > officeThreshold;

    const newRecord = {
      id: Date.now(),
      employeeId: String(employeeId),
      date: today,
      checkIn: checkInTime,
      checkOut: null,
      workHours: 0,
      status: isLate ? 'late' : 'present',
      verifiedByCamera: !!extra.camera,
      location: extra.location || null
    };

    records.push(newRecord);
    this.saveAttendance(records);
    return newRecord;
  },

  /**
   * Rule:
   * Check-out only after check-in.
   * Work hours = out - in; under 5 hours = half day.
   */
  checkOut(employeeId) {
    const today = this.getTodayString();
    const records = this.getAttendance();
    const recordIndex = records.findIndex(r => String(r.employeeId) === String(employeeId) && r.date === today);

    if (recordIndex === -1) {
      throw new Error('No check-in record found for today.');
    }

    if (records[recordIndex].checkOut) {
      throw new Error('You have already checked out today.');
    }

    const now = new Date();
    const checkOutTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // Compute hours difference
    const [inH, inM] = records[recordIndex].checkIn.split(':').map(Number);
    const [outH, outM] = checkOutTime.split(':').map(Number);
    const diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    const hours = Math.max(0, +(diffMinutes / 60).toFixed(2));

    records[recordIndex].checkOut = checkOutTime;
    records[recordIndex].workHours = hours;

    // Rule: under 5 hours = half day
    if (hours < 5) {
      records[recordIndex].status = 'half_day';
    }

    this.saveAttendance(records);
    return records[recordIndex];
  },

  // ── LEAVE MANAGEMENT ──
  getLeaves() {
    const data = localStorage.getItem(STORAGE_KEYS.LEAVES);
    return data ? JSON.parse(data) : [];
  },

  saveLeaves(leaves) {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  },

  // Working days calculator (skips Saturday & Sunday)
  countWorkingDays(fromDateStr, toDateStr) {
    const start = new Date(fromDateStr);
    const end = new Date(toDateStr);
    if (isNaN(start) || isNaN(end) || start > end) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) { // Skip Sunday(0) and Saturday(6)
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  },

  getEmployeeLeaveBalance(employeeId) {
    const company = this.getCompany() || { leaveQuota: 20 };
    const quota = Number(company.leaveQuota || 20);

    const leaves = this.getLeaves().filter(
      l => String(l.employeeId) === String(employeeId) && l.status === 'approved'
    );
    const usedDays = leaves.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
    const remaining = Math.max(0, quota - usedDays);

    return { quota, used: usedDays, remaining };
  },

  /**
   * Leave Application Rules:
   * 1. From date <= To date
   * 2. Count working days only (skip weekends)
   * 3. Cannot overlap another leave (pending or approved)
   * 4. Cannot go over yearly quota set by Admin
   */
  applyLeave(data) {
    const { employeeId, type, fromDate, toDate, reason } = data;

    if (!fromDate || !toDate) {
      throw new Error('Please select both From and To dates.');
    }

    if (fromDate > toDate) {
      throw new Error('From date cannot be after To date.');
    }

    const days = this.countWorkingDays(fromDate, toDate);
    if (days <= 0) {
      throw new Error('Selected period has no working days (e.g. only weekend days).');
    }

    // Overlap check
    const existing = this.getLeaves().filter(
      l => String(l.employeeId) === String(employeeId) && l.status !== 'rejected'
    );

    const hasOverlap = existing.some(l => {
      return (fromDate <= l.toDate && toDate >= l.fromDate);
    });

    if (hasOverlap) {
      throw new Error('You already have a pending or approved leave request overlapping these dates.');
    }

    // Quota check
    const balance = this.getEmployeeLeaveBalance(employeeId);
    if (days > balance.remaining) {
      throw new Error(`Insufficient leave balance. You requested ${days} day(s) but only have ${balance.remaining} day(s) left.`);
    }

    const leaves = this.getLeaves();
    const newLeave = {
      id: Date.now(),
      employeeId: String(employeeId),
      type: type || 'Casual',
      fromDate,
      toDate,
      days,
      reason: reason ? reason.trim() : '',
      status: 'pending', // pending, approved, rejected
      comment: '',
      appliedAt: new Date().toISOString()
    };

    leaves.push(newLeave);
    this.saveLeaves(leaves);
    return newLeave;
  },

  updateLeaveStatus(leaveId, status, comment = '') {
    const leaves = this.getLeaves();
    const index = leaves.findIndex(l => String(l.id) === String(leaveId));
    if (index === -1) throw new Error('Leave request not found');

    leaves[index].status = status; // 'approved' or 'rejected'
    leaves[index].comment = comment.trim();
    leaves[index].reviewedAt = new Date().toISOString();

    this.saveLeaves(leaves);
    return leaves[index];
  },

  // ── PAYSLIP CALCULATION ──
  /**
   * Business Rules (Section 3 & 4):
   * Per day = monthly salary ÷ working days in the month
   * Deduction = per day × (absent days + 0.5 × half days)
   * Net = salary − deduction
   */
  calculatePayslip(employeeId, year, month) {
    const user = this.getUserById(employeeId);
    if (!user) throw new Error('Employee not found');

    const salary = Number(user.salary) || 0;

    // Calculate total working days in that month (skipping weekends)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    let totalWorkingDays = 0;
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) totalWorkingDays++;
      cur.setDate(cur.getDate() + 1);
    }
    if (totalWorkingDays === 0) totalWorkingDays = 22;

    const perDayRate = totalWorkingDays > 0 ? (salary / totalWorkingDays) : 0;

    // Month prefix: YYYY-MM
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    // Get attendance records for this employee in this month
    const empAttendance = this.getAttendance().filter(
      r => String(r.employeeId) === String(employeeId) && r.date.startsWith(monthPrefix)
    );

    const presentCount = empAttendance.filter(r => r.status === 'present').length;
    const lateCount = empAttendance.filter(r => r.status === 'late').length;
    const halfDayCount = empAttendance.filter(r => r.status === 'half_day').length;

    // Approved leaves in this month
    const approvedLeaves = this.getLeaves().filter(l => {
      return String(l.employeeId) === String(employeeId) &&
        l.status === 'approved' &&
        (l.fromDate.startsWith(monthPrefix) || l.toDate.startsWith(monthPrefix));
    });
    const approvedLeaveDays = approvedLeaves.reduce((acc, l) => acc + (Number(l.days) || 0), 0);

    // Days with activity
    const totalAccountedDays = presentCount + lateCount + halfDayCount + approvedLeaveDays;

    // Up to current day if current month, else entire month
    const now = new Date();
    let passedWorkingDays = totalWorkingDays;
    if (now.getFullYear() === year && (now.getMonth() + 1) === month) {
      let passed = 0;
      const c = new Date(year, month - 1, 1);
      while (c <= now) {
        if (c.getDay() !== 0 && c.getDay() !== 6) passed++;
        c.setDate(c.getDate() + 1);
      }
      passedWorkingDays = passed;
    }

    const absentDays = Math.max(0, passedWorkingDays - totalAccountedDays);

    const deduction = +(perDayRate * (absentDays + 0.5 * halfDayCount)).toFixed(2);
    const netSalary = Math.max(0, +(salary - deduction).toFixed(2));

    return {
      employee: user,
      year,
      month,
      monthlySalary: salary,
      totalWorkingDays,
      perDayRate: +perDayRate.toFixed(2),
      presentDays: presentCount,
      lateDays: lateCount,
      halfDays: halfDayCount,
      leaveDays: approvedLeaveDays,
      absentDays,
      deduction,
      netSalary
    };
  },

  // ── ANNOUNCEMENTS ──
  getAnnouncements() {
    const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    return data ? JSON.parse(data) : [];
  },

  addAnnouncement(title, content, authorName = 'Admin') {
    const list = this.getAnnouncements();
    const newAnn = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      author: authorName,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    };
    list.unshift(newAnn);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    return newAnn;
  },

  // ── SESSION ──
  getSession() {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },

  setSession(user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // ── RESET SYSTEM ──
  resetAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};

window.Storage = Storage;
