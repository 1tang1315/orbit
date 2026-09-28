import { Fragment } from 'react';

import type { ArchNode } from '@/features/projects/actions';

export interface ArchDiagramProps {
  nodes: ArchNode[];
  /** 画布下方补充说明（不传则不渲染）。 */
  note?: string;
}

/**
 * 屏 02 架构图卡：静态数据流「A → B → C」，节点来自 project.arch（seed 已给），
 * 右上角标注 L1 全自动。
 */
export function ArchDiagram({ nodes, note }: ArchDiagramProps) {
  return (
    <section className="card arch-card">
      <div className="arch-head">
        <span className="arch-title">架构图</span>
        <span className="chip">L1 全自动</span>
      </div>
      <div className="arch-canvas">
        <div className="arch-flow">
          {nodes.map((node, index) => (
            <Fragment key={node.name}>
              {index > 0 ? <span className="arch-arrow" aria-hidden="true">→</span> : null}
              <div className="arch-node">
                <div className="arch-node-name">{node.name}</div>
                <div className="arch-node-sub">{node.sub}</div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
      {note !== undefined ? <p className="ghost-note">{note}</p> : null}
    </section>
  );
}
