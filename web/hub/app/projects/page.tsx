import { redirect } from 'next/navigation';

/**
 * /projects 无独立列表路由：项目总览收口在首页网格，
 * 旧链接统一重定向，避免死链。
 */
export default function ProjectsIndexPage() {
  redirect('/');
}
