import type { CaseStudy } from "./caseStudies"

export default function StudyCredits({ study }: { study: CaseStudy }) {
    return <dl className="study-credits">
        <div><dt>My role</dt><dd>{study.role}</dd></div>
        <div><dt>Client</dt><dd>{study.client}</dd></div>
        <div><dt>Date</dt><dd>{study.year || "—"}</dd></div>
    </dl>
}
