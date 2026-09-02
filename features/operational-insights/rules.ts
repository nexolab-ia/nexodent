import { createHash } from "node:crypto";
export const INSIGHT_RULE_VERSION="1";
export type InsightEvidence={windowStart:string;windowEnd:string;sourceIds:string[];observedAt:string;siteId?:string;emptySlotCount?:number};
export type InsightCandidate={ruleKey:"empty_site_agenda";ruleVersion:string;fresh:boolean;state:"ready"|"unavailable";evidence:InsightEvidence;action:{type:"prepare_recall_notice"};evidenceHash:string};
const hash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function evaluateEmptySiteAgenda(evidence:InsightEvidence,now=new Date(),freshnessHours=24):InsightCandidate{const observed=new Date(evidence.observedAt);const fresh=Number.isFinite(observed.valueOf())&&now.valueOf()-observed.valueOf()<=freshnessHours*3600000&&evidence.sourceIds.length>0;const normalized={...evidence,sourceIds:[...evidence.sourceIds].sort()};return{ruleKey:"empty_site_agenda",ruleVersion:INSIGHT_RULE_VERSION,fresh,state:fresh?"ready":"unavailable",evidence:normalized,action:{type:"prepare_recall_notice"},evidenceHash:hash(normalized)};}
export function classifyInsightRequest(category:string):"operational"|"excluded_clinical"{return /diagnos|tratamiento|cl[ií]nic|enfermedad/i.test(category)?"excluded_clinical":"operational";}
export function stableInputHash(value:unknown):string{return hash(value);}
