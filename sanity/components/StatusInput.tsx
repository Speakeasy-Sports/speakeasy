import { useMemo } from "react";
import { useCurrentUser, type StringInputProps, type StringSchemaType } from "sanity";
import { canPublish as userCanPublish } from "../roles";

type ListOption = { title: string; value: string };

// Hides the "Published" option from anyone who is not an Editor or Administrator.
// The site sets status to published when a document publishes (AGENTS.md section 5).
export function StatusInput(props: StringInputProps) {
  const user = useCurrentUser();
  const canPublish = userCanPublish(user);

  const schemaType = useMemo<StringSchemaType>(() => {
    if (canPublish) return props.schemaType;
    const list = (props.schemaType.options?.list ?? []) as ListOption[];
    return {
      ...props.schemaType,
      options: { ...props.schemaType.options, list: list.filter((o) => o.value !== "published") },
    };
  }, [canPublish, props.schemaType]);

  return props.renderDefault({ ...props, schemaType });
}
