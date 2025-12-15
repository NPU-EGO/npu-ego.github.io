import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: '社團介紹',
      collapsible: false,
      items: ['about', 'officers', 'activities', 'announcements', 'constitution', 'join-contact'],
    },
  ],
};

export default sidebars;
