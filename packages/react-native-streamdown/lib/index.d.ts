import React from 'react';
export type StreamdownProps = {
    children: string;
    parseIncompleteMarkdown?: boolean;
    style?: any;
    rules?: any;
};
export declare const Streamdown: React.MemoExoticComponent<({ children, parseIncompleteMarkdown: shouldParseIncompleteMarkdown, style, rules, ...props }: StreamdownProps) => React.JSX.Element>;
