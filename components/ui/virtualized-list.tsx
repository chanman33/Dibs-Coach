import { FixedSizeList as List } from 'react-window'

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

export function VirtualizedList({
  items,
  height,
  itemHeight,
  renderItem
}: VirtualizedListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index]
    return (
      <div style={{
        ...style,
        paddingLeft: '0.25rem',
        paddingRight: '0.25rem',
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        height: 'auto', // Allow natural height
      }}>
        {renderItem(item)}
      </div>
    )
  }

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      className="!overflow-x-hidden"
    >
      {Row}
    </List>
  )
} 