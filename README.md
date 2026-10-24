# HCM Lite — Saylani Hackathon (Beginner Track)

> **Modern, AI-Assisted Human Capital Management Web App**  
> Built strictly with **HTML5, CSS3, Vanilla JavaScript (ES6+), and browser `localStorage`**.  
> **Zero Frameworks • Zero Backend • No Preloaded/Dummy Data**

---

## 🌟 Live Demo & Judging Guide (5-Minute Walkthrough)

As specified in the hackathon brief, the application **starts 100% empty**. Follow these simple steps during judging:

### Step 1: First-Run Setup (`index.html`)
1. Open [`index.html`](index.html) in any modern browser.
2. Because no company exists yet, the **First-Run Setup** screen appears automatically.
3. Enter your company information:
   - **Company Name**: e.g. *Saylani Welfare International Trust*
   - **Office Start Time**: `09:00`
   - **Grace Minutes**: `15`
   - **Annual Leave Quota**: `20` Days
   - **Admin Name, Email & Password**: Create the master administrator credentials.
4. Click **Complete Setup & Launch**. You are immediately logged in to the **Admin Dashboard**!

### Step 2: Register Employees (`employees.html`)
1. Go to **Manage Employees** in the sidebar.
2. Click **+ Add Employee**.
3. Create 1 or 2 employees (e.g., Name: *Ahmed Raza*, Email: *ahmed@saylani.org*, Password: *1234*, Department: *Engineering*, Salary: *80000*).
4. Notice that registering an employee automatically creates their credentials!
5. Optional: Click **Export CSV** to download employee data.

### Step 3: Employee Self-Service Check-In & Leave (`employee.html`)
1. Click **Logout** from the Admin dashboard.
2. Log in using the employee credentials you just created (*ahmed@saylani.org* / *1234*).
3. On the **Employee Dashboard**:
   - View the **Live Digital Clock** and office timing policy.
   - Click **Check In** (or click **Camera Check-In** for bonus webcam face verification!).
   - Notice the status badge turns **PRESENT** (or **LATE** if after 09:15).
   - Click **Apply for Leave** modal: Choose dates (e.g. next Monday & Tuesday). The app validates working days excluding weekends, checks quota, and prevents overlapping leaves.
   - Submit the leave request.

### Step 4: Admin Review & Approvals (`leaves.html` & `admin.html`)
1. Log out from the employee account and log back in as **Admin**.
2. Visit **Leave Requests**: View the pending application and click **Approve** (with an optional comment).
3. Return to **Dashboard**: Observe real-time totals, today's attendance table, and the dynamic **Chart.js status doughnut chart**.

### Step 5: Monthly Payroll & Payslip (`payslip.html`)
1. Navigate to **Payroll & Payslips**.
2. Select any employee and generate their monthly slip.
3. **Exact Business Formula Applied**:
   $$\text{Per Day Rate} = \frac{\text{Monthly Salary}}{\text{Working Days in Month}}$$
   $$\text{Deduction} = \text{Per Day Rate} \times (\text{Absent Days} + 0.5 \times \text{Half Days})$$
   $$\text{Net Salary} = \text{Gross Salary} - \text{Deduction}$$
4. Click **Print / Save as PDF** to preview a crisp, professional payslip document.

### Step 6: Test the Smart Helper (AI Touch)
Click the floating **AI Assistant** button at the bottom-right of either dashboard:
- **As Admin, ask**:
  - *"How many employees do we have?"*
  - *"Who was late today?"*
  - *"Who is on leave today?"*
  - *"What is total payroll cost?"*
- **As Employee, ask**:
  - *"How many leaves do I have left?"*
  - *"Was I late today?"*
  - *"What is my net salary?"*
- *All answers are computed on the fly from actual localStorage records!*

---

## 📁 Project Architecture & File Map

```text
├── index.html          # Login & First-run company/admin setup
├── admin.html          # Admin dashboard, KPIs, Chart.js, Announcements
├── employees.html      # Employee directory, Add/Edit/Delete, CSV export
├── leaves.html         # Leave requests approval inbox with comments
├── settings.html       # Organization rules, timings, quota & demo reset
├── employee.html       # Employee self-service, check-in/out, camera modal
├── payslip.html        # Monthly salary statement with print layout
├── css/
│   └── style.css       # Complete modern enterprise design system & dark mode
└── js/
    ├── storage.js      # LocalStorage engine, CRUD, business rules & math
    ├── auth.js         # Session management & role security guards
    ├── employees.js    # Directory search, department filters & modal logic
    ├── attendance.js   # Live clock, late penalty, camera preview & CSV
    ├── leave.js        # Leave validations (no overlap, weekend skipping)
    └── helper.js       # Smart Helper chatbot answering from live data
```

---

## 🛡️ Business Rules Implemented

| Module | Business Rule Decided by Admin |
|---|---|
| **M1: Auth & Access** | Session persistence in `hcm_session`. If an Employee attempts to open an Admin page, they are immediately redirected back to `employee.html`. |
| **M2: Company Setup** | Starts empty. First-run setup stores company start time, grace minutes, leave quota, and admin account. |
| **M3: Employees** | Required fields, valid email format, email uniqueness guard, positive salary check, real-time search & department filtering. |
| **M4: Attendance** | Single check-in per day (second check-in blocked). Arrival after `startTime + graceMinutes` automatically marked **LATE**. Work hours under 5 hours marked **HALF DAY**. |
| **M5: Leaves** | From date $\le$ To date. Working days calculated excluding Saturdays and Sundays. Overlapping requests blocked. Quota overflow blocked. |
| **M6: Payslip** | Daily rate calculated from month's working days. Automated absent and half-day deductions calculated per specification. |
| **M8: Smart Helper** | Admin receives company-wide metrics; Employees receive strictly their own scoped records. |

---

## 🎁 Bonus Points Implemented (+10)
1. **Camera Web Check-In**: Live webcam video stream via `navigator.mediaDevices.getUserMedia()` with selfie check-in confirmation.
2. **Chart.js Attendance Analytics**: Real-time interactive Doughnut chart of today's attendance distribution.
3. **CSV Data Export**: One-click export for both Employee Directory and Daily Attendance Logs.
4. **Dark Mode Toggle**: Persistent theme switcher with custom CSS variables.
5. **Printable Payslip**: Dedicated `@media print` CSS layout for clean PDF downloads.
6. **One-Click Demo Reset**: Danger zone button to wipe localStorage and let judges re-run the entire fresh install story.

---

### Saylani Hackathon — 24 October 2026
**Zaitoon Ashraf IT Park**
