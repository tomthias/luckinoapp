import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResizablePanelsProps {
  children: [ReactNode, ReactNode]
  className?: string
  defaultSize?: number // percentage (0-100)
  minSize?: number // percentage
  maxSize?: number // percentage
  direction?: 'horizontal' | 'vertical'
}

export function ResizablePanels({
  children,
  className = '',
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  direction = 'horizontal'
}: ResizablePanelsProps) {
  const [size, setSize] = useState(defaultSize)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const total = direction === 'horizontal' ? rect.width : rect.height
    const position = direction === 'horizontal' 
      ? e.clientX - rect.left 
      : e.clientY - rect.top

    const percentage = Math.min(maxSize, Math.max(minSize, (position / total) * 100))
    setSize(percentage)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, direction])

  const isHorizontal = direction === 'horizontal'
  const firstPanelStyle = isHorizontal 
    ? { width: `${size}%` } 
    : { height: `${size}%` }
  const secondPanelStyle = isHorizontal 
    ? { width: `${100 - size}%` } 
    : { height: `${100 - size}%` }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex overflow-hidden',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {/* First Panel */}
      <div
        style={firstPanelStyle}
        className="overflow-hidden h-full"
      >
        {children[0]}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          'bg-border hover:bg-accent transition-colors flex-shrink-0 relative group',
          isHorizontal 
            ? 'w-1 cursor-col-resize hover:w-1.5' 
            : 'h-1 cursor-row-resize hover:h-1.5',
          isDragging && 'bg-primary'
        )}
      >
        {/* Visual indicator */}
        <div
          className={cn(
            'absolute bg-muted-foreground/20 group-hover:bg-muted-foreground/40 transition-colors',
            isHorizontal
              ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full'
              : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 rounded-full'
          )}
        />
      </div>

      {/* Second Panel */}
      <div
        style={secondPanelStyle}
        className="overflow-hidden h-full"
      >
        {children[1]}
      </div>
    </div>
  )
}