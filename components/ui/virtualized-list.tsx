import { FixedSizeList as List } from 'react-window'
import { ExtendedSession } from '@/utils/types/calendly'

interface VirtualizedListProps {
  items: ExtendedSession[]
  height: number
  itemHeight: number
  renderItem: (item: ExtendedSession) => React.ReactNode
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