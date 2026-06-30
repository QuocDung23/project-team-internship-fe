import { Truck } from "@phosphor-icons/react";
import { PlaceholderPage } from "./PlaceholderPage";

export function FleetPage() {
  return (
    <PlaceholderPage
      title="Đội xe"
      description="Bản đồ trực tiếp và danh sách đội xe sẽ hiển thị tại đây. Driver.position trong store đã có sẵn toạ độ để vẽ lên map."
      hint="Sẽ render map nhỏ ở góc phải header với các pin theo team."
      icon={<Truck size={22} weight="duotone" />}
    />
  );
}