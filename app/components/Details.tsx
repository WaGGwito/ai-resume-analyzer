import React from 'react';
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from'./Accordion';
import { cn } from '~/lib/utils';

// Local tip type matching Feedback sections
interface SectionTip {
  type: 'good' | 'improve';
  tip: string;
  explanation: string;
}

// Local score badge per spec
const ScorePill = ({ score }: { score: number }) => {
  const isGreen = score > 69;
  const isYellow = !isGreen && score > 49;
  const bg = isGreen ? 'bg-green-100' : isYellow ? 'bg-yellow-100' : 'bg-red-100';
  const text = isGreen ? 'text-green-700' : isYellow ? 'text-yellow-700' : 'text-red-700';
  const ring = isGreen ? 'ring-green-200' : isYellow ? 'ring-yellow-200' : 'ring-red-200';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ring-1', bg, text, ring)}>
      {/* check icon always shown as per spec when score > 69 green bg and check; otherwise pill still shown */}
      {isGreen && (
        <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      <span className={cn(text)}>{score}/100</span>
    </span>
  );
};

// Header component for each category
const CategoryHeader = ({ title, score }: { title: string; score: number }) => {
  return (
    <div className="flex items-center justify-between w-full gap-1">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
      <ScorePill score={score} />
    </div>
  );
};

// Tip row with icon and text
const TipRow = ({ tip }: { tip: SectionTip }) => {
  const isGood = tip.type === 'good';
  return (
    <div className="flex items-start gap-3">
      {isGood ? (
        <svg className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )}
      <p className={cn('text-sm', isGood ? 'text-gray-800' : 'text-gray-800')}>{tip.tip}</p>
    </div>
  );
};

// Explanation box styled per type
const ExplanationBox = ({ tip }: { tip: SectionTip }) => {
  const isGood = tip.type === 'good';
  const base = 'rounded-lg p-3 text-sm border';
  const styles = isGood
    ? 'bg-green-50 border-green-200 text-green-800'
    : 'bg-yellow-50 border-yellow-200 text-yellow-800';
  return (
    <div className={cn(base, styles)}>
      <div className="flex items-start gap-2">
        {isGood ? (
          <svg className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        )}
        <div>
          <p className="font-medium mb-1">{tip.tip}</p>
          <p className="text-xs opacity-90 leading-relaxed">{tip.explanation}</p>
        </div>
      </div>
    </div>
  );
};

const SectionContent = ({ tips }: { tips: SectionTip[] }) => {
  if (!tips?.length) return <p className="text-sm text-gray-500">No tips available.</p>;

  return (
    <div className="space-y-5">
      {/* 'Two column' grid with icon and tip text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((t, idx) => (
          <TipRow key={idx} tip={t} />
        ))}
      </div>

      {/* Explanation boxes */}
      <div className="space-y-3">
        {tips.map((t, idx) => (
          <ExplanationBox key={`exp-${idx}`} tip={t} />
        ))}
      </div>
    </div>
  );
};

const Details = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <Accordion defaultOpen="tone" allowMultiple className="divide-y divide-gray-100">
        <AccordionItem id="tone">
          <AccordionHeader itemId="tone">
            <CategoryHeader title="Tone & Style" score={feedback.toneAndStyle.score} />
          </AccordionHeader>
          <AccordionContent itemId="tone">
            <SectionContent tips={feedback.toneAndStyle.tips as SectionTip[]} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="content">
          <AccordionHeader itemId="content">
            <CategoryHeader title="Content" score={feedback.content.score} />
          </AccordionHeader>
          <AccordionContent itemId="content">
            <SectionContent tips={feedback.content.tips as SectionTip[]} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="structure">
          <AccordionHeader itemId="structure">
            <CategoryHeader title="Structure" score={feedback.structure.score} />
          </AccordionHeader>
          <AccordionContent itemId="structure">
            <SectionContent tips={feedback.structure.tips as SectionTip[]} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem id="skills">
          <AccordionHeader itemId="skills">
            <CategoryHeader title="Skills" score={feedback.skills.score} />
          </AccordionHeader>
          <AccordionContent itemId="skills">
            <SectionContent tips={feedback.skills.tips as SectionTip[]} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Details;