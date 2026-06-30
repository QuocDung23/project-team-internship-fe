import { Warning } from "@phosphor-icons/react";
import { PlaceholderPage } from "./PlaceholderPage";

export function AlertsPage() {
  return (
    <PlaceholderPage
      title="Cảnh báo"
      description="Stream cảnh báo thời gian thực từ socket sẽ tập trung tại đây. alertStore đã được seed sẵn để subscribe."
      hint="Sẽ filter theo mức độ nghiêm trọng, gom nhóm theo tài xế và cho phép acknowledge."
      icon={<Warning size={22} weight="duotone" />}
    />
  );
}