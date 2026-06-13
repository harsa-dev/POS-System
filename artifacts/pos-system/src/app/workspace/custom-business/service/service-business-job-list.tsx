import { ServiceBusinessJobCard } from "./service-business-job-card";
import type { ServiceBusinessJob } from "./service-business-workspace-types";
import { ServiceSectionCard } from "./service-business-workspace-ui";

export function ServiceBusinessJobList({
  jobs,
  onSelectJob,
  selectedJobId,
}: {
  jobs: readonly ServiceBusinessJob[];
  onSelectJob?: (jobId: string) => void;
  selectedJobId?: string | null;
}) {
  return (
    <ServiceSectionCard
      title="Mock service jobs"
      description="Hard-coded jobs to preview how the future service workspace should feel before Prisma models exist. This preview is read-only."
    >
      <div className="space-y-4">
        {jobs.map((job) => (
          <ServiceBusinessJobCard
            key={job.id}
            isSelected={selectedJobId === job.id}
            job={job}
            onSelect={onSelectJob}
          />
        ))}
      </div>
    </ServiceSectionCard>
  );
}
