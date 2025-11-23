import { Link, createFileRoute } from '@tanstack/react-router'
import guitars from '../../data/example-guitars'

export const Route = createFileRoute('/example/guitars/')({
  component: GuitarsIndex,
})

function GuitarsIndex() {
  return (
    <div className="bg-black text-white p-5">
      <h1 className="text-3xl font-bold mb-8 text-center">Featured Guitars</h1>
      <div className="flex flex-wrap gap-12 justify-center">
        {guitars.map((guitar) => (
          <div
            key={guitar.id}
            className="w-full md:w-[calc(50%-1.5rem)] xl:w-[calc(33.333%-2rem)] relative mb-24"
          >
            <Link
              to="/example/guitars/$guitarId"
              params={{
                guitarId: guitar.id.toString(),
              }}
            >
              <div className="relative z-0 w-full aspect-square mb-8">
                <div className="w-full h-full overflow-hidden rounded-2xl border-4 border-gray-800 shadow-2xl">
                  <img
                    src={guitar.image}
                    alt={guitar.name}
                    className="w-full h-full object-cover guitar-image group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-500/80 text-white px-4 py-2 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                  View Details
                </div>
              </div>

              <div className="absolute bottom-0 right-0 z-10 w-[80%] bg-gray-900/60 backdrop-blur-md rounded-2xl p-5 border border-gray-800/50 shadow-xl transform translate-y-[40%]">
                <h2 className="text-xl font-bold mb-2">{guitar.name}</h2>
                <p className="text-gray-300 mb-3 line-clamp-2">
                  {guitar.shortDescription}
                </p>
                <div className="text-xl font-bold text-emerald-400">
                  ${guitar.price}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
