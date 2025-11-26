import { jest } from '@jest/globals';

describe('Chrome Storage API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('chrome.storage.local', () => {
    it('should retrieve data from chrome.storage.local', async () => {
      const mockData = { test_key: 'test_value' };
      chrome.storage.local.get.mockResolvedValue(mockData);

      const result = await chrome.storage.local.get('test_key');
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith('test_key');
      expect(result).toEqual(mockData);
    });

    it('should save data to chrome.storage.local', async () => {
      const data = { test_key: 'test_value' };
      
      await chrome.storage.local.set(data);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(data);
    });

    it('should remove data from chrome.storage.local', async () => {
      await chrome.storage.local.remove('test_key');
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('test_key');
    });

    it('should clear all storage data', async () => {
      await chrome.storage.local.clear();
      
      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });
  });
});
