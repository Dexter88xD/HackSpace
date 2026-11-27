import { JudgeManagement } from "./JudgeManagement";
import { ScoringCriteriaManagement } from "./ScoringCriteriaManagement";

type Props = {
  hackathonId: number;
  canManageJudges: boolean;
  canManageCriteria: boolean;
};

export function JuryManagement({
  hackathonId,
  canManageJudges,
  canManageCriteria,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Jury and evaluation criteria</h2>

      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <JudgeManagement
          hackathonId={hackathonId}
          canManage={canManageJudges}
        />

        <ScoringCriteriaManagement
          hackathonId={hackathonId}
          canManage={canManageCriteria}
        />
      </div>
    </section>
  );
}
