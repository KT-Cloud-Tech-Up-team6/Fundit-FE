import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { RewardDraft } from "../model/basic-info-demo";

type Groups = NonNullable<RewardDraft["optionGroups"]>;

export function RewardOptionEditor({
  groups,
  onChange,
}: {
  groups: Groups;
  onChange: (groups: Groups) => void;
}) {
  function update(index: number, patch: Partial<Groups[number]>) {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }
  return (
    <div className="space-y-4" aria-label="리워드 옵션 편집">
      {groups.map((group, index) => (
        <fieldset
          key={index}
          className="border-border-default min-w-0 space-y-3 rounded-xs border p-3"
        >
          <legend className="text-body-strong">옵션 그룹 {index + 1}</legend>
          <label className="block space-y-1">
            <span>그룹명</span>
            <Input
              aria-label={`옵션 그룹 ${index + 1} 이름`}
              value={group.groupName}
              onChange={(event) => update(index, { groupName: event.target.value })}
            />
          </label>
          {group.values.map((value, valueIndex) => (
            <div key={valueIndex} className="flex items-center gap-2">
              <Input
                className="min-w-0 flex-1"
                aria-label={`옵션 그룹 ${index + 1} 값 ${valueIndex + 1}`}
                value={value}
                onChange={(event) =>
                  update(index, {
                    values: group.values.map((item, i) =>
                      i === valueIndex ? event.target.value : item,
                    ),
                  })
                }
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`옵션 그룹 ${index + 1} 값 ${valueIndex + 1} 삭제`}
                onClick={() =>
                  update(index, { values: group.values.filter((_, i) => i !== valueIndex) })
                }
              >
                삭제
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label={`옵션 그룹 ${index + 1} 값 추가`}
              onClick={() => update(index, { values: [...group.values, ""] })}
            >
              값 추가
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label={`옵션 그룹 ${index + 1} 삭제`}
              onClick={() => onChange(groups.filter((_, i) => i !== index))}
            >
              그룹 삭제
            </Button>
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...groups, { groupName: "", values: [""] }])}
      >
        옵션 그룹 추가
      </Button>
    </div>
  );
}
