/**
 * HCM Lite - Employees Management Module
 * Section 3 & 8: Add, Edit, Delete, Search, Filter, Export to CSV
 */

const EmployeeModule = {
  init() {
    this.tableBody = document.getElementById('employees-table-body');
    this.searchInput = document.getElementById('search-employee');
    this.deptFilter = document.getElementById('filter-department');
    this.modal = document.getElementById('employee-modal');
    this.form = document.getElementById('employee-form');

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Search & Filter
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.render());
    }
    if (this.deptFilter) {
      this.deptFilter.addEventListener('change', () => this.render());
    }

    // Add Employee Button -> Open Modal
    const addBtn = document.getElementById('btn-add-employee');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    // Modal Close Buttons
    const closeBtn = document.getElementById('btn-close-modal');
    const cancelBtn = document.getElementById('btn-cancel-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

    // Form Submit (Create or Edit)
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Export CSV Button
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCSV());
    }
  },

  openModal(employeeId = null) {
    if (!this.modal || !this.form) return;
    this.clearErrors();
    this.form.reset();

    const titleEl = document.getElementById('modal-title');
    const editIdInput = document.getElementById('employee-edit-id');
    const passwordHelp = document.getElementById('password-help');

    if (employeeId) {
      const emp = Storage.getUserById(employeeId);
      if (!emp) return;
      if (titleEl) titleEl.textContent = 'Edit Employee';
      if (editIdInput) editIdInput.value = emp.id;
      document.getElementById('emp-name').value = emp.name;
      document.getElementById('emp-email').value = emp.email;
      document.getElementById('emp-dept').value = emp.department;
      document.getElementById('emp-designation').value = emp.designation || '';
      document.getElementById('emp-salary').value = emp.salary;
      document.getElementById('emp-phone').value = emp.phone || '';
      document.getElementById('emp-password').required = false;
      if (passwordHelp) passwordHelp.textContent = 'Leave blank to keep existing password.';
    } else {
      if (titleEl) titleEl.textContent = 'Add New Employee';
      if (editIdInput) editIdInput.value = '';
      document.getElementById('emp-password').required = true;
      if (passwordHelp) passwordHelp.textContent = 'Sets the initial login password for this employee.';
    }

    this.modal.classList.remove('hidden');
  },

  closeModal() {
    if (this.modal) this.modal.classList.add('hidden');
    if (this.form) this.form.reset();
    this.clearErrors();
  },

  clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  },

  showError(fieldId, message) {
    const el = document.getElementById(`err-${fieldId}`);
    if (el) el.textContent = message;
  },

  handleSubmit(e) {
    e.preventDefault();
    this.clearErrors();

    const editId = document.getElementById('employee-edit-id').value;
    const name = document.getElementById('emp-name').value.trim();
    const email = document.getElementById('emp-email').value.trim().toLowerCase();
    const password = document.getElementById('emp-password').value;
    const department = document.getElementById('emp-dept').value;
    const designation = document.getElementById('emp-designation').value.trim() || 'Staff';
    const salary = parseFloat(document.getElementById('emp-salary').value);
    const phone = document.getElementById('emp-phone').value.trim();

    let hasError = false;

    // Rules verification
    if (!name) {
      this.showError('name', 'Employee name is required.');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showError('email', 'Please provide a valid email address.');
      hasError = true;
    }

    if (!editId && (!password || password.length < 4)) {
      this.showError('password', 'Password must be at least 4 characters.');
      hasError = true;
    }

    if (isNaN(salary) || salary <= 0) {
      this.showError('salary', 'Salary must be a positive number greater than 0.');
      hasError = true;
    }

    if (hasError) return;

    try {
      if (editId) {
        // Edit existing
        const updateData = { name, email, department, designation, salary, phone };
        if (password) updateData.password = password;
        Storage.updateUser(editId, updateData);
        alert('Employee updated successfully.');
      } else {
        // Add new
        Storage.addUser({
          name, email, password, department, designation, salary, phone, role: 'employee'
        });
        alert(`Employee registered! They can now log in using email: ${email}`);
      }

      this.closeModal();
      this.render();
      this.populateDepartments();
    } catch (err) {
      this.showError('email', err.message);
    }
  },

  deleteEmployee(id) {
    const emp = Storage.getUserById(id);
    if (!emp) return;
    if (confirm(`Are you sure you want to delete employee "${emp.name}"? This action cannot be undone.`)) {
      Storage.deleteUser(id);
      this.render();
      this.populateDepartments();
    }
  },

  getFilteredEmployees() {
    const users = Storage.getUsers().filter(u => u.role === 'employee');
    const query = (this.searchInput ? this.searchInput.value : '').trim().toLowerCase();
    const dept = (this.deptFilter ? this.deptFilter.value : 'all');

    return users.filter(u => {
      const matchesQuery = !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.designation && u.designation.toLowerCase().includes(query));

      const matchesDept = dept === 'all' || u.department === dept;

      return matchesQuery && matchesDept;
    });
  },

  populateDepartments() {
    if (!this.deptFilter) return;
    const users = Storage.getUsers().filter(u => u.role === 'employee');
    const depts = [...new Set(users.map(u => u.department).filter(Boolean))];

    const currentVal = this.deptFilter.value;
    this.deptFilter.innerHTML = '<option value="all">All Departments</option>';
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      if (d === currentVal) opt.selected = true;
      this.deptFilter.appendChild(opt);
    });
  },

  render() {
    if (!this.tableBody) return;
    const employees = this.getFilteredEmployees();

    if (employees.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-muted">
            <i class="fa-solid fa-users-slash fa-2x mb-2" style="display:block; opacity: 0.5;"></i>
            No employees found. Click "Add Employee" to register your first team member!
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = employees.map(emp => {
      const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
          <td>${emp.designation || 'Staff'}</td>
          <td><strong>PKR ${Number(emp.salary).toLocaleString()}</strong></td>
          <td>${emp.phone || '—'}</td>
          <td>${emp.joinedDate || '—'}</td>
          <td class="text-right">
            <button type="button" class="btn btn-sm btn-outline mr-1" onclick="EmployeeModule.openModal('${emp.id}')" title="Edit">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button type="button" class="btn btn-sm btn-danger-outline" onclick="EmployeeModule.deleteEmployee('${emp.id}')" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  exportCSV() {
    const employees = Storage.getUsers().filter(u => u.role === 'employee');
    if (employees.length === 0) {
      alert('No employee data available to export.');
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Department', 'Designation', 'Monthly Salary (PKR)', 'Phone', 'Join Date'];
    const rows = employees.map(e => [
      e.id,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.email.replace(/"/g, '""')}"`,
      `"${e.department.replace(/"/g, '""')}"`,
      `"${(e.designation || '').replace(/"/g, '""')}"`,
      e.salary,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      e.joinedDate || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_${Storage.getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.EmployeeModule = EmployeeModule;
