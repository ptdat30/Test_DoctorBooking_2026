import { motion } from 'framer-motion';

/**
 * 3D lift card — adapted from perspective + wrapper pattern.
 * Wrapper (shadow layer) and content move at different speeds on hover.
 */
const PlatformRoleCard = ({ icon: Icon, name, desc, motionProps }) => (
  <motion.div {...motionProps} className="h-full">
    <div className="perspective-role-card h-full min-h-[220px]">
      <div className="perspective-role-card__wrapper" aria-hidden="true" />
      <div className="perspective-role-card__content">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <Icon className="w-6 h-6 text-neutral-400 transition-colors duration-500" strokeWidth={1.5} />
        </div>
        <div className="mt-6 flex flex-1 flex-col">
          <p className="font-semibold text-sm text-neutral-900 leading-snug">{name}</p>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed flex-1">{desc}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

export default PlatformRoleCard;
