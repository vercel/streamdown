export interface Guitar {
  id: number
  name: string
  image: string
  description: string
  shortDescription: string
  price: number
}

const guitars: Array<Guitar> = [
  {
    id: 1,
    name: 'Video Game Guitar',
    image: '/example-guitar-video-games.jpg',
    description:
      "The Video Game Guitar is a unique acoustic guitar that features a design inspired by video games. It has a sleek, high-gloss finish and a comfortable playability. The guitar's ergonomic body and fast neck profile ensure comfortable playability for hours on end.",
    shortDescription:
      'A unique electric guitar with a video game design, high-gloss finish, and comfortable playability.',
    price: 699,
  },
  {
    id: 2,
    name: 'Superhero Guitar',
    image: '/example-guitar-superhero.jpg',
    description:
      "The Superhero Guitar is a bold black electric guitar that stands out with its unique superhero logo design. Its sleek, high-gloss finish and powerful pickups make it perfect for high-energy performances. The guitar's ergonomic body and fast neck profile ensure comfortable playability for hours on end.",
    shortDescription:
      'A bold black electric guitar with a unique superhero logo, high-gloss finish, and powerful pickups.',
    price: 699,
  },
  {
    id: 3,
    name: 'Motherboard Guitar',
    image: '/example-guitar-motherboard.jpg',
    description:
      "This guitar is a tribute to the motherboard of a computer. It's a unique and stylish instrument that will make you feel like a hacker. The intricate circuit-inspired design features actual LED lights that pulse with your playing intensity, while the neck is inlaid with binary code patterns that glow under stage lights. Each pickup has been custom-wound to produce tones ranging from clean digital precision to glitched-out distortion, perfect for electronic music fusion. The Motherboard Guitar seamlessly bridges the gap between traditional craftsmanship and cutting-edge technology, making it the ultimate instrument for the digital age musician.",
    shortDescription:
      'A tech-inspired electric guitar featuring LED lights and binary code inlays that glow under stage lights.',
    price: 649,
  },
  {
    id: 4,
    name: 'Racing Guitar',
    image: '/example-guitar-racing.jpg',
    description:
      "Engineered for speed and precision, the Racing Guitar embodies the spirit of motorsport in every curve and contour. Its aerodynamic body, painted in classic racing stripes and high-gloss finish, is crafted from lightweight materials that allow for effortless play during extended performances. The custom low-action setup and streamlined neck profile enable lightning-fast fretwork, while specially designed pickups deliver a high-octane tone that cuts through any mix. Built with performance-grade hardware including racing-inspired control knobs and checkered flag inlays, this guitar isn't just played—it's driven to the limits of musical possibility.",
    shortDescription:
      'A lightweight, aerodynamic guitar with racing stripes and a low-action setup designed for speed and precision.',
    price: 679,
  },
  {
    id: 5,
    name: 'Steamer Trunk Guitar',
    image: '/example-guitar-steamer-trunk.jpg',
    description:
      'The Steamer Trunk Guitar is a semi-hollow body instrument that exudes vintage charm and character. Crafted from reclaimed antique luggage wood, it features brass hardware that adds a touch of elegance and durability. The fretboard is adorned with a world map inlay, making it a unique piece that tells a story of travel and adventure.',
    shortDescription:
      'A semi-hollow body guitar with brass hardware and a world map inlay, crafted from reclaimed antique luggage wood.',
    price: 629,
  },
  {
    id: 6,
    name: "Travelin' Man Guitar",
    image: '/example-guitar-traveling.jpg',
    description:
      "The Travelin' Man Guitar is an acoustic masterpiece adorned with vintage postcards from around the world. Each postcard tells a story of adventure and wanderlust, making this guitar a unique piece of art. Its rich, resonant tones and comfortable playability make it perfect for musicians who love to travel and perform.",
    shortDescription:
      'An acoustic guitar with vintage postcards, rich tones, and comfortable playability.',
    price: 499,
  },
  {
    id: 7,
    name: 'Flowerly Love Guitar',
    image: '/example-guitar-flowers.jpg',
    description:
      "The Flowerly Love Guitar is an acoustic masterpiece adorned with intricate floral designs on its body. Each flower is hand-painted, adding a touch of nature's beauty to the instrument. Its warm, resonant tones make it perfect for both intimate performances and larger gatherings.",
    shortDescription:
      'An acoustic guitar with hand-painted floral designs and warm, resonant tones.',
    price: 599,
  },
]

export default guitars
