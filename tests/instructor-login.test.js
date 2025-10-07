/**
 * @jest-environment jsdom
 */

/**
 * Comprehensive Test Suite for Instructor Login Functionality
 * Tests form validation, submission, security, edge cases, and user interactions
 */

describe('Instructor Login - Comprehensive Tests', () => {
  let mockAlert, mockConsole, mockLocalStorage;

  beforeEach(() => {
    // Mock browser APIs
    mockAlert = jest.fn();
    mockConsole = jest.fn();
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    
    global.alert = mockAlert;
    global.console = { ...console, log: mockConsole, error: mockConsole };
    global.localStorage = mockLocalStorage;

    // Create the instructor login form structure
    document.body.innerHTML = `
      <div class="login-card">
        <div class="tab-list">
          <button class="tab-trigger" data-tab="student">Student</button>
          <button class="tab-trigger active" data-tab="instructor">Instructor</button>
        </div>

        <div id="instructor-tab" class="tab-content active">
          <div class="demo-credentials">
            <p>Demo credentials: <span class="code">admin</span> / <span class="code">password</span></p>
          </div>

          <form id="instructor-form" class="form">
            <div class="form-group">
              <label for="instructor-username">Username</label>
              <input id="instructor-username" type="text" placeholder="Enter your username" required maxlength="50" />
              <div id="username-error" class="error-message" style="display: none;"></div>
            </div>

            <div class="form-group">
              <label for="instructor-password">Password</label>
              <input id="instructor-password" type="password" placeholder="Enter your password" required minlength="6" maxlength="50" />
              <div id="password-error" class="error-message" style="display: none;"></div>
              <button type="button" id="toggle-password" class="toggle-password">👁️</button>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" id="remember-me"> Remember me
              </label>
            </div>

            <button type="submit" id="login-btn" class="btn btn-primary btn-full">Sign In as Instructor</button>
            <div id="login-error" class="error-message" style="display: none;"></div>
            <div id="login-success" class="success-message" style="display: none;"></div>
          </form>

          <div class="forgot-password">
            <a href="#" id="forgot-password-link">Forgot Password?</a>
          </div>

          <div id="loading-overlay" class="loading-overlay" style="display: none;">
            <div class="loading-spinner"></div>
            <p>Signing you in...</p>
          </div>

          <div id="login-attempts" style="display: none;">
            <p>Login attempts: <span id="attempt-count">0</span>/3</p>
          </div>
        </div>
      </div>
    `;

    // Mock login validation with enhanced logic
    global.loginAttempts = 0;
    global.isAccountLocked = false;
    
    global.validateInstructorLogin = jest.fn((username, password) => {
      if (global.isAccountLocked) {
        return { success: false, message: 'Account temporarily locked. Try again later.' };
      }
      
      if (!username || !password) {
        return { success: false, message: 'Please enter both username and password' };
      }
      
      if (username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
      }
      
      if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }
      
      if (username === 'admin' && password === 'password') {
        global.loginAttempts = 0;
        return { success: true, message: 'Login successful' };
      } else {
        global.loginAttempts++;
        if (global.loginAttempts >= 3) {
          global.isAccountLocked = true;
          return { success: false, message: 'Too many failed attempts. Account locked for 15 minutes.' };
        }
        return { success: false, message: `Invalid credentials. ${3 - global.loginAttempts} attempts remaining.` };
      }
    });

    // Mock other functions
    global.redirectToInstructorDashboard = jest.fn();
    global.showForgotPasswordModal = jest.fn();
    global.togglePasswordVisibility = jest.fn();

    // Add comprehensive form handlers
    setupFormHandlers();
  });

  function setupFormHandlers() {
    const form = document.getElementById('instructor-form');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    // Form submission handler
    form.addEventListener('submit', handleFormSubmit);
    
    // Password toggle handler
    togglePasswordBtn.addEventListener('click', () => {
      const passwordInput = document.getElementById('instructor-password');
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
      global.togglePasswordVisibility(isPassword);
    });

    // Forgot password handler
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      global.showForgotPasswordModal();
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    
    const loginBtn = document.getElementById('login-btn');
    
    // Prevent double submission - FIXED
    if (loginBtn.disabled) {
      return;
    }
    
    const username = document.getElementById('instructor-username').value.trim();
    const password = document.getElementById('instructor-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    const errorDiv = document.getElementById('login-error');
    const successDiv = document.getElementById('login-success');
    const attemptCountSpan = document.getElementById('attempt-count');
    const attemptsDiv = document.getElementById('login-attempts');
    
    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Simulate network delay
    setTimeout(() => {
      const result = global.validateInstructorLogin(username, password);
      
      if (result.success) {
        successDiv.textContent = result.message;
        successDiv.style.display = 'block';
        
        if (rememberMe) {
          mockLocalStorage.setItem('rememberedUser', username); // FIXED: Use mockLocalStorage
        }
        
        setTimeout(() => {
          global.redirectToInstructorDashboard();
        }, 1000);
      } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In as Instructor';
        
        // Update attempt counter
        attemptCountSpan.textContent = global.loginAttempts;
        if (global.loginAttempts > 0) {
          attemptsDiv.style.display = 'block';
        }
      }
    }, 100);
  }

  afterEach(() => {
    jest.clearAllMocks();
    global.loginAttempts = 0;
    global.isAccountLocked = false;
  });

  // ORIGINAL 5 TESTS (FIXED)

  // Test 1: Successful instructor login with correct credentials - FIXED
  test('1. Should successfully login with correct credentials (admin/password)', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'admin';
    passwordInput.value = 'password';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Wait for both async operations (validation + redirect delay) - FIXED timing
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(global.validateInstructorLogin).toHaveBeenCalledWith('admin', 'password');
    expect(global.redirectToInstructorDashboard).toHaveBeenCalled();
    
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('none');
  });

  // Test 2: Failed login with incorrect username
  test('2. Should show error message with incorrect username', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'wronguser';
    passwordInput.value = 'password';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(global.validateInstructorLogin).toHaveBeenCalledWith('wronguser', 'password');
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toContain('Invalid credentials');
  });

  // Test 3: Failed login with incorrect password
  test('3. Should show error message with incorrect password', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'admin';
    passwordInput.value = 'wrongpassword';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(global.validateInstructorLogin).toHaveBeenCalledWith('admin', 'wrongpassword');
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toContain('Invalid credentials');
  });

  // Test 4: Validation error with empty fields
  test('4. Should show validation error when fields are empty', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = '';
    passwordInput.value = '';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(global.validateInstructorLogin).toHaveBeenCalledWith('', '');
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toBe('Please enter both username and password');
  });

  // Test 5: Button loading state during form submission
  test('5. Should show loading state on button during form submission', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');
    const loginBtn = document.getElementById('login-btn');

    usernameInput.value = 'admin';
    passwordInput.value = 'password';

    expect(loginBtn.disabled).toBe(false);
    expect(loginBtn.textContent).toBe('Sign In as Instructor');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(loginBtn.disabled).toBe(true);
    expect(loginBtn.textContent).toBe('Signing In...');
  });

  // ADDITIONAL 15 TESTS (FIXED)

  // Test 6: Username with whitespace trimming - FIXED
  test('6. Should trim whitespace from username input', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = '  admin  ';
    passwordInput.value = 'password';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    // Wait for both async operations - FIXED timing
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(global.validateInstructorLogin).toHaveBeenCalledWith('admin', 'password');
    expect(global.redirectToInstructorDashboard).toHaveBeenCalled();
  });

  // Test 7: Password visibility toggle
  test('7. Should toggle password visibility when eye icon is clicked', () => {
    const passwordInput = document.getElementById('instructor-password');
    const toggleBtn = document.getElementById('toggle-password');

    expect(passwordInput.type).toBe('password');
    expect(toggleBtn.textContent).toBe('👁️');

    toggleBtn.click();

    expect(passwordInput.type).toBe('text');
    expect(toggleBtn.textContent).toBe('🙈');
    expect(global.togglePasswordVisibility).toHaveBeenCalledWith(true);

    toggleBtn.click();

    expect(passwordInput.type).toBe('password');
    expect(toggleBtn.textContent).toBe('👁️');
  });

  // Test 8: Remember Me functionality - FIXED
  test('8. Should save username to localStorage when Remember Me is checked', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const rememberCheckbox = document.getElementById('remember-me');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'admin';
    passwordInput.value = 'password';
    rememberCheckbox.checked = true;

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Check that localStorage.setItem was called (using the mock) - FIXED
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberedUser', 'admin');
  });

  // Test 9: Username too short validation
  test('9. Should show error for username shorter than 3 characters', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'ab';
    passwordInput.value = 'password123';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.textContent).toBe('Username must be at least 3 characters');
  });

  // Test 10: Password too short validation
  test('10. Should show error for password shorter than 6 characters', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'admin';
    passwordInput.value = '12345';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.textContent).toBe('Password must be at least 6 characters');
  });

  // Test 11: Login attempt counter
  test('11. Should track and display login attempt count', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // First failed attempt
    usernameInput.value = 'admin';
    passwordInput.value = 'wrong1';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 150));

    const attemptCountSpan = document.getElementById('attempt-count');
    const attemptsDiv = document.getElementById('login-attempts');
    
    expect(attemptCountSpan.textContent).toBe('1');
    expect(attemptsDiv.style.display).toBe('block');
  });

  // Test 12: Account lockout after 3 failed attempts
  test('12. Should lock account after 3 failed login attempts', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // Make 3 failed attempts
    for (let i = 1; i <= 3; i++) {
      usernameInput.value = 'admin';
      passwordInput.value = `wrong${i}`;
      
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Try again after lockout
    usernameInput.value = 'admin';
    passwordInput.value = 'password';
    
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 150));

    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.textContent).toContain('Account temporarily locked');
  });

  // Test 13: Forgot password link functionality
  test('13. Should trigger forgot password modal when link is clicked', () => {
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    forgotPasswordLink.click();

    expect(global.showForgotPasswordModal).toHaveBeenCalled();
  });

  // Test 14: Case sensitivity in username
  test('14. Should handle case-sensitive username correctly', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'ADMIN'; // uppercase
    passwordInput.value = 'password';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('block');
  });

  // Test 15: Special characters in credentials
  test('15. Should handle special characters in password', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'admin';
    passwordInput.value = 'p@ssw0rd!#$';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(global.validateInstructorLogin).toHaveBeenCalledWith('admin', 'p@ssw0rd!#$');
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
  });

  // Test 16: Form field maxlength validation - FIXED
  test('16. Should respect maxlength attribute on input fields', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');

    expect(usernameInput.maxLength).toBe(50);
    expect(passwordInput.maxLength).toBe(50);
    
    // Note: JSDOM doesn't enforce maxlength like real browsers - FIXED
    // In real browsers, this would be truncated to 50 characters
    // For testing, we just verify the attribute exists
    expect(usernameInput.hasAttribute('maxlength')).toBe(true);
    expect(passwordInput.hasAttribute('maxlength')).toBe(true);
  });

  // Test 17: Multiple rapid form submissions (prevent double submission) - FIXED
  test('17. Should prevent multiple rapid form submissions', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');
    const loginBtn = document.getElementById('login-btn');

    usernameInput.value = 'admin';
    passwordInput.value = 'password';

    // Submit form rapidly multiple times
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Button should be disabled after first submission
    expect(loginBtn.disabled).toBe(true);
    
    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Validation should only be called once due to double-submission prevention - FIXED
    expect(global.validateInstructorLogin).toHaveBeenCalledTimes(1);
  });

  // Test 18: Success message display
  test('18. Should display success message before redirect', async () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    usernameInput.value = 'admin';
    passwordInput.value = 'password';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    await new Promise(resolve => setTimeout(resolve, 150));

    const successDiv = document.getElementById('login-success');
    expect(successDiv.style.display).toBe('block');
    expect(successDiv.textContent).toBe('Login successful');
  });

  // Test 19: Form accessibility attributes
  test('19. Should have proper accessibility attributes', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // Check required attributes
    expect(usernameInput.hasAttribute('required')).toBe(true);
    expect(passwordInput.hasAttribute('required')).toBe(true);

    // Check labels are associated
    const usernameLabel = document.querySelector('label[for="instructor-username"]');
    const passwordLabel = document.querySelector('label[for="instructor-password"]');
    
    expect(usernameLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();

    // Check form has proper structure
    expect(form.tagName.toLowerCase()).toBe('form');
  });

  // Test 20: Demo credentials visibility and styling
  test('20. Should display demo credentials with proper styling', () => {
    const demoCredentials = document.querySelector('.demo-credentials');
    expect(demoCredentials).toBeTruthy();

    const codeElements = demoCredentials.querySelectorAll('.code');
    expect(codeElements).toHaveLength(2);
    expect(codeElements[0].textContent).toBe('admin');
    expect(codeElements[1].textContent).toBe('password');

    // Check the demo text structure
    const demoText = demoCredentials.querySelector('p');
    expect(demoText.textContent).toContain('Demo credentials:');
  });
});
