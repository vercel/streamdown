import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/styles/prism';
import Katex from 'react-native-katex';

const { width } = Dimensions.get('window');

interface Node {
  attributes: {
    class?: string;
  };
  children: {
    content: string;
  }[];
}

interface ComponentProps {
  children: React.ReactNode;
}

interface CodeComponentProps {
  node: Node;
}

export const components = {
  h1: ({ children }: ComponentProps) => <Text style={styles.h1}>{children}</Text>,
  h2: ({ children }: ComponentProps) => <Text style={styles.h2}>{children}</Text>,
  h3: ({ children }: ComponentProps) => <Text style={styles.h3}>{children}</Text>,
  h4: ({ children }: ComponentProps) => <Text style={styles.h4}>{children}</Text>,
  h5: ({ children }: ComponentProps) => <Text style={styles.h5}>{children}</Text>,
  h6: ({ children }: ComponentProps) => <Text style={styles.h6}>{children}</Text>,
  p: ({ children }: ComponentProps) => <Text style={styles.p}>{children}</Text>,
  strong: ({ children }: ComponentProps) => <Text style={styles.strong}>{children}</Text>,
  em: ({ children }: ComponentProps) => <Text style={styles.em}>{children}</Text>,
  li: ({ children }: ComponentProps) => (
    <View style={styles.li}>
      <Text style={styles.liDot}>{'\u2022'}</Text>
      <Text style={styles.liText}>{children}</Text>
    </View>
  ),
  blockquote: ({ children }: ComponentProps) => <View style={styles.blockquote}><Text style={styles.blockquoteText}>{children}</Text></View>,
  code: ({ node }: CodeComponentProps) => {
    const lang = node.attributes.class?.replace('language-', '');
    const content = node.children?.[0]?.content;

    if (lang && content) {
      return (
        <SyntaxHighlighter language={lang} style={prism}>
          {content}
        </SyntaxHighlighter>
      );
    }
    return <Text style={styles.code}>{content}</Text>;
  },
  codespan: ({ children }: ComponentProps) => <Text style={styles.codespan}>{children}</Text>,
  hr: () => <View style={styles.hr} />,
  table: ({ children }: ComponentProps) => <View style={styles.table}>{children}</View>,
  thead: ({ children }: ComponentProps) => <View style={styles.thead}>{children}</View>,
  tbody: ({ children }: ComponentProps) => <View style={styles.tbody}>{children}</View>,
  tr: ({ children }: ComponentProps) => <View style={styles.tr}>{children}</View>,
  th: ({ children }: ComponentProps) => <View style={styles.th}><Text style={styles.thText}>{children}</Text></View>,
  td: ({ children }: ComponentProps) => <View style={styles.td}><Text>{children}</Text></View>,
  math: ({ children }: ComponentProps) => <Katex expression={children as string} style={styles.katex} />,
};

const styles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  h2: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  h3: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  h4: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  h5: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  h6: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  p: { fontSize: 16, marginBottom: 10 },
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  li: { flexDirection: 'row', marginBottom: 5 },
  liDot: { marginRight: 5, fontSize: 16 },
  liText: { fontSize: 16 },
  blockquote: { borderLeftWidth: 4, borderLeftColor: '#cccccc', paddingLeft: 10, marginVertical: 10, backgroundColor: '#f0f0f0' },
  blockquoteText: { fontStyle: 'italic', color: '#555555' },
  code: { fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: 2, borderRadius: 3 },
  codespan: { fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: 2, borderRadius: 3 },
  hr: { borderBottomWidth: 1, borderBottomColor: '#cccccc', marginVertical: 10 },
  table: { borderWidth: 1, borderColor: '#cccccc', borderRadius: 3, marginBottom: 10 },
  thead: { backgroundColor: '#f0f0f0' },
  tbody: {},
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#cccccc' },
  th: { flex: 1, padding: 5, fontWeight: 'bold' },
  thText: { fontWeight: 'bold' },
  td: { flex: 1, padding: 5 },
  katex: {
    width: width - 20,
  },
});
