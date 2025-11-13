import React from "react";

type Suggestion = {
  type: "good" | "improve";
  tip: string;
};

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS: React.FC<ATSProps> = ({ score, suggestions }) => {
  // Determine gradient and icon based on score range
  const gradient =
    score > 69
      ? "from-green-100 to-green-50"
      : score > 49
        ? "from-yellow-100 to-yellow-50"
        : "from-red-100 to-red-50";

  const icon =
    score > 69
      ? "/icons/ats-good.svg"
      : score > 49
        ? "/icons/ats-warning.svg"
        : "/icons/ats-bad.svg";

  const getTitle =
    score > 69
      ? "Great Job!"
      : score > 49
        ? "Good Start"
        : "Needs Improvement";

  return(
    <div className={`bg-gradient-to-b ${gradient} to-white rounded-2xl shadow-md w-full h-fit p-6`}>
      {/*top section*/}
      <div className="flex items-center gap-4 mb-6">
        <img src={icon} alt = "ATS Score Icon" className="w-12 h-12"/>

        <div>
          <h2 className="text-2xl font-bold">ATS Score - {score}/100</h2>
        </div>
      </div>

    {/*  Desc section*/}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{getTitle}</h3>
        <p className="text-gray-600 mb-4">Below are a few pointers based on your ATS evaluation.</p>

      {/*suggestion list*/}

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3">
              <img
                src={suggestion.type === "good" ? "/icons/ats-good.svg" : "/icons/ats-warning.svg"}
                alt={suggestion.type === "good" ? "check" : "Warning"}
                className="w-5 h-5 mt-1"/>
              <p className={suggestion.type === "good" ? "text-green-700" : "text-amber-700"}>
                {suggestion.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

    {/*  closing encouragements*/}
<p className="text-gray 700 italic">
  Keep refining your resume — every adjustment improves your ATS score.
</p>
    </div>
  )
};

export default ATS;
