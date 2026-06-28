'use client';

import React from 'react';
import { ArrowRight, Search, Star, Sun } from 'lucide-react';
import { PromptPlaceholder } from './PromptPlaceholder';
import { useI18n } from '@/lib/i18n';

export function NewspaperSection() {
  const { locale, t } = useI18n();

  const featureCards = [
    {
      id: 4,
      title: 'MOON',
      subtitle: locale === 'zh' ? '去中心化所见即所得编辑器' : 'Decentralized WYSIWYG editor',
    },
    {
      id: 5,
      title: 'ESCAPE',
      subtitle: locale === 'zh' ? '云端知识拉取与归档' : 'Cloud pull and archive',
    },
    {
      id: 6,
      title: 'SHOT',
      subtitle: locale === 'zh' ? 'Agent 检索与知识引擎' : 'Agent retrieval engine',
    },
  ] as const;

  const dateLabel = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date('2026-06-28'));

  return (
    <section id="newspaper-section" className="border-t border-paperGray bg-[#dfdbd2] px-4 py-10 md:px-8 xl:px-10 xl:py-14">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8">
        <article className="bg-paperCream p-4 shadow-[0_18px_46px_rgba(18,18,18,0.10)] md:p-6">
          <div className="border border-paperDark/35 px-5 pb-0 pt-5 md:px-8 md:pt-7">
            <header className="border-b border-paperDark/55 pb-3">
              <div className="grid items-end gap-4 md:grid-cols-[220px_minmax(0,1fr)_220px]">
                <div className="hidden text-[11px] leading-[1.25] text-paperDark/78 md:block">
                  <div className="mb-2 flex items-center gap-1.5 border-b border-paperDark/18 pb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]">
                    <Sun size={11} className="text-brandRed" />
                    <span>Weather</span>
                  </div>
                  <p>{t('weatherStatus')}</p>
                </div>

                <div className="text-center">
                  <div className="font-old-standard text-[18px] uppercase leading-none tracking-[0.05em] text-paperDark sm:text-[22px]">
                    THE
                  </div>
                  <h2 className="mt-1 font-playfair text-[32px] font-black uppercase leading-[0.88] tracking-[0.02em] text-paperDark sm:text-[46px] md:text-[56px] lg:text-[72px]">
                    MOONLESS TIMES
                  </h2>
                </div>

                <div className="hidden text-right text-[11px] leading-[1.25] text-paperDark/78 md:block">
                  <div className="mb-2 border-b border-paperDark/18 pb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Edition
                  </div>
                  <p>{t('editionInfo')}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-paperDark/55 py-2 font-sans text-[11px] uppercase tracking-[0.08em] text-paperDark md:flex-row md:items-center md:justify-between">
                <span>{dateLabel}</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <a href="#latest">{t('latestEventBadge')}</a>
                  <span className="text-paperDark/35">|</span>
                  <a href="#epaper">{t('epaper')}</a>
                  <span className="text-paperDark/35">|</span>
                  <a href="#today">{t('todaysPaper')}</a>
                </div>
              </div>
            </header>

            <section className="mt-6 border border-paperDark/35 px-5 pb-5 pt-4 md:px-6 md:pb-6">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-paperDark/72">
                <span>{t('latestEventBadge')}</span>
                <span>{locale === 'zh' ? '特别报道' : 'Special feature'}</span>
              </div>

              <div className="mt-4 grid gap-6 lg:grid-cols-[1.02fr_0.9fr]">
                <div>
                  <h3 className="font-playfair text-[36px] font-black uppercase leading-[0.9] tracking-[0.01em] text-paperDark sm:text-[46px] md:text-[56px] lg:text-[76px]">
                    {t('escapeTitle')}
                  </h3>

                  <div className="mt-5 inline-flex items-center bg-paperDark px-6 py-3 font-sans text-[16px] font-semibold uppercase tracking-[0.08em] text-paperCream">
                    OKF V0.1
                  </div>

                  <p className="mt-5 max-w-[620px] text-[18px] leading-[1.38] text-paperDark/88">
                    {t('escapeText')}
                  </p>
                </div>

                <div className="flex flex-col">
                  <div className="border border-paperDark/22 p-2">
                    <PromptPlaceholder
                      id={2}
                      width={420}
                      height={320}
                      ratio="4:3"
                      className="border-0 bg-transparent p-0"
                      imageClassName="object-cover"
                      objectPosition="center center"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-4">
                    <span className="font-mono text-[13px] uppercase tracking-[0.12em] text-paperDark/55">
                      {locale === 'zh' ? '继续探索' : 'Explore more'}
                    </span>
                    <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-paperDark font-mono text-[12px] uppercase tracking-[0.08em] text-paperCream">
                      {t('explore')}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-0 border-t border-paperDark/35 pt-6 md:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-paperDark/25 pb-6 md:border-b-0 md:border-r md:pr-6">
                <h3 className="font-playfair text-[32px] font-black uppercase leading-[0.9] tracking-[0.01em] text-paperDark sm:text-[46px] md:text-[58px]">
                  {t('joinUsTitle')}
                </h3>
                <p className="mt-4 max-w-[320px] text-[17px] leading-[1.42] text-paperDark/86">
                  {t('joinUsText')}
                </p>

                <div className="mt-6 overflow-hidden border border-paperDark/20">
                  <PromptPlaceholder
                    id={3}
                    width={200}
                    height={360}
                    ratio="5:7"
                    className="border-0 bg-transparent p-0"
                    imageClassName="object-cover"
                    objectPosition="50% 26%"
                  />
                </div>
              </div>

              <div className="pt-6 md:pl-6 md:pt-0">
                <div className="border-b border-paperDark/25 pb-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-brandRed">
                      {t('escapeReleasedHeader')}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paperDark/56">
                      {locale === 'zh' ? '现已推出' : 'Now available'}
                    </span>
                  </div>
                  <h4 className="mt-3 font-sans text-[28px] font-semibold uppercase leading-[0.95] tracking-[-0.03em] text-paperDark sm:text-[32px] md:text-[42px]">
                    {t('escapeReleasedTitle')}
                  </h4>
                  <p className="mt-3 text-[18px] leading-[1.42] text-paperDark/86">
                    {t('escapeReleasedText')}
                  </p>
                  <a
                    href="#read-more-escape"
                    className="mt-4 inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-paperDark"
                  >
                    <span>{t('learnMore')}</span>
                    <ArrowRight size={13} />
                  </a>
                </div>

                <div className="pt-6">
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-brandRed">
                    {t('editorNeedsHeader')}
                  </span>
                  <h4 className="mt-3 font-sans text-[28px] font-semibold uppercase leading-[0.95] tracking-[-0.03em] text-paperDark sm:text-[32px] md:text-[42px]">
                    {t('editorNeedsTitle')}
                  </h4>
                  <p className="mt-3 text-[18px] leading-[1.42] text-paperDark/86">
                    {t('editorNeedsText')}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>

        <article className="bg-paperCream p-4 shadow-[0_18px_46px_rgba(18,18,18,0.10)] md:p-6">
          <div className="h-full border border-paperDark/35 px-5 pb-6 pt-5 md:px-7 md:pt-7">
            <header className="border-b border-paperDark/55 pb-4">
              <h3 className="text-center font-playfair text-[32px] font-black uppercase leading-[0.9] tracking-[0.02em] text-paperDark sm:text-[54px] md:text-[66px]">
                SPACE TIMES
              </h3>
              <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-paperDark/25 pt-3 font-sans text-[11px] uppercase tracking-[0.08em] text-paperDark">
                <a href="#home">{t('home')}</a>
                <a href="#latest">{t('latest')}</a>
                <a href="#world">{t('world')}</a>
                <a href="#opinions">{t('editors')}</a>
                <a href="#sports">{t('sports')}</a>
                <a href="#lifestyle">{t('lifestyle')}</a>
                <a href="#epaper">{t('epaper')}</a>
                <button aria-label="Search" className="flex h-5 w-5 items-center justify-center border border-paperDark/55">
                  <Search size={12} />
                </button>
              </nav>
            </header>

            <section className="grid gap-5 border-b border-paperDark/25 py-5 md:grid-cols-[1.22fr_0.78fr]">
              <div>
                <div className="overflow-hidden border border-paperDark/18">
                  <PromptPlaceholder
                    id={1}
                    width={220}
                    height={130}
                    ratio="16:9"
                    className="border-0 bg-transparent p-0"
                    imageClassName="object-cover"
                    objectPosition="center 45%"
                  />
                </div>
                <h4 className="mt-3 font-sans text-[18px] font-semibold text-paperDark">
                  {t('architectureHeader')}
                </h4>
                <p className="mt-2 text-[15px] leading-[1.45] text-paperDark/82">{t('architectureText')}</p>
              </div>

              <div className="border border-paperDark/25 px-4 py-3">
                <div className="bg-paperDark px-3 py-2 text-center font-sans text-[14px] font-semibold uppercase tracking-[0.08em] text-paperCream">
                  {t('thisWeekHeader')}
                </div>
                <h4 className="mt-4 text-center font-playfair text-[17px] font-bold uppercase leading-[1.05] text-paperDark">
                  {t('dataFlowTitle')}
                </h4>
                <div className="mt-4 space-y-3 text-[14px] leading-[1.34] text-paperDark/84">
                  <p>{t('dataFlow1')}</p>
                  <p>{t('dataFlow2')}</p>
                  <p>{t('dataFlow3')}</p>
                </div>
              </div>
            </section>

            <section className="border-b border-paperDark/25 py-5">
              <h4 className="mb-4 font-sans text-[16px] font-semibold uppercase tracking-[0.08em] text-paperDark">
                E-MAGAZINE
              </h4>

              <div className="grid gap-4 sm:grid-cols-3">
                {featureCards.map((item) => (
                  <div key={item.id}>
                    <div className="overflow-hidden border border-paperDark/22">
                      <PromptPlaceholder
                        id={item.id}
                        width={220}
                        height={280}
                        ratio="11:14"
                        className="border-0 bg-transparent p-0"
                        imageClassName="object-cover"
                        objectPosition="center top"
                      />
                    </div>
                    <div className="mt-2 font-old-standard text-[11px] uppercase tracking-[0.08em] text-paperDark/66">
                      E-MAGAZINE
                    </div>
                    <div className="mt-1 font-sans text-[15px] font-semibold uppercase text-paperDark">{item.title}</div>
                    <p className="mt-1 text-[14px] leading-[1.35] text-paperDark/78">{item.subtitle}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-center">
                <a
                  href="#see-more"
                  className="inline-flex items-center gap-3 border border-paperDark/45 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.08em] text-paperDark transition-colors hover:bg-paperDark hover:text-paperCream"
                >
                  <span>{t('seeMore')}</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </section>

            <section className="pt-5">
              <div className="overflow-hidden border border-paperDark/18">
                <PromptPlaceholder
                  id={7}
                  width={480}
                  height={260}
                  ratio="16:9"
                  className="border-0 bg-transparent p-0"
                  imageClassName="object-cover"
                  objectPosition="center 36%"
                />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-paperDark">
                <Star size={12} className="fill-paperDark text-paperDark" />
                <span>{locale === 'zh' ? '业务趋势' : 'Business trending'}</span>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[0.86fr_1.14fr]">
                <div>
                  <h4 className="font-playfair text-[28px] font-black uppercase leading-[0.92] tracking-[0.01em] text-paperDark sm:text-[38px]">
                    {t('shotTitle')}
                  </h4>
                  <p className="mt-3 text-[15px] leading-[1.42] text-paperDark/82">{t('shotText')}</p>
                </div>
                <div className="border-l-0 border-paperDark/25 md:border-l md:pl-4">
                  <div className="font-old-standard text-[15px] uppercase tracking-[0.08em] text-paperDark/65">
                    {t('shotRoadmap')}
                  </div>
                  <p className="mt-2 text-[15px] leading-[1.45] text-paperDark/82">
                    {locale === 'zh'
                      ? '围绕 OKF Markdown 建立可检索、可关联、可被 Agent 消费的知识底座。'
                      : 'A decentralized OKF Markdown substrate that can be searched, linked, and consumed by agents.'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
