import { Section } from "./section";

const markdown = `# Real-time Updates

When streaming content from an AI model, users need visual feedback that more content is coming. Without a clear indicator, it can be difficult to tell if the response is still generating or has finished.

A blinking caret at the end of the content provides immediate visual feedback. Users can see at a glance that the model is still thinking and more text is on the way.

This is especially important for longer responses where users might scroll up to read earlier content. The caret ensures they know the stream hasn't ended prematurely.
`;

export const Caret = () => (
  <Section
    description="Show users that content is still being generated with built-in caret styles — block or circle."
    markdown={markdown}
    streamdownProps={{ caret: "block" }}
    title="Streaming caret indicators"
  />
);
