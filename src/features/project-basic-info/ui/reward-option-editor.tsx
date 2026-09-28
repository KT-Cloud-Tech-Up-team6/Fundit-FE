import { useState } from "react";
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
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [addingValue, setAddingValue] = useState<number | null>(null);
  const [valueName, setValueName] = useState("");

  function update(index: number, patch: Partial<Groups[number]>) {
    onChange(groups.map((group, i) => (i === index ? { ...group, ...patch } : group)));
  }

  function addGroup() {
    const name = groupName.trim();
    if (!name) return;
    onChange([...groups, { groupName: name, values: [] }]);
    setGroupName("");
    setAddingGroup(false);
  }

  function addValue(index: number) {
    const value = valueName.trim();
    if (!value) return;
    update(index, { values: [...groups[index].values, value] });
    setValueName("");
    setAddingValue(null);
  }

  function finishName(index: number) {
    const name = editingName.trim();
    if (name) update(index, { groupName: name });
    setEditingGroup(null);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setEditingGroup(null);
    setAddingValue(null);
    const next = [...groups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="space-y-2 pl-10" aria-label="리워드 옵션 편집">
      {groups.map((group, index) => (
        <fieldset
          key={index}
          draggable
          onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            if (Number.isSafeInteger(from)) reorder(from, index);
          }}
          className="border-border-default min-w-0 space-y-2 rounded-xs border py-2"
        >
          <legend className="sr-only">옵션 카테고리 {index + 1}</legend>
          <div className="flex items-center gap-2 px-1">
            <button
              type="button"
              aria-label={`옵션 카테고리 ${index + 1} 순서 변경. 위/아래 화살표로 이동`}
              className="text-text-secondary text-body-s focus-visible:outline-border-primary cursor-grab rounded-xs leading-none focus-visible:outline-2 focus-visible:outline-offset-2"
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" && index > 0) {
                  event.preventDefault();
                  reorder(index, index - 1);
                }
                if (event.key === "ArrowDown" && index < groups.length - 1) {
                  event.preventDefault();
                  reorder(index, index + 1);
                }
              }}
            >
              ⠿
            </button>
            {editingGroup === index ? (
              <Input
                size="xs"
                autoFocus
                aria-label={`옵션 카테고리 ${index + 1} 이름`}
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                onBlur={() => finishName(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) finishName(index);
                  if (event.key === "Escape") setEditingGroup(null);
                }}
              />
            ) : (
              <span className="text-body-s flex-1 font-medium">{group.groupName}</span>
            )}
            <button
              type="button"
              className="text-caption-s text-text-secondary px-2 underline"
              onClick={() => {
                setEditingName(group.groupName);
                setEditingGroup(index);
              }}
            >
              수정
            </button>
          </div>
          <div className="flex flex-wrap gap-2 px-4">
            {group.values.map((value, valueIndex) => (
              <button
                key={`${value}:${valueIndex}`}
                type="button"
                className="border-border-default bg-layer-bg text-caption-s flex h-8 items-center gap-2 rounded-full border px-2"
                aria-label={`${value} 선택지 삭제`}
                onClick={() =>
                  update(index, { values: group.values.filter((_, item) => item !== valueIndex) })
                }
              >
                {value}
                <span aria-hidden>×</span>
              </button>
            ))}
            {addingValue === index ? (
              <Input
                size="xs"
                autoFocus
                className="w-40"
                aria-label={`${group.groupName} 선택지`}
                placeholder="선택지를 입력해주세요"
                value={valueName}
                onChange={(event) => setValueName(event.target.value)}
                onBlur={() => (valueName.trim() ? addValue(index) : setAddingValue(null))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) addValue(index);
                  if (event.key === "Escape") setAddingValue(null);
                }}
              />
            ) : (
              <button
                type="button"
                className="border-border-default text-caption-s flex h-8 items-center gap-1 rounded-full border px-2"
                onClick={() => {
                  setValueName("");
                  setAddingValue(index);
                }}
              >
                선택지 추가 <span aria-hidden>＋</span>
              </button>
            )}
          </div>
        </fieldset>
      ))}
      {addingGroup ? (
        <Input
          size="sm"
          autoFocus
          aria-label="옵션 카테고리 이름"
          placeholder="옵션 카테고리 명을 입력해주세요"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          onBlur={() => (groupName.trim() ? addGroup() : setAddingGroup(false))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) addGroup();
            if (event.key === "Escape") setAddingGroup(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="border-border-default text-caption-s text-text-secondary flex h-10 w-full items-center gap-1 rounded-xs border px-1 text-left"
          onClick={() => setAddingGroup(true)}
        >
          <span aria-hidden className="text-body-m">
            ＋
          </span>{" "}
          옵션 카테고리 추가
        </button>
      )}
    </div>
  );
}
