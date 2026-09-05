import React, { useMemo, useEffect } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const CITATIONS_MARKDOWN = `# Citations & Source Literature

This document catalogs all primary literature and foundational research referenced across the **Recurrent Memory Explainer** interactive artifact and documentation.

---

## Group A: General Recurrent Memory & In-Context Learning (2022–2026)

These peer-reviewed and preprint contributions establish the theoretical context for fixed-size recurrent memory, test-time associative writes, and capacity–interference dynamics in neural sequence models:

1. **Infini-attention (Linear Memory in Attention Blocks)**
   * **Authors**: Tsendsuren Munkhdalai, Manaal Faruqui, Siddharth Gopal
   * **Title**: *Leave No Context Behind: Efficient Infinite Context Transformers with Infini-attention*
   * **Preprint**: [arXiv:2404.07143](https://arxiv.org/abs/2404.07143) (April 2024)
   * **Relevance to Explainer**: Demonstrates how a fixed-size compressive memory state ($d \\times d$) can be updated using outer-product Hebbian-style writes alongside local masked multi-head attention, enabling bounded-memory context scaling up to 1M+ tokens without $O(n^2)$ KV-cache footprint.

2. **Titans (Test-Time Memory Modules)**
   * **Authors**: Ali Behrouz, Peilin Zhong, Vahab Mirrokni
   * **Title**: *Titans: Learning to Memorize at Test Time*
   * **Preprint**: [arXiv:2501.00663](https://arxiv.org/abs/2501.00663) (January 2025)
   * **Relevance to Explainer**: Establishes a formal distinction between fast short-term associative attention and a recurrent deep neural memory module that actively learns key–value associations at inference time, scaling to contexts beyond 2M tokens.

3. **Gated DeltaNet (Selective State Writes & Delta Rule)**
   * **Authors**: Songlin Yang, Jan Kautz, Ali Hatamizadeh (MIT CSAIL / NVIDIA; ICLR 2025)
   * **Title**: *Gated Delta Networks: Improving Mamba2 with Delta Rule*
   * **Preprint**: [arXiv:2412.06464](https://arxiv.org/abs/2412.06464) (December 2024; revised March 2025)
   * **Relevance to Explainer**: Investigates the catastrophic interference problem in outer-product recurrent matrices and proposes gating combined with the delta-rule update ($M \\leftarrow M - \\beta (M k - v) k^T$) to selectively erase outdated associations and mitigate cross-talk.

4. **Variational Linear Attention (Stable Associative Memory)**
   * **Authors**: Vishal Pandey, Gopal Singh
   * **Title**: *Variational Linear Attention: Stable Associative Memory for Long-Context Transformers*
   * **Preprint**: [arXiv:2605.11196](https://arxiv.org/abs/2605.11196) (May 2026)
   * **Relevance to Explainer**: Reframes the linear memory update as an online regularized least-squares problem with an adaptive penalty matrix maintained via the Sherman-Morrison rank-1 formula. Proves that normalizing write directions to unit length guarantees recurrence Jacobian spectral norm of exactly 1 for all sequence lengths and head dimensions (Proposition 2), with bounded state growth under bounded inputs (Proposition 1). Empirically reduces $\\|S_t\\|_F$ by $109\\times$ relative to standard linear attention at $T=1000$ and maintains substantially higher retrieval accuracy on multi-query associative recall, preserving 62% accuracy at the per-head capacity boundary. A Triton-fused kernel achieves $14\\times$ speedup over sequential Python with $\\mathcal{O}(T)$ scaling.

---

## Group B: BDH & BDH-CQ Primary Sources

Primary research from Pathway establishing the Dragon Hatchling (BDH) architecture and its in-context demonstration learning extension (BDH-CQ):

1. **The Dragon Hatchling (BDH Foundation Paper)**
   * **Authors**: Adrian Kosowski, Przemysław Uznański, Jan Chorowski, Zuzanna Stamirowska, Michał Bartoszkiewicz (Pathway Research)
   * **Title**: *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain*
   * **Preprint**: [arXiv:2509.26507](https://arxiv.org/abs/2509.26507) (September 2025)
   * **Relevance to Explainer**: Introduces the scale-free, biologically-inspired graph of neuron particles where working memory emerges directly from Hebbian synaptic plasticity ($M \\leftarrow M + v k^T$). Documents ~5% activation sparsity, monosemantic synaptic connections, and the GPU-efficient linear attention formulation (BDH-GPU, Section 4).

2. **BDH-CQ (Demonstration Learning with Recurrent Latent Reasoning)**
   * **Authors**: Björn Engdahl, Adrian Kosowski, Jan Chorowski, Zuzanna Stamirowska, Przemysław Uznański, Junlin Jiang, Rohan Phadke, Remigiusz Kinas, Richard Zhong (Pathway Research Team)
   * **Title**: *BDH-CQ: In-Context Learning with Recurrent Latent Reasoning*
   * **Preprint**: [arXiv:2608.09888](https://arxiv.org/abs/2608.09888) (August 2026)
   * **Hugging Face Paper Discussion**: [huggingface.co/papers/2608.09888](https://huggingface.co/papers/2608.09888)
   * **Relevance to Explainer**: Details how demonstration input–output pairs are absorbed directly into recurrent latent state at inference time without gradient descent or verbose chain-of-thought token generation. Evaluates the self-reported 29.5% pass@2 benchmark on ARC-AGI-1 ($0.0007/task, with a partner-institution audit) and explicitly documents the 0/72 failure on color-swap composition.

3. **Pathway BDH Reference Implementation**
   * **Source Repository**: [https://github.com/pathwaycom/bdh](https://github.com/pathwaycom/bdh)
   * **Note on Scope**: Official Pathway educational toy implementation demonstrating the neuron dynamics (labeled by Pathway as not intended to reproduce large-scale internal benchmarks).

4. **Pathway Research Documentation & Official Overviews**
   * *BDH Technical Explainer*: [pathway.com/research/bdh-explainer](https://pathway.com/research/bdh-explainer)
   * *Introducing BDH-CQ*: [pathway.com/research/introducing-bdh-cq](https://pathway.com/research/introducing-bdh-cq)

---

## Licensing & Derivative Records

- **Interactive Explainer Code**: MIT License (Copyright &copy; 2026 Team DataForge × Pathway).
- **Fonts**: Departure Mono, Inter, Fraunces (SIL Open Font License 1.1).
- **Math Engine**: KaTeX (MIT License).
`;

interface CitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitationsModal: React.FC<CitationsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const renderedHtml = useMemo(() => {
    // 1. Process inline math $...$ with KaTeX
    const processedMath = CITATIONS_MARKDOWN.replace(/\$([^\$\n]+)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), { throwOnError: false });
      } catch (err) {
        return expr;
      }
    });

    // 2. Parse markdown to clean HTML
    return marked.parse(processedMath) as string;
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citations-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-canvas border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-memory/10 text-memory border border-memory/30 font-semibold">
              DOCUMENTATION
            </span>
            <h2 id="citations-title" className="text-lg font-display font-semibold text-ink m-0">
              Primary Citations & Literature
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-border/40 text-ink-muted hover:text-ink transition-colors font-mono text-xs flex items-center gap-1"
            aria-label="Close modal"
          >
            <span className="text-base leading-none">&times;</span>
            <span className="hidden sm:inline">Close (Esc)</span>
          </button>
        </div>

        {/* Rendered Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto font-sans leading-relaxed text-ink space-y-4 prose-editorial">
          <div
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
            className="citations-content text-sm"
          />
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-ink-muted">
          <span>Source: <code className="font-mono text-[11px] bg-linen px-1 py-0.5 rounded border border-border">docs/citations.md</code></span>
          <div className="flex gap-4">
            <a
              href="https://github.com/LuciferK47/recurrent-memory-explainer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink hover:text-memory underline"
            >
              GitHub Repository
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-ink text-canvas hover:opacity-90 font-medium transition-opacity"
            >
              Back to Explainer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
