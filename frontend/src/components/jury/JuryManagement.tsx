import { JudgeManagement } from "./JudgeManagement";
import { ScoringCriteriaManagement } from "./ScoringCriteriaManagement";

type Props = {
  hackathonId: number;
  canManage: boolean;
};

export function JuryManagement({ hackathonId, canManage }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Jury and evaluation criteria</h2>

      <div className="grid items-start gap-4 md:grid-cols-2">
        <JudgeManagement hackathonId={hackathonId} canManage={canManage} />

        <ScoringCriteriaManagement
          hackathonId={hackathonId}
          canManage={canManage}
        />
      </div>
    </section>
  );
}
