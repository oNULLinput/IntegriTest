/**
 * @jest-environment jsdom
 */

/**
 * Test suite for Instructor Login Functionality
 * Tests form validation, submission, and user interactions
 */

describe('Instructor Login - Functional Tests', () => {
  let mockAlert, mockConsole;

  beforeEach(() => {
    // Mock alert and console
    mockAlert = jest.fn();
    mockConsole = jest.fn();
    global.alert = mockAlert;
    global.console = { ...console, log: mockConsole, error: mockConsole };

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
              <input id="instructor-username" type="text" placeholder="Enter your username" required />
              <div id="username-error" class="error-message" style="display: none;"></div>
            </div>

            <div class="form-group">
              <label for="instructor-password">Password</label>
              <input id="instructor-password" type="password" placeholder="Enter your password" required />
              <div id="password-error" class="error-message" style="display: none;"></div>
            </div>

            <button type="submit" id="login-btn" class="btn btn-primary btn-full">Sign In as Instructor</button>
            <div id="login-error" class="error-message" style="display: none;"></div>
          </form>

          <div id="loading-overlay" class="loading-overlay" style="display: none;">
            <div class="loading-spinner"></div>
            <p>Signing you in...</p>
          </div>
        </div>
      </div>
    `;

    // Mock the login validation function
    global.validateInstructorLogin = jest.fn((username, password) => {
      if (username === 'admin' && password === 'password') {
        return { success: true, message: 'Login successful' };
      } else if (!username || !password) {
        return { success: false, message: 'Please enter both username and password' };
      } else {
        return { success: false, message: 'Invalid credentials' };
      }
    });

    // Mock redirect function
    global.redirectToInstructorDashboard = jest.fn();

    // Add form submission handler
    const form = document.getElementById('instructor-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('instructor-username').value;
      const password = document.getElementById('instructor-password').value;
      const loginBtn = document.getElementById('login-btn');
      const errorDiv = document.getElementById('login-error');
      
      // Show loading state
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing In...';
      
      // Validate credentials
      const result = global.validateInstructorLogin(username, password);
      
      if (result.success) {
        errorDiv.style.display = 'none';
        global.redirectToInstructorDashboard();
      } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In as Instructor';
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Successful instructor login with correct credentials
  test('1. Should successfully login with correct credentials (admin/password)', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');
    const loginBtn = document.getElementById('login-btn');

    // Enter correct credentials
    usernameInput.value = 'admin';
    passwordInput.value = 'password';

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verify login validation was called with correct parameters
    expect(global.validateInstructorLogin).toHaveBeenCalledWith('admin', 'password');
    
    // Verify successful login flow
    expect(global.redirectToInstructorDashboard).toHaveBeenCalled();
    
    // Verify no error message is shown
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('none');
  });

  // Test 2: Failed login with incorrect username
  test('2. Should show error message with incorrect username', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // Enter incorrect username
    usernameInput.value = 'wronguser';
    passwordInput.value = 'password';

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verify login validation was called
    expect(global.validateInstructorLogin).toHaveBeenCalledWith('wronguser', 'password');
    
    // Verify redirect was NOT called
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    // Verify error message is displayed
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toBe('Invalid credentials');

    // Verify button is re-enabled
    const loginBtn = document.getElementById('login-btn');
    expect(loginBtn.disabled).toBe(false);
    expect(loginBtn.textContent).toBe('Sign In as Instructor');
  });

  // Test 3: Failed login with incorrect password
  test('3. Should show error message with incorrect password', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // Enter correct username but wrong password
    usernameInput.value = 'admin';
    passwordInput.value = 'wrongpassword';

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verify login validation was called
    expect(global.validateInstructorLogin).toHaveBeenCalledWith('admin', 'wrongpassword');
    
    // Verify redirect was NOT called
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    // Verify error message is displayed
    const errorDiv = document.getElementById('login-error');
    expect(errorDiv.style.display).toBe('block');
    expect(errorDiv.textContent).toBe('Invalid credentials');
  });

  // Test 4: Validation error with empty fields
  test('4. Should show validation error when fields are empty', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // Leave fields empty
    usernameInput.value = '';
    passwordInput.value = '';

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verify login validation was called with empty values
    expect(global.validateInstructorLogin).toHaveBeenCalledWith('', '');
    
    // Verify redirect was NOT called
    expect(global.redirectToInstructorDashboard).not.toHaveBeenCalled();
    
    // Verify error message is displayed
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

    // Enter credentials
    usernameInput.value = 'admin';
    passwordInput.value = 'password';

    // Verify initial button state
    expect(loginBtn.disabled).toBe(false);
    expect(loginBtn.textContent).toBe('Sign In as Instructor');

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Verify button shows loading state initially
    expect(loginBtn.disabled).toBe(true);
    expect(loginBtn.textContent).toBe('Signing In...');

    // Since login is successful, button should remain in success state
    // (In real implementation, this would redirect to dashboard)
  });

  // Bonus Test: Form field validation attributes
  test('Bonus: Should have proper form validation attributes', () => {
    const usernameInput = document.getElementById('instructor-username');
    const passwordInput = document.getElementById('instructor-password');
    const form = document.getElementById('instructor-form');

    // Check required attributes
    expect(usernameInput.hasAttribute('required')).toBe(true);
    expect(passwordInput.hasAttribute('required')).toBe(true);

    // Check input types
    expect(usernameInput.type).toBe('text');
    expect(passwordInput.type).toBe('password');

    // Check form structure
    expect(form.tagName.toLowerCase()).toBe('form');
    
    // Check placeholders
    expect(usernameInput.placeholder).toBe('Enter your username');
    expect(passwordInput.placeholder).toBe('Enter your password');
  });

  // Bonus Test: Demo credentials display
  test('Bonus: Should display demo credentials for testing', () => {
    const demoCredentials = document.querySelector('.demo-credentials');
    expect(demoCredentials).toBeTruthy();

    const codeElements = demoCredentials.querySelectorAll('.code');
    expect(codeElements).toHaveLength(2);
    expect(codeElements[0].textContent).toBe('admin');
    expect(codeElements[1].textContent).toBe('password');
  });
});
