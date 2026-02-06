import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import 'katex/dist/katex.min.css';

export default function BlogPost({ content }: { content: string }) {
  return (
    <Streamdown
      mode="static"
      plugins={{ code, math }}
      shikiTheme={['github-light', 'github-dark']}
      linkSafety={{ enabled: false }}
    >
      {content}
    </Streamdown>
  );
}
