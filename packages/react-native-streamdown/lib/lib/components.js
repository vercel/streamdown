"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.components = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_native_syntax_highlighter_1 = __importDefault(require("react-native-syntax-highlighter"));
const prism_1 = require("react-syntax-highlighter/styles/prism");
const react_native_katex_1 = __importDefault(require("react-native-katex"));
const { width } = react_native_1.Dimensions.get('window');
exports.components = {
    h1: ({ children }) => <react_native_1.Text style={styles.h1}>{children}</react_native_1.Text>,
    h2: ({ children }) => <react_native_1.Text style={styles.h2}>{children}</react_native_1.Text>,
    h3: ({ children }) => <react_native_1.Text style={styles.h3}>{children}</react_native_1.Text>,
    h4: ({ children }) => <react_native_1.Text style={styles.h4}>{children}</react_native_1.Text>,
    h5: ({ children }) => <react_native_1.Text style={styles.h5}>{children}</react_native_1.Text>,
    h6: ({ children }) => <react_native_1.Text style={styles.h6}>{children}</react_native_1.Text>,
    p: ({ children }) => <react_native_1.Text style={styles.p}>{children}</react_native_1.Text>,
    strong: ({ children }) => <react_native_1.Text style={styles.strong}>{children}</react_native_1.Text>,
    em: ({ children }) => <react_native_1.Text style={styles.em}>{children}</react_native_1.Text>,
    li: ({ children }) => (<react_native_1.View style={styles.li}>
      <react_native_1.Text style={styles.liDot}>{'\u2022'}</react_native_1.Text>
      <react_native_1.Text style={styles.liText}>{children}</react_native_1.Text>
    </react_native_1.View>),
    blockquote: ({ children }) => <react_native_1.View style={styles.blockquote}><react_native_1.Text style={styles.blockquoteText}>{children}</react_native_1.Text></react_native_1.View>,
    code: ({ node }) => {
        const lang = node.attributes.class?.replace('language-', '');
        const content = node.children?.[0]?.content;
        if (lang && content) {
            return (<react_native_syntax_highlighter_1.default language={lang} style={prism_1.prism}>
          {content}
        </react_native_syntax_highlighter_1.default>);
        }
        return <react_native_1.Text style={styles.code}>{content}</react_native_1.Text>;
    },
    codespan: ({ children }) => <react_native_1.Text style={styles.codespan}>{children}</react_native_1.Text>,
    hr: () => <react_native_1.View style={styles.hr}/>,
    table: ({ children }) => <react_native_1.View style={styles.table}>{children}</react_native_1.View>,
    thead: ({ children }) => <react_native_1.View style={styles.thead}>{children}</react_native_1.View>,
    tbody: ({ children }) => <react_native_1.View style={styles.tbody}>{children}</react_native_1.View>,
    tr: ({ children }) => <react_native_1.View style={styles.tr}>{children}</react_native_1.View>,
    th: ({ children }) => <react_native_1.View style={styles.th}><react_native_1.Text style={styles.thText}>{children}</react_native_1.Text></react_native_1.View>,
    td: ({ children }) => <react_native_1.View style={styles.td}><react_native_1.Text>{children}</react_native_1.Text></react_native_1.View>,
    math: ({ children }) => <react_native_katex_1.default expression={children} style={styles.katex}/>,
};
const styles = react_native_1.StyleSheet.create({
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
