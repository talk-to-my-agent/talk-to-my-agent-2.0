import { jest } from '@jest/globals';

// Common Chrome API mocks
export const createMockChrome = () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    lastError: null
  }
});

// Mock DOM elements factory
export const createMockElement = (overrides = {}) => ({
  value: '',
  textContent: '',
  className: '',
  contentEditable: false,
  disabled: false,
  style: { display: 'none' },
  dataset: {},
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    contains: jest.fn()
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  focus: jest.fn(),
  blur: jest.fn(),
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  ...overrides
});

// Mock document factory
export const createMockDocument = (elements = {}) => ({
  addEventListener: jest.fn(),
  getElementById: jest.fn((id) => elements[id] || createMockElement()),
  querySelector: jest.fn((selector) => elements[selector] || createMockElement()),
  querySelectorAll: jest.fn((selector) => {
    if (Array.isArray(elements[selector])) {
      return elements[selector];
    }
    return [elements[selector] || createMockElement()];
  }),
  createElement: jest.fn(() => createMockElement()),
  body: createMockElement(),
  head: createMockElement()
});

// Mock window/global objects
export const createMockGlobals = () => ({
  console: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  },
  navigator: {
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn()
    },
    userAgent: 'Mozilla/5.0 (Test Browser)'
  },
  fetch: jest.fn(),
  AbortController: jest.fn(() => ({
    abort: jest.fn(),
    signal: {}
  })),
  setTimeout: jest.fn((fn, delay) => {
    if (delay < 100) fn(); // Auto-execute short timeouts
    return Math.random();
  }),
  clearTimeout: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn()
});

// Storage helpers
export const createStorageHelper = (mockChrome) => ({
  mockGet: (data) => {
    mockChrome.storage.local.get.mockImplementation((keys, callback) => {
      callback(data);
    });
  },
  mockSet: (success = true, error = null) => {
    mockChrome.storage.local.set.mockImplementation((data, callback) => {
      if (!success) {
        mockChrome.runtime.lastError = error || { message: 'Storage error' };
      } else {
        mockChrome.runtime.lastError = null;
      }
      callback();
    });
  },
  mockClear: (success = true) => {
    mockChrome.storage.local.clear.mockImplementation((callback) => {
      if (!success) {
        mockChrome.runtime.lastError = { message: 'Clear error' };
      }
      callback();
    });
  }
});

// API response helpers
export const createApiResponse = (success = true, data = {}, error = null) => {
  if (success) {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: data.text || 'Mock API response'
            }]
          }
        }]
      })
    };
  } else {
    return {
      ok: false,
      status: error?.status || 500,
      json: () => Promise.resolve(error?.body || {})
    };
  }
};

// Common test data
export const testData = {
  validApiKey: 'AIzaSyTest123ValidKey',
  invalidApiKey: 'invalid-key',
  placeholderApiKey: '[GEMINI_API_KEY]',
  sampleCV: `John Doe
Software Engineer
Email: john@example.com
Phone: (555) 123-4567

EXPERIENCE:
Senior Developer at Tech Corp (2020-2023)
- Built scalable web applications
- Led team of 5 developers
- Reduced system latency by 40%

SKILLS:
JavaScript, React, Node.js, Python, AWS`,
  sampleJobDescription: `Senior Frontend Developer
TechCorp Solutions

We are seeking a talented Senior Frontend Developer to join our dynamic team. 
You will be responsible for developing user-facing applications using modern 
JavaScript frameworks and ensuring excellent user experiences.

Requirements:
- 5+ years of experience in frontend development
- Expert knowledge of React, TypeScript, and modern CSS
- Experience with state management (Redux, Context API)
- Strong understanding of responsive design principles`,
  expectedCoverLetter: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Frontend Developer position at TechCorp Solutions...',
  expectedOptimizedCV: 'JOHN DOE\nSENIOR FRONTEND DEVELOPER\n\nOptimized for frontend development role with emphasis on React and TypeScript experience...'
};

// Test assertion helpers
export const expectStorageCall = (mockChrome, method, expectedArgs) => {
  expect(mockChrome.storage.local[method]).toHaveBeenCalledWith(
    expectedArgs,
    expect.any(Function)
  );
};

export const expectElementState = (element, expectedState) => {
  Object.entries(expectedState).forEach(([key, value]) => {
    expect(element[key]).toBe(value);
  });
};

export const expectClassMethod = (element, method, ...args) => {
  expect(element.classList[method]).toHaveBeenCalledWith(...args);
};

// Setup and teardown helpers
export const setupTestEnvironment = () => {
  const mockChrome = createMockChrome();
  const mockGlobals = createMockGlobals();
  
  global.chrome = mockChrome;
  Object.assign(global, mockGlobals);
  
  return { mockChrome, mockGlobals };
};

export const teardownTestEnvironment = () => {
  jest.clearAllMocks();
  delete global.chrome;
  delete global.fetch;
  delete global.AbortController;
  delete global.setTimeout;
  delete global.clearTimeout;
};

// Async test helpers
export const waitFor = (condition, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Condition not met within timeout'));
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
};

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

// Error simulation helpers
export const simulateStorageError = (mockChrome, errorMessage = 'Storage quota exceeded') => {
  mockChrome.runtime.lastError = { message: errorMessage };
};

export const simulateNetworkError = (global, errorType = 'NetworkError') => {
  global.fetch.mockRejectedValue(new Error(errorType));
};

export const simulateApiError = (global, status = 500, message = 'API Error') => {
  global.fetch.mockResolvedValue(createApiResponse(false, {}, { 
    status, 
    body: { error: { message } } 
  }));
};