import React from 'react';
import { motion } from 'motion/react';
import { IsoIllustration } from './illustrations/IsoIllustration';
import { Reveal, StaggerGroup, StaggerItem } from './ui/Reveal';
import { Panel } from './ui/Panel';
import { Badge } from './ui/Badge';
import { SectionHeader } from './ui/SectionHeader';

type EvidenceTone = 'deployed' | 'self-reported' | 'audited';
type GrowthKind = 'linear' | 'constant' | 'constant-window';

interface ArchRow {
  system: string;
  memoryType: string;
  growth: GrowthKind;
  growthLabel: string;
  writeRule: string;
  keyClaim: string;
  evidenceLabel: string;
  tone: EvidenceTone;
  /** BDH-CQ — the row this whole page is actually about. */
  highlight?: boolean;
}

const ARCH_ROWS: readonly ArchRow[] = [
  {
    system: 'Transformer',
    memoryType: 'KV-Cache',
    growth: 'linear',
    growthLabel: 'O(n)',
    writeRule: 'Append',
    keyClaim: 'Perfect recall, any length',
    evidenceLabel: 'deployed',
    tone: 'deployed',
  },
  {
    system: 'Infini-attention',
    memoryType: 'Fixed + local attn',
    growth: 'constant-window',
    growthLabel: 'O(1) + O(w)',
    writeRule: 'Linear attn update',
    keyClaim: '1M-token passkey retrieval',
    evidenceLabel: 'self-reported benchmark',
    tone: 'self-reported',
  },
  {
    system: 'Titans',
    memoryType: 'Neural memory module',
    growth: 'constant',
    growthLabel: 'O(1)',
    writeRule: 'Surprise-gated',
    keyClaim: '2M+ token, test-time learning',
    evidenceLabel: 'self-reported benchmark',
    tone: 'self-reported',
  },
  {
    system: 'BDH',
    memoryType: 'Synaptic matrix',
    growth: 'constant',
    growthLabel: 'O(1)',
    writeRule: 'Hebbian outer-product',
    keyClaim: '~5% sparse, monosemantic',
    evidenceLabel: 'self-reported benchmark',
    tone: 'self-reported',
  },
  {
    system: 'BDH-CQ',
    memoryType: 'Recurrent latent state',
    growth: 'constant',
    growthLabel: 'O(1)',
    writeRule: 'Demo → state write',
    keyClaim: '29.5% ARC-AGI, $0.0007/task',
    evidenceLabel: 'partially-independent audit',
    tone: 'audited',
    highlight: true,
  },
];

/** A tiny inline growth-shape sparkline — the actual point of this table's
 * Growth column (rises without bound vs. stays flat), previously only
 * spelled out in text (O(n) vs O(1)) rather than shown. */
const GrowthSpark: React.FC<{ kind: GrowthKind }> = ({ kind }) => {
  const color = kind === 'linear' ? '#FF6B6B' : '#00D2FF';
  const path = kind === 'linear' ? 'M2,17 L58,3' : kind === 'constant-window' ? 'M2,11 L38,11 L58,7' : 'M2,11 L58,11';
  const dotY = kind === 'linear' ? 3 : kind === 'constant-window' ? 7 : 11;
  return (
    <svg width="60" height="20" viewBox="0 0 60 20" className="overflow-visible shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <circle cx={58} cy={dotY} r={2.2} fill={color} />
    </svg>
  );
};

export const EvidencePanel: React.FC = () => {
  return (
    <section id="evidence" className="py-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <SectionHeader
          eyebrow="05 Evidence & Limitations"
          title="What the Evidence Actually Shows"
          lede="Every claim needs a label: benchmark, deployment, partnership, or independent reproduction. Here's what BDH-CQ's numbers actually are."
          icon={<IsoIllustration name="data-vault" size={92} className="hidden sm:block shrink-0" />}
          className="mb-8"
        />

        {/* BDH-CQ Evidence Card */}
        <Reveal className="mb-8">
        <Panel tone="data" className="p-6">
          <h3 className="text-xl font-display text-ink mb-4">BDH-CQ on ARC-AGI-1</h3>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <StaggerItem className="bg-surface-elevated/40 border border-border/80 rounded-lg p-4">
              <div className="font-mono text-3xl font-bold text-memory mb-1 shadow-[0_0_12px_rgba(0,210,255,0.2)]">29.5%</div>
              <div className="text-xs text-ink-muted">pass@2 on ARC-AGI-1 public eval</div>
            </StaggerItem>
            <StaggerItem className="bg-surface-elevated/40 border border-border/80 rounded-lg p-4">
              <div className="font-mono text-3xl font-bold text-truth mb-1 shadow-[0_0_12px_rgba(52,211,153,0.2)]">$0.0007</div>
              <div className="text-xs text-ink-muted">estimated cost per task</div>
            </StaggerItem>
            <StaggerItem className="bg-surface-elevated/40 border border-border/80 rounded-lg p-4">
              <div className="font-mono text-3xl font-bold text-ink mb-1">150M</div>
              <div className="text-xs text-ink-muted">parameters</div>
            </StaggerItem>
          </StaggerGroup>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge tone="self-reported">self-reported benchmark</Badge>
            <Badge tone="audited">partially-independent audit</Badge>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed mb-4">
            This result is reported in{' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              arXiv:2608.09888
            </a>
            . The "independent audit" reproducing the 29.5% figure was conducted by co-authors from partner institutions — not a fully arm's-length third party. This is a <strong className="text-ink">self-reported benchmark result with a partially-independent audit</strong>, not an external reproduction or a deployment.
          </p>

          <h4 className="text-sm font-semibold text-ink uppercase tracking-wide mt-4 mb-2 font-mono">
            Known Limitations (from the paper itself)
          </h4>
          <ul className="list-disc list-inside text-sm text-ink-muted space-y-1.5 mb-4">
            <li>A scaling-law claim is asserted without multi-scale (50M/150M/500M) ablation experiments.</li>
            <li>A language-modeling capability claim is asserted without LM experiments.</li>
            <li>Disclosed composition failure: <strong className="text-interference">0/72 on a specific color-swap task</strong>.</li>
            <li>No publicly available checkpoint for independent reproduction.</li>
          </ul>

          <p className="text-xs text-ink-muted italic border-t border-border/70 pt-3 m-0">
            Source:{' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              arXiv:2608.09888
            </a>{' '}
            (BDH-CQ paper, limitations section) and the{' '}
            <a
              href="https://huggingface.co/papers/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              Hugging Face paper page public review thread
            </a>
            .
          </p>
        </Panel>
        </Reveal>

        {/* Architecture Comparison Table */}
        <Reveal className="mb-4">
          <h3 className="text-xl font-display text-ink mb-2">Architecture Comparison</h3>
          <p className="text-sm text-ink-muted mb-4">
            How does fixed-size recurrent memory compare across recent architectures?
          </p>

          {/* >=md: the semantic table, real chrome. Below md: a separate
              stacked-card list (below), not this table with columns hidden
              — a hidden-cell table still ships full markup to a screen
              reader and a horizontally-scrolling table on a touch device is
              a poor experience either way. */}
          <Panel className="overflow-x-auto p-2 sm:p-3 hidden md:block">
            <table className="w-full text-left text-sm border-separate" style={{ borderSpacing: '0 6px' }}>
              <thead>
                <tr>
                  <th className="py-2 px-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.1em]">System</th>
                  <th className="py-2 px-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.1em]">Memory Type</th>
                  <th className="py-2 px-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.1em]">Growth</th>
                  <th className="py-2 px-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.1em]">Write Rule</th>
                  <th className="py-2 px-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.1em] hidden lg:table-cell">
                    Key Claim
                  </th>
                  <th className="py-2 px-4 text-[10px] font-semibold text-ink-muted uppercase tracking-[0.1em]">Evidence Level</th>
                </tr>
              </thead>
              <tbody>
                {ARCH_ROWS.map((row, i) => (
                  <motion.tr
                    key={row.system}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -2 }}
                    className="group"
                    style={{ transition: 'box-shadow 0.2s' }}
                  >
                    <td
                      className={`py-3 pl-4 pr-4 rounded-l-xl border-y border-l font-semibold text-ink group-hover:bg-surface-elevated/70 transition-colors ${
                        row.highlight ? 'bg-memory/[0.06] border-memory/30' : 'bg-surface border-border/60'
                      }`}
                      style={{ borderLeftWidth: 3, borderLeftColor: row.growth === 'linear' ? '#FF6B6B' : '#00D2FF' }}
                    >
                      {row.system}
                      {row.highlight && (
                        <span className="ml-2 align-middle whitespace-nowrap text-[9px] font-mono font-semibold uppercase tracking-wide text-memory bg-memory/10 border border-memory/30 rounded-full px-1.5 py-0.5">
                          this page
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 border-y text-ink-muted group-hover:bg-surface-elevated/70 transition-colors ${
                        row.highlight ? 'bg-memory/[0.06] border-memory/30' : 'bg-surface border-border/60'
                      }`}
                    >
                      {row.memoryType}
                    </td>
                    <td
                      className={`py-3 px-4 border-y group-hover:bg-surface-elevated/70 transition-colors ${
                        row.highlight ? 'bg-memory/[0.06] border-memory/30' : 'bg-surface border-border/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <GrowthSpark kind={row.growth} />
                        <span className={`font-mono text-xs ${row.growth === 'linear' ? 'text-interference' : 'text-memory'}`}>
                          {row.growthLabel}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-3 px-4 border-y text-ink-muted group-hover:bg-surface-elevated/70 transition-colors ${
                        row.highlight ? 'bg-memory/[0.06] border-memory/30' : 'bg-surface border-border/60'
                      }`}
                    >
                      {row.writeRule}
                    </td>
                    <td
                      className={`py-3 px-4 border-y text-ink-muted hidden lg:table-cell group-hover:bg-surface-elevated/70 transition-colors ${
                        row.highlight ? 'bg-memory/[0.06] border-memory/30' : 'bg-surface border-border/60'
                      }`}
                    >
                      {row.keyClaim}
                    </td>
                    <td
                      className={`py-3 pr-4 pl-4 rounded-r-xl border-y border-r group-hover:bg-surface-elevated/70 transition-colors ${
                        row.highlight ? 'bg-memory/[0.06] border-memory/30' : 'bg-surface border-border/60'
                      }`}
                    >
                      <Badge tone={row.tone}>{row.evidenceLabel}</Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* <md: the same data as real stacked cards, not a table with
              columns hidden — every field is present, nothing needs a wider
              screen to read. */}
          <StaggerGroup className="md:hidden space-y-3">
            {ARCH_ROWS.map(row => (
              <StaggerItem key={row.system}>
                <Panel
                  className={`p-4 border-l-4 ${row.growth === 'linear' ? 'border-l-interference' : 'border-l-memory'} ${
                    row.highlight ? 'bg-memory/[0.06]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-semibold text-ink text-sm">
                      {row.system}
                      {row.highlight && (
                        <span className="ml-2 align-middle whitespace-nowrap text-[9px] font-mono font-semibold uppercase tracking-wide text-memory bg-memory/10 border border-memory/30 rounded-full px-1.5 py-0.5">
                          this page
                        </span>
                      )}
                    </span>
                    <Badge tone={row.tone}>{row.evidenceLabel}</Badge>
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
                    <dt className="text-ink-faint">Memory Type</dt>
                    <dd className="text-ink-muted">{row.memoryType}</dd>
                    <dt className="text-ink-faint">Growth</dt>
                    <dd className="flex items-center gap-2">
                      <GrowthSpark kind={row.growth} />
                      <span className={`font-mono ${row.growth === 'linear' ? 'text-interference' : 'text-memory'}`}>
                        {row.growthLabel}
                      </span>
                    </dd>
                    <dt className="text-ink-faint">Write Rule</dt>
                    <dd className="text-ink-muted">{row.writeRule}</dd>
                    <dt className="text-ink-faint">Key Claim</dt>
                    <dd className="text-ink-muted">{row.keyClaim}</dd>
                  </dl>
                </Panel>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <p className="text-xs text-ink-muted italic border-t border-border/70 pt-3 mt-4 mb-0">
            Sources: Transformer (widespread deployment); Infini-attention ({' '}
            <a
              href="https://arxiv.org/abs/2404.07143"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              arXiv:2404.07143
            </a>
            ); Titans ({' '}
            <a
              href="https://arxiv.org/abs/2501.00663"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              arXiv:2501.00663
            </a>
            ); BDH ({' '}
            <a
              href="https://arxiv.org/abs/2509.26507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              arXiv:2509.26507
            </a>
            ); BDH-CQ ({' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-memory underline"
            >
              arXiv:2608.09888
            </a>
            ).
          </p>
        </Reveal>
      </div>
    </section>
  );
};
