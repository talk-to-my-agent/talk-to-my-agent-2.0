import { jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
    lastError: null
  }
};

global.chrome = mockChrome;

// Mock DOM elements
const mockElements = {
  settingsBtn: { addEventListener: jest.fn() },
  tabBtns: [
    { addEventListener: jest.fn(), dataset: { tab: 'cover-letter' }, classList: { toggle: jest.fn() } },
    { addEventListener: jest.fn(), dataset: { tab: 'cv-optimizer' }, classList: { toggle: jest.fn() } }
  ],
  tabPanels: [
    { id: 'cover-letter-tab', classList: { toggle: jest.fn() } },
    { id: 'cv-optimizer-tab', classList: { toggle: jest.fn() } }
  ],
  alert: { textContent: '', className: '' },
  loader: { classList: { add: jest.fn(), remove: jest.fn() } },
  loaderText: { textContent: '' },
  coverLetterForm: { addEventListener: jest.fn() },
  jobDescription: { 
    value: '', 
    addEventListener: jest.fn(), 
    classList: { add: jest.fn(), remove: jest.fn() } 
  },
  generateCoverLetterBtn: { disabled: false },
  coverLetterOutput: { style: { display: 'none' } },
  coverLetterContent: { textContent: '', contentEditable: false, classList: { add: jest.fn(), remove: jest.fn() }, focus: jest.fn() },
  copyCoverLetterBtn: { addEventListener: jest.fn() },
  editCoverLetterBtn: { addEventListener: jest.fn(), textContent: '', removeEventListener: jest.fn() },
  cvOptimizerForm: { addEventListener: jest.fn() },
  targetJob: { 
    value: '', 
    addEventListener: jest.fn(), 
    classList: { add: jest.fn(), remove: jest.fn() } 
  },
  optimizeCvBtn: { disabled: false },
  cvOutput: { style: { display: 'none' } },
  cvContent: { textContent: '', contentEditable: true, classList: { add: jest.fn(), remove: jest.fn() } },
  copyCvBtn: { addEventListener: jest.fn() },
  saveCvBtn: { addEventListener: jest.fn() },
  jobDescriptionError: { textContent: '' },
  targetJobError: { textContent: '' }
};

// Mock document
global.document = {
  addEventListener: jest.fn(),
  getElementById: jest.fn((id) => mockElements[id] || null),
  querySelectorAll: jest.fn((selector) => {
    if (selector === '.tab-btn') return mockElements.tabBtns;
    if (selector === '.tab-panel') return mockElements.tabPanels;
    return [];
  })
};

// Mock navigator
global.navigator = {
  clipboard: {
    writeText: jest.fn()
  }
};

// Mock console
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

// Popup functionality extracted from popup.js
let switchTab, checkSettings, handleCoverLetterGeneration, handleCvOptimization;
let showAlert, hideAlert, showLoader, hideLoader, copyToClipboard, validateInput, clearError;
let enableCoverLetterEdit, saveCoverLetterChanges, saveCvChanges, sendMessage;

beforeEach(() => {
  jest.clearAllMocks();
  mockChrome.runtime.lastError = null;
  
  // Reset element states
  Object.values(mockElements).forEach(el => {
    if (el.value !== undefined) el.value = '';
    if (el.textContent !== undefined) el.textContent = '';
    if (el.className !== undefined) el.className = '';
    if (el.disabled !== undefined) el.disabled = false;
  });

  // Initialize popup functions
  switchTab = function(tabName) {
    mockElements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    mockElements.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabName}-tab`);
    });

    hideAlert();
  };

  checkSettings = function() {
    chrome.storage.local.get(['gemini_api_key', 'user_cv'], function(result) {
      if (!result.gemini_api_key || !result.user_cv) {
        showAlert('Please configure your API key and CV in settings first.', 'warning');
      }
    });
  };

  handleCoverLetterGeneration = async function(e) {
    e.preventDefault();

    if (!validateInput(mockElements.jobDescription, mockElements.jobDescriptionError, 'Job description is required')) {
      return;
    }

    showLoader('Generating cover letter...');

    chrome.storage.local.get(['gemini_api_key', 'user_cv'], async function(result) {
      const apiKey = result.gemini_api_key;
      const userCV = result.user_cv;

      if (!apiKey || !userCV) {
        hideLoader();
        showAlert('Please configure your API key and CV in settings first.', 'error');
        return;
      }

      try {
        const response = await sendMessage({
          action: 'generateCoverLetter',
          data: {
            jobDescription: mockElements.jobDescription.value.trim(),
            userCV: userCV,
            apiKey: apiKey
          }
        });

        hideLoader();

        if (response && response.success) {
          mockElements.coverLetterContent.textContent = response.data.message;
          mockElements.coverLetterOutput.style.display = 'flex';
          showAlert('Cover letter generated successfully!', 'success');
        } else {
          showAlert(response?.error || 'Failed to generate cover letter', 'error');
        }
      } catch (error) {
        hideLoader();
        showAlert('An error occurred while generating the cover letter', 'error');
      }
    });
  };

  handleCvOptimization = async function(e) {
    e.preventDefault();

    if (!validateInput(mockElements.targetJob, mockElements.targetJobError, 'Target job description is required')) {
      return;
    }

    showLoader('Optimizing CV...');

    chrome.storage.local.get(['gemini_api_key', 'user_cv'], async function(result) {
      const apiKey = result.gemini_api_key;
      const userCV = result.user_cv;

      if (!apiKey || !userCV) {
        hideLoader();
        showAlert('Please configure your API key and CV in settings first.', 'error');
        return;
      }

      try {
        const response = await sendMessage({
          action: 'optimizeCV',
          data: {
            targetJob: mockElements.targetJob.value.trim(),
            userCV: userCV,
            apiKey: apiKey
          }
        });

        hideLoader();

        if (response && response.success) {
          mockElements.cvContent.textContent = response.data.message;
          mockElements.cvOutput.style.display = 'flex';
          showAlert('CV optimized successfully!', 'success');
        } else {
          showAlert(response?.error || 'Failed to optimize CV', 'error');
        }
      } catch (error) {
        hideLoader();
        showAlert('An error occurred while optimizing the CV', 'error');
      }
    });
  };

  showAlert = function(message, type = 'error') {
    mockElements.alert.textContent = message;
    mockElements.alert.className = `alert ${type}`;
    
    setTimeout(() => {
      hideAlert();
    }, 5000);
  };

  hideAlert = function() {
    mockElements.alert.className = 'alert';
    mockElements.alert.textContent = '';
  };

  showLoader = function(message) {
    mockElements.loaderText.textContent = message;
    mockElements.loader.classList.add('visible');
    
    mockElements.generateCoverLetterBtn.disabled = true;
    mockElements.optimizeCvBtn.disabled = true;
  };

  hideLoader = function() {
    mockElements.loader.classList.remove('visible');
    
    mockElements.generateCoverLetterBtn.disabled = false;
    mockElements.optimizeCvBtn.disabled = false;
  };

  copyToClipboard = async function(text, type) {
    try {
      await navigator.clipboard.writeText(text);
      showAlert(`${type} copied to clipboard!`, 'success');
    } catch (err) {
      showAlert(`Failed to copy ${type.toLowerCase()}`, 'error');
    }
  };

  validateInput = function(input, errorElement, errorMessage) {
    if (!input.value.trim()) {
      input.classList.add('error');
      errorElement.textContent = errorMessage;
      return false;
    }
    return true;
  };

  clearError = function(input, errorElement) {
    if (input.value.trim()) {
      input.classList.remove('error');
      errorElement.textContent = '';
    }
  };

  enableCoverLetterEdit = function() {
    mockElements.coverLetterContent.contentEditable = true;
    mockElements.coverLetterContent.classList.add('editable');
    mockElements.coverLetterContent.focus();
    
    mockElements.editCoverLetterBtn.textContent = '💾 Save Changes';
    mockElements.editCoverLetterBtn.removeEventListener('click', enableCoverLetterEdit);
    mockElements.editCoverLetterBtn.addEventListener('click', saveCoverLetterChanges);
  };

  saveCoverLetterChanges = function() {
    mockElements.coverLetterContent.contentEditable = false;
    mockElements.coverLetterContent.classList.remove('editable');
    
    mockElements.editCoverLetterBtn.textContent = '✏️ Edit';
    mockElements.editCoverLetterBtn.removeEventListener('click', saveCoverLetterChanges);
    mockElements.editCoverLetterBtn.addEventListener('click', enableCoverLetterEdit);
    
    showAlert('Changes saved!', 'success');
  };

  saveCvChanges = function() {
    const updatedCV = mockElements.cvContent.textContent;
    chrome.storage.local.set({user_cv: updatedCV}, function() {
      if (chrome.runtime.lastError) {
        showAlert('Error saving CV changes', 'error');
        return;
      }
      showAlert('CV changes saved!', 'success');
    });
  };

  sendMessage = function(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  };
});

describe('Popup Functionality', () => {
  describe('Tab Switching', () => {
    it('should switch to cover letter tab', () => {
      switchTab('cover-letter');

      expect(mockElements.tabBtns[0].classList.toggle).toHaveBeenCalledWith('active', true);
      expect(mockElements.tabBtns[1].classList.toggle).toHaveBeenCalledWith('active', false);
      expect(mockElements.tabPanels[0].classList.toggle).toHaveBeenCalledWith('active', true);
      expect(mockElements.tabPanels[1].classList.toggle).toHaveBeenCalledWith('active', false);
    });

    it('should switch to CV optimizer tab', () => {
      switchTab('cv-optimizer');

      expect(mockElements.tabBtns[0].classList.toggle).toHaveBeenCalledWith('active', false);
      expect(mockElements.tabBtns[1].classList.toggle).toHaveBeenCalledWith('active', true);
      expect(mockElements.tabPanels[0].classList.toggle).toHaveBeenCalledWith('active', false);
      expect(mockElements.tabPanels[1].classList.toggle).toHaveBeenCalledWith('active', true);
    });

    it('should hide alerts when switching tabs', () => {
      mockElements.alert.textContent = 'Test alert';
      mockElements.alert.className = 'alert error';

      switchTab('cover-letter');

      expect(mockElements.alert.textContent).toBe('');
      expect(mockElements.alert.className).toBe('alert');
    });
  });

  describe('Settings Check', () => {
    it('should show warning when API key is missing', () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ user_cv: 'Test CV' });
      });

      checkSettings();

      expect(mockElements.alert.textContent).toBe('Please configure your API key and CV in settings first.');
      expect(mockElements.alert.className).toBe('alert warning');
    });

    it('should show warning when CV is missing', () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ gemini_api_key: 'test-key' });
      });

      checkSettings();

      expect(mockElements.alert.textContent).toBe('Please configure your API key and CV in settings first.');
      expect(mockElements.alert.className).toBe('alert warning');
    });

    it('should not show warning when both are present', () => {
      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ 
          gemini_api_key: 'test-key',
          user_cv: 'Test CV'
        });
      });

      checkSettings();

      expect(mockElements.alert.textContent).toBe('');
    });
  });

  describe('Cover Letter Generation', () => {
    it('should validate job description input', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.jobDescription.value = '';

      await handleCoverLetterGeneration(mockEvent);

      expect(mockElements.jobDescription.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.jobDescriptionError.textContent).toBe('Job description is required');
    });

    it('should show error when settings are missing', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.jobDescription.value = 'Test job description';

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      await handleCoverLetterGeneration(mockEvent);

      expect(mockElements.alert.textContent).toBe('Please configure your API key and CV in settings first.');
      expect(mockElements.alert.className).toBe('alert error');
    });

    it('should generate cover letter successfully', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.jobDescription.value = 'Software Engineer position';

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({
          gemini_api_key: 'test-key',
          user_cv: 'Test CV'
        });
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({
          success: true,
          data: { message: 'Generated cover letter' }
        });
      });

      await handleCoverLetterGeneration(mockEvent);

      expect(mockElements.coverLetterContent.textContent).toBe('Generated cover letter');
      expect(mockElements.coverLetterOutput.style.display).toBe('flex');
      expect(mockElements.alert.textContent).toBe('Cover letter generated successfully!');
    });

    it('should handle API errors', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.jobDescription.value = 'Test job';

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({
          gemini_api_key: 'test-key',
          user_cv: 'Test CV'
        });
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({
          success: false,
          error: 'API error occurred'
        });
      });

      await handleCoverLetterGeneration(mockEvent);

      expect(mockElements.alert.textContent).toBe('API error occurred');
      expect(mockElements.alert.className).toBe('alert error');
    });
  });

  describe('CV Optimization', () => {
    it('should validate target job input', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.targetJob.value = '';

      await handleCvOptimization(mockEvent);

      expect(mockElements.targetJob.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.targetJobError.textContent).toBe('Target job description is required');
    });

    it('should optimize CV successfully', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.targetJob.value = 'Senior Developer position';

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({
          gemini_api_key: 'test-key',
          user_cv: 'Original CV'
        });
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({
          success: true,
          data: { message: 'Optimized CV content' }
        });
      });

      await handleCvOptimization(mockEvent);

      expect(mockElements.cvContent.textContent).toBe('Optimized CV content');
      expect(mockElements.cvOutput.style.display).toBe('flex');
      expect(mockElements.alert.textContent).toBe('CV optimized successfully!');
    });

    it('should handle optimization errors', async () => {
      const mockEvent = { preventDefault: jest.fn() };
      mockElements.targetJob.value = 'Test position';

      mockChrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({
          gemini_api_key: 'test-key',
          user_cv: 'Test CV'
        });
      });

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({
          success: false,
          error: 'Optimization failed'
        });
      });

      await handleCvOptimization(mockEvent);

      expect(mockElements.alert.textContent).toBe('Optimization failed');
      expect(mockElements.alert.className).toBe('alert error');
    });
  });

  describe('Alert System', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show success alert', () => {
      showAlert('Success message', 'success');

      expect(mockElements.alert.textContent).toBe('Success message');
      expect(mockElements.alert.className).toBe('alert success');
    });

    it('should show error alert', () => {
      showAlert('Error message', 'error');

      expect(mockElements.alert.textContent).toBe('Error message');
      expect(mockElements.alert.className).toBe('alert error');
    });

    it('should auto-hide alert after timeout', () => {
      showAlert('Temporary message', 'success');

      expect(mockElements.alert.textContent).toBe('Temporary message');

      jest.advanceTimersByTime(5000);

      expect(mockElements.alert.textContent).toBe('');
      expect(mockElements.alert.className).toBe('alert');
    });
  });

  describe('Loader System', () => {
    it('should show loader with message', () => {
      showLoader('Loading test...');

      expect(mockElements.loaderText.textContent).toBe('Loading test...');
      expect(mockElements.loader.classList.add).toHaveBeenCalledWith('visible');
      expect(mockElements.generateCoverLetterBtn.disabled).toBe(true);
      expect(mockElements.optimizeCvBtn.disabled).toBe(true);
    });

    it('should hide loader and re-enable buttons', () => {
      hideLoader();

      expect(mockElements.loader.classList.remove).toHaveBeenCalledWith('visible');
      expect(mockElements.generateCoverLetterBtn.disabled).toBe(false);
      expect(mockElements.optimizeCvBtn.disabled).toBe(false);
    });
  });

  describe('Clipboard Operations', () => {
    it('should copy text to clipboard successfully', async () => {
      global.navigator.clipboard.writeText.mockResolvedValueOnce();

      await copyToClipboard('Test content', 'Cover letter');

      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('Test content');
      expect(mockElements.alert.textContent).toBe('Cover letter copied to clipboard!');
      expect(mockElements.alert.className).toBe('alert success');
    });

    it('should handle clipboard errors', async () => {
      global.navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));

      await copyToClipboard('Test content', 'CV');

      expect(mockElements.alert.textContent).toBe('Failed to copy cv');
      expect(mockElements.alert.className).toBe('alert error');
    });
  });

  describe('Input Validation', () => {
    it('should validate non-empty input', () => {
      mockElements.jobDescription.value = 'Valid input';

      const result = validateInput(
        mockElements.jobDescription,
        mockElements.jobDescriptionError,
        'Field is required'
      );

      expect(result).toBe(true);
    });

    it('should reject empty input', () => {
      mockElements.jobDescription.value = '   ';

      const result = validateInput(
        mockElements.jobDescription,
        mockElements.jobDescriptionError,
        'Field is required'
      );

      expect(result).toBe(false);
      expect(mockElements.jobDescription.classList.add).toHaveBeenCalledWith('error');
      expect(mockElements.jobDescriptionError.textContent).toBe('Field is required');
    });

    it('should clear error when input becomes valid', () => {
      mockElements.jobDescription.value = 'Valid input';

      clearError(mockElements.jobDescription, mockElements.jobDescriptionError);

      expect(mockElements.jobDescription.classList.remove).toHaveBeenCalledWith('error');
      expect(mockElements.jobDescriptionError.textContent).toBe('');
    });
  });

  describe('Content Editing', () => {
    it('should enable cover letter editing', () => {
      enableCoverLetterEdit();

      expect(mockElements.coverLetterContent.contentEditable).toBe(true);
      expect(mockElements.coverLetterContent.classList.add).toHaveBeenCalledWith('editable');
      expect(mockElements.coverLetterContent.focus).toHaveBeenCalled();
      expect(mockElements.editCoverLetterBtn.textContent).toBe('💾 Save Changes');
    });

    it('should save cover letter changes', () => {
      saveCoverLetterChanges();

      expect(mockElements.coverLetterContent.contentEditable).toBe(false);
      expect(mockElements.coverLetterContent.classList.remove).toHaveBeenCalledWith('editable');
      expect(mockElements.editCoverLetterBtn.textContent).toBe('✏️ Edit');
      expect(mockElements.alert.textContent).toBe('Changes saved!');
    });

    it('should save CV changes to storage', () => {
      mockElements.cvContent.textContent = 'Updated CV content';
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveCvChanges();

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        { user_cv: 'Updated CV content' },
        expect.any(Function)
      );
      expect(mockElements.alert.textContent).toBe('CV changes saved!');
    });

    it('should handle CV save errors', () => {
      mockElements.cvContent.textContent = 'Updated CV';
      mockChrome.runtime.lastError = { message: 'Save error' };
      mockChrome.storage.local.set.mockImplementation((data, callback) => {
        callback();
      });

      saveCvChanges();

      expect(mockElements.alert.textContent).toBe('Error saving CV changes');
      expect(mockElements.alert.className).toBe('alert error');
    });
  });

  describe('Message Sending', () => {
    it('should send message and return promise', async () => {
      const testMessage = { action: 'test', data: {} };
      const expectedResponse = { success: true };

      mockChrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(expectedResponse);
      });

      const result = await sendMessage(testMessage);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage, expect.any(Function));
      expect(result).toEqual(expectedResponse);
    });
  });
});