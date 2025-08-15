import Link from "next/link";
import Example from "./components/example";
import { SVGProps } from "react";
import { Button } from "@/components/ui/button";

const Vercel = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 76 65"
    fill="none" xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Vercel</title>
    <path
      d="M37.5274 0L75.0548 65H0L37.5274 0Z"
      fill="currentColor"
    />
  </svg>
)

const Home = () => (
  <div className="max-w-3xl mx-auto border-x min-h-screen divide-y divide-border">
    <div className='sticky p-4 bg-background/90 backdrop-blur-sm top-0 z-10'>
      <div className="flex items-center gap-2">
        <Vercel className="h-4 w-auto" />
        <span className="text-sm font-medium">Vercel</span>
        <div className="text-sm text-muted-foreground">/</div> 
        <div className="text-sm text-muted-foreground">Streamdown</div>
      </div>
    </div>
    <main className="py-8 space-y-4 px-4">
      <h1 className="text-4xl font-semibold tracking-tight">Streamdown</h1>
      <p>A drop-in replacement for react-markdown, designed for AI-powered streaming.</p>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="https://npmjs.com/package/streamdown">
            Download on NPM
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="https://github.com/vercel/streamdown">
            Source code
          </Link>
        </Button>
      </div>
    </main>
    <div className="p-4">
      <Example />
    </div>
  </div>
)

export default Home;