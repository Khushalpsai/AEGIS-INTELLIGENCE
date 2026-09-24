/**
 * AEGIS-INTELLIGENCE — Threat Intelligence Report PDF Generator
 *
 * Uses jsPDF + jspdf-autotable to construct a fully programmatic,
 * text-selectable, analysis-rich PDF. NOT a screenshot.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Colour palette
const C = {
  teal:      [0,   180, 150],
  blue:      [56,  189, 248],
  purple:    [167, 139, 250],
  red:       [244,  63,  94],
  amber:     [251, 191,  36],
  dark:      [14,  16,  18],
  mid:       [30,  37,  46],
  muted:     [90, 106, 122],
  text:      [205, 214, 224],
  white:     [255, 255, 255],
  sectionBg: [22,  27,  34],
};

function confLabel(pct) {
  if (pct >= 80) return "WARNING: HIGH CONFIDENCE — SAME ACTOR";
  if (pct >= 65) return "PROBABLE MATCH";
  if (pct >= 40) return "POSSIBLE MATCH";
  return "WEAK / INSUFFICIENT EVIDENCE";
}
function confColor(pct) {
  if (pct >= 80) return C.teal;
  if (pct >= 65) return C.blue;
  if (pct >= 40) return C.amber;
  return C.red;
}

function hLine(doc, y, lm, rm) {
  doc.setDrawColor(...C.mid);
  doc.setLineWidth(0.3);
  doc.line(lm, y, rm, y);
}

function sectionHeader(doc, text, y, lm, pageW) {
  doc.setFillColor(...C.dark);
  doc.rect(lm, y - 5, pageW - lm * 2, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.teal);
  doc.text(text.toUpperCase(), lm + 3, y + 0.5);
  return y + 8;
}

function metricBar(doc, label, pct, color, y, lm, barW) {
  const v       = Math.max(0, Math.min(100, pct));
  const trackH  = 2.5;
  const labelW  = 78;
  const trackX  = lm + labelW;
  const trackW  = barW - labelW - 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(label, lm, y + trackH / 2 + 1);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(`${v.toFixed(0)}%`, trackX + trackW + 2, y + trackH / 2 + 1);

  doc.setFillColor(...C.mid);
  doc.rect(trackX, y, trackW, trackH, "F");

  doc.setFillColor(...color);
  doc.rect(trackX, y, Math.max(1, (v / 100) * trackW), trackH, "F");

  return y + trackH + 3;
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
  const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const lm    = 14;
  const rm    = pageW - lm;
  const cW    = pageW - lm * 2;

  let y = 0;

  // ── Cover ────────────────────────────────────────────
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, 3, 38, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.teal);
  doc.text("AEGIS-INTELLIGENCE", lm + 4, 10);

  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text("THREAT INTELLIGENCE REPORT", lm + 4, 19);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  doc.text("Stylometric Identity Correlation Analysis — CONFIDENTIAL", lm + 4, 25);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.teal);
  doc.setFontSize(7);
  doc.text(`CASE: ${caseId}`, lm + 4, 32);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  doc.text(`GENERATED: ${new Date().toUTCString()}`, lm + 54, 32);

  y = 44;

  // ── Classification banner ─────────────────────────────
  const confPct = confidence ?? 0;
  const cColor  = confColor(confPct);
  const cLabel  = confLabel(confPct);

  doc.setDrawColor(...cColor);
  doc.setLineWidth(0.5);
  doc.rect(lm, y, cW, 10, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...cColor);
  doc.text(cLabel, pageW / 2, y + 6.5, { align: "center" });

  y += 15;

  // ── Subject identities ────────────────────────────────
  y = sectionHeader(doc, "01  Subject Identities", y, lm, pageW);
  const halfW = (cW - 4) / 2;

  // Card A
  doc.setFillColor(...C.sectionBg);
  doc.rect(lm, y, halfW, 20, "F");
  doc.setDrawColor(...C.teal);
  doc.setLineWidth(0.4);
  doc.line(lm, y, lm, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.teal);
  doc.text(targetId, lm + 3, y + 7);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  doc.text(`Handle: @${targetUsername}`, lm + 3, y + 13);
  doc.text(`Posts analysed: ${targetPosts.length}`, lm + 3, y + 18);

  // Card B
  const bX = lm + halfW + 4;
  doc.setFillColor(...C.sectionBg);
  doc.rect(bX, y, halfW, 20, "F");
  doc.setDrawColor(...C.red);
  doc.setLineWidth(0.4);
  doc.line(bX, y, bX, y + 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.red);
  doc.text(candidateId, bX + 3, y + 7);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  doc.text(`Handle: @${candidateUsername}`, bX + 3, y + 13);
  doc.text(`Posts analysed: ${candidatePosts.length}`, bX + 3, y + 18);

  y += 26;

  // ── Confidence overview ───────────────────────────────
  y = sectionHeader(doc, "02  Confidence Assessment", y, lm, pageW);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...cColor);
  doc.text(`${confPct}%`, lm, y + 12);

  const bandDesc =
    confPct >= 80
      ? `The two aliases exhibit statistically significant stylometric overlap across semantic, lexical, syntactic, and punctuation dimensions. Composite score of ${confPct}% strongly suggests a single authoring entity operating under multiple pseudonyms.`
      : confPct >= 65
      ? `Meaningful stylometric correlation detected across multiple signal dimensions. Composite score of ${confPct}% exceeds the probable attribution threshold. Analyst review is recommended before formal attribution.`
      : confPct >= 40
      ? `Partial stylometric overlap detected (${confPct}%). Insufficient for high-confidence attribution. Additional intelligence collection and corpus expansion is advised.`
      : `Minimal stylometric correlation (${confPct}%). These identities likely represent distinct authoring entities. No further action recommended without new intelligence.`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  const bLines = doc.splitTextToSize(bandDesc, cW - 28);
  doc.text(bLines, lm + 28, y + 2);
  y += 22;

  // ── Stylometric signal breakdown ──────────────────────
  y = sectionHeader(doc, "03  Multi-Signal Stylometric Breakdown", y, lm, pageW);

  const sentDelta = evidence.sentence_length_delta ?? 0;
  const punctSim  = evidence.punctuation_similarity ?? 0;
  const syntaxPct = Math.max(10, 100 - sentDelta * 10);

  y = metricBar(doc, "Semantic Embedding Similarity  (all-MiniLM-L6-v2)", confPct,          C.teal,   y, lm, cW);
  y = metricBar(doc, `Syntactic Structure Match  (Sentence Delta +/-${sentDelta} words)`,  syntaxPct, C.blue,   y, lm, cW);
  y = metricBar(doc, "Punctuation Profile Overlap  (cosine similarity)",                   punctSim * 100, C.purple, y, lm, cW);
  y += 4;

  // ── Evidence table ────────────────────────────────────
  y = sectionHeader(doc, "04  Pairwise Signal Summary", y, lm, pageW);

  const avgLen = (posts) => {
    if (!posts.length) return "N/A";
    const total = posts.reduce((s, p) => s + (p.content?.split(" ").length || 0), 0);
    return `~${Math.round(total / posts.length)} wds`;
  };

  autoTable(doc, {
    startY: y,
    margin: { left: lm, right: lm },
    head: [["Signal Dimension", `${targetId} (A)`, `${candidateId} (B)`, "Score"]],
    body: [
      ["Semantic Embedding (cosine)",  "—",                    "—",                    `${confPct.toFixed(1)}%`],
      ["Avg. Sentence Length",         avgLen(targetPosts),    avgLen(candidatePosts), `Delta ${sentDelta} wds`],
      ["Punctuation Cosine",           "—",                    "—",                    `${(punctSim * 100).toFixed(1)}%`],
      ["Corpus Size",                  `${targetPosts.length} posts`, `${candidatePosts.length} posts`, "—"],
    ],
    headStyles: { fillColor: C.dark, textColor: C.teal, fontStyle: "bold", fontSize: 7, halign: "left" },
    bodyStyles: { fontSize: 7, textColor: C.text, fillColor: C.sectionBg },
    alternateRowStyles: { fillColor: [18, 21, 26] },
    columnStyles: { 0: { cellWidth: 70, fontStyle: "bold" }, 3: { halign: "right", textColor: cColor, fontStyle: "bold" } },
    tableLineColor: C.mid,
    tableLineWidth: 0.3,
  });

  y = doc.lastAutoTable.finalY + 6;

  // ── Shared N-Grams ────────────────────────────────────
  y = sectionHeader(doc, "05  Shared Linguistic Patterns (N-Grams)", y, lm, pageW);

  const phrases = evidence.shared_phrases ?? [];
  if (phrases.length > 0) {
    const cols   = 3;
    const cellW  = cW / cols;
    phrases.slice(0, 18).forEach((phrase, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx  = lm + col * cellW;
      const cy  = y + row * 7;
      doc.setFillColor(...C.sectionBg);
      doc.rect(cx, cy, cellW - 2, 5.5, "F");
      doc.setDrawColor(...C.mid);
      doc.rect(cx, cy, cellW - 2, 5.5, "S");
      doc.setFont("courier", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.teal);
      const t = phrase.length > 28 ? phrase.slice(0, 27) + "…" : phrase;
      doc.text(`"${t}"`, cx + 2, cy + 3.8);
    });
    y += Math.ceil(Math.min(phrases.length, 18) / cols) * 7 + 4;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text("No significant shared n-gram patterns detected.", lm, y + 4);
    y += 10;
  }

  // ── Temporal analysis ─────────────────────────────────
  y = sectionHeader(doc, "06  Temporal Activity Analysis", y, lm, pageW);

  const aTimes = targetPosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const bTimes = candidatePosts.map(p => new Date(p.timestamp).getTime()).filter(t => !isNaN(t));
  const allTs  = [...aTimes, ...bTimes];

  if (allTs.length >= 2) {
    const tMin  = Math.min(...allTs);
    const tMax  = Math.max(...allTs);
    const tRange = tMax - tMin || 1;
    const barH  = 4;
    const rowA  = y + 8;
    const rowB  = y + 16;

    // axis labels
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.muted);
    doc.text(new Date(tMin).toLocaleDateString(), lm, y + 4);
    doc.text(new Date(tMax).toLocaleDateString(), rm - 16, y + 4);

    // tracks
    doc.setFillColor(...C.mid);
    doc.rect(lm, rowA, cW, barH, "F");
    doc.rect(lm, rowB, cW, barH, "F");

    // row labels
    doc.setFontSize(5.5);
    doc.setTextColor(...C.teal);
    doc.text(targetId, lm, rowA - 1);
    doc.setTextColor(...C.red);
    doc.text(candidateId, lm, rowB - 1);

    // overlap shading
    if (aTimes.length && bTimes.length) {
      const os = Math.max(Math.min(...aTimes), Math.min(...bTimes));
      const oe = Math.min(Math.max(...aTimes), Math.max(...bTimes));
      if (os <= oe) {
        const ox1 = lm + ((os - tMin) / tRange) * cW;
        const ow  = ((oe - os) / tRange) * cW;
        doc.setFillColor(0, 180, 150);
        doc.setGState(doc.GState({ opacity: 0.12 }));
        doc.rect(ox1, rowA - 2, ow, barH * 2 + 10, "F");
        doc.setGState(doc.GState({ opacity: 1 }));
      }
    }

    // dots A
    doc.setFillColor(...C.teal);
    aTimes.forEach(t => {
      const px = lm + ((t - tMin) / tRange) * cW;
      doc.circle(px, rowA + barH / 2, 0.9, "F");
    });

    // dots B
    doc.setFillColor(...C.red);
    bTimes.forEach(t => {
      const px = lm + ((t - tMin) / tRange) * cW;
      doc.circle(px, rowB + barH / 2, 0.9, "F");
    });

    y += 28;

    const hasOverlap = aTimes.length && bTimes.length &&
      Math.max(Math.min(...aTimes), Math.min(...bTimes)) <= Math.min(Math.max(...aTimes), Math.max(...bTimes));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    if (hasOverlap) {
      doc.setTextColor(...C.teal);
      doc.text("CONCURRENT ACTIVITY OVERLAP DETECTED", lm, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.muted);
      doc.text("Both aliases were active simultaneously, consistent with dual-alias concurrent operation by a single threat actor.", lm, y);
    } else {
      doc.setTextColor(...C.muted);
      doc.text("SEQUENTIAL HANDOVER / NO TEMPORAL OVERLAP", lm, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.text("No concurrent activity detected. Possible identity handover or transition between distinct operational phases.", lm, y);
    }
    y += 8;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text("Insufficient temporal data for activity analysis.", lm, y + 4);
    y += 10;
  }

  // ── Analyst assessment ────────────────────────────────
  y = sectionHeader(doc, "07  Analyst Assessment & Recommendations", y, lm, pageW);

  const assessment =
    confPct >= 80
      ? `AEGIS-INTELLIGENCE assigns HIGH CONFIDENCE to the hypothesis that ${targetId} and ${candidateId} represent the same threat actor operating under distinct pseudonyms. The stylometric signature overlap across semantic, syntactic, and punctuation dimensions (${confPct}% composite score) exceeds the high-confidence attribution threshold. Recommend formal attribution and escalation to threat hunting teams for further investigation.`
      : confPct >= 65
      ? `AEGIS-INTELLIGENCE identifies PROBABLE correlation between ${targetId} and ${candidateId}. The composite stylometric score of ${confPct}% indicates meaningful overlap across multiple signal dimensions. Recommend analyst review of shared n-gram patterns and temporal data before formal attribution.`
      : `AEGIS-INTELLIGENCE identifies POSSIBLE correlation between ${targetId} and ${candidateId}. The composite score of ${confPct}% does not meet the high-confidence threshold. Recommend additional intelligence collection and expanded corpus analysis before drawing definitive conclusions.`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.text);
  const aLines = doc.splitTextToSize(assessment, cW);
  doc.text(aLines, lm, y);
  y += aLines.length * 4.5 + 6;

  // Disclaimer
  doc.setFillColor(...C.sectionBg);
  doc.setDrawColor(...C.mid);
  doc.rect(lm, y, cW, 16, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.amber);
  doc.text("DISCLAIMER", lm + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.muted);
  const disc = "This report is generated by an automated stylometric analysis system. Results are probabilistic and must be independently verified by a qualified threat intelligence analyst prior to any formal attribution or operational decision. AEGIS-INTELLIGENCE does not constitute legal evidence.";
  const dLines = doc.splitTextToSize(disc, cW - 6);
  doc.text(dLines, lm + 3, y + 11);
  y += 20;

  // ── Footer ────────────────────────────────────────────
  hLine(doc, pageH - 12, lm, rm);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.muted);
  doc.text("AEGIS-INTELLIGENCE  •  Autonomous Stylometric Attribution Platform", lm, pageH - 7);
  doc.text(`${caseId}  •  TLP:RED — NOT FOR PUBLIC RELEASE`, rm, pageH - 7, { align: "right" });

  // ── Save ─────────────────────────────────────────────
  const safeName = `AEGIS_${caseId.replace(/[^A-Z0-9\-]/gi, "_")}_${targetId}_vs_${candidateId}.pdf`;
  doc.save(safeName);
}
