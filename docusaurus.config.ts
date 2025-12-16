import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'EndPoint Guardian Ops',
  tagline: '終端防護攻防隊',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://npu-ego.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'NPU-EGO', // Usually your GitHub org/user name.
  projectName: 'npu-ego.github.io', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'EGO 資安攻防隊',
      logo: {
        alt: 'EGO Logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/about', label: '關於我們', position: 'left' },
        { to: '/blog', label: '最新公告', position: 'left' },
        { to: '/activities', label: '社團活動', position: 'left' },
        { to: '/bylaws', label: '社團章程', position: 'left' },
        { to: '/join', label: '加入/聯絡', position: 'left' },
        {
          href: 'https://github.com/NPU-EGO',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '導覽',
          items: [
            {
              label: '關於我們',
              to: '/about',
            },
            {
              label: '社團活動',
              to: '/activities',
            },
            {
              label: '最新公告',
              to: '/blog',
            },
            {
              label: '社團章程',
              to: '/bylaws',
            },
          ],
        },
        {
          title: '加入/聯絡',
          items: [
            {
              label: 'Email',
              href: 'mailto:contact@example.com',
            },
            {
              label: 'Discord',
              href: '#',
            },
          ],
        },
        {
          title: '社群',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/NPU-EGO',
            },
            {
              label: 'Instagram',
              href: '#',
            },
            {
              label: 'Facebook',
              href: '#',
            },
          ],
        },
        {
          title: '相關連結',
          items: [
            {
              label: '澎科大資工',
              href: 'https://csie.npu.edu.tw',
            },
            {
              label: '澎科大',
              href: 'https://www.npu.edu.tw',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} EndPoint Guardian Ops. 保留所有權利。`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
