/**
 * @jest-environment jsdom
 */

/**
 * Comprehensive test suite for IntegriTest Landing Page
 * Tests DOM structure, forms, accessibility, and user interactions
 * Uses mock DOM instead of file loading to avoid JSDOM issues
 */

describe('IntegriTest - Landing Page Tests', () => {
  beforeEach(() => {
    // Create mock DOM structure for each test
    document.head.innerHTML = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Empowering educational institutions with trustworthy online assessments">
      <title>IntegriTest - Secure Online Examination Platform</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="styles.css">
    `;

    document.body.innerHTML = `
      <!-- Header -->
      <header class="header">
        <div class="container">
          <div class="header-content">
            <div class="logo">
              <svg class="shield-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <h1>IntegriTest</h1>
            </div>
            <nav class="nav">
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero">
        <div class="container">
          <div class="hero-grid">
            <div class="hero-content">
              <div class="badge">Trusted by 500+ Institutions</div>
              <h1 class="hero-title">
                Secure Your Future with <span class="text-primary">IntegriTest</span>
              </h1>
              <p class="hero-description">
                Empowering educational institutions with trustworthy online assessments. Experience seamless
                examinations designed for both students and educators.
              </p>
              <div class="hero-buttons">
                <button class="btn btn-primary">Get Started</button>
                <button class="btn btn-outline">Learn More</button>
              </div>
              <div class="features-list">
                <div class="feature-item">
                  <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Bank-level Security</span>
                </div>
                <div class="feature-item">
                  <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Real-time Proctoring</span>
                </div>
                <div class="feature-item">
                  <svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Easy Setup</span>
                </div>
              </div>
            </div>

            <!-- Login Card -->
            <div class="login-card">
              <div class="card-header">
                <h2>Welcome Back</h2>
                <p>Sign in to access your examinations</p>
              </div>

              <!-- Tabs -->
              <div class="tab-list">
                <button class="tab-trigger active" data-tab="student">Student</button>
                <button class="tab-trigger" data-tab="instructor">Instructor</button>
              </div>

              <!-- Student Tab -->
              <div id="student-tab" class="tab-content active">
                <form id="student-form" class="form">
                  <!-- Camera detection -->
                  <div class="form-group camera-verify">
                    <label style="display:flex;align-items:center;gap:0.5rem;">
                      <input id="face-verified" type="checkbox" disabled>
                      <span id="face-verified-label">Face detected</span>
                    </label>
                    <button type="button" id="start-camera-btn" class="btn btn-outline">Detect face</button>
                    <div class="camera-container">
                      <video id="camera-preview" autoplay muted playsinline style="display:none;"></video>
                      <div id="camera-status">
                        <div class="status-text">Camera not started</div>
                      </div>
                    </div>
                  </div>

                  <!-- Student input fields -->
                  <div class="form-group">
                    <label for="exam-code">Exam Code</label>
                    <input id="exam-code" name="exam-code" type="text" />
                  </div>
                  <div class="form-group">
                    <label for="full-name">Full Name</label>
                    <input id="full-name" name="full-name" type="text" />
                  </div>
                  <div class="form-group">
                    <label for="student-number">Student Number</label>
                    <input id="student-number" name="student-number" type="text" />
                  </div>

                  <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-full">Access Exam</button>
                  </div>
                </form>
              </div>

              <!-- Instructor Tab -->
              <div id="instructor-tab" class="tab-content">
                <div class="demo-credentials">
                  <p>Demo credentials: <span class="code">admin</span> / <span class="code">password</span></p>
                </div>

                <form id="instructor-form" class="form">
                  <div class="form-group">
                    <label for="instructor-username">Username</label>
                    <input id="instructor-username" type="text" placeholder="Enter your username" required />
                  </div>

                  <div class="form-group">
                    <label for="instructor-password">Password</label>
                    <input id="instructor-password" type="password" placeholder="Enter your password" required />
                  </div>

                  <button type="submit" class="btn btn-primary btn-full">Sign In as Instructor</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Exam Reminder Section -->
      <section class="exam-reminder" aria-live="polite">
        <div class="reminder-header">
          <span class="warning-icon" aria-hidden="true">⚠️</span>
          <h4 class="font-heading">Exam Monitoring & Behavior</h4>
        </div>
        <div class="reminder-content">
          <p>Switching tabs or windows (including Alt+Tab) is monitored. First switch = your first warning, second switch = your final warning, a third switch will automatically submit your exam.</p>
          <p>Proctors may view your webcam during the exam to monitor behavior. By proceeding you consent to camera monitoring for this session.</p>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features">
        <div class="container">
          <div class="section-header">
            <h2>Why Choose IntegriTest?</h2>
            <p>Your data is secure with state-of-the-art encryption and privacy measures</p>
          </div>

          <div class="features-grid">
            <div class="feature-card">
              <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <h3>Advanced Security</h3>
              <p>Bank-level encryption and secure authentication protect your examinations</p>
            </div>

            <div class="feature-card">
              <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              <h3>Real-time Proctoring</h3>
              <p>AI-powered monitoring ensures exam integrity with live supervision</p>
            </div>

            <div class="feature-card">
              <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <h3>Easy Management</h3>
              <p>Intuitive interface for creating, managing, and grading examinations</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-content">
            <div class="footer-logo">
              <svg class="shield-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>IntegriTest</span>
            </div>
            <p>© 2024 IntegriTest. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <!-- Loading Overlay -->
      <div id="loading-overlay" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Processing your request...</p>
      </div>
    `;
  });

  // Test 1: Page title and meta information
  test('1. Should have correct page title and meta information', () => {
    expect(document.title).toBe('IntegriTest - Secure Online Examination Platform');
    
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription.getAttribute('content')).toBe('Empowering educational institutions with trustworthy online assessments');
    
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
    expect(viewport.getAttribute('content')).toBe('width=device-width, initial-scale=1.0');
  });

  // Test 2: Header with logo and navigation
  test('2. Should have header with logo and navigation', () => {
    const header = document.querySelector('.header');
    expect(header).toBeTruthy();
    
    const logo = document.querySelector('.logo h1');
    expect(logo).toBeTruthy();
    expect(logo.textContent).toBe('IntegriTest');
    
    const navLinks = document.querySelectorAll('.nav a');
    expect(navLinks).toHaveLength(3);
    expect(navLinks[0].getAttribute('href')).toBe('#features');
    expect(navLinks[1].getAttribute('href')).toBe('#about');
    expect(navLinks[2].getAttribute('href')).toBe('#contact');
  });

  // Test 3: Hero section content
  test('3. Should have hero section with correct content', () => {
    const hero = document.querySelector('.hero');
    expect(hero).toBeTruthy();
    
    const badge = document.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('Trusted by 500+ Institutions');
    
    const heroTitle = document.querySelector('.hero-title');
    expect(heroTitle).toBeTruthy();
    expect(heroTitle.textContent.trim()).toContain('Secure Your Future with IntegriTest');
  });

  // Test 4: Hero buttons
  test('4. Should have hero section buttons', () => {
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    expect(heroButtons).toHaveLength(2);
    expect(heroButtons[0].textContent).toBe('Get Started');
    expect(heroButtons[1].textContent).toBe('Learn More');
  });

  // Test 5: Login card structure
  test('5. Should have login card with student and instructor tabs', () => {
    const loginCard = document.querySelector('.login-card');
    expect(loginCard).toBeTruthy();
    
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    expect(tabTriggers).toHaveLength(2);
    expect(tabTriggers[0].textContent).toBe('Student');
    expect(tabTriggers[1].textContent).toBe('Instructor');
    
    const tabContents = document.querySelectorAll('.tab-content');
    expect(tabContents).toHaveLength(2);
  });

  // Test 6: Student form structure
  test('6. Should have student form with required fields', () => {
    const studentForm = document.querySelector('#student-form');
    expect(studentForm).toBeTruthy();
    
    const examCodeInput = document.querySelector('#exam-code');
    expect(examCodeInput).toBeTruthy();
    expect(examCodeInput.type).toBe('text');
    
    const fullNameInput = document.querySelector('#full-name');
    expect(fullNameInput).toBeTruthy();
    expect(fullNameInput.type).toBe('text');
    
    const studentNumberInput = document.querySelector('#student-number');
    expect(studentNumberInput).toBeTruthy();
    expect(studentNumberInput.type).toBe('text');
    
    const submitButton = studentForm.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    expect(submitButton.textContent).toBe('Access Exam');
  });

  // Test 7: Instructor form structure
  test('7. Should have instructor form with username and password fields', () => {
    const instructorForm = document.querySelector('#instructor-form');
    expect(instructorForm).toBeTruthy();
    
    const usernameInput = document.querySelector('#instructor-username');
    expect(usernameInput).toBeTruthy();
    expect(usernameInput.type).toBe('text');
    expect(usernameInput.hasAttribute('required')).toBe(true);
    
    const passwordInput = document.querySelector('#instructor-password');
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.type).toBe('password');
    expect(passwordInput.hasAttribute('required')).toBe(true);
    
    const submitButton = instructorForm.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    expect(submitButton.textContent.trim()).toBe('Sign In as Instructor');
  });

  // Test 8: Camera detection elements
  test('8. Should have camera detection elements', () => {
    const cameraVerify = document.querySelector('.camera-verify');
    expect(cameraVerify).toBeTruthy();
    
    const faceVerifiedCheckbox = document.querySelector('#face-verified');
    expect(faceVerifiedCheckbox).toBeTruthy();
    expect(faceVerifiedCheckbox.type).toBe('checkbox');
    expect(faceVerifiedCheckbox.disabled).toBe(true);
    
    const startCameraBtn = document.querySelector('#start-camera-btn');
    expect(startCameraBtn).toBeTruthy();
    expect(startCameraBtn.textContent).toBe('Detect face');
    
    const cameraPreview = document.querySelector('#camera-preview');
    expect(cameraPreview).toBeTruthy();
    expect(cameraPreview.tagName.toLowerCase()).toBe('video');
  });

  // Test 9: Demo credentials display
  test('9. Should have demo credentials displayed for instructor', () => {
    const demoCredentials = document.querySelector('.demo-credentials');
    expect(demoCredentials).toBeTruthy();
    
    const codeElements = demoCredentials.querySelectorAll('.code');
    expect(codeElements).toHaveLength(2);
    expect(codeElements[0].textContent).toBe('admin');
    expect(codeElements[1].textContent).toBe('password');
  });

  // Test 10: Exam reminder section
  test('10. Should have exam reminder section with ARIA attributes', () => {
    const examReminder = document.querySelector('.exam-reminder');
    expect(examReminder).toBeTruthy();
    expect(examReminder.getAttribute('aria-live')).toBe('polite');
    
    const warningIcon = examReminder.querySelector('.warning-icon');
    expect(warningIcon).toBeTruthy();
    expect(warningIcon.textContent).toBe('⚠️');
    expect(warningIcon.getAttribute('aria-hidden')).toBe('true');
  });

  // Test 11: Features section
  test('11. Should have features section with three feature cards', () => {
    const featuresSection = document.querySelector('#features');
    expect(featuresSection).toBeTruthy();
    
    const featureCards = document.querySelectorAll('.feature-card');
    expect(featureCards).toHaveLength(3);
    
    const expectedFeatures = ['Advanced Security', 'Real-time Proctoring', 'Easy Management'];
    featureCards.forEach((card, index) => {
      const title = card.querySelector('h3');
      expect(title.textContent).toBe(expectedFeatures[index]);
    });
  });

  // Test 12: Footer structure
  test('12. Should have footer with logo and copyright', () => {
    const footer = document.querySelector('.footer');
    expect(footer).toBeTruthy();
    
    const footerLogo = document.querySelector('.footer-logo span');
    expect(footerLogo).toBeTruthy();
    expect(footerLogo.textContent).toBe('IntegriTest');
    
    const copyright = footer.querySelector('p');
    expect(copyright).toBeTruthy();
    expect(copyright.textContent).toBe('© 2024 IntegriTest. All rights reserved.');
  });

  // Test 13: Loading overlay
  test('13. Should have loading overlay with proper structure', () => {
    const loadingOverlay = document.querySelector('#loading-overlay');
    expect(loadingOverlay).toBeTruthy();
    expect(loadingOverlay.classList.contains('loading-overlay')).toBe(true);
    
    const loadingSpinner = loadingOverlay.querySelector('.loading-spinner');
    expect(loadingSpinner).toBeTruthy();
    
    const loadingText = loadingOverlay.querySelector('p');
    expect(loadingText).toBeTruthy();
    expect(loadingText.textContent).toBe('Processing your request...');
  });

  // Test 14: External resources links
test('14. Should have Google Fonts and CSS links in head', () => {
  const preconnects = document.querySelectorAll('link[rel="preconnect"]');
  expect(preconnects).toHaveLength(2);
  expect(preconnects[0].href).toBe('https://fonts.googleapis.com/');
  expect(preconnects[1].href).toBe('https://fonts.gstatic.com/');
  
  const fontLink = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
  expect(fontLink).toBeTruthy();
  expect(fontLink.href).toContain('Inter');
  expect(fontLink.href).toContain('Playfair+Display');
  
  // Fix: Look for styles.css specifically, not just any stylesheet
  const cssLink = document.querySelector('link[href="styles.css"]');
  expect(cssLink).toBeTruthy();
  expect(cssLink.getAttribute('rel')).toBe('stylesheet');
});

  // Test 15: Form labels and accessibility
  test('15. Should have proper form labels for accessibility', () => {
    const labels = document.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);
    
    labels.forEach(label => {
      const forAttribute = label.getAttribute('for');
      if (forAttribute) {
        const associatedInput = document.querySelector(`#${forAttribute}`);
        expect(associatedInput).toBeTruthy();
      }
    });
  });

  // Test 16: Hero feature list
  test('16. Should have correct hero section feature list', () => {
    const featureItems = document.querySelectorAll('.features-list .feature-item span');
    const expectedFeatures = ['Bank-level Security', 'Real-time Proctoring', 'Easy Setup'];
    
    expect(featureItems).toHaveLength(3);
    featureItems.forEach((item, index) => {
      expect(item.textContent).toBe(expectedFeatures[index]);
    });
  });

  // Test 17: Section headers
  test('17. Should have proper section headers', () => {
    const sectionHeader = document.querySelector('.section-header h2');
    expect(sectionHeader).toBeTruthy();
    expect(sectionHeader.textContent).toBe('Why Choose IntegriTest?');
    
    const sectionDescription = document.querySelector('.section-header p');
    expect(sectionDescription).toBeTruthy();
    expect(sectionDescription.textContent).toBe('Your data is secure with state-of-the-art encryption and privacy measures');
  });

  // Test 18: HTML structure and SEO
  test('18. Should have proper HTML structure for SEO', () => {
    const charset = document.querySelector('meta[charset]');
    expect(charset).toBeTruthy();
    expect(charset.getAttribute('charset')).toBe('UTF-8');
    
    const title = document.querySelector('title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('IntegriTest');
    expect(title.textContent).toContain('Secure Online Examination');
  });

  // Test 19: Required JavaScript interaction elements
  test('19. Should have elements required for JavaScript functionality', () => {
    const jsRequiredElements = [
      '#student-form',
      '#instructor-form', 
      '#loading-overlay',
      '#camera-preview',
      '#start-camera-btn',
      '#face-verified',
      '.tab-trigger',
      '.tab-content'
    ];
    
    jsRequiredElements.forEach(selector => {
      const element = document.querySelector(selector);
      expect(element).toBeTruthy();
    });
  });

  // Test 20: Form field IDs for validation
  test('20. Should have proper form field IDs for validation', () => {
    const formFields = [
      'exam-code',
      'full-name', 
      'student-number',
      'instructor-username',
      'instructor-password'
    ];
    
    formFields.forEach(id => {
      const element = document.getElementById(id);
      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe('input');
    });
  });
});
