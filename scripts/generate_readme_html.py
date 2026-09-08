import re

with open('README.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

html = md_content

# Code blocks
def replace_code_blocks(match):
    code = match.group(2)
    code = code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return f'<pre><code>{code}</code></pre>'

html = re.sub(r'```([a-zA-Z0-9_-]*)\n(.*?)```', replace_code_blocks, html, flags=re.DOTALL)

# Inline code
html = re.sub(r'`([^`\n]+)`', r'<code>\1</code>', html)

# Headers
html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.M)
html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.M)
html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.M)
html = re.sub(r'^---$', r'<hr/>', html, flags=re.M)

# Badges and images
html = re.sub(r'\[\!\[(.*?)\]\((.*?)\)\]\((.*?)\)', r'<a href="\3" target="_blank" rel="noopener noreferrer"><img src="\2" alt="\1" style="vertical-align:middle; margin-right:4px; margin-bottom:4px;"/></a>', html)

# Links
html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', html)

# Bold and italic
html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)

# Blockquotes and tables
def process_blockquotes_and_tables(text):
    lines = text.split('\n')
    out = []
    in_table = False
    table_lines = []
    
    for line in lines:
        if line.strip().startswith('|') and line.strip().endswith('|'):
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
        else:
            if in_table:
                out.append('<div class="table-container"><table>')
                header_cols = [c.strip() for c in table_lines[0].split('|')[1:-1]]
                out.append('<thead><tr>' + ''.join(f'<th>{c}</th>' for c in header_cols) + '</tr></thead><tbody>')
                for row_line in table_lines[2:]:
                    cols = [c.strip() for c in row_line.split('|')[1:-1]]
                    out.append('<tr>' + ''.join(f'<td>{c}</td>' for c in cols) + '</tr>')
                out.append('</tbody></table></div>')
                in_table = False
                table_lines = []
            
            if line.strip().startswith('>'):
                quote_text = line.strip().lstrip('>').strip()
                out.append(f'<blockquote>{quote_text}</blockquote>')
            elif line.strip().startswith('- '):
                out.append(f'<ul><li>{line.strip()[2:]}</li></ul>')
            elif re.match(r'^\d+\.\s+', line.strip()):
                content = re.sub(r'^\d+\.\s+', '', line.strip())
                out.append(f'<ol><li>{content}</li></ol>')
            elif line.strip().startswith('<h') or line.strip().startswith('<hr') or line.strip().startswith('<pre') or line.strip() == '':
                out.append(line)
            else:
                out.append(f'<p>{line}</p>')
                
    if in_table:
        out.append('<div class="table-container"><table><tbody>')
        for row_line in table_lines:
            cols = [c.strip() for c in row_line.split('|')[1:-1]]
            out.append('<tr>' + ''.join(f'<td>{c}</td>' for c in cols) + '</tr>')
        out.append('</tbody></table></div>')
        
    return '\n'.join(out)

body = process_blockquotes_and_tables(html)

template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>README — Recurrent Memory Explainer</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
        onload="renderMathInElement(document.body, {{delimiters: [{{left: '$$', right: '$$', display: true}}, {{left: '$', right: '$', display: false}}]}});"></script>
    <style>
        :root {{
            /* Matches react-app/src/index.css's :root and docs/citations.html —
               all three should read as the same dark surface. */
            --bg-canvas: #08161B;
            --bg-surface: #16262F;
            --text-ink: #EAF2F5;
            --text-muted: #9DB2BC;
            --border: rgba(255, 255, 255, 0.08);
            --accent-memory: #00D2FF;
            --font-display: 'Fraunces', serif;
            --font-body: 'Inter', -apple-system, sans-serif;
            --font-mono: ui-monospace, SFMono-Regular, monospace;
        }}
        body {{
            background-color: var(--bg-canvas);
            color: var(--text-ink);
            font-family: var(--font-body);
            line-height: 1.6;
            margin: 0;
            padding: 2rem 1rem;
        }}
        .container {{
            max-width: 860px;
            margin: 0 auto;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2.5rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }}
        .nav-back {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--accent-memory);
            text-decoration: none;
            margin-bottom: 1.5rem;
            padding: 0.35rem 0.75rem;
            background: rgba(0, 210, 255, 0.08);
            border: 1px solid rgba(0, 210, 255, 0.2);
            border-radius: 6px;
        }}
        .nav-back:hover {{
            background: rgba(0, 210, 255, 0.15);
        }}
        h1 {{
            font-family: var(--font-display);
            font-size: 2.25rem;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 1rem;
            letter-spacing: -0.02em;
            color: #FFFFFF;
        }}
        h2 {{
            font-family: var(--font-display);
            font-size: 1.4rem;
            font-weight: 600;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.5rem;
            color: #F8FAFC;
        }}
        hr {{
            border: 0;
            border-top: 1px solid var(--border);
            margin: 2rem 0;
        }}
        a {{
            color: var(--accent-memory);
            text-decoration: underline;
            text-underline-offset: 2px;
        }}
        blockquote {{
            border-left: 3px solid var(--accent-memory);
            padding-left: 1rem;
            margin: 1rem 0;
            color: var(--text-muted);
            font-style: italic;
            background: rgba(0, 210, 255, 0.05);
            border-radius: 0 6px 6px 0;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
        }}
        pre {{
            background: #030A0D;
            color: #E2E8F0;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: 0.85rem;
            line-height: 1.5;
            margin: 1rem 0;
            border: 1px solid var(--border);
        }}
        code {{
            font-family: var(--font-mono);
            font-size: 0.85em;
            background: rgba(255, 255, 255, 0.08);
            padding: 0.15rem 0.35rem;
            border-radius: 4px;
            color: var(--accent-memory);
        }}
        pre code {{
            background: transparent;
            padding: 0;
            color: inherit;
        }}
        .table-container {{
            overflow-x: auto;
            margin: 1.5rem 0;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }}
        th, td {{
            border: 1px solid var(--border);
            padding: 0.5rem 0.75rem;
            text-align: left;
        }}
        th {{
            background: #1B2E38;
            font-weight: 600;
            color: #F8FAFC;
        }}
        tr:nth-child(even) {{
            background: rgba(255, 255, 255, 0.02);
        }}
    </style>
</head>
<body>
    <div class="container">
        <a href="./" class="nav-back">← Back to Interactive Explainer</a>
        {body}
    </div>
</body>
</html>'''

with open('docs/readme.html', 'w', encoding='utf-8') as f:
    f.write(template)
with open('react-app/public/readme.html', 'w', encoding='utf-8') as f:
    f.write(template)
print('Successfully generated docs/readme.html and react-app/public/readme.html')
