import { formatTime, formatDuration, secondsToDuration } from '../../utils/date-utils.js';
import { STORAGE_KEYS, MESSAGE_TYPES, SESSION_STATUS } from '../../utils/constants.js';

describe('Date Utils', () => {
  describe('formatTime', () => {
    it('should format date to time string', () => {
      const date = new Date('2025-11-26T14:30:00');
      const result = formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should return N/A for invalid date', () => {
      expect(formatTime(null)).toBe('N/A');
      expect(formatTime(undefined)).toBe('N/A');
    });
  });

  describe('formatDuration', () => {
    it('should format duration between two dates', () => {
      const start = new Date('2025-11-26T14:00:00');
      const end = new Date('2025-11-26T15:30:00');
      const result = formatDuration(start, end);
      expect(result).toContain('1h');
      expect(result).toContain('30m');
    });

    it('should return "N/A" when end time is null', () => {
      const start = new Date('2025-11-26T14:00:00');
      expect(formatDuration(start, null)).toBe('N/A');
    });

    it('should return "N/A" when start time is null', () => {
      expect(formatDuration(null, null)).toBe('N/A');
    });
  });

  describe('secondsToDuration', () => {
    it('should convert seconds to duration string', () => {
      expect(secondsToDuration(3665)).toBe('1h 1m');
      expect(secondsToDuration(90)).toBe('1m');
      expect(secondsToDuration(45)).toBe('45s');
    });

    it('should handle zero seconds', () => {
      expect(secondsToDuration(0)).toBe('0s');
    });
  });
});

describe('Constants', () => {
  it('should export STORAGE_KEYS', () => {
    expect(STORAGE_KEYS).toBeDefined();
    expect(STORAGE_KEYS.AUTH_TOKEN).toBe('auth_token');
    expect(STORAGE_KEYS.USER_INFO).toBe('user_info');
  });

  it('should export MESSAGE_TYPES', () => {
    expect(MESSAGE_TYPES).toBeDefined();
    expect(MESSAGE_TYPES.START_SESSION).toBeDefined();
    expect(MESSAGE_TYPES.END_SESSION).toBeDefined();
  });

  it('should export SESSION_STATUS', () => {
    expect(SESSION_STATUS).toBeDefined();
    expect(SESSION_STATUS.ACTIVE).toBeDefined();
    expect(SESSION_STATUS.IDLE).toBeDefined();
  });
});
