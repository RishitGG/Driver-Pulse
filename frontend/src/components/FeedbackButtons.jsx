import { useState } from 'react'
import { ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react'
import { api } from '../api/client'

const options = [
  { key: 'correct', label: 'Correct', icon: ThumbsUp, color: 'text-uber-green hover:bg-green-50' },
  { key: 'incorrect', label: 'Incorrect', icon: ThumbsDown, color: 'text-uber-red hover:bg-red-50' },
  { key: 'not_relevant', label: 'Not Relevant', icon: MinusCircle, color: 'text-uber-gray-500 hover:bg-uber-gray-100' },
]

export default function FeedbackButtons({ eventId, current, onFeedback }) {
  const [selected, setSelected] = useState(current || null)
  const [sending, setSending] = useState(false)

  const handleClick = async (label) => {
    if (sending) return
    setSending(true)
    try {
      await api.postFeedback(eventId, label)
      setSelected(label)
      if (onFeedback) onFeedback(eventId, label)
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-uber-gray-400 mr-1">Feedback:</span>
      {options.map(({ key, label, icon: Icon, color }) => (
        <button
          key={key}
          onClick={() => handleClick(key)}
          disabled={sending}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors
            ${selected === key ? 'ring-2 ring-uber-blue bg-blue-50 text-uber-blue' : color}`}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
