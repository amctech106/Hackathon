/**
 * AMC Tech - Leave Management Module
 * Handles leave applications, working day calculation, balance verification, and admin approval workflows.
 */

const LeaveModule = {
  // Initialize module state and UI bindings
  init(user) {
    this.user = user || Storage.getSession();
    this.isAdmin = this.user && this.user.role === 'admin';

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Employee Apply Leave Form
    const applyForm = document.getElementById('leave-apply-form');
    if (applyForm) {
      applyForm.addEventListener('submit', (e) => this.handleApply(e));

      // Live working day preview
      const fromInput = document.getElementById('leave-from');
      const toInput = document.getElementById('leave-to');
      if (fromInput && toInput) {
        const updateDays = () => {
          const f = fromInput.value;
          const t = toInput.value;
          const previewEl = document.getElementById('leave-days-preview');
          if (f && t && previewEl) {
            if (f > t) {
              previewEl.textContent = 'Invalid date range';
              previewEl.className = 'text-danger small mt-1';
            } else {
              const days = Storage.countWorkingDays(f, t);
              previewEl.textContent = `${days} working day(s) (excluding weekends)`;
              previewEl.className = 'text-info small mt-1';
            }
          }
        };
        fromInput.addEventListener('change', updateDays);
        toInput.addEventListener('change', updateDays);
      }
    }

    // Admin Status Filter
    const filterSelect = document.getElementById('filter-leave-status');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.render());
    }

    // Modal Close
    const closeDecisionModal = document.getElementById('btn-close-decision-modal');
    if (closeDecisionModal) {
      closeDecisionModal.addEventListener('click', () => {
        document.getElementById('leave-decision-modal').classList.add('hidden');
      });
    }

    // Modal Submit
    const decisionForm = document.getElementById('leave-decision-form');
    if (decisionForm) {
      decisionForm.addEventListener('submit', (e) => this.handleDecisionSubmit(e));
    }
  },

  handleApply(e) {
    e.preventDefault();
    if (!this.user) return;

    const fromDate = document.getElementById('leave-from').value;
    const toDate = document.getElementById('leave-to').value;
    const type = document.getElementById('leave-type').value;
    const reason = document.getElementById('leave-reason').value;

    try {
      Storage.applyLeave({
        employeeId: this.user.id,
        type,
        fromDate,
        toDate,
        reason
      });

      alert('Leave request submitted successfully! Awaiting Admin approval.');
      document.getElementById('leave-apply-form').reset();
      const previewEl = document.getElementById('leave-days-preview');
      if (previewEl) previewEl.textContent = '';
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  openDecisionModal(leaveId, action) {
    const modal = document.getElementById('leave-decision-modal');
    const idInput = document.getElementById('decision-leave-id');
    const actionInput = document.getElementById('decision-action');
    const titleEl = document.getElementById('decision-modal-title');
    const commentInput = document.getElementById('decision-comment');

    if (!modal) return;

    idInput.value = leaveId;
    actionInput.value = action;
    titleEl.textContent = action === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request';
    commentInput.value = '';

    modal.classList.remove('hidden');
  },

  handleDecisionSubmit(e) {
    e.preventDefault();
    const leaveId = document.getElementById('decision-leave-id').value;
    const action = document.getElementById('decision-action').value;
    const comment = document.getElementById('decision-comment').value;

    try {
      Storage.updateLeaveStatus(leaveId, action, comment);
      alert(`Leave request has been ${action}.`);
      document.getElementById('leave-decision-modal').classList.add('hidden');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  },

  render() {
    if (!this.isAdmin && this.user) {
      this.renderEmployeeLeaves();
    }

    if (this.isAdmin) {
      this.renderAdminLeaves();
    }
  },

  renderEmployeeLeaves() {
    // 1. Leave Balance
    const balance = Storage.getEmployeeLeaveBalance(this.user.id);
    const quotaEl = document.getElementById('quota-total');
    const usedEl = document.getElementById('quota-used');
    const remainingEl = document.getElementById('quota-remaining');

    if (quotaEl) quotaEl.textContent = `${balance.quota} Days`;
    if (usedEl) usedEl.textContent = `${balance.used} Days`;
    if (remainingEl) remainingEl.textContent = `${balance.remaining} Days`;

    // 2. Table
    const tableBody = document.getElementById('employee-leave-history');
    if (!tableBody) return;

    const myLeaves = Storage.getLeaves()
      .filter(l => String(l.employeeId) === String(this.user.id))
      .sort((a, b) => b.id - a.id);

    if (myLeaves.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No leave requests found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = myLeaves.map(l => {
      const badgeClass = l.status === 'approved' ? 'badge-success' :
        (l.status === 'rejected' ? 'badge-danger' : 'badge-warning');

      return `
        <tr>
          <td><strong>${l.type}</strong></td>
          <td>${l.fromDate} to ${l.toDate}</td>
          <td>${l.days} day(s)</td>
          <td>${l.reason || '—'}</td>
          <td><span class="badge ${badgeClass}">${l.status.toUpperCase()}</span></td>
          <td><small class="text-muted">${l.comment || 'No comment'}</small></td>
        </tr>
      `;
    }).join('');
  },

  renderAdminLeaves() {
    const tableBody = document.getElementById('admin-leaves-table-body');
    if (!tableBody) return;

    const filter = document.getElementById('filter-leave-status');
    const statusVal = filter ? filter.value : 'all';

    let leaves = Storage.getLeaves();
    if (statusVal !== 'all') {
      leaves = leaves.filter(l => l.status === statusVal);
    }
    leaves.sort((a, b) => b.id - a.id);

    if (leaves.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-muted">No leave applications found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = leaves.map(l => {
      const emp = Storage.getUserById(l.employeeId);
      const badgeClass = l.status === 'approved' ? 'badge-success' :
        (l.status === 'rejected' ? 'badge-danger' : 'badge-warning');

      const isPending = l.status === 'pending';

      return `
        <tr>
          <td>
            <strong>${emp ? emp.name : 'Unknown Employee'}</strong>
            <div class="text-muted small">${emp ? emp.email : ''}</div>
          </td>
          <td><span class="badge badge-dept">${emp ? emp.department : 'General'}</span></td>
          <td><strong>${l.type}</strong></td>
          <td>${l.fromDate} → ${l.toDate}</td>
          <td><strong>${l.days}</strong> day(s)</td>
          <td>${l.reason || '—'}</td>
          <td><span class="badge ${badgeClass}">${l.status.toUpperCase()}</span></td>
          <td class="text-right">
            ${isPending ? `
              <button type="button" class="btn btn-sm btn-success mr-1" onclick="LeaveModule.openDecisionModal('${l.id}', 'approved')">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button type="button" class="btn btn-sm btn-danger-outline" onclick="LeaveModule.openDecisionModal('${l.id}', 'rejected')">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
            ` : `
              <span class="text-muted small">${l.comment ? `Comment: "${l.comment}"` : 'Reviewed'}</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }
};

window.LeaveModule = LeaveModule;
