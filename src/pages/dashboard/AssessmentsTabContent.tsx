import { AssessmentsSection } from "@/components/dashboard/AssessmentsSection";

interface AssessmentsTabContentProps {
  panelClassName: string;
}

export function AssessmentsTabContent({
  panelClassName,
}: AssessmentsTabContentProps) {
  return <AssessmentsSection className={panelClassName} />;
}
