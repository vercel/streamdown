import { Section } from './section';

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
  <Section
    description="Streamdown supports LaTeX math expressions through remark-math and KaTeX, enabling beautiful mathematical notation in your markdown."
    markdown={markdown}
    title="Mathematical Expressions"
  />
);
