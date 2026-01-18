import { Section } from "./section";

const markdown = `# External Links

When AI models generate content, they may include links to external websites. These links could potentially be:

- Phishing attempts disguised as legitimate URLs
- Malicious sites injected through prompt manipulation
- Tracking links that compromise user privacy

Click any of these links to see the safety modal in action:

- [OpenAI Documentation](https://platform.openai.com/docs)
- [Anthropic Console](https://console.anthropic.com)
- [Google AI Studio](https://aistudio.google.com)

The modal lets users inspect the full URL before deciding to open it, copy it for verification, or dismiss it entirely.
`;

export const LinkSafety = () => (
  <Section
    description="Protect users from malicious links with a confirmation modal that displays the full URL before navigation."
    markdown={markdown}
    title="Link safety modal"
  />
);
