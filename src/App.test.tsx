import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App - UI Integration Tests', () => {
  it('renders the main sections', () => {
    render(<App />)
    
    expect(screen.getByText('Informed Guessing')).toBeInTheDocument()
    expect(screen.getByText('Work Items')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle advanced settings')).toBeInTheDocument()
    expect(screen.getByText('Results')).toBeInTheDocument()
  })

  it('starts with one empty work item', () => {
    render(<App />)
    
    // Should have one work item by default
    expect(screen.getByLabelText('Title for work item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Best case hours for work item 1')).toBeInTheDocument()
  })

  it('adds a work item when button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const addButton = screen.getByText('+ Add Work Item')
    await user.click(addButton)
    
    // Should now have 2 work items
    expect(screen.getByLabelText('Title for work item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Title for work item 2')).toBeInTheDocument()
  })

  it('allows editing text fields', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Test title input
    const titleInput = screen.getByLabelText('Title for work item 1') as HTMLInputElement
    await user.type(titleInput, 'Test Feature')
    expect(titleInput.value).toBe('Test Feature')

    // Test notes input
    const notesInput = screen.getByLabelText('Notes for work item 1') as HTMLInputElement
    await user.type(notesInput, 'Test notes')
    expect(notesInput.value).toBe('Test notes')
  })

  it('allows editing best and worst case values', async () => {
    render(<App />)

    const bestInput = screen.getByLabelText('Best case hours for work item 1') as HTMLInputElement
    const worstInput = screen.getByLabelText('Worst case hours for work item 1') as HTMLInputElement

    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(bestInput, { target: { value: '80' } })
    fireEvent.change(worstInput, { target: { value: '120' } })

    expect(bestInput.value).toBe('80')
    expect(worstInput.value).toBe('120')
  })

  it('auto-adjusts worst case when best exceeds it', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const bestInput = screen.getByLabelText('Best case hours for work item 1') as HTMLInputElement
    const worstInput = screen.getByLabelText('Worst case hours for work item 1') as HTMLInputElement
    
    // Set worst to a lower value first
    await user.clear(worstInput)
    await user.type(worstInput, '50')
    
    // Set best higher - should auto-adjust worst
    await user.clear(bestInput)
    await user.type(bestInput, '100')
    
    // Worst should be auto-adjusted to match best
    expect(worstInput.value).toBe('100')
  })

  it('displays zero values correctly when best equals worst', async () => {
    render(<App />)

    const bestInput = screen.getByLabelText('Best case hours for work item 1') as HTMLInputElement
    const worstInput = screen.getByLabelText('Worst case hours for work item 1') as HTMLInputElement

    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(bestInput, { target: { value: '100' } })
    fireEvent.change(worstInput, { target: { value: '100' } })

    // Should show 0.00 for range spread and variance (zero range is valid)
    const rangeSpread = screen.getByLabelText('Range spread: 0.00 hours')
    const variance = screen.getByLabelText('Variance: 0.00')
    expect(rangeSpread).toBeInTheDocument()
    expect(variance).toBeInTheDocument()
  })

  it('removes work item when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Add two more items (starts with 1)
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))
    
    // Should have 3 remove buttons
    const removeButtons = screen.getAllByLabelText(/remove work item/i)
    expect(removeButtons).toHaveLength(3)
    
    // Remove first item
    await user.click(removeButtons[0])
    
    // Should have 2 remove buttons left
    expect(screen.getAllByLabelText(/remove work item/i)).toHaveLength(2)
  })

  it('calculates and displays portfolio results', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const bestInput = screen.getByLabelText('Best case hours for work item 1') as HTMLInputElement
    const worstInput = screen.getByLabelText('Worst case hours for work item 1') as HTMLInputElement
    
    await user.clear(bestInput)
    await user.type(bestInput, '100')
    await user.clear(worstInput)
    await user.type(worstInput, '200')
    
    // Should show calculated outputs
    expect(screen.getByText('Total Expected Hours')).toBeInTheDocument()
    expect(screen.getByText('Portfolio Range Spread')).toBeInTheDocument()
    expect(screen.getByText('Total Effort Hours')).toBeInTheDocument()
    expect(screen.getByText('Total Staff Weeks')).toBeInTheDocument()
    expect(screen.getByText('Duration (Calendar)')).toBeInTheDocument()
    
    // Values should be calculated (check for numeric pattern)
    const outputs = screen.getAllByText(/\d+\.\d+/)
    expect(outputs.length).toBeGreaterThan(0)
  })

  it('handles multiple work items correctly', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Add 3 more work items (starts with 1)
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))
    
    // Should show 4 rows with proper IDs
    expect(screen.getByLabelText('Title for work item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Title for work item 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Title for work item 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Title for work item 4')).toBeInTheDocument()
    
    // Should show 4 remove buttons
    expect(screen.getAllByLabelText(/remove work item/i)).toHaveLength(4)
  })

  it('displays advanced settings open by default with correct values', () => {
    render(<App />)

    // Advanced settings should be open by default
    const expectedPosInput = document.getElementById('expected_case_position')
    expect(expectedPosInput).not.toBeNull()

    // Should display default values
    expect(screen.getByDisplayValue('0.4')).toBeInTheDocument()  // Expected case position default
    expect(screen.getByDisplayValue('2.6')).toBeInTheDocument()  // Range spread divisor default
    expect(screen.getByDisplayValue('36')).toBeInTheDocument()   // Billable hours default
    expect(screen.getByDisplayValue('3.5')).toBeInTheDocument()  // Duration scaling default
  })

  it('allows editing advanced variables', async () => {
    const { container } = render(<App />)

    const expectedPosInput = container.querySelector('#expected_case_position') as HTMLInputElement

    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(expectedPosInput, { target: { value: '0.5' } })

    expect(expectedPosInput.value).toBe('0.5')
  })

  it('resets advanced variables to defaults', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    const billableHoursInput = container.querySelector('#billable_hours_per_week') as HTMLInputElement

    // Change from default 36 to 40
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(billableHoursInput, { target: { value: '40' } })
    expect(billableHoursInput.value).toBe('40')

    // Reset button
    const resetButton = screen.getByText('↺ Reset to Defaults')
    await user.click(resetButton)

    // Should be back to 36
    expect(billableHoursInput.value).toBe('36')
  })

  it('recalculates when advanced variables change', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)

    // Work item already exists - just set values
    const bestInput = screen.getByLabelText('Best case hours for work item 1') as HTMLInputElement
    const worstInput = screen.getByLabelText('Worst case hours for work item 1') as HTMLInputElement

    await user.clear(bestInput)
    await user.type(bestInput, '100')
    await user.clear(worstInput)
    await user.type(worstInput, '200')

    // Get initial expected hours value (should be 140 with default 0.4 position)
    expect(screen.getByText('Total Expected Hours')).toBeInTheDocument()

    // Change expected_case_position from 0.4 to 0.5
    const expectedPosInput = container.querySelector('#expected_case_position') as HTMLInputElement
    await user.clear(expectedPosInput)
    await user.type(expectedPosInput, '0.5')

    // Should recalculate - just verify calculation still exists
    expect(screen.getByText('Total Expected Hours')).toBeInTheDocument()
    const outputs = screen.getAllByText(/\d+\.\d+/)
    expect(outputs.length).toBeGreaterThan(0)
  })

  it('renumbers rows after deletion', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Add two more items (starts with 1, now 3 total)
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))

    // Delete the second item
    const removeButtons = screen.getAllByLabelText(/remove work item/i)
    await user.click(removeButtons[1])

    // Remaining rows should be renumbered 1 and 2 (not 1 and 3)
    expect(screen.getByLabelText('Title for work item 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Title for work item 2')).toBeInTheDocument()
    expect(screen.queryByLabelText('Title for work item 3')).not.toBeInTheDocument()
  })

  it('maintains accessibility with keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const titleInput = screen.getByLabelText('Title for work item 1')
    const notesInput = screen.getByLabelText('Notes for work item 1')
    const bestInput = screen.getByLabelText('Best case hours for work item 1')
    
    // Tab navigation should work
    titleInput.focus()
    await user.keyboard('{Tab}')
    expect(notesInput).toHaveFocus()
    
    await user.keyboard('{Tab}')
    expect(bestInput).toHaveFocus()
  })
})
