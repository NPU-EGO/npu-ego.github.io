import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          推廣資安知識、強化防護能力、培養攻防實作與 CTF 競賽實力。
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/join">
            加入我們
          </Link>
          <Link
            className="button button--outline button--secondary button--lg margin-left--md"
            to="/activities">
            查看課程與活動
          </Link>
        </div>
      </div>
    </header>
  );
}

const QuickNavList = [
  { title: '關於我們', description: '認識終端防護攻防隊的宗旨與使命。', to: '/about' },
  { title: '幹部與指導老師', description: '了解社團的組織架構與聯絡窗口。', to: '/team' },
  { title: '社團活動', description: '查看常態課程、CTF 訓練與工作坊。', to: '/activities' },
  { title: '最新公告', description: '掌握最新活動與重要訊息。', to: '/blog' },
  { title: '社團章程', description: '閱讀章程與權利義務。', to: '/bylaws' },
  { title: '加入/聯絡', description: '加入我們或透過社群媒體聯絡。', to: '/join' },
];

function QuickNav() {
  return (
    <div className={clsx('container', styles.section)}>
      <div className="text--center margin-bottom--lg">
        <Heading as="h2">快速導覽</Heading>
        <p>從這裡直達你關心的區域。</p>
      </div>
      <div className="row">
        {QuickNavList.map((item, idx) => (
          <div className="col col--4 margin-bottom--md" key={idx}>
            <Link to={item.to} className={clsx('card', styles.navCard)}>
              <div className="card__header">
                <h3>{item.title}</h3>
              </div>
              <div className="card__body">
                <p>{item.description}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentFocus() {
  return (
    <div className={clsx('container', styles.section, styles.recentFocusSection)}>
      <div className="text--center margin-bottom--lg">
        <Heading as="h2">近期焦點</Heading>
        <p>活動與公告一目瞭然。</p>
      </div>
      <div className="row">
        {/* Recent Activities */}
        <div className="col col--6">
          <div className="card h-100">
            <div className="card__header">
              <Heading as="h3">近期活動</Heading>
            </div>
            <div className="card__body">
              <ul className={styles.focusList}>
                <li className={styles.focusItem}>
                  <div className={styles.focusTag}>訓練</div>
                  <div>
                    <strong>CTF 基礎技巧夜讀</strong>
                    <div className="text--secondary">每週三 19:00 · EB-305</div>
                  </div>
                </li>
                <li className={styles.focusItem}>
                  <div className={styles.focusTag}>講座</div>
                  <div>
                    <strong>資安講座：雲端防護實務</strong>
                    <div className="text--secondary">1/12（週五）· 邀請業界講師</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="card__footer">
              <Link to="/activities" className="button button--link">查看全部</Link>
            </div>
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="col col--6">
          <div className="card h-100">
            <div className="card__header">
              <Heading as="h3">最新公告</Heading>
            </div>
            <div className="card__body">
              <ul className={styles.focusList}>
                <li className={styles.focusItem}>
                  <div className={styles.focusTag}>公告</div>
                  <div>
                    <strong>寒假集訓報名開放中</strong>
                    <div className="text--secondary">報名截止：1/5</div>
                  </div>
                </li>
                <li className={styles.focusItem}>
                  <div className={styles.focusTag}>行政</div>
                  <div>
                    <strong>社費繳交通知</strong>
                    <div className="text--secondary">本學期 300 元 · 總務收費</div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="card__footer">
              <Link to="/blog" className="button button--link">查看全部</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="EndPoint Guardian Ops - 終端防護攻防隊">
      <HomepageHeader />
      <main>
        <QuickNav />
        <RecentFocus />
      </main>
    </Layout>
  );
}
