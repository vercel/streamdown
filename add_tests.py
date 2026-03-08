content = open('packages/streamdown/__tests__/custom-renderer.test.tsx').read()

# The triple backtick strings - use chr(96)*3 to avoid issues
bt = chr(96) * 3

addition = f"""
  it("passes meta prop to custom renderer when metastring is present", async () => {{
    const MetaRenderer = ({{ meta }}: CustomRendererProps) => (
      <div data-meta={{meta ?? ""}} data-testid="meta-renderer" />
    );
    const {{ container }} = render(
      <Streamdown
        plugins={{{{
          renderers: [{{ language: "rust", component: MetaRenderer }}],
        }}}}
      >
        {{'{bt}rust {{1}} title="foo"\\nlet x = 1;\\n{bt}'}}
      </Streamdown>
    );

    await waitFor(() => {{
      const el = container.querySelector('[data-testid="meta-renderer"]');
      expect(el?.getAttribute("data-meta")).toBe('{{1}} title="foo"');
    }});
  }});

  it("passes undefined meta when no metastring present", async () => {{
    const MetaRenderer = ({{ meta }}: CustomRendererProps) => (
      <div
        data-has-meta={{meta !== undefined ? "true" : "false"}}
        data-testid="meta-renderer"
      />
    );
    const {{ container }} = render(
      <Streamdown
        plugins={{{{
          renderers: [{{ language: "rust", component: MetaRenderer }}],
        }}}}
      >
        {{"{bt}rust\\nlet x = 1;\\n{bt}"}}
      </Streamdown>
    );

    await waitFor(() => {{
      const el = container.querySelector('[data-testid="meta-renderer"]');
      expect(el?.getAttribute("data-has-meta")).toBe("false");
    }});
  }});
"""

idx = content.rfind('});')
new_content = content[:idx] + addition + content[idx:]
open('packages/streamdown/__tests__/custom-renderer.test.tsx', 'w').write(new_content)
print('done')
