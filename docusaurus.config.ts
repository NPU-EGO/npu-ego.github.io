import type {Config} from '@docusaurus/types';
import {themes as prismThemes} from 'prism-react-renderer';
import {Blob} from 'buffer';

// Polyfills for Node build environment (File + require.resolveWeak)
if (typeof (globalThis as any).File === 'undefined') {
  class NodeFile extends Blob {
    name: string;
    lastModified: number;
    constructor(parts: any[], name: string, options: any = {}) {
      super(parts, options);
      this.name = name;
      this.lastModified = options.lastModified ?? Date.now();
    }
  }
  (globalThis as any).File = NodeFile;
}

if (typeof require !== 'undefined' && typeof (require as any).resolveWeak !== 'function') {
  (require as any).resolveWeak = (id: string) => {
    try {
      return require.resolve(id);
    } catch (e) {
      return id;
    }
  };
}

const config: Config = {
  title: 'EndPoint Guardian Ops',
  tagline: '終端防護攻防隊 · 資安推廣、攻防實作、CTF 培訓',
  favicon: 'img/logo.svg',
  url: 'https://npu-ego.github.io',
  baseUrl: '/',
  organizationName: 'NPU-EGO',
  projectName: 'npu-ego.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
  onBrokenLinks: 'warn',
  ssrTemplate: undefined,
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
        },
        blog: {
          routeBasePath: 'blog',
          blogTitle: '最新公告',
          blogDescription: '社團公告與活動更新',
          showReadingTime: true,
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    image: 'img/logo.svg',
    navbar: {
      title: 'EGO 資安攻防隊',
      logo: {
        alt: 'EGO Logo',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/docs/about', label: '關於我們', position: 'left'},
        {to: '/docs/activities', label: '社團活動', position: 'left'},
        {to: '/blog', label: '最新公告', position: 'left'},
        {to: '/docs/constitution', label: '社團章程', position: 'left'},
        {to: '/docs/join-contact', label: '加入/聯絡', position: 'left'},
        {href: 'https://github.com/NPU-EGO', label: 'GitHub', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '導覽',
          items: [
            {label: '關於我們', to: '/docs/about'},
            {label: '社團活動', to: '/docs/activities'},
            {label: '最新公告', to: '/blog'},
            {label: '社團章程', to: '/docs/constitution'},
          ],
        },
        {
          title: '加入我們',
          items: [
            {label: '加入/聯絡', to: '/docs/join-contact'},
            {label: 'Email', href: 'mailto:ego@example.edu.tw'},
            {label: 'Discord', href: 'https://discord.gg/placeholder'},
          ],
        },
        {
          title: '社群',
          items: [
            {label: 'GitHub', href: 'https://github.com/NPU-EGO'},
            {label: 'Instagram', href: 'https://instagram.com/'},
            {label: 'Facebook', href: 'https://facebook.com/'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} EndPoint Guardian Ops. 保留所有權利。`,
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
    },
  },
  future: {
    experimental_router: 'hash',
  },
};

export default config;
