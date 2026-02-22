import fs from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const readPublicMarkdown = async (fileName: string) => {
  const fullPath = path.join(process.cwd(), 'public', fileName);
  try {
    return await fs.readFile(fullPath, 'utf8');
  } catch {
    return `# Missing file\n\nUnable to read \`${fileName}\` from public folder.`;
  }
};

const previewMarkdown = (input: string, maxLines = 48) => {
  const lines = input.split('\n');
  if (lines.length <= maxLines) return input;
  return `${lines.slice(0, maxLines).join('\n')}\n\n...`;
};

export default async function AgentsPage() {
  const skillDoc = await readPublicMarkdown('skill.md');
  const heartbeatDoc = await readPublicMarkdown('heartbeat.md');

  return (
    <main className="min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="glass rounded-2xl border border-white/10 p-6">
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-gray-300 mt-3">
            This page is the public entrypoint for automation agents. The two core files below are
            available as direct markdown URLs:
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link
              href="/skill.md"
              className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-300/30 text-emerald-200"
            >
              /skill.md
            </Link>
            <Link
              href="/heartbeat.md"
              className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-300/30 text-emerald-200"
            >
              /heartbeat.md
            </Link>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="glass rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-white">Skill Preview</h2>
              <Link
                href="/skill.md"
                className="px-3 py-1.5 rounded-full bg-[#FFD700] text-black text-xs font-bold"
              >
                View full file
              </Link>
            </div>
            <div className="prose prose-invert max-w-none prose-sm overflow-auto max-h-[70vh]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewMarkdown(skillDoc)}
              </ReactMarkdown>
            </div>
          </section>

          <section className="glass rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-white">Heartbeat Preview</h2>
              <Link
                href="/heartbeat.md"
                className="px-3 py-1.5 rounded-full bg-[#FFD700] text-black text-xs font-bold"
              >
                View full file
              </Link>
            </div>
            <div className="prose prose-invert max-w-none prose-sm overflow-auto max-h-[70vh]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewMarkdown(heartbeatDoc)}
              </ReactMarkdown>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
