import { jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};

global.chrome = mockChrome;

// Mock DOM elements
const mockElements = {
  geminiApiKeyInput: {
    value: '',
    addEventListener: jest.fn(),
    dataset: {}
  },
  cvTextInput: {
    value: '',
    addEventListener: jest.fn(),
    dataset: {}
  },
  statusDiv: {
    textContent: '',
    className: ''
  },
  container: {
    appendChild: jest.fn()
  }
};

// Mock document
global.document = {
  addEventListener: jest.fn(),
  getElementById: jest.fn((id) => {
    switch(id) {
      case 'geminiApiKey': return mockElements.geminiApiKeyInput;
      case 'cvText': return mockElements.cvTextInput;
      case 'status': return mockElements.statusDiv;
      default: return null;
    }
  }),
  querySelector: jest.fn((selector) => {
    if (selector === '.container') return mockElements.container;
    return null;
  }),
  createElement: jest.fn(() => ({
    textContent: '',
    className: '',
    style: {},
    addEventListener: jest.fn()
  }))
};

// Mock console
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

// Mock setTimeout and clearTimeout
global.setTimeout = jest.fn((fn, delay) => {
  if (delay < 100) fn(); // Auto-execute short timeouts for tests
  return Math.random();
});
global.clearTimeout = jest.fn();

// Options page functionality (extracted from options.js)
let loadSavedData, saveData, showStatus, debouncedSave;
let saveTimeout;

beforeEach(() => {
  jest.clearAllMocks();
  mockChrome.runtime.lastError = null;
  
  // Reset element values
  mockElements.geminiApiKeyInput.value = '';
  mockElements.cvTextInput.value = '';
  mockElements.statusDiv.textContent = '';
  mockElements.statusDiv.className = '';
  
  // Initialize the options page functions
  loadSavedData = function() {
    console.log('Loading saved data...');
    chrome.storage.local.get(['gemini_api_key', 'user_cv'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('Error loading saved data:', chrome.runtime.lastError);
        showStatus('Error loading saved data', 'error');
        return;
      }

      console.log('Loaded data:', result);

      if (result && result.gemini_api_key) {
        mockElements.geminiApiKeyInput.value = result.gemini_api_key;
        console.log('API key loaded successfully');
      } else {
        console.log('No API key found in storage');
      }

      if (result && result.user_cv) {
        mockElements.cvTextInput.value = result.user_cv;
        console.log('CV loaded successfully');
      } else {
        console.log('No CV found in storage');
      }
    });
  };

  saveData = function() {
    const apiKey = mockElements.geminiApiKeyInput.value.trim();
    const cvText = mockElements.cvTextInput.value.trim();

    console.log('Saving data - API key length:', apiKey.length, 'CV length:', cvText.length);

    const dataToSave = {};

    if (apiKey) {
      dataToSave.gemini_api_key = apiKey;
      console.log('Adding API key to save data');
    }

    if (cvText) {
      dataToSave.user_cv = cvText;
      console.log('Adding CV to save data');
    }

    console.log('Data to save:', Object.keys(dataToSave));

    chrome.storage.local.set(dataToSave, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        showStatus('Error saving settings', 'error');
        return;
      }
      console.log('Settings saved successfully');
      showStatus('Settings saved successfully', 'success');
    });

    const keysToRemove = [];
    if (!apiKey && mockElements.geminiApiKeyInput.dataset.hadValue) {
      keysToRemove.push('gemini_api_key');
    }
    if (!cvText && mockElements.cvTextInput.dataset.hadValue) {
      keysToRemove.push('user_cv');
    }

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove);
    }

    mockElements.geminiApiKeyInput.dataset.hadValue = !!apiKey;
    mockElements.cvTextInput.dataset.hadValue = !!cvText;
  };

  showStatus = function(message, type) {
    mockElements.statusDiv.textContent = message;
    mockElements.statusDiv.className = `status ${type}`;
    
    setTimeout(() => {
      mockElements.statusDiv.textContent = '';
      mockElements.statusDiv.className = 'status';
    }, 3000);
  };

  debouncedSave = function() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveData, 500);
  };
});

describe('Options Page', () => {
  describe('Data Loading', () => {
    it('should load API key and CV from storage', () => {
      const mockData = {
        gemini_api_key: 'test-api-key-123',
        user_cv: 'Test CV content'
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      loadSavedData();

      expect(mockChrome.storage.local.get).toHaveBeenCalledWith(
        ['gemini_api_key', 'user_cv'],
        expect.any(Function)
      );
      expect(mockElements.geminiApiKeyInput.value).toBe('test-api-key-123');
      expect(mockElements.cvTextInput.value).toBe('Test CV content');
    });

    it('should handle empty storage gracefully', () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      loadSavedData();

      expect(mockElements.geminiApiKeyInput.value).toBe('');
      expect(mockElements.cvTextInput.value).toBe('');
    });

    it('should handle storage errors', () => {
      mockChrome.runtime.lastError = { message: 'Storage error' };
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      loadSavedData();

      expect(mockElements.statusDiv.textContent).toBe('Error loading saved data');
      expect(mockElements.statusDiv.className).toBe('status error');
    });

    it('should handle partial data loading', () => {
      const mockData = {
        gemini_api_key: 'test-key'
        // missing user_cv
      };

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(mockData);
      });

      loadSavedData();

      expect(mockElements.geminiApiKeyInput.value).toBe('test-key');
      expect(mockElements.cvTextInput.value).toBe('');
    });
  });

  describe('Data Saving', () => {
    it('should save API key and CV to storage', () => {
      mockElements.geminiApiKeyInput.value = 'new-api-key';
      mockElements.cvTextInput.value = 'New CV content';

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          gemini_api_key: 'new-api-key',
          user_cv: 'New CV content'
        },
        expect.any(Function)
      );
      expect(mockElements.statusDiv.textContent).toBe('Settings saved successfully');
      expect(mockElements.statusDiv.className).toBe('status success');
    });

    it('should save only API key when CV is empty', () => {
      mockElements.geminiApiKeyInput.value = 'api-key-only';
      mockElements.cvTextInput.value = '';

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          gemini_api_key: 'api-key-only'
        },
        expect.any(Function)
      );
    });

    it('should save only CV when API key is empty', () => {
      mockElements.geminiApiKeyInput.value = '';
      mockElements.cvTextInput.value = 'CV only content';

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          user_cv: 'CV only content'
        },
        expect.any(Function)
      );
    });

    it('should handle saving errors', () => {
      mockElements.geminiApiKeyInput.value = 'test-key';
      mockElements.cvTextInput.value = 'test-cv';
      mockChrome.runtime.lastError = { message: 'Save error' };

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockElements.statusDiv.textContent).toBe('Error saving settings');
      expect(mockElements.statusDiv.className).toBe('status error');
    });

    it('should trim whitespace from inputs', () => {
      mockElements.geminiApiKeyInput.value = '  whitespace-api-key  ';
      mockElements.cvTextInput.value = '  \n  Whitespace CV content  \n  ';

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          gemini_api_key: 'whitespace-api-key',
          user_cv: 'Whitespace CV content'
        },
        expect.any(Function)
      );
    });

    it('should remove keys for empty values when they previously had values', () => {
      // Set up previous values
      mockElements.geminiApiKeyInput.dataset.hadValue = 'true';
      mockElements.cvTextInput.dataset.hadValue = 'true';
      mockElements.geminiApiKeyInput.value = '';
      mockElements.cvTextInput.value = '';

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });
      mockChrome.storage.local.remove.mockImplementation((keys) => {
        // Mock remove
      });

      saveData();

      expect(mockChrome.storage.local.remove).toHaveBeenCalledWith(
        ['gemini_api_key', 'user_cv']
      );
    });
  });

  describe('Status Display', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show success status', () => {
      showStatus('Test success message', 'success');

      expect(mockElements.statusDiv.textContent).toBe('Test success message');
      expect(mockElements.statusDiv.className).toBe('status success');
    });

    it('should show error status', () => {
      showStatus('Test error message', 'error');

      expect(mockElements.statusDiv.textContent).toBe('Test error message');
      expect(mockElements.statusDiv.className).toBe('status error');
    });

    it('should clear status after timeout', () => {
      showStatus('Temporary message', 'success');

      expect(mockElements.statusDiv.textContent).toBe('Temporary message');

      jest.advanceTimersByTime(3000);

      expect(mockElements.statusDiv.textContent).toBe('');
      expect(mockElements.statusDiv.className).toBe('status');
    });

    it('should handle multiple status updates', () => {
      showStatus('First message', 'success');
      expect(mockElements.statusDiv.textContent).toBe('First message');

      showStatus('Second message', 'error');
      expect(mockElements.statusDiv.textContent).toBe('Second message');
      expect(mockElements.statusDiv.className).toBe('status error');
    });
  });

  describe('Debounced Saving', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      global.clearTimeout = jest.fn();
      global.setTimeout = jest.fn((fn, delay) => {
        return { id: Math.random(), fn, delay };
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce multiple rapid saves', () => {
      debouncedSave();
      debouncedSave();
      debouncedSave();

      expect(global.setTimeout).toHaveBeenCalledTimes(3);
      expect(global.clearTimeout).toHaveBeenCalled();
    });

    it('should use 500ms delay for debouncing', () => {
      debouncedSave();

      expect(global.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        500
      );
    });
  });

  describe('Input Validation', () => {
    it('should handle very long API keys', () => {
      const longApiKey = 'a'.repeat(1000);
      mockElements.geminiApiKeyInput.value = longApiKey;
      mockElements.cvTextInput.value = 'Normal CV';

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          gemini_api_key: longApiKey,
          user_cv: 'Normal CV'
        },
        expect.any(Function)
      );
    });

    it('should handle very long CV content', () => {
      const longCV = 'CV content '.repeat(1000);
      mockElements.geminiApiKeyInput.value = 'normal-key';
      mockElements.cvTextInput.value = longCV;

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          gemini_api_key: 'normal-key',
          user_cv: longCV
        },
        expect.any(Function)
      );
    });

    it('should handle special characters in inputs', () => {
      const specialApiKey = 'key-with-特殊字符-🔑-symbols';
      const specialCV = 'CV with émojis 🚀 and spëcial chars ñ';
      
      mockElements.geminiApiKeyInput.value = specialApiKey;
      mockElements.cvTextInput.value = specialCV;

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        {
          gemini_api_key: specialApiKey,
          user_cv: specialCV
        },
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle storage quota exceeded error', () => {
      mockElements.geminiApiKeyInput.value = 'test-key';
      mockElements.cvTextInput.value = 'test-cv';
      mockChrome.runtime.lastError = { message: 'QUOTA_BYTES_PER_ITEM quota exceeded' };

      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveData();

      expect(mockElements.statusDiv.textContent).toBe('Error saving settings');
      expect(mockElements.statusDiv.className).toBe('status error');
    });

    it('should handle extension context invalidated error', () => {
      mockChrome.runtime.lastError = { message: 'Extension context invalidated' };
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      loadSavedData();

      expect(mockElements.statusDiv.textContent).toBe('Error loading saved data');
      expect(mockElements.statusDiv.className).toBe('status error');
    });

    it('should handle undefined callback results gracefully', () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback(undefined);
      });

      expect(() => loadSavedData()).not.toThrow();
    });
  });
});