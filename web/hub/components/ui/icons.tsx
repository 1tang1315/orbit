interface IconProps {
  size?: number;
}

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

/** 工作区 · 动态流。 */
export function IconPulse({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M3 12h4l2.5-7 4 14L16 12h5" />
    </svg>
  );
}

/** 工作区 · 项目。 */
export function IconGrid({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

/** 工作区 · 知识库。 */
export function IconBook({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19" />
    </svg>
  );
}

/** 工作区 · 任务看板。 */
export function IconBoard({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="3.5" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="15.5" y="4" width="5" height="7" rx="1.5" />
    </svg>
  );
}

/** 工作区 · 技术栈知识。 */
export function IconChip({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </svg>
  );
}

/** 工作区 · 复盘报告。 */
export function IconRetro({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M4 12a8 8 0 1 0 2.3-5.6" />
      <path d="M4 4v4h4" />
    </svg>
  );
}

/** 顶栏搜索。 */
export function IconSearch({ size = 16 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  );
}

/** 顶栏通知。 */
export function IconBell({ size = 16 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** 顶栏头像占位。 */
export function IconUser({ size = 16 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" />
    </svg>
  );
}

/** 加号（新建 / 接入）。 */
export function IconPlus({ size = 15 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** 文档图标（生成文档按钮）。 */
export function IconDoc({ size = 15 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

/** 右箭头（查看全部 / 去看板）。 */
export function IconArrowRight({ size = 14 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** 对勾（checklist 已完成）。 */
export function IconCheck({ size = 13 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** 侧栏品牌标。 */
export function IconLogo({ size = 18 }: IconProps) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-24 12 12)" />
    </svg>
  );
}
