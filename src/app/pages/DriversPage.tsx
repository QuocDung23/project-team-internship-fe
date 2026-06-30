import { Users } from "@phosphor-icons/react";
import { PlaceholderPage } from "./PlaceholderPage";

export function DriversPage() {
  return (
    <PlaceholderPage
      title="Quản lý tài xế"
      description="Module CRUD cho tài xế sẽ được dựng tại đây. Store rosterStore đã có sẵn các action add / update / remove."
      hint="Sẽ hook vào useRosterStore và bảng seed để hiển thị danh sách 12 tài xế hiện có."
      icon={<Users size={22} weight="duotone" />}
    />
  );
}