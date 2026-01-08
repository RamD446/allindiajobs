import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebase.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showSuccessToast = false;
  auth = auth;
  
  @Output() loginSuccess = new EventEmitter<any>();

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Check session storage first
    const sessionUser = this.getSessionUser();
    if (sessionUser) {
      console.log('User found in session, navigating to admin...');
      this.router.navigate(['/admin']);
      return;
    }

    // Check if user is already logged in and redirect to admin
    onAuthStateChanged(this.auth, (user: any) => {
      if (user) {
        console.log('User already authenticated, storing in session and navigating to admin...');
        this.storeUserSession(user);
        this.router.navigate(['/admin']);
      }
    });
  }

  // Session storage methods
  private storeUserSession(user: any) {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      timestamp: Date.now()
    };
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    sessionStorage.setItem('auth_status', 'authenticated');
  }

  private getSessionUser() {
    try {
      const userStr = sessionStorage.getItem('auth_user');
      const authStatus = sessionStorage.getItem('auth_status');
      
      if (userStr && authStatus === 'authenticated') {
        const userData = JSON.parse(userStr);
        // Check if session is not too old (24 hours)
        const sessionAge = Date.now() - userData.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          return userData;
        } else {
          // Session expired, clear it
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error reading session:', error);
      this.clearSession();
    }
    return null;
  }

  private clearSession() {
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_status');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      
      try {
        console.log('Attempting to login with Firebase...');
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('Login successful:', userCredential.user);
        
        // Store user in session
        this.storeUserSession(userCredential.user);
        
        // Show success toast
        this.showSuccessToast = true;
        
        // Navigate to admin page immediately
        this.router.navigate(['/admin']);
        
        // Hide toast after navigation
        setTimeout(() => {
          this.showSuccessToast = false;
        }, 3000);
        
        this.loginSuccess.emit(userCredential.user);
      } catch (error: any) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        // Handle specific Firebase error codes
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email address.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Please try again later.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please check your credentials.';
            break;
          default:
            errorMessage = error.message || 'Login failed. Please try again.';
        }
        
        alert(errorMessage);
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Getter for easy access to form controls in template
  get f() {
    return this.loginForm.controls;
  }

  hideSuccessToast() {
    this.showSuccessToast = false;
  }
}
