## 🔑 AllIndianJobs Admin Setup Instructions

### Create Admin User in Firebase:

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select project: `allindiajobs-36405`

2. **Navigate to Authentication:**
   - Click on "Authentication" in the left menu
   - Go to "Users" tab
   - Click "Add User"

3. **Create Admin User:**
   - **Email:** `admin@allindianjobs.com`
   - **Password:** `admin123456`
   - Click "Add User"

4. **Test Login:**
   - Go to: `http://localhost:4200/admin`
   - Use the credentials above to login

### Features Available After Login:
- ✅ Dashboard with job statistics
- ✅ User email display in header
- ✅ Logout functionality
- ✅ View all jobs in table format
- ✅ Create new jobs with form
- ✅ View job details in modal
- ✅ Delete jobs with confirmation
- ✅ Responsive design with Bootstrap 5

### Test the System:
1. Login with admin credentials
2. Create a test job
3. View the job in the dashboard
4. Check job details
5. Delete the job if needed

All data is stored in Firebase Firestore with proper security rules.