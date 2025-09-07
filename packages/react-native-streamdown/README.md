# React Native Streamdown

A React Native component for streaming Markdown. This is a refactor of the original `streamdown` package to be compatible with React Native.

## Features

-   **Streaming Markdown:** Render Markdown as it is being streamed, with support for incomplete Markdown syntax.
-   **React Native Compatible:** Built for React Native, using native components for rendering.
-   **Syntax Highlighting:** Code blocks are highlighted using `react-native-syntax-highlighter`.
-   **Math Rendering:** KaTeX is supported for rendering math expressions.
-   **Customizable:** You can provide your own components to customize the rendering of any Markdown element.

## Installation

```bash
npm install react-native-streamdown
```

or

```bash
yarn add react-native-streamdown
```

## Usage

```jsx
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Streamdown } from 'react-native-streamdown';

const markdown = `
# Hello, world!

This is a **React Native** component for streaming _Markdown_.

\`\`\`javascript
console.log('Hello, from a code block!');
\`\`\`

$$
E = mc^2
$$
`;

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Streamdown>{markdown}</Streamdown>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

export default App;
```

## Customization

You can customize the rendering of any Markdown element by providing a `rules` prop to the `Streamdown` component. The `rules` prop is an object where the keys are the names of the elements to customize (e.g., `h1`, `p`, `code`), and the values are the components to use for rendering.

```jsx
import { Text } from 'react-native';
import { Streamdown } from 'react-native-streamdown';

const customRules = {
  h1: ({ children }) => <Text style={{ fontSize: 40, color: 'red' }}>{children}</Text>,
};

const App = () => {
  return (
    <Streamdown rules={customRules}>
      # This will be red and huge!
    </Streamdown>
  );
};
```

## Limitations

-   **Mermaid Support:** Mermaid diagrams are not supported in this version.

## License

This project is licensed under the Apache-2.0 License.
