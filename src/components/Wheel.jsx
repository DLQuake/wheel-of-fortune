import { motion } from 'motion/react'
import './Wheel.sass'

const SIZE = 500
const CENTER = SIZE / 2
const RADIUS = 238

function getPoint(angle, radius = RADIUS) {
  const radians = (angle * Math.PI) / 180

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  }
}

function createSegment(index, total) {
  const slice = 360 / total
  const startAngle = index * slice - 90
  const endAngle = startAngle + slice

  const start = getPoint(startAngle)
  const end = getPoint(endAngle)

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0`,
    `${slice > 180 ? 1 : 0} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

export default function Wheel({
  items,
  rotation,
  onRotationChange,
  onAnimationComplete,
}) {
  const slice = 360 / items.length

  return (
    <div className="wheel">
      <div className="wheel__pointer" />

      <motion.div
        className="wheel__rotator"
        animate={{ rotate: rotation }}
        transition={{
          duration: 7,
          ease: [0.1, 0.05, 0.2, 1],
        }}
        onUpdate={(latest) => {
          onRotationChange?.(latest.rotate)
        }}
        onAnimationComplete={onAnimationComplete}
      >
        <svg
          className="wheel__svg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Wheel of Fortune"
        >
          {items.map((item, index) => {
            const middleAngle =
              index * slice + slice / 2 - 90

            const labelPoint = getPoint(
              middleAngle,
              RADIUS * 0.66,
            )

            return (
              <g key={item.id}>
                <path
                  d={createSegment(index, items.length)}
                  fill={item.color}
                  stroke="#ffffff"
                  strokeWidth="3"
                />

                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  transform={
                    `rotate(${middleAngle + 90} ` +
                    `${labelPoint.x} ${labelPoint.y})`
                  }
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="wheel__label"
                >
                  {item.label}
                </text>
              </g>
            )
          })}

          <circle
            cx={CENTER}
            cy={CENTER}
            r="25"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="5"
          />
        </svg>
      </motion.div>
    </div>
  )
}