'use client';

import { useRouter } from 'next/navigation';

export interface BranchFilterSelectProps {
  projectId: string;
  /** 可选分支名列表（来自 GitHub 实时分支）。 */
  branches: string[];
  /** 当前选中分支；空串表示全部（默认分支的提交）。 */
  active: string;
}

/**
 * 提交历史头部的分支筛选下拉：选中后以 ?tab=commits&branch=… 触发
 * 服务端按该分支重新拉取提交（GitHub /commits 仅返回单分支，需 sha 参数）。
 */
export function BranchFilterSelect({ projectId, branches, active }: BranchFilterSelectProps) {
  const router = useRouter();

  return (
    <select
      className="branch-filter-select"
      value={active}
      onChange={(event) => {
        const branch = event.target.value;
        const query = branch
          ? `?tab=commits&branch=${encodeURIComponent(branch)}`
          : '?tab=commits';
        router.push(`/projects/${projectId}${query}`);
      }}
      aria-label="按分支筛选提交"
    >
      {/* 不带 sha 的 /commits 返回默认分支提交，故基础选项如实标注 */}
      <option value="">默认分支</option>
      {branches.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
