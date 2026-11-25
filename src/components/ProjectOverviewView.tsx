import { FileText, ExternalLink } from 'lucide-react';
import { TEAM_MEMBERS } from '../types';

const PIPELINE_STAGES = [
  {
    step: '01. Image + GPS Upload',
    detail: 'Citizen uploads a photo with map-pin confirmed coordinates before submission.',
  },
  {
    step: '02. Vision Model Detects Issue',
    detail: 'Classifies pothole, garbage, streetlight fault, or water leakage with confidence & quality check.',
  },
  {
    step: '03. Duplicate Check',
    detail: 'Image + geo-tag matching merges repeat reports within ward proximity.',
  },
  {
    step: '04. Priority Score',
    detail: 'Combines physical severity with proximity to schools, hospitals, and highways.',
  },
  {
    step: '05. Department Routing',
    detail: 'Auto-routes the verified complaint directly to the concerned municipal department.',
  },
  {
    step: '06. Dashboard & Status',
    detail: 'Live OpenStreetMap + Leaflet city map, hotspot heatmap, and status tracking.',
  },
];

const CHALLENGES = [
  {
    risk: 'Blurry or fake images',
    strategy: 'Quality check, confidence threshold, manual review',
  },
  {
    risk: 'Limited training data',
    strategy: 'Pretrained models, transfer learning, augmentation',
  },
  {
    risk: 'Inaccurate GPS location',
    strategy: 'Map pin confirmation before submit',
  },
  {
    risk: 'Department adoption',
    strategy: 'Simple dashboard, pilot in one ward first',
  },
  {
    risk: 'Citizen privacy',
    strategy: 'Auto-blur faces and number plates',
  },
];

const REFERENCES = [
  {
    title: 'YOLO Object Detection',
    citation: 'Redmon et al., "You Only Look Once: Unified, Real-Time Object Detection", CVPR 2016',
    url: 'https://arxiv.org/abs/1506.02640',
  },
  {
    title: 'Road Damage Dataset (RDD2022)',
    citation: 'Arya et al., "RDD2022: A multi-national image dataset for automatic Road Damage Detection"',
    url: 'https://arxiv.org/abs/2209.08538',
  },
  {
    title: 'Smart Cities Mission, India',
    citation: 'Ministry of Housing and Urban Affairs (MoHUA)',
    url: 'https://smartcities.gov.in',
  },
  {
    title: 'Swachh Bharat Mission - Urban',
    citation: 'Citizen grievance and sanitation reporting model',
    url: 'https://swachhbharatmission.gov.in',
  },
  {
    title: 'Leaflet + OpenStreetMap',
    citation: 'Open-source mapping and heatmap tools',
    url: 'https://leafletjs.com',
  },
];

export function ProjectOverviewView() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      {/* Institutional Banner */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs text-slate-500">
              Delhi Technical Campus, Greater Noida · Affiliated to GGSIPU, New Delhi (NAAC-A++)
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              UrbanEye AI: Smart City Civic Issue Detection
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              Team DOOMSCROLLERS · Theme: Smart Cities / Urban Governance · ManthanKriti 2k26 (Software).
              Brings detection, de-duplication, prioritization, and department routing into one unified civic pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/assets/aistudio/UrbanEye_AI_ManthanKriti__1__b28691e4.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Presentation Deck (PDF)</span>
            </a>
            <a
              href="/assets/aistudio/UrbanEye_AI_Poster__2__632ff67e.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Project Poster (PDF)</span>
            </a>
          </div>
        </div>
      </section>

      {/* 6-Stage Methodology */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900">
          6-Stage Implementation Methodology
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_STAGES.map((item) => (
            <div
              key={item.step}
              className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-1.5"
            >
              <div className="text-xs font-semibold text-blue-800">{item.step}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feasibility & Stack + Challenges Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Feasibility &amp; Target Architecture
          </h3>
          <dl className="space-y-3 text-xs">
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Computer Vision</dt>
              <dd className="text-slate-600 mt-0.5">
                YOLO / CNN (PyTorch, OpenCV) &amp; multimodal vision classification
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Machine Learning</dt>
              <dd className="text-slate-600 mt-0.5">
                scikit-learn &amp; spatial scoring for priority ranking and duplicate matching
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Frontend &amp; Mapping</dt>
              <dd className="text-slate-600 mt-0.5">
                React + Leaflet + OpenStreetMap (city map &amp; hotspot heatmap)
              </dd>
            </div>
            <div className="border-b border-slate-100 pb-2.5">
              <dt className="font-semibold text-slate-800">Backend &amp; Geo-Database</dt>
              <dd className="text-slate-600 mt-0.5">
                REST APIs + PostgreSQL / PostGIS geo-queries for production scale
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">Economic &amp; Operational Viability</dt>
              <dd className="text-slate-600 mt-0.5">
                Low-cost open-source stack designed for single-ward pilot deployment first.
              </dd>
            </div>
          </dl>
        </section>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Challenges &amp; Mitigation Strategies
            </h3>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-6 font-semibold">Potential Challenge / Risk</th>
                <th className="py-2.5 px-6 font-semibold">Strategy for Overcoming</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CHALLENGES.map((row) => (
                <tr key={row.risk}>
                  <td className="py-3 px-6 font-medium text-slate-900">{row.risk}</td>
                  <td className="py-3 px-6 text-slate-600">{row.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Team Members (Batch 2026-27) + Research References */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Team DOOMSCROLLERS
            </h3>
            <span className="text-xs font-mono text-slate-500">Batch 2026–27</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-6 font-semibold">Student Name</th>
                <th className="py-2.5 px-6 font-semibold text-right">Enrollment No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEAM_MEMBERS.map((member) => (
                <tr key={member.enrollment}>
                  <td className="py-2.5 px-6 font-medium text-slate-900">
                    {member.name}
                  </td>
                  <td className="py-2.5 px-6 text-right font-mono tabular-nums text-slate-600">
                    {member.enrollment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">
            Impact &amp; Research References
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-b border-slate-100 pb-4">
            <div>
              <div className="font-semibold text-slate-900">Social Impact</div>
              <p className="text-slate-600 mt-1">Safer roads, public spaces, stronger citizen participation.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Economic Impact</div>
              <p className="text-slate-600 mt-1">Early repairs cost less and reduce manual triage staff effort.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Environmental Impact</div>
              <p className="text-slate-600 mt-1">Faster garbage and leak action means cleaner streets and less water waste.</p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs">
            {REFERENCES.map((ref) => (
              <li
                key={ref.title}
                className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
              >
                <div>
                  <div className="font-medium text-slate-900">{ref.title}</div>
                  <div className="text-slate-500">{ref.citation}</div>
                </div>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${ref.title}`}
                  className="text-blue-700 hover:text-blue-900 shrink-0 p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
