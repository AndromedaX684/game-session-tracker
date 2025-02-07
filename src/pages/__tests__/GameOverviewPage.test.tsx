import React from 'react';
import { render, cleanup } from '@testing-library/react';
import GameOverviewPage from '../GameOverviewPage';
import { Chart } from 'react-chartjs-2';

jest.mock('react-chartjs-2', () => {
    return {
        Chart: jest.fn(() => null),
    };
});

afterEach(() => {
    cleanup();
    Chart.mockClear();
});

test('renders chart and cleans up previous instance', () => {
    const { rerender } = render(<GameOverviewPage />);
    expect(Chart).toHaveBeenCalledTimes(1);

    rerender(<GameOverviewPage />);
    expect(Chart).toHaveBeenCalledTimes(2);
});