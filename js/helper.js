/**
 * HCM Lite - Smart Helper (Data-driven AI Touch)
 * Answers questions instantly using real localStorage data.
 * Adheres strictly to role permissions:
 * - Admin gets company-wide answers
 * - Employee gets ONLY their own records
 */

const SmartHelper = {
  init(user) {
    this.user = user || Storage.getSession();
    this.isAdmin = this.user && this.user.role === 'admin';
    this.renderWidget();
    this.bindEvents();
  },

  renderWidget() {
    const existing = document.getElementById('smart-helper-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'smart-helper-container';
    container.className = 'smart-helper-container';

    // Quick chips based on role
    const chips = this.isAdmin ? [
      "How many employees do we have?",
      "Who is on leave today?",
      "Who was late today?",
      "Pending leave requests?",
      "What is total payroll cost?"
    ] : [
      "How many leaves do I have left?",
      "Was I late today?",
      "How many hours did I work this week?",
      "What is my net salary?"
    ];

    container.innerHTML = `
      <!-- Floating Trigger Button -->
      <button type="button" id="helper-toggle-btn" class="helper-toggle-btn" title="Ask Smart Assistant">
        <i class="fa-solid fa-sparkles"></i>
        <span>AI Assistant</span>
      </button>

      <!-- Chat Drawer Window -->
      <div id="helper-chat-box" class="helper-chat-box hidden">
        <div class="helper-header">
          <div class="helper-header-info">
            <span class="helper-bot-avatar"><i class="fa-solid fa-robot"></i></span>
            <div>
              <div class="helper-title">HCM Smart Helper</div>
              <div class="helper-subtitle">${this.isAdmin ? 'Company Intelligence' : 'Personal Self-Service'}</div>
            </div>
          </div>
          <button type="button" id="helper-close-btn" class="helper-close-btn" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="helper-messages" id="helper-messages">
          <div class="helper-msg bot">
            <div class="msg-bubble">
              Assalam-o-Alaikum <strong>${this.user ? this.user.name : 'there'}</strong>! 👋<br>
              I am your HCM Smart Helper. Ask me anything about attendance, leaves, or company data!
            </div>
          </div>
        </div>

        <!-- Quick suggestion chips -->
        <div class="helper-chips">
          ${chips.map(c => `<button type="button" class="chip-btn js-chip-btn">${c}</button>`).join('')}
        </div>

        <form id="helper-form" class="helper-form">
          <input type="text" id="helper-input" placeholder="Type a question (e.g. who is late today?)..." autocomplete="off" required>
          <button type="submit" class="helper-send-btn">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(container);
  },

  bindEvents() {
    const toggleBtn = document.getElementById('helper-toggle-btn');
    const chatBox = document.getElementById('helper-chat-box');
    const closeBtn = document.getElementById('helper-close-btn');
    const form = document.getElementById('helper-form');
    const input = document.getElementById('helper-input');

    if (toggleBtn && chatBox) {
      toggleBtn.addEventListener('click', () => {
        chatBox.classList.toggle('hidden');
        if (!chatBox.classList.contains('hidden')) {
          input.focus();
        }
      });
    }

    if (closeBtn && chatBox) {
      closeBtn.addEventListener('click', () => {
        chatBox.classList.add('hidden');
      });
    }

    document.querySelectorAll('.js-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.textContent;
        this.ask(query);
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        this.ask(text);
      });
    }
  },

  ask(question) {
    this.addMessage(question, 'user');

    // Simulate quick intelligent thinking
    setTimeout(() => {
      const answer = this.processQuestion(question);
      this.addMessage(answer, 'bot');
    }, 250);
  },

  addMessage(text, sender = 'bot') {
    const container = document.getElementById('helper-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `helper-msg ${sender}`;
    msgDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  },

  processQuestion(q) {
    const lower = q.toLowerCase();
    const today = Storage.getTodayString();
    const company = Storage.getCompany() || { name: 'Company', leaveQuota: 20 };

    // ──────────────── ADMIN QUESTIONS ────────────────
    if (this.isAdmin) {
      // 1. Employee headcount
      if (lower.includes('how many employee') || lower.includes('headcount') || lower.includes('total staff') || lower.includes('kitne employee') || lower.includes('total employee')) {
        const employees = Storage.getUsers().filter(u => u.role === 'employee');
        if (employees.length === 0) {
          return `Currently there are <strong>0 registered employees</strong>. You can add employees from the <strong>Manage Employees</strong> page.`;
        }
        return `We currently have <strong>${employees.length} active employee(s)</strong> in the company.`;
      }

      // 2. Who is on leave today
      if (lower.includes('leave today') || lower.includes('chutti') || lower.includes('who is on leave') || lower.includes('absent')) {
        const approved = Storage.getLeaves().filter(l => l.status === 'approved' && today >= l.fromDate && today <= l.toDate);
        if (approved.length === 0) {
          return `🎉 Good news! <strong>No employees are on approved leave today</strong> (${today}).`;
        }
        const names = approved.map(l => {
          const emp = Storage.getUserById(l.employeeId);
          return `• <strong>${emp ? emp.name : 'Unknown'}</strong> (${l.type} Leave)`;
        }).join('<br>');
        return `Today (<strong>${today}</strong>), <strong>${approved.length} employee(s)</strong> are on leave:<br>${names}`;
      }

      // 3. Who was late today
      if (lower.includes('late today') || lower.includes('who was late') || lower.includes('kon late')) {
        const lateRecords = Storage.getTodayAttendance().filter(r => r.status === 'late');
        if (lateRecords.length === 0) {
          return `✨ Excellent! <strong>No one arrived late today</strong>. All checked-in employees arrived within the grace period.`;
        }
        const list = lateRecords.map(r => {
          const emp = Storage.getUserById(r.employeeId);
          return `• <strong>${emp ? emp.name : 'Employee'}</strong> checked in at <em>${r.checkIn}</em>`;
        }).join('<br>');
        return `<strong>${lateRecords.length} employee(s)</strong> checked in late today:<br>${list}`;
      }

      // 4. Pending leaves
      if (lower.includes('pending') || lower.includes('requests')) {
        const pending = Storage.getLeaves().filter(l => l.status === 'pending');
        if (pending.length === 0) {
          return `There are currently <strong>0 pending leave requests</strong>. Everything is reviewed!`;
        }
        return `You have <strong>${pending.length} pending leave request(s)</strong> waiting for your approval. Visit the <strong>Leave Requests</strong> page to review them.`;
      }

      // 5. Total payroll
      if (lower.includes('payroll') || lower.includes('salary cost') || lower.includes('expense')) {
        const employees = Storage.getUsers().filter(u => u.role === 'employee');
        const total = employees.reduce((acc, u) => acc + (Number(u.salary) || 0), 0);
        return `Total monthly budgeted payroll across all ${employees.length} employee(s) is <strong>PKR ${total.toLocaleString()}</strong>.`;
      }
    }

    // ──────────────── EMPLOYEE QUESTIONS (Scoped to Self) ────────────────
    if (!this.isAdmin && this.user) {
      const myId = String(this.user.id);

      // 1. Leave balance
      if (lower.includes('leave') && (lower.includes('left') || lower.includes('balance') || lower.includes('kitni'))) {
        const balance = Storage.getEmployeeLeaveBalance(myId);
        return `You have <strong>${balance.remaining} day(s)</strong> remaining out of your yearly quota of <strong>${balance.quota} days</strong>. (Used: ${balance.used} days).`;
      }

      // 2. Was I late today
      if (lower.includes('was i late') || lower.includes('am i late') || lower.includes('kya main late')) {
        const att = Storage.getEmployeeTodayAttendance(myId);
        if (!att) {
          return `You have not checked in yet today. Don't forget to click the <strong>Check In</strong> button!`;
        }
        if (att.status === 'late') {
          return `Yes, you checked in at <strong>${att.checkIn}</strong> which was marked as <strong>Late</strong> based on company start time.`;
        } else {
          return `No, you arrived on time! Checked in at <strong>${att.checkIn}</strong> (Status: <strong>Present</strong>).`;
        }
      }

      // 3. Work hours this week
      if (lower.includes('hour') || lower.includes('hours worked') || lower.includes('this week') || lower.includes('kitne ghante')) {
        // Find records from the last 7 days
        const records = Storage.getAttendance().filter(r => String(r.employeeId) === myId && r.workHours > 0);
        const totalHours = records.reduce((sum, r) => sum + (Number(r.workHours) || 0), 0);
        return `You have recorded approximately <strong>${totalHours.toFixed(1)} working hours</strong> across completed check-ins.`;
      }

      // 4. Salary / Payslip
      if (lower.includes('salary') || lower.includes('payslip') || lower.includes('pay') || lower.includes('tankhwah')) {
        const now = new Date();
        try {
          const slip = Storage.calculatePayslip(myId, now.getFullYear(), now.getMonth() + 1);
          return `Your base salary is <strong>PKR ${slip.monthlySalary.toLocaleString()}</strong>. Estimated net payable for this month (after deductions): <strong>PKR ${slip.netSalary.toLocaleString()}</strong>. View full details in the Payslip tab!`;
        } catch (e) {
          return `Your registered monthly salary is <strong>PKR ${Number(this.user.salary || 0).toLocaleString()}</strong>.`;
        }
      }
    }

    // ──────────────── GENERAL COMPANY RULES & FALLBACK ────────────────
    if (lower.includes('office') || lower.includes('timing') || lower.includes('start time') || lower.includes('grace')) {
      const start = company.startTime || '09:00';
      const grace = company.graceMinutes || 15;
      return `Office timing starts at <strong>${start}</strong> with a <strong>${grace}-minute grace period</strong> (late marked after ${start} + ${grace}m).`;
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('salam') || lower.includes('hey')) {
      return `Hello! How can I assist you with your HCM records today? Try asking about attendance, leave balances, or company stats!`;
    }

    // Friendly fallback
    return `I can help you with specific records! Try asking:<br>
      • <em>"How many leaves do I have left?"</em><br>
      • <em>"Who was late today?"</em><br>
      • <em>"How many employees do we have?"</em><br>
      • <em>"Office timing and grace period"</em>`;
  }
};

window.SmartHelper = SmartHelper;
