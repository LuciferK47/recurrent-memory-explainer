import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

type ButtonVariant = 'primary' | 'tonal' | 'ghost' | 'danger';

// Literal class strings per variant (not built from a color-name variable) —
// the same Tailwind-build-scanner reason every other tone map in this app
// spells its classes out in full.
const variantClasses: Record<ButtonVariant, string> = {
  // Dark text on the bright memory cyan, not white — white-on-#00D2FF fails
  // contrast (the accent hue is a light-on-dark instrument color, so its
  // best pairing is the page's own dark ground, not literal white).
  primary: 'bg-memory text-canvas hover:bg-memory-dark shadow-sm font-semibold',
  tonal: 'bg-memory/15 text-memory border border-memory/40 hover:bg-memory/25',
  ghost: 'bg-surface border border-border/80 text-ink hover:bg-surface-elevated',
  danger: 'border border-interference/40 text-interference hover:bg-interference/10',
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-medium px-3.5 sm:px-4 py-2 sm:py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

interface ButtonAsButtonProps extends HTMLMotionProps<'button'> {
  as?: 'button';
  variant?: ButtonVariant;
}
interface ButtonAsAnchorProps extends HTMLMotionProps<'a'> {
  as: 'a';
  variant?: ButtonVariant;
}
type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

/** One spring hover/tap + one radius for every button (or button-shaped
 * link) on the page, instead of each CTA hand-rolling its own
 * `whileHover={{scale:1.02}}`. `as="a"` renders a `motion.a` — same visual
 * treatment, real anchor semantics for the hero's in-page nav links. */
export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>((props, ref) => {
  const { variant = 'tonal', className = '', children, ...rest } = props;
  const shared = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
    className: `${BASE} ${variantClasses[variant]} ${className}`,
  };
  if (props.as === 'a') {
    const { as: _as, ...anchorRest } = rest as Omit<ButtonAsAnchorProps, 'variant' | 'className' | 'children'>;
    return (
      <motion.a ref={ref as React.Ref<HTMLAnchorElement>} {...shared} {...anchorRest}>
        {children}
      </motion.a>
    );
  }
  const { as: _as, ...buttonRest } = rest as Omit<ButtonAsButtonProps, 'variant' | 'className' | 'children'>;
  return (
    <motion.button ref={ref as React.Ref<HTMLButtonElement>} {...shared} {...buttonRest}>
      {children}
    </motion.button>
  );
});
Button.displayName = 'Button';
