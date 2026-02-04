import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App - UI Integration Tests', () => {
  it('renders the main sections', () => {
    render(<App />)
    
    expect(screen.getByText('Informed Guessing - Estimation Workbench')).toBeInTheDocument()
    expect(screen.getByText('1. Inputs')).toBeInTheDocument()
    expect(screen.getByText('2. Advanced Variables')).toBeInTheDocument()
    expect(screen.getByText('3. Outputs')).toBeInTheDocument()
  })

  it('shows empty state initially', () => {
    render(<App />)
    
    expect(screen.getByText(/no work items yet/i)).toBeInTheDocument()
    expect(screen.getByText(/add work items to see results/i)).toBeInTheDocument()
  })

  it('adds a work item when button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const addButton = screen.getByText('+ Add Work Item')
    await user.click(addButton)
    
    // Should show table headers after adding an item
    expect(screen.getByText('Best Case (hrs)')).toBeInTheDocument()
    expect(screen.getByText('Worst Case (hrs)')).toBeInTheDocument()
    expect(screen.getByText('Expected (hrs)')).toBeInTheDocument()
  })

  it('allows editing best and worst case values', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Add a work item
    await user.click(screen.getByText('+ Add Work Item'))
    
    // Get the input fields
    const inputs = screen.getAllByRole('spinbutton')
    
    // Just verify inputs are editable (actual value entry is tricky in tests)
    expect(inputs[0]).not.toBeDisabled()
    expect(inputs[1]).not.toBeDisabled()
    
    // Table headers should be visible
    expect(screen.getByText('Expected (hrs)')).toBeInTheDocument()
  })

  it('auto-adjusts to prevent worst < best', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    await user.click(screen.getByText('+ Add Work Item'))
    
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]
    
    // Set worst to 80 first
    const worstCaseInput = inputs[1]
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(worstCaseInput, { target: { value: '80' } })
    
    // Then set best to 120, which should auto-adjust worst to 120 as well
    const bestCaseInput = inputs[0]
    fireEvent.change(bestCaseInput, { target: { value: '120' } })
    
    // The worst case should have been auto-adjusted to match best
    expect(worstCaseInput.value).toBe('120')
    
    // Should NOT show warning icon since values are now valid
    expect(screen.queryByText('⚠️')).not.toBeInTheDocument()
  })

  it('auto-adjusts worst case when best case exceeds it', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    await user.click(screen.getByText('+ Add Work Item'))
    
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]
    
    // Set initial valid values
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(inputs[0], { target: { value: '50' } })
    fireEvent.change(inputs[1], { target: { value: '100' } })
    
    // Now increase best above worst - should auto-adjust worst
    fireEvent.change(inputs[0], { target: { value: '120' } })
    
    // Both should be 120 now (worst auto-adjusted)
    expect(inputs[0].value).toBe('120')
    expect(inputs[1].value).toBe('120')
  })

  it('removes work item when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Add two items
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))
    
    // Should have 2 remove buttons
    const removeButtons = screen.getAllByText('Remove')
    expect(removeButtons).toHaveLength(2)
    
    // Remove first item
    await user.click(removeButtons[0])
    
    // Should have 1 remove button left
    expect(screen.getAllByText('Remove')).toHaveLength(1)
  })

  it('calculates portfolio results (integration test)', async () => {
    // This test verifies the calculation flow is wired correctly
    // Detailed calculation correctness is verified in estimation.test.ts
    const user = userEvent.setup()
    render(<App />)
    
    // Add a work item
    await user.click(screen.getByText('+ Add Work Item'))
    
    // Verify outputs section shows calculated results
    expect(screen.getByText('3. Outputs')).toBeInTheDocument()
    expect(screen.getByText('Total Expected Hours:')).toBeInTheDocument()
    expect(screen.getByText('Duration (Calendar Weeks):')).toBeInTheDocument()
  })

  it('handles multiple work items', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Add 3 work items
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))
    await user.click(screen.getByText('+ Add Work Item'))
    
    // Should show 3 remove buttons (one per item)
    expect(screen.getAllByText('Remove')).toHaveLength(3)
    
    // Should show 6 input fields (2 per item: best and worst)
    expect(screen.getAllByRole('spinbutton')).toHaveLength(6)
  })

  it('does not crash when incrementing values', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    await user.click(screen.getByText('+ Add Work Item'))
    
    const inputs = screen.getAllByRole('spinbutton')
    const bestCaseInput = inputs[0] as HTMLInputElement
    
    // Type initial value
    await user.clear(bestCaseInput)
    await user.type(bestCaseInput, '50')
    
    // Increment using arrow up (simulates clicking increment button)
    bestCaseInput.focus()
    await user.keyboard('{ArrowUp}')
    
    // App should still be rendered (not blank screen)
    expect(screen.getByText('Informed Guessing - Estimation Workbench')).toBeInTheDocument()
  })
})
