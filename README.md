# 🚀 Hackathon Starter Kit (HTML5 + CSS3 + JavaScript + Supabase)

Yeh boilerplate aapke kal ke hackathon ke liye mukammal taur par tayyar kiya gaya hai taake aapka waqt Authentication, UI styling, Fonts aur Database configuration me barbad na ho.

---

## 📁 File Structure

```text
Hackathon/
├── index.html            # Landing / Dashboard page (Session check, User Greeting, Cheatsheet)
├── login.html            # Dedicated Sign In (Login) page
├── signup.html           # Dedicated Create Account (Sign Up) page
├── auth.html             # Combined Tabbed Login & Sign-up page
├── css/
│   └── style.css         # Modern responsive CSS, Variables, Buttons, Cards, Toast alerts
├── js/
│   ├── config.js         # Yahan apna Supabase URL aur Anon Key lagayein
│   ├── supabaseClient.js # Supabase client initialization (CDN based)
│   ├── toast.js          # Modern alert/toast system (no ugly browser alert popups)
│   ├── auth.js           # Sign In, Sign Up, Sign Out, Forgot password logic
│   └── app.js            # App logic & ready-to-use CRUD helper functions
├── .gitignore            # Git ignore file
└── README.md             # Guide & instructions
```

---

## 🔤 Pre-Configured Fonts & Icons

Aapko fonts download ya configure karne ki zaroorat nahi hai, yeh pehle se HTML files aur CSS me wired hain:
1. **Headings Font:** `Plus Jakarta Sans` (Google Font - Bold & Modern)
2. **Body Text Font:** `Inter` (Google Font - Clean & Readable)
3. **Icons:** `Font Awesome 6` (CDN pre-loaded: User, Lock, Eye, Trash, Rocket, Check, etc.)

---

## ⚡ Step 1: Supabase Setup (Sirf 2 Minute)

1. [Supabase](https://supabase.com/) par login karein aur naya project banayein.
2. Left sidebar se **Project Settings** (Gear icon ⚙️) me jayein -> **API** par click karein.
3. Wahan se:
   - **Project URL** copy karein
   - **Project API Keys** me se **`anon` `public`** key copy karein
4. File `js/config.js` ko open karein aur values paste kar dein:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://your-project-id.supabase.co",
     anonKey: "eyJhbGciOi..."
   };
   ```

> 💡 **Hackathon Tip:** Agar aap chahte hain ke Sign-Up ke waqt user ko email verification ka intezar na karna pare aur seedha login ho jaye, tou Supabase Dashboard me **Authentication** -> **Providers** -> **Email** me jayein aur **"Confirm email"** ko **OFF (disable)** kar dein!

---

## 💻 Step 2: Project Run Kaise Karein?

- Agar aap VS Code use kar rahe hain: **Live Server** extension se `index.html` ya `auth.html` ko Right Click kar ke **"Open with Live Server"** karein.
- Ya simply kisi bhi browser me `index.html` file par double click kar ke open kar lein.

---

## 🐙 Step 3: GitHub Repo Kaise Banayein Aur Push Karein?

### Tareeqa A: Agar Git CLI install hai:
```bash
# 1. Git repository initialize karein
git init

# 2. Tamam files add karein
git add .

# 3. Commit karein
git commit -m "Initial hackathon starter setup with Supabase auth"

# 4. GitHub par ja kar naya repository create karein (e.g., hackathon-project)
# Phir apna branch main karein aur remote add karein:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Tareeqa B: GitHub Desktop (Asaan tareeqa):
1. **GitHub Desktop** open karein.
2. **File -> Add Local Repository** par click karein aur `e:\SMIT B22\Hackathon` folder select karein.
3. Agar poochay ke repository nahi bana hua tou **"Create a repository"** par click karein.
4. **Publish repository** par click kar dein!

---

## 🛠️ Kal Ke Liye Ready-to-Use Database (CRUD) Functions

`js/app.js` me `Database` object bana hua hai, kal jo bhi table banayein:

```javascript
// 1. Data Get Karna (Read)
const products = await Database.getAll('products');

// 2. Naya Record Daalna (Create)
const newItem = await Database.create('products', {
  name: 'Laptop',
  price: 999,
  user_id: currentUser.id
});

// 3. Record Update Karna (Update)
await Database.update('products', itemId, { price: 899 });

// 4. Record Delete Karna (Delete)
await Database.delete('products', itemId);
```

---

## 🔔 Toast Notifications Kaise Use Karein?

Browser ke standard `alert()` ke bajaye toast alerts use karein:
```javascript
Toast.success('Kamyabi se save ho gaya!');
Toast.error('Koi ghalti pesh aayi!');
Toast.warning('Check input fields!');
Toast.info('Aapka session active hai.');
```

All the best for tomorrow's hackathon! 🏆
