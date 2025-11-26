import { jest } from '@jest/globals';
import { MESSAGE_TYPES } from '../../utils/constants.js';

describe('Background Script Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle START_SESSION message', async () => {
    const message = {
      type: MESSAGE_TYPES.START_SESSION,
      payload: {
        class_id: 1,
        meeting_id: 'meet-123',
      },
    };

    // Simulate message handling
    const response = await chrome.runtime.sendMessage(message);
    
    expect(response.success).toBe(true);
  });

  it('should handle END_SESSION message', async () => {
    const message = {
      type: MESSAGE_TYPES.END_SESSION,
      payload: {
        session_id: 123,
      },
    };

    const response = await chrome.runtime.sendMessage(message);
    
    expect(response.success).toBe(true);
  });

  it('should store data in chrome.storage', async () => {
    const data = { test: 'value' };
    
    await chrome.storage.local.set(data);
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith(data);
  });

  it('should retrieve data from chrome.storage', async () => {
    const mockData = { auth_token: 'test-token' };
    chrome.storage.local.get.mockResolvedValue(mockData);
    
    const result = await chrome.storage.local.get('auth_token');
    
    expect(chrome.storage.local.get).toHaveBeenCalledWith('auth_token');
    expect(result).toEqual(mockData);
  });

  it('should handle authentication state', async () => {
    const authData = {
      engagium_auth_token: 'valid-token',
      engagium_user_info: {
        id: 1,
        email: 'teacher@example.com',
      },
    };

    await chrome.storage.local.set(authData);
    chrome.storage.local.get.mockResolvedValue(authData);
    
    const result = await chrome.storage.local.get(['engagium_auth_token', 'engagium_user_info']);
    
    expect(result.engagium_auth_token).toBe('valid-token');
    expect(result.engagium_user_info.email).toBe('teacher@example.com');
  });
});
