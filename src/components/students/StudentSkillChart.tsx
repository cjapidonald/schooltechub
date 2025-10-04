import { useMemo } from "react";
import { format, parse } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StudentSkillProgress } from "@/features/students/types";

const chartConfig = {
  value: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
} as const;

type StudentSkillChartProps = {
  skill: StudentSkillProgress;
  emptyLabel: string;
};

export function StudentSkillChart({ skill, emptyLabel }: StudentSkillChartProps) {
  const data = useMemo(
    () =>
      skill.scores.map(entry => {
        const parsed = parse(`${entry.month}-01`, "yyyy-MM-dd", new Date());
        return {
          month: format(parsed, "MMM yyyy"),
          value: entry.score,
        };
      }),
    [skill.scores],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[260px]">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} dy={8} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} dx={-8} />
        <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-progress)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
