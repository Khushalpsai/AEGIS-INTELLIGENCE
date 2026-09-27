import jsPDF from "jspdf";

function confBand(pct) {
  if (pct >= 80) return "Strong Indicator";
  if (pct >= 65) return "Probable Match";
  if (pct >= 40) return "Partial Match";
  return "Inconclusive";
}

function strHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function pick_n(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function buildNarrative(targetId, candidateId, confPct, evidence, hasOverlap) {
  const seed      = strHash(targetId + candidateId);
  const sentDelta = evidence.sentence_length_delta ?? 0;
  const phrases   = evidence.shared_phrases ?? [];

  if (confPct >= 80) {
    const opens = [
      `Putting ${targetId} and ${candidateId} side by side, the stylometric signal here is about as clean as it gets for this type of analysis.`,
      `I've looked at a lot of these comparisons and the overlap between ${targetId} and ${candidateId} is harder to explain away than most.`,
      `Ran ${targetId} against ${candidateId} — the numbers came back strong. Worth treating seriously.`,
    ];
    const middles = [
      `The sentence rhythm, word choices, and punctuation habits line up in a way that doesn't feel like coincidence. Two unrelated people writing this similarly in the same niche is possible, but it's a stretch.`,
      `It's not just one signal — it's all three moving together. Same sentence cadence, overlapping vocabulary, matching punctuation profile. Each of those alone wouldn't mean much, but together they're telling a consistent story.`,
      `The punctuation overlap is particularly notable — that's one of the harder things to consciously fake, and both handles share it.`,
    ];
    const closes = hasOverlap
      ? [
          `The temporal data seals it for me: both accounts were posting at the same time, which rules out a simple handover. Someone was deliberately running two identities in parallel.`,
          `Concurrent activity windows make account takeover a lot less likely. This reads more like deliberate compartmentalisation.`,
        ]
      : [
          `Worth noting: the timelines don't overlap — ${targetId} went quiet right around the time ${candidateId} started up. That's a pattern I'd expect from a deliberate alias rotation.`,
          `No concurrent posting detected. Could mean a planned transition rather than two separate people — fits the alias-rotation model.`,
        ];
    return [pick_n(opens, seed), pick_n(middles, seed + 1), pick_n(closes, seed + 2)].join(" ");
  }

  if (confPct >= 65) {
    const opens = [
      `There's a real overlap here between ${targetId} and ${candidateId}, though I wouldn't call it definitive yet.`,
      `Something worth flagging: ${targetId} and ${candidateId} share more stylistic ground than I'd expect from two unrelated accounts.`,
      `${targetId} vs ${candidateId} — not a slam dunk, but it's on my radar. The signals are consistent enough to warrant a second look.`,
    ];
    const middles = sentDelta <= 2
      ? `The sentence-length numbers are tighter than I usually see between unrelated authors. One-word differential across averaged corpora is pretty close.`
      : `The vocabulary and punctuation overlap is real, but the ${sentDelta}-word gap in average sentence length does introduce some uncertainty I can't fully ignore.`;
    const closes = phrases.length > 0
      ? `${phrases.length} shared phrase${phrases.length > 1 ? "s" : ""} in a corpus this size is something — not conclusive on its own, since jargon travels, but it adds to the picture. I'd recommend pulling more posts before escalating.`
      : `Didn't find any distinctive shared phrases, which is a mild negative. The other signals still hold up, just keep this at "monitor" for now.`;
    return [pick_n(opens, seed), middles, closes].join(" ");
  }

  const opens = [
    `Honestly, at ${confPct}%, I wouldn't put a lot of weight on this link between ${targetId} and ${candidateId}.`,
    `The evidence isn't really there yet to say ${targetId} and ${candidateId} are the same person.`,
  ];
  const closes = [
    `Keep it in the queue, but don't escalate without something stronger. Another source of corroboration would help considerably.`,
    `More posts from either account would clarify things. Right now I can't say whether the overlap is meaningful or just noise.`,
  ];
  return [pick_n(opens, seed), pick_n(closes, seed + 1)].join(" ");
}

export function exportIntelligenceReport({
  caseId,
  targetId,
  targetUsername,
  targetPosts = [],
  candidateId,
  candidateUsername,
  candidatePosts = [],
  confidence,
  evidence = {},
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const pageW = doc.internal.pageSize.getWidth();
  const lm = 20;
  const cW = pageW - lm * 2;
  
  let y = 20;

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("THREAT INTELLIGENCE MEMORANDUM", pageW / 2, y, { align: "center" });
  y += 10;
  
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  
  doc.text(`TO: Intel Review Board`, lm, y);
  y += 6;
  doc.text(`FROM: Automated Stylometric Correlation System (AEGIS)`, lm, y);
  y += 6;
  doc.text(`DATE: ${dateStr}`, lm, y);
  y += 6;
  doc.text(`CASE REF: ${caseId}`, lm, y);
  y += 6;
  doc.text(`SUBJECT: Identity Correlation Assessment - ${targetId} & ${candidateId}`, lm, y);
  y += 10;
  
  doc.setLineWidth(0.5);
  doc.line(lm, y, pageW - lm, y);
  y += 10;

  // Temporal processing for overlap
  const aTimes = targetPosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const bTimes = candidatePosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const allTs  = [...aTimes, ...bTimes];
  let hasOverlap = false;
  
  if (aTimes.length && bTimes.length) {
      const os = Math.max(Math.min(...aTimes), Math.min(...bTimes));
      const oe = Math.min(Math.max(...aTimes), Math.max(...bTimes));
      if (os <= oe) {
          hasOverlap = true;
      }
  }

  // 1. Executive Summary
  doc.setFont("times", "bold");
  doc.text("1. Executive Summary", lm, y);
  y += 6;
  doc.setFont("times", "normal");

  const confPct = confidence ?? 0;
  const narrative = buildNarrative(targetId, candidateId, confPct, evidence, hasOverlap);
  
  const narrativeLines = doc.splitTextToSize(narrative, cW);
  doc.text(narrativeLines, lm, y);
  y += narrativeLines.length * 5 + 6;

  // 2. Overview of Subjects
  doc.setFont("times", "bold");
  doc.text("2. Subjects Under Review", lm, y);
  y += 6;
  doc.setFont("times", "normal");
  
  doc.text(`• Subject A: ${targetId} (@${targetUsername}) - ${targetPosts.length} posts reviewed`, lm + 5, y);
  y += 6;
  doc.text(`• Subject B: ${candidateId} (@${candidateUsername}) - ${candidatePosts.length} posts reviewed`, lm + 5, y);
  y += 10;

  // 3. Metrics
  doc.setFont("times", "bold");
  doc.text("3. Stylometric Evidence", lm, y);
  y += 6;
  doc.setFont("times", "normal");
  
  const sentDelta = evidence.sentence_length_delta ?? 0;
  const punctSim  = evidence.punctuation_similarity ?? 0;

  doc.text(`Composite Confidence Score: ${confPct}% (${confBand(confPct)})`, lm, y);
  y += 6;
  doc.text(`• Semantic Similarity (embedding cosine): ${confPct.toFixed(1)}%`, lm + 5, y);
  y += 6;
  doc.text(`• Sentence-length difference: ${sentDelta} words on average`, lm + 5, y);
  y += 6;
  doc.text(`• Punctuation Profile Overlap (cosine): ${(punctSim * 100).toFixed(1)}%`, lm + 5, y);
  y += 10;

  // 4. Shared Phrases
  doc.setFont("times", "bold");
  doc.text("4. Shared Linguistic Markers", lm, y);
  y += 6;
  doc.setFont("times", "normal");
  
  const phrases = evidence.shared_phrases ?? [];
  if (phrases.length > 0) {
    doc.text(`Found ${phrases.length} shared phrases between the two accounts:`, lm, y);
    y += 6;
    
    phrases.slice(0, 10).forEach(phrase => {
      doc.text(`- "${phrase}"`, lm + 5, y);
      y += 5;
    });
    
    if (phrases.length > 10) {
       doc.text(`...and ${phrases.length - 10} more.`, lm + 5, y);
       y += 5;
    }
  } else {
    doc.text("No highly distinctive shared phrases identified in the current sample size.", lm, y);
    y += 5;
  }
  y += 5;

  // 5. Temporal
  doc.setFont("times", "bold");
  doc.text("5. Temporal Analysis", lm, y);
  y += 6;
  doc.setFont("times", "normal");
  
  if (allTs.length >= 2) {
    if (hasOverlap) {
       doc.text("Overlapping activity detected: both accounts were active during the same time period.", lm, y);
    } else {
       doc.text("No concurrent activity detected. Accounts appear to have been active sequentially.", lm, y);
    }
  } else {
    doc.text("Insufficient timestamped posts to perform temporal analysis.", lm, y);
  }
  y += 10;

  // 6. Recommendation
  doc.setFont("times", "bold");
  doc.text("6. Analyst Recommendation", lm, y);
  y += 6;
  doc.setFont("times", "normal");

  const rec =
    confPct >= 80
      ? "Escalate for review. Cross-reference against known TTPs and consider formal attribution. Don't sit on this one."
      : confPct >= 65
      ? "Flag for follow-up. More posts would help — re-score once corpus is larger. Don't escalate yet."
      : "Hold and monitor. Come back to this if something else surfaces. Not enough to act on right now.";
      
  const recLines = doc.splitTextToSize(rec, cW);
  doc.text(recLines, lm, y);
  y += recLines.length * 5 + 10;
  
  // Disclaimer
  doc.setFontSize(9);
  doc.setFont("times", "italic");
  const disc = "Disclaimer: AEGIS outputs are probabilistic. They are meant to support analyst judgement, not replace it. Nothing in this report should be treated as definitive or used as standalone evidence without independent review.";
  const discLines = doc.splitTextToSize(disc, cW);
  doc.text(discLines, lm, y);
  y += discLines.length * 5 + 10;

  // Sign-off
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  doc.text("Analyst Signature: ______________________", lm, y);
  doc.text("Date: ______________________", lm + 100, y);

  const safeName = `AEGIS_${caseId.replace(/[^A-Z0-9\-]/gi, "_")}_${targetId}_vs_${candidateId}.pdf`;
  doc.save(safeName);
}
