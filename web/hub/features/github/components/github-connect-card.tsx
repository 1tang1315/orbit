'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formatRelative } from '@/components/ui/format';
import type { GithubRepo, GithubStatus } from '../actions';
import { ImportRepoButton } from './import-repo-button';
import '../styles.scss';

export interface GithubConnectCardProps {
  status: GithubStatus;
  repos: GithubRepo[];
}

/** 单个仓库行：全名链接 + 私有/语言标签 + 推送时间 + 导入按钮。 */
function RepoRow({ repo }: { repo: GithubRepo }) {
  return (
    <li className="gh-repo-row">
      <div className="gh-repo-main">
        <div className="gh-repo-title">
          <Link href={repo.htmlUrl} target="_blank" className="gh-repo-name">
            {repo.fullName}
          </Link>
          {repo.isPrivate ? <span className="tag tag-pending">私有</span> : null}
          {repo.language ? <span className="tag">{repo.language}</span> : null}
        </div>
        <p className="gh-repo-desc">{repo.description ?? '暂无描述'}</p>
      </div>
      <div className="gh-repo-side">
        <span className="gh-repo-pushed">
          {repo.pushedAt ? `推送于 ${formatRelative(repo.pushedAt)}` : '暂无推送'}
        </span>
        <ImportRepoButton fullName={repo.fullName} imported={repo.imported} />
      </div>
    </li>
  );
}

/**
 * 按 owner 登录名归组（保持传入顺序，传入按最近推送倒序）。
 * 只用于下拉选项的生成与计数，列表本身始终平铺。
 */
function groupByOwner(repos: GithubRepo[]): Array<{ owner: string; rows: GithubRepo[] }> {
  const groups = new Map<string, GithubRepo[]>();
  for (const repo of repos) {
    const rows = groups.get(repo.ownerLogin);
    if (rows) {
      rows.push(repo);
    } else {
      groups.set(repo.ownerLogin, [repo]);
    }
  }
  return [...groups].map(([owner, rows]) => ({ owner, rows }));
}

/**
 * 首页「GitHub 账户接入」卡：连接状态 + 仓库列表（一键导入）。
 *
 * 头部下拉按「全部 / 组织 / 个人 + 按组织细分」筛选，列表内部不分组、
 * 始终按最近推送倒序平铺（开发规范 02 §2.3：组件内自治状态用客户端组件）。
 */
export function GithubConnectCard({ status, repos }: GithubConnectCardProps) {
  const [filter, setFilter] = useState('all');

  const orgRepos = repos.filter((repo) => repo.ownerType === 'Organization');
  const personalRepos = repos.filter((repo) => repo.ownerType !== 'Organization');
  const orgGroups = groupByOwner(orgRepos);

  const visibleRepos = repos.filter((repo) => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'org') {
      return repo.ownerType === 'Organization';
    }
    if (filter === 'personal') {
      return repo.ownerType !== 'Organization';
    }
    if (filter.startsWith('owner:')) {
      return repo.ownerLogin === filter.slice('owner:'.length);
    }
    return true;
  });

  return (
    <section className="card workspace-block gh-card">
      <div className="card-title">
        <span className="gh-card-head">
          <span className={`status-dot${status.connected ? '' : ' gh-dot-off'}`} />
          GitHub 账户接入
        </span>
        {status.connected ? (
          <span className="gh-card-tools">
            <span className="chip">{`@${status.login}`}</span>
            {repos.length > 0 ? (
              <select
                className="gh-filter-select"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="仓库筛选"
              >
                <option value="all">{`全部 · ${repos.length}`}</option>
                <option value="org">{`组织 · ${orgRepos.length}`}</option>
                <option value="personal">{`个人 · ${personalRepos.length}`}</option>
                {orgGroups.length > 0 ? (
                  <optgroup label="按组织">
                    {orgGroups.map(({ owner, rows }) => (
                      <option key={owner} value={`owner:${owner}`}>
                        {`${owner} · ${rows.length}`}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            ) : null}
          </span>
        ) : null}
      </div>

      {status.connected ? (
        repos.length > 0 ? (
          <div className="gh-repo-list">
            {visibleRepos.length > 0 ? (
              <ul className="gh-rows">
                {visibleRepos.map((repo) => (
                  <RepoRow key={repo.fullName} repo={repo} />
                ))}
              </ul>
            ) : (
              <p className="muted">该筛选条件下没有仓库。</p>
            )}
          </div>
        ) : (
          <p className="muted">账户下没有可用仓库（或均为空仓库）。</p>
        )
      ) : (
        <div className="gh-connect-hint">
          {status.error ? <p className="gh-connect-error">{status.error}</p> : null}
          <ol className="gh-connect-steps">
            <li>
              到 GitHub → Settings → Developer settings →
              {' '}
              <Link href="https://github.com/settings/personal-access-tokens" target="_blank">
                Fine-grained tokens
              </Link>
              {' '}
              生成只读 token（勾选仓库 read 权限）。
            </li>
            <li>把 token 写入 web/hub/.env.local 的 GITHUB_TOKEN 一行。</li>
            <li>重启 dev 服务后刷新本页，仓库列表会出现在这里。</li>
          </ol>
        </div>
      )}
    </section>
  );
}
