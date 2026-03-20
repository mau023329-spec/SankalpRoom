import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SankalpRoom</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:       #07080D;
          --surface:  #0D0F18;
          --surface2: #131621;
          --border:   #1E2235;
          --border2:  #252A3D;
          --primary:  #6C63FF;
          --primary2: #9B8AFF;
          --accent:   #FF6B9D;
          --green:    #34D399;
          --red:      #F87171;
          --text:     #E2E4F0;
          --text2:    #8B90A7;
          --text3:    #454960;
          --font-head: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --radius:    12px;
          --radius-sm: 8px;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
        input, textarea, select, button { font-family: var(--font-body); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .fade-in { animation: fadeIn 0.25s ease both; }
        .stagger > *:nth-child(1) { animation-delay: 0.05s; }
        .stagger > *:nth-child(2) { animation-delay: 0.10s; }
        .stagger > *:nth-child(3) { animation-delay: 0.15s; }
        .stagger > *:nth-child(4) { animation-delay: 0.20s; }
        .stagger > *:nth-child(5) { animation-delay: 0.25s; }
        .stagger > *:nth-child(6) { animation-delay: 0.30s; }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
