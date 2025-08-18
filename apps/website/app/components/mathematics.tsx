import { Renderer } from './renderer';

const markdown = `## Inline Math

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ for solving $ax^2 + bx + c = 0$.

Euler's identity: $e^{i\\pi} + 1 = 0$ combines five fundamental mathematical constants.

## Block Math

The normal distribution probability density function:

$$
f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}
$$

## Summations and Integrals

The sum of the first $n$ natural numbers: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$

Integration by parts: $\\int u \\, dv = uv - \\int v \\, du$
`;

export const Mathematics = () => (
  <section className="space-y-16 pt-16">
    <div className="mx-auto max-w-2xl space-y-4 text-center">
      <h2 className="font-semibold text-4xl tracking-tight">
        Mathematical Expressions
      </h2>
      <p className="text-balance text-lg text-muted-foreground md:text-xl">
        Streamdown supports LaTeX math expressions through remark-math and
        KaTeX, enabling beautiful mathematical notation in your markdown.
      </p>
    </div>
    <div className="grid grid-cols-2 divide-x overflow-hidden border-t">
      <div className="divide-y">
        <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
          With react-markdown
        </div>
        <div className="h-[400px] overflow-y-auto bg-background p-4">
          <Renderer markdown={markdown} type="markdown" />
        </div>
      </div>
      <div className="divide-y">
        <div className="w-full bg-dashed p-4 text-center font-medium text-muted-foreground text-sm">
          With Streamdown
        </div>
        <div className="h-[400px] overflow-y-auto bg-background p-4">
          <Renderer markdown={markdown} type="streamdown" />
        </div>
      </div>
    </div>
  </section>
);
