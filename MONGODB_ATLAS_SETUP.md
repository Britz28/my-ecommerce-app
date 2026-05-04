# How to Set Up MongoDB Atlas (Cloud Hosted)

If you don't have a local MongoDB installed on your computer, the easiest way to run MongoDB is to use **MongoDB Atlas**, which is completely free and hosted in the cloud.

Here is exactly how to set it up and connect it to your application.

### Step 1: Create a Free MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up for an account.
2. Once logged in, you will be prompted to build your first cluster.
3. Choose the **M0 Free** cluster tier.
4. Select a provider (AWS, Google Cloud, or Azure) and a region closest to your users. 
5. Click **Create Cluster**. (It may take 1-3 minutes to provision).

### Step 2: Set Up Database Access (Username & Password)
1. On the Quickstart screen or under **Database Access** (on the left sidebar), click **Add New Database User**.
2. Choose **Password** for the authentication method.
3. Enter a username (e.g., `admin`) and a strong password. **Write down or copy this password**—you will need it soon.
4. Click **Add User**.

### Step 3: Set Up Network Access (IP Whitelist)
1. In the left sidebar, click **Network Access**.
2. Click **Add IP Address**.
3. Choose **Allow Access from Anywhere** (which inserts `0.0.0.0/0`) so your backend can connect to it no matter where it is hosted. 
4. Click **Confirm**.

### Step 4: Get Your Connection String
1. In the left sidebar, click **Database** to go back to your cluster view.
2. Click the **Connect** button on your cluster.
3. Choose **Connect your application** (or "Drivers").
4. Under "Driver", ensure Node.js is selected.
5. You will see a connection string that looks similar to this:
   `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Copy this connection string.

### Step 5: Connect It to Your Application
1. Open your code editor and find the `.env.local` file inside the `frontend` folder (`c:\Users\nokut\Desktop\E-COMMERCE\frontend\.env.local`).
2. Replace the `MONGODB_URI` line with the connection string you just copied. 
3. **Crucial:** In the connection string you pasted, replace `<password>` with the actual password you created in Step 2. Do not include the angle brackets `<>`. 
   
   It should look something like this:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://admin:MySecretPassword123@cluster0.xxxxx.mongodb.net/ecommerce?retryWrites=true&w=majority
   ```
   *(Note: Add `/ecommerce` right before the `?` in the URL to name your database "ecommerce", as shown above).*

4. Save the file.

### Step 6: Test the Connection
1. In your terminal, inside the `frontend` folder, run your server:
   ```bash
   node server.js
   ```
2. You should see `Connected to MongoDB successfully!` logged in the terminal. If you see this, you are fully connected to the cloud!
