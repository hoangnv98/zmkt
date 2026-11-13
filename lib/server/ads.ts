import "server-only";
import { SAMPLE_CAMPAIGNS } from "./sample";

// Cổng nói chuyện với kênh quảng cáo. Mọi thao tác đụng tới tiền thật đi qua đây,
// nên phần còn lại của backend không biết đang chạy Meta thật hay bản giả lập.
export interface AdsChannel {
  readonly kind: "simulator" | "meta";
  launch(c: { id: string; name: string; budgetVnd: number }): Promise<{ externalId: string }>;
  setBudget(externalId: string, budgetVnd: number): Promise<void>;
  pause(externalId: string): Promise<void>;
  resume(externalId: string): Promise<void>;
  /** Số liệu một ngày. `day` đếm từ 1 kể từ khi chiến dịch chạy. */
  insights(externalId: string, day: number, budgetVnd: number): Promise<{ spendVnd: number; orders: number }>;
}

// Bản giả lập: trả đúng số liệu mẫu của Gốm Lam trong 14 ngày đầu,
// sau đó chi đều ngân sách tháng và ra đơn theo chi phí mỗi đơn đã thấy khi chạy thử.
class Simulator implements AdsChannel {
  readonly kind = "simulator" as const;
  async launch(c: { id: string }) { return { externalId: `sim_${c.id}` }; }
  async setBudget() {}
  async pause() {}
  async resume() {}
  async insights(externalId: string, day: number, budgetVnd: number) {
    const sample = SAMPLE_CAMPAIGNS.find((c) => `sim_${c.seq}` === externalId);
    if (sample && day >= 1 && day <= sample.perDaySpend.length) {
      return { spendVnd: sample.perDaySpend[day - 1] * 1000, orders: sample.perDayOrders[day - 1] };
    }
    const spendVnd = Math.round(budgetVnd / 30 / 1000) * 1000;
    return { spendVnd, orders: Math.round(spendVnd / (sample?.costPerOrderVnd ?? 150_000)) };
  }
}

// Chỗ để nối Meta Marketing API sau này. Chưa có token thì báo rõ thay vì âm thầm giả lập.
class MetaAds implements AdsChannel {
  readonly kind = "meta" as const;
  private fail(): never { throw new Error("Meta Ads chưa được nối. Đặt META_ACCESS_TOKEN và META_AD_ACCOUNT_ID rồi viết phần gọi Marketing API."); }
  launch(): Promise<{ externalId: string }> { this.fail(); }
  setBudget(): Promise<void> { this.fail(); }
  pause(): Promise<void> { this.fail(); }
  resume(): Promise<void> { this.fail(); }
  insights(): Promise<{ spendVnd: number; orders: number }> { this.fail(); }
}

export function ads(): AdsChannel {
  return process.env.ADS_MODE === "meta" ? new MetaAds() : new Simulator();
}
