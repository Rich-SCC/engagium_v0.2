import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import Home from '@/pages/Home';
import * as api from '@/services/api';

// Mock the API
vi.mock('@/services/api', () => ({
  classesAPI: {
    getAll: vi.fn(),
    getStats: vi.fn(),
  },
  sessionsAPI: {
    getStats: vi.fn(),
  },
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome message', () => {
    api.classesAPI.getAll.mockResolvedValue({ data: [] });
    api.classesAPI.getStats.mockResolvedValue({ data: {} });
    api.sessionsAPI.getStats.mockResolvedValue({ data: {} });

    renderWithProviders(<Home />);
    
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByText(/Here's an overview of your teaching activities/i)).toBeInTheDocument();
  });

  it('displays quick stats cards', async () => {
    api.classesAPI.getAll.mockResolvedValue({ data: [] });
    api.classesAPI.getStats.mockResolvedValue({
      data: {
        totalClasses: 5,
        totalStudents: 120,
      },
    });
    api.sessionsAPI.getStats.mockResolvedValue({
      data: {
        totalSessions: 25,
        activeSessions: 2,
      },
    });

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Total Classes')).toBeInTheDocument();
      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('Total Sessions')).toBeInTheDocument();
      expect(screen.getByText('Active Now')).toBeInTheDocument();
    });

    // Check if stats are displayed
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('displays quick action buttons', () => {
    api.classesAPI.getAll.mockResolvedValue({ data: [] });
    api.classesAPI.getStats.mockResolvedValue({ data: {} });
    api.sessionsAPI.getStats.mockResolvedValue({ data: {} });

    renderWithProviders(<Home />);

    expect(screen.getByText('Manage Classes')).toBeInTheDocument();
    expect(screen.getByText('View Live Feed')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('displays classes when available', async () => {
    const mockClasses = [
      {
        id: '1',
        name: 'Computer Science 101',
        section: 'A',
        status: 'active',
        student_count: 30,
      },
      {
        id: '2',
        name: 'Mathematics 201',
        section: 'B',
        status: 'active',
        student_count: 25,
      },
    ];

    api.classesAPI.getAll.mockResolvedValue({ data: mockClasses });
    api.classesAPI.getStats.mockResolvedValue({ data: {} });
    api.sessionsAPI.getStats.mockResolvedValue({ data: {} });

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Computer Science 101')).toBeInTheDocument();
      expect(screen.getByText('Mathematics 201')).toBeInTheDocument();
    });
  });

  it('shows empty state when no classes exist', async () => {
    api.classesAPI.getAll.mockResolvedValue({ data: [] });
    api.classesAPI.getStats.mockResolvedValue({ data: {} });
    api.sessionsAPI.getStats.mockResolvedValue({ data: {} });

    renderWithProviders(<Home />);

    await waitFor(() => {
      expect(screen.getByText('No classes yet')).toBeInTheDocument();
      expect(screen.getByText('Create Your First Class')).toBeInTheDocument();
    });
  });
});
