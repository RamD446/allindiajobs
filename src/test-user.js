// Test Firebase Authentication
// Run this in browser console to create a test user

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();

// Create a test admin user
async function createTestUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@allindianjobs.com', 'admin123456');
    console.log('Test user created successfully:', userCredential.user);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

// Uncomment to create test user
// createTestUser();