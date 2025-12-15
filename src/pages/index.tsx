import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './index.module.css';

const quickLinks = [
  {title: '關於我們', description: '認識終端防護攻防隊的宗旨與使命。', to: '/docs/about'},
  {title: '幹部與指導老師', description: '了解社團的組織架構與聯絡窗口。', to: '/docs/officers'},
  {title: '社團活動', description: '查看常態課程、CTF 訓練與工作坊。', to: '/docs/activities'},
  {title: '最新公告', description: '掌握最新活動與重要訊息。', to: '/blog'},
  {title: '社團章程', description: '閱讀章程與權利義務。', to: '/docs/constitution'},
  {title: '加入/聯絡', description: '加入我們或透過社群媒體聯絡。', to: '/docs/join-contact'},
];

const highlights = {
  activities: [
    {title: 'CTF 基礎技巧夜讀', meta: '每週三 19:00 · EB-305', tag: '訓練'},
    {title: '資安講座：雲端防護實務', meta: '1/12（週五）· 邀請業界講師', tag: '講座'},
  ],
  announcements: [
    {title: '寒假集訓報名開放中', meta: '報名截止：1/5', tag: '公告'},
    {title: '社費繳交通知', meta: '本學期 300 元 · 總務收費', tag: '行政'},
  ],
};

function Hero() {
  return (
    <header className={clsx('hero hero--dark', styles.hero)}>
      <div className="container">
        <p className={styles.kicker}>EndPoint Guardian Ops</p>
        <h1 className="hero__title">終端防護攻防隊</h1>
        <p className="hero__subtitle">
          推廣資安知識、強化防護能力、培養攻防實作與 CTF 競賽實力。
        </p>
        <div className={styles.ctaRow}>
          <Link className={clsx('button button--primary button--lg', styles.ctaButton)} to="/docs/join-contact">
            加入我們
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/activities">
            查看課程與活動
          </Link>
        </div>
      </div>
    </header>
  );
}

function QuickLinks() {
  return (
    <section className="container margin-top--lg margin-bottom--lg">
      <div className="row">
        <div className="col col--12">
          <h2>快速導覽</h2>
          <p className="section-muted">從這裡直達你關心的區域。</p>
        </div>
      </div>
      <div className="quick-links margin-top--sm">
        {quickLinks.map((item) => (
          <Link key={item.title} className="quick-card" to={item.to}>
            <h3>{item.title}</h3>
            <p className="section-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HighlightSection({title, items}: {title: string; items: {title: string; meta: string; tag: string}[]}) {
  return (
    <div className="col col--6 margin-bottom--lg">
      <div className="card">
        <div className="card__header">
          <h3>{title}</h3>
        </div>
        <div className="card__body">
          <ul className={styles.listReset}>
            {items.map((item) => (
              <li key={item.title} className={styles.listItem}>
                <div className={styles.listTitle}>{item.title}</div>
                <div className={styles.listMeta}>
                  <span className={styles.tag}>{item.tag}</span>
                  <span>{item.meta}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card__footer">
          <Link to={title.includes('公告') ? '/blog' : '/docs/activities'} className={styles.cardLink}>
            查看全部
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  return (
    <Layout description="終端防護攻防隊 · 資安推廣、攻防實作、CTF 培訓">
      <Hero />
      <main>
        <QuickLinks />
        <section className="container margin-top--lg margin-bottom--xl">
          <div className="row">
            <div className="col col--12">
              <h2>近期焦點</h2>
              <p className="section-muted">活動與公告一目瞭然。</p>
            </div>
          </div>
          <div className="row">
            <HighlightSection title="近期活動" items={highlights.activities} />
            <HighlightSection title="最新公告" items={highlights.announcements} />
          </div>
        </section>
      </main>
    </Layout>
  );
}
