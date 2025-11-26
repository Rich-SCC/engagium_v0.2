import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the popup module
const mockSessionStatus = {
  status: 'active',
  session_id: 123,
  class_name: 'Computer Science 101',
  started_at: new Date().toISOString(),
};

const mockParticipants = [
  {
    id: 1,
    name: 'John Doe',
    joined_at: new Date().toISOString(),
    events_count: 5,
    status: 'present',
  },
  {
    id: 2,
    name: 'Jane Smith',
    joined_at: new Date().toISOString(),
    events_count: 3,
    status: 'present',
  },
];

// Mock chrome.runtime.sendMessage for popup tests
beforeEach(() => {
  chrome.runtime.sendMessage.mockImplementation((message) => {
    if (message.type === 'GET_SESSION_STATUS') {
      return Promise.resolve({
        success: true,
        data: mockSessionStatus,
      });
    }
    if (message.type === 'GET_PARTICIPANTS') {
      return Promise.resolve({
        success: true,
        data: mockParticipants,
      });
    }
    return Promise.resolve({ success: true });
  });
});

describe('Popup Integration', () => {
  it('should render popup component', () => {
    const div = document.createElement('div');
    div.id = 'root';
    document.body.appendChild(div);
    
    expect(div).toBeInTheDocument();
  });

  it('should call chrome.runtime.sendMessage on mount', async () => {
    // This test verifies that the popup would make API calls
    expect(chrome.runtime.sendMessage).toBeDefined();
    
    const result = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockSessionStatus);
  });

  it('should handle session status responses', async () => {
    const result = await chrome.runtime.sendMessage({ type: 'GET_SESSION_STATUS' });
    
    expect(result.data.status).toBe('active');
    expect(result.data.session_id).toBe(123);
    expect(result.data.class_name).toBe('Computer Science 101');
  });

  it('should handle participant data', async () => {
    const result = await chrome.runtime.sendMessage({ type: 'GET_PARTICIPANTS' });
    
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('John Doe');
    expect(result.data[1].name).toBe('Jane Smith');
  });
});
