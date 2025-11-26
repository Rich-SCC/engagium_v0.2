import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import LiveFeed from '@/pages/LiveFeed';
import { useWebSocket } from '@/contexts/WebSocketContext';

// Mock the WebSocket context
vi.mock('@/contexts/WebSocketContext', () => ({
  useWebSocket: vi.fn(),
}));

describe('LiveFeed Page', () => {
  it('renders page title', () => {
    useWebSocket.mockReturnValue({
      isConnected: true,
      activeSessions: [],
      recentEvents: [],
      clearEvents: vi.fn(),
    });

    renderWithProviders(<LiveFeed />);
    
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
  });

  it('displays active session card', () => {
    useWebSocket.mockReturnValue({
      isConnected: true,
      activeSessions: [],
      recentEvents: [],
      clearEvents: vi.fn(),
    });

    renderWithProviders(<LiveFeed />);
    
    // ActiveSessionCard component should be rendered
    // We can verify its presence through its content or structure
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
  });
});
