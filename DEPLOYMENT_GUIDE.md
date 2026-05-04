# How to Host Your Application for Free

You asked about using **InfinityFree** to host your app. There is one major issue with InfinityFree: **they only support PHP and static websites. They do not support Node.js.** 

Since your backend (`server.js`) is built using Node.js and Express, your application will **not** work on InfinityFree. 

However, you can still host your entire application **completely for free** using modern platforms that integrate directly with Git and GitHub! 

Here is the best free architecture for your app:
1. **GitHub**: To store your code online.
2. **Render.com**: To host your Node.js backend (`server.js`) for free.
3. **Vercel or Netlify**: To host your React frontend for free.

---

### Step 1: Upload Your Code to GitHub
Before you can host anything, your code needs to be on GitHub.
1. Create a free account at [GitHub.com](https://github.com/).
2. Download and install [Git](https://git-scm.com/downloads) on your computer if you haven't already.
3. Open your terminal in your `frontend` folder (`c:\Users\nokut\Desktop\E-COMMERCE\frontend`).
4. Run these commands to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
5. Go to GitHub and create a **New Repository**.
6. Follow the instructions GitHub gives you to "push an existing repository from the command line" (it will look like `git remote add origin ...` and `git push -u origin main`).

---

### Step 2: Prepare Your Code for Production
Right now, your React frontend expects the backend to be at `http://localhost:5000`. When it's live on the internet, it needs to talk to the live URL.
1. Open your `App.js`.
2. Find every place where it says `fetch('/api/...')` and you will need to update this to point to your live backend URL once you get it in Step 3. (Usually, we use environment variables for this, e.g., `process.env.REACT_APP_API_URL + '/api/...'`).

---

### Step 3: Host Your Node.js Backend (Render.com)
1. Go to [Render.com](https://render.com/) and sign up using your GitHub account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Scroll down to **Environment Variables** and add your `MONGODB_URI` and your `PAYNOW` keys here.
6. Click **Create Web Service**. 
7. Render will give you a live URL (e.g., `https://my-ecommerce-backend.onrender.com`). Copy this!

---

### Step 4: Host Your React Frontend (Vercel)
Now that your backend is live, let's host the visual website.
1. First, update your `App.js` `fetch` requests to use the Render URL you just got. Push this change to GitHub (`git add .`, `git commit -m "update url"`, `git push`).
2. Go to [Vercel.com](https://vercel.com/) and sign up with GitHub.
3. Click **Add New -> Project**.
4. Import your GitHub repository.
5. Vercel will automatically detect that it is a React app (Create React App).
6. Click **Deploy**.
7. Vercel will build your website and give you a live link (e.g., `https://my-ecommerce-site.vercel.app`) that anyone in the world can visit!
