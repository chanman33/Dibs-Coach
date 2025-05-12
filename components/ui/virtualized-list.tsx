'use client'

import React from 'react'

// Define a generic session item type
interface SessionItem {
  ulid: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: string
  userRole: string
  otherParty: {
    ulid: string
    firstName: string | null
    lastName: string | null
    email: string | null
    imageUrl: string | null
  }
}

interface VirtualizedListProps {
  items: SessionItem[]
  height: number
  itemHeight: number
  renderItem: (item: SessionItem) => React.ReactNode
}

// Simple list implementation until we can fix the react-window integration
export function VirtualizedList({
  items,
  height,
  itemHeight,
  renderItem
}: VirtualizedListProps) {
  if (items.length === 0) {
    return <div style={{ height }}>No items to display</div>
  }

  return (
    <div 
      style={{ 
        height, 
        width: '100%', 
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {items.map((item) => (
        <div 
          key={item.ulid}
          style={{
            minHeight: itemHeight,
            paddingLeft: '0.25rem',
            paddingRight: '0.25rem',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
          }}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
} 