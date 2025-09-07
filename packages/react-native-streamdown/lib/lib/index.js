"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Streamdown = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_markdown_display_1 = __importDefault(require("react-native-markdown-display"));
const parse_blocks_1 = require("./lib/parse-blocks");
const parse_incomplete_markdown_1 = require("./lib/parse-incomplete-markdown");
const components_1 = require("./lib/components");
const Block = (0, react_1.memo)(({ content, shouldParseIncompleteMarkdown, ...props }) => {
    const parsedContent = (0, react_1.useMemo)(() => typeof content === 'string' && shouldParseIncompleteMarkdown
        ? (0, parse_incomplete_markdown_1.parseIncompleteMarkdown)(content.trim())
        : content, [content, shouldParseIncompleteMarkdown]);
    return <react_native_markdown_display_1.default {...props}>{parsedContent}</react_native_markdown_display_1.default>;
});
Block.displayName = 'Block';
exports.Streamdown = (0, react_1.memo)(({ children, parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true, style, rules, ...props }) => {
    const blocks = (0, react_1.useMemo)(() => (0, parse_blocks_1.parseMarkdownIntoBlocks)(typeof children === 'string' ? children : ''), [children]);
    const mergedRules = (0, react_1.useMemo)(() => ({ ...components_1.components, ...rules }), [rules]);
    return (<react_native_1.View style={style}>
        {blocks.map((block, index) => (<Block key={index} content={block} shouldParseIncompleteMarkdown={shouldParseIncompleteMarkdown} rules={mergedRules} {...props}/>))}
      </react_native_1.View>);
});
exports.Streamdown.displayName = 'Streamdown';
