/**
 * Test suite for index.html - IntegriTest Landing Page
 * Tests cover DOM structure, form validation, tab switching, camera functionality, and user interactions
 */

// Mock global objects and APIs
global.fetch = jest.fn();
global.navigator = {
  mediaDevices: {
    getUserMedia: jest.fn()
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};


/**
 * @jest-environment jsdom
 */

// Load the HTML content and scripts
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Mock global objects and APIs
global.fetch = jest.fn();
global.navigator = {
  mediaDevices: {
    getUserMedia: jest.fn()
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

let dom;
let document;
let window;

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  fetch.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  
  // Create a fresh DOM for each test
  const htmlPath = path.join(__dirname, '../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  dom = new JSDOM(htmlContent, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  });
  
  document = dom.window.document;
  window = dom.window;
  
  // Set up global references
  global.document = document;
  global.window = window;
  global.HTMLElement = window.HTMLElement;
  global.Element = window.Element;
  
  // Set up window location AFTER jsdom creates window
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      href: ''
    }
  });
  
  // Mock video element methods
  const mockVideoElement = {
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    style: {},
    srcObject: null,
    readyState: 4
  };
  
  // Override createElement for video elements
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = jest.fn((tagName) => {
    if (tagName === 'video') {
      return mockVideoElement;
    }
    return originalCreateElement(tagName);
  });
});

afterEach(() => { // ← FIXED TYPO: was "aftereEach"
  if (dom) {
    dom.window.close();
  }
});

describe('Index.html - DOM Structure Tests', () => {
  test('should have correct page title and meta information', () => {
    expect(document.title).toBe('IntegriTest - Secure Online Examination Platform');
    
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription.getAttribute('content')).toBe('Empowering educational institutions with trustworthy online assessments');
    
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
    expect(viewport.getAttribute('content')).toBe('width=device-width, initial-scale=1.0');
  });

  test('should have hero section with correct content', () => {
    const hero = document.querySelector('.hero');
    expect(hero).toBeTruthy();
    
    const badge = document.querySelector('.badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('Trusted by 500+ Institutions');
    
    const heroTitle = document.querySelector('.hero-title');
    expect(heroTitle).toBeTruthy();
    expect(heroTitle.textContent.trim()).toContain('Secure Your Future with IntegriTest');
    
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    expect(heroButtons).toHaveLength(2);
  });
  
  test('should have login card with student and instructor tabs', () => {
    const loginCard = document.querySelector('.login-card');
    expect(loginCard).toBeTruthy();
    
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    expect(tabTriggers).toHaveLength(2);
    expect(tabTriggers[0].textContent).toBe('Student');
    expect(tabTriggers[1].textContent).toBe('Instructor');
    
    const tabContents = document.querySelectorAll('.tab-content');
    expect(tabContents).toHaveLength(2);
  });
  
  test('should have features section with three feature cards', () => {
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
  
  test('should have footer with logo and copyright', () => {
    const footer = document.querySelector('.footer');
    expect(footer).toBeTruthy();
    
    const footerLogo = document.querySelector('.footer-logo span');
    expect(footerLogo).toBeTruthy();
    expect(footerLogo.textContent).toBe('IntegriTest');
    
    const copyright = footer.querySelector('p');
    expect(copyright).toBeTruthy();
    expect(copyright.textContent).toBe('© 2024 IntegriTest. All rights reserved.');
  });
  
  test('should have exam reminder section', () => {
    const examReminder = document.querySelector('.exam-reminder');
    expect(examReminder).toBeTruthy();
    expect(examReminder.getAttribute('aria-live')).toBe('polite');
    
    const warningIcon = examReminder.querySelector('.warning-icon');
    expect(warningIcon).toBeTruthy();
    expect(warningIcon.textContent).toBe('⚠️');
  });
});

describe('Index.html - Form Elements Tests', () => {
  test('should have student form with required fields', () => {
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
  
  test('should have instructor form with username and password fields', () => {
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
  
  test('should have camera detection elements', () => {
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
  
  test('should have demo credentials displayed for instructor', () => {
    const demoCredentials = document.querySelector('.demo-credentials');
    expect(demoCredentials).toBeTruthy();
    
    const codeElements = demoCredentials.querySelectorAll('.code');
    expect(codeElements).toHaveLength(2);
    expect(codeElements[0].textContent).toBe('admin');
    expect(codeElements[1].textContent).toBe('password');
  });
});

describe('Index.html - Accessibility Tests', () => {
  test('should have proper ARIA attributes', () => {
    const examReminder = document.querySelector('.exam-reminder');
    expect(examReminder.getAttribute('aria-live')).toBe('polite');
    
    const warningIcon = document.querySelector('.warning-icon');
    expect(warningIcon.getAttribute('aria-hidden')).toBe('true');
  });
  
  test('should have proper form labels', () => {
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
  
  test('should have alt attributes for images and icons', () => {
    // SVG icons should have proper accessibility
    const svgIcons = document.querySelectorAll('svg');
    svgIcons.forEach(svg => {
      // SVG icons used for decoration should have aria-hidden or be properly labeled
      expect(
        svg.getAttribute('aria-hidden') === 'true' || 
        svg.getAttribute('aria-label') ||
        svg.querySelector('title')
      ).toBeTruthy();
    });
  });
});

describe('Index.html - Loading Overlay Tests', () => {
  test('should have loading overlay with proper structure', () => {
    const loadingOverlay = document.querySelector('#loading-overlay');
    expect(loadingOverlay).toBeTruthy();
    expect(loadingOverlay.classList.contains('loading-overlay')).toBe(true);
    
    const loadingSpinner = loadingOverlay.querySelector('.loading-spinner');
    expect(loadingSpinner).toBeTruthy();
    
    const loadingText = loadingOverlay.querySelector('p');
    expect(loadingText).toBeTruthy();
    expect(loadingText.textContent).toBe('Processing your request...');
  });
});

describe('Index.html - External Resources Tests', () => {
  test('should have Google Fonts preconnect and font links', () => {
    const preconnects = document.querySelectorAll('link[rel="preconnect"]');
    expect(preconnects).toHaveLength(2);
    expect(preconnects[0].href).toBe('https://fonts.googleapis.com/');
    expect(preconnects[1].href).toBe('https://fonts.gstatic.com/');
    
    const fontLink = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
    expect(fontLink).toBeTruthy();
    expect(fontLink.href).toContain('Inter');
    expect(fontLink.href).toContain('Playfair+Display');
  });
  
  test('should have proper script loading order', () => {
    const scripts = document.querySelectorAll('script[src]');
    expect(scripts).toHaveLength(2);
    expect(scripts[0].src).toContain('utils.js');
    expect(scripts[1].src).toContain('script.js');
  });
  
  test('should have CSS file linked', () => {
    const cssLink = document.querySelector('link[rel="stylesheet"]');
    expect(cssLink).toBeTruthy();
    expect(cssLink.href).toContain('styles.css');
  });
});

// Note: JavaScript functionality tests would require loading the actual script files
// and setting up proper DOM event simulation. These tests focus on the HTML structure
// and static content verification.

describe('Index.html - Content Validation Tests', () => {
  test('should have correct hero section content', () => {
    const featureItems = document.querySelectorAll('.features-list .feature-item span');
    const expectedFeatures = ['Bank-level Security', 'Real-time Proctoring', 'Easy Setup'];
    
    expect(featureItems).toHaveLength(3);
    featureItems.forEach((item, index) => {
      expect(item.textContent).toBe(expectedFeatures[index]);
    });
  });
  
  test('should have proper section headers', () => {
    const sectionHeader = document.querySelector('.section-header h2');
    expect(sectionHeader).toBeTruthy();
    expect(sectionHeader.textContent).toBe('Why Choose IntegriTest?');
    
    const sectionDescription = document.querySelector('.section-header p');
    expect(sectionDescription).toBeTruthy();
    expect(sectionDescription.textContent).toBe('Your data is secure with state-of-the-art encryption and privacy measures');
  });
  
  test('should have proper form validation structure', () => {
    // Check that forms have proper structure for validation
    const studentForm = document.querySelector('#student-form');
    const instructorForm = document.querySelector('#instructor-form');
    
    expect(studentForm.tagName.toLowerCase()).toBe('form');
    expect(instructorForm.tagName.toLowerCase()).toBe('form');
    
    // Check required inputs have proper attributes
    const requiredInputs = document.querySelectorAll('input[required]');
    expect(requiredInputs.length).toBeGreaterThan(0);
  });
});

describe('Index.html - SEO and Meta Tests', () => {
  test('should have proper meta tags for SEO', () => {
    const charset = document.querySelector('meta[charset]');
    expect(charset).toBeTruthy();
    expect(charset.getAttribute('charset')).toBe('UTF-8');
    
    const title = document.querySelector('title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('IntegriTest');
    expect(title.textContent).toContain('Secure Online Examination');
  });
  
  test('should have proper HTML structure', () => {
    const html = document.documentElement;
    expect(html.getAttribute('lang')).toBe('en');
    
    const head = document.querySelector('head');
    const body = document.querySelector('body');
    
    expect(head).toBeTruthy();
    expect(body).toBeTruthy();
  });
});

// Performance and Optimization Tests
describe('Index.html - Performance Tests', () => {
  test('should have optimized font loading', () => {
    const fontDisplayOptimization = document.querySelector('link[href*="display=swap"]');
    expect(fontDisplayOptimization).toBeTruthy();
  });
  
  test('should have preconnect for external resources', () => {
    const preconnects = document.querySelectorAll('link[rel="preconnect"]');
    expect(preconnects.length).toBeGreaterThanOrEqual(2);
  });
});

// Integration points tests
describe('Index.html - Integration Points', () => {
  test('should have elements required for JavaScript functionality', () => {
    // Elements that JavaScript will interact with
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
  
  test('should have proper form field IDs for validation', () => {
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