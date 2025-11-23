import { useNavigate } from '@tanstack/react-router'

import { showAIAssistant } from './example-AIAssistant'

import guitars from '../data/example-guitars'

export default function GuitarRecommendation({ id }: { id: string }) {
  const navigate = useNavigate()
  const guitar = guitars.find((guitar) => guitar.id === +id)
  if (!guitar) {
    return null
  }
  return (
    <div className="my-4 rounded-lg overflow-hidden border border-orange-500/20 bg-gray-800/50">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img
          src={guitar.image}
          alt={guitar.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{guitar.name}</h3>
        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
          {guitar.shortDescription}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-emerald-400">
            ${guitar.price}
          </div>
          <button
            onClick={() => {
              navigate({
                to: '/example/guitars/$guitarId',
                params: { guitarId: guitar.id.toString() },
              })
              showAIAssistant.setState(() => false)
            }}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-1.5 rounded-lg text-sm hover:opacity-90 transition-opacity"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
