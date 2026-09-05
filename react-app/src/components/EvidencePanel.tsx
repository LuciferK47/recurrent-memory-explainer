import React from 'react';

export const EvidencePanel: React.FC = () => {
  return (
    <section id="evidence" className="py-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-sm font-display text-ink-muted mb-2">05 Evidence &amp; Limitations</div>
        <h2 className="text-3xl sm:text-4xl font-display text-ink mb-3">
          What the Evidence Actually Shows
        </h2>
        <p className="text-base text-ink-muted max-w-2xl mb-8 leading-relaxed">
          Every claim needs a label: benchmark, deployment, partnership, or independent reproduction. Here's what BDH-CQ's numbers actually are.
        </p>

        {/* BDH-CQ Evidence Card */}
        <div className="bg-surface border border-border rounded-lg p-6 mb-8 shadow-sm">
          <h3 className="text-xl font-display text-ink mb-4">BDH-CQ on ARC-AGI-1</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="font-mono text-3xl font-bold text-memory mb-1">29.5%</div>
              <div className="text-xs text-ink-muted">pass@2 on ARC-AGI-1 public eval</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-truth mb-1">$0.0007</div>
              <div className="text-xs text-ink-muted">estimated cost per task</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-ink mb-1">150M</div>
              <div className="text-xs text-ink-muted">parameters</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-border bg-linen text-ink">
              self-reported benchmark
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-border bg-linen text-ink">
              partially-independent audit
            </span>
          </div>

          <p className="text-sm text-ink leading-relaxed mb-4">
            This result is reported in{' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2608.09888
            </a>
            . The "independent audit" reproducing the 29.5% figure was conducted by co-authors from partner institutions — not a fully arm's-length third party. This is a <strong>self-reported benchmark result with a partially-independent audit</strong>, not an external reproduction or a deployment.
          </p>

          <h4 className="text-sm font-semibold text-ink uppercase tracking-wide mt-4 mb-2">
            Known Limitations (from the paper itself)
          </h4>
          <ul className="list-disc list-inside text-sm text-ink space-y-1 mb-4">
            <li>A scaling-law claim is asserted without multi-scale (50M/150M/500M) ablation experiments.</li>
            <li>A language-modeling capability claim is asserted without LM experiments.</li>
            <li>Disclosed composition failure: <strong>0/72 on a specific color-swap task</strong>.</li>
            <li>No publicly available checkpoint for independent reproduction.</li>
          </ul>

          <p className="text-xs text-ink-muted italic border-t border-border pt-3 m-0">
            Source:{' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2608.09888
            </a>{' '}
            (BDH-CQ paper, limitations section) and the{' '}
            <a
              href="https://huggingface.co/papers/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              Hugging Face paper page public review thread
            </a>
            .
          </p>
        </div>

        {/* Architecture Comparison Table */}
        <div className="mb-4">
          <h3 className="text-xl font-display text-ink mb-2">Architecture Comparison</h3>
          <p className="text-sm text-ink-muted mb-4">
            How does fixed-size recurrent memory compare across recent architectures?
          </p>

          <div className="overflow-x-auto bg-surface border border-border rounded-lg shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-linen border-b-2 border-border">
                  <th className="py-3 px-4 text-xs font-semibold text-ink">System</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Memory Type</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Growth</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Write Rule</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Key Claim</th>
                  <th className="py-3 px-4 text-xs font-semibold text-ink">Evidence Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-linen/50">
                  <td className="py-3 px-4 font-semibold text-ink">Transformer</td>
                  <td className="py-3 px-4 text-ink">KV-Cache</td>
                  <td className="py-3 px-4 text-ink">O(n)</td>
                  <td className="py-3 px-4 text-ink">Append</td>
                  <td className="py-3 px-4 text-ink">Perfect recall, any length</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-linen text-truth">
                      deployed
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-linen/50">
                  <td className="py-3 px-4 font-semibold text-ink">Infini-attention</td>
                  <td className="py-3 px-4 text-ink">Fixed + local attn</td>
                  <td className="py-3 px-4 text-ink">O(1) + O(w)</td>
                  <td className="py-3 px-4 text-ink">Linear attn update</td>
                  <td className="py-3 px-4 text-ink">1M-token passkey retrieval</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-linen text-ink">
                      self-reported benchmark
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-linen/50">
                  <td className="py-3 px-4 font-semibold text-ink">Titans</td>
                  <td className="py-3 px-4 text-ink">Neural memory module</td>
                  <td className="py-3 px-4 text-ink">O(1)</td>
                  <td className="py-3 px-4 text-ink">Surprise-gated</td>
                  <td className="py-3 px-4 text-ink">2M+ token, test-time learning</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-linen text-ink">
                      self-reported benchmark
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-linen/50">
                  <td className="py-3 px-4 font-semibold text-ink">BDH</td>
                  <td className="py-3 px-4 text-ink">Synaptic matrix</td>
                  <td className="py-3 px-4 text-ink">O(1)</td>
                  <td className="py-3 px-4 text-ink">Hebbian outer-product</td>
                  <td className="py-3 px-4 text-ink">~5% sparse, monosemantic</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-linen text-ink">
                      self-reported benchmark
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-linen/50">
                  <td className="py-3 px-4 font-semibold text-ink">BDH-CQ</td>
                  <td className="py-3 px-4 text-ink">Recurrent latent state</td>
                  <td className="py-3 px-4 text-ink">O(1)</td>
                  <td className="py-3 px-4 text-ink">Demo → state write</td>
                  <td className="py-3 px-4 text-ink">29.5% ARC-AGI, $0.0007/task</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-linen text-ink">
                      partially-independent audit
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-ink-muted italic border-t border-border pt-3 mt-4 mb-0">
            Sources: Transformer (widespread deployment); Infini-attention ({' '}
            <a
              href="https://arxiv.org/abs/2404.07143"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2404.07143
            </a>
            ); Titans ({' '}
            <a
              href="https://arxiv.org/abs/2501.00663"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2501.00663
            </a>
            ); BDH ({' '}
            <a
              href="https://arxiv.org/abs/2509.26507"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2509.26507
            </a>
            ); BDH-CQ ({' '}
            <a
              href="https://arxiv.org/abs/2608.09888"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              arXiv:2608.09888
            </a>
            ).
          </p>
        </div>
      </div>
    </section>
  );
};
