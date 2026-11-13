import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import type { AppState } from "@/lib/types";

// Z.MKT trả lời trong khung chat. Nó chỉ nói, không tự đổi tiền:
// mọi thay đổi ngân sách phải đi qua nút duyệt của người dùng (lib/server/zmkt.ts).
const SYSTEM = `Bạn là Z.MKT, trợ lý marketing nhận phần quảng cáo thay một thương hiệu nhỏ ở Việt Nam.
Xưng "mình", gọi người dùng là "bạn". Trả lời bằng tiếng Việt, ngắn gọn, thẳng, như một người làm quảng cáo có kinh nghiệm nói với chủ shop.
Khung chat chỉ hiện chữ thường: không dùng markdown (không **, không #, không bảng). Muốn liệt kê thì xuống dòng và bắt đầu bằng "- ". Thường 2 đến 6 câu là đủ.
Kênh quảng cáo hiện có: Meta Ads (Facebook, Instagram).
Quy tắc về tiền:
- Bạn không tự tăng ngân sách, không tự duyệt chiến dịch. Khi người dùng muốn đổi tiền, chỉ họ đến nút duyệt trên màn Triển khai hoặc Chiến lược.
- Không bao giờ đề xuất vượt trần mỗi tháng của thương hiệu.
- Nói số tiền bằng ₫ và triệu ₫, kèm tiêu chí chi phí mỗi đơn khi liên quan.
Nếu câu hỏi cần dữ liệu bạn không có trong trạng thái bên dưới, nói rõ là chưa có thay vì đoán.`;

const MODEL = process.env.ZMKT_MODEL ?? "claude-opus-5-5";

function brief(s: AppState) {
  if (!s.brand.sample) return [
    `Thương hiệu: ${s.brand.name}${s.brand.shopUrl ? ` (link: ${s.brand.shopUrl})` : ""}. Thương hiệu mới, chưa có hồ sơ, chiến lược hay chiến dịch.`,
    `Trần chi tiêu mỗi tháng: ${s.capVnd.toLocaleString("vi-VN")} ₫. Meta Ads: ${s.metaConnected ? "đã kết nối" : "chưa kết nối"}. Chưa chi đồng nào.`,
    `Việc của bạn lúc này: hỏi để hiểu thương hiệu (bán gì, giá, khách là ai, điểm khác biệt), mỗi lần một hai câu hỏi. Bạn chưa đọc được link shop ở bản thử này, nói thật nếu được hỏi.`,
  ].join("\n");
  return [
    `Trạng thái hiện tại của thương hiệu ${s.brand.name} (dữ liệu mẫu):`,
    ...(s.profile ? [`- Hồ sơ: ${[s.profile.essence, s.profile.difference, s.profile.values, s.profile.personality].filter(Boolean).join("; ")}. Hợp nhất với: ${s.profile.bestFit ?? "chưa rõ"}. Còn thiếu: ${s.profile.missing.join(", ") || "không"}.`] : []),
    ...(s.segments.length ? [`- Nhóm khách theo thứ tự ưu tiên: ${s.segments.map((g) => `${g.rank}. ${g.name} (phù hợp ${g.fit}%)`).join("; ")}.`] : []),
    ...s.strategies.map((t) => `- Chiến lược “${t.name}”: ${t.status}, ${t.budgetMonthVnd.toLocaleString("vi-VN")} ₫ mỗi tháng, tiêu chí dưới ${t.criterionVnd.toLocaleString("vi-VN")} ₫ mỗi đơn.`),
    `- Giai đoạn: ${s.stage === "before" ? "chưa duyệt chiến lược đầu tiên" : s.stage === "running" ? `đang chạy thử, ngày ${s.simDay}/14` : "đã chạy thử xong 2 tuần"}`,
    `- Đã chi: ${s.spentVnd.toLocaleString("vi-VN")} ₫; đang giữ chỗ: ${s.committedVnd.toLocaleString("vi-VN")} ₫; trần tháng: ${s.capVnd.toLocaleString("vi-VN")} ₫`,
    `- Dừng mọi chi tiêu: ${s.halted ? "ĐANG DỪNG" : "không"}; Meta Ads: ${s.metaConnected ? "đã kết nối" : "đang ngắt"}`,
    ...s.campaigns.map((c) => `- Chiến dịch #${c.seq} “${c.name}”: ${c.status}, trần ${c.budgetVnd.toLocaleString("vi-VN")} ₫, đã chi ${c.spentVnd.toLocaleString("vi-VN")} ₫, ${c.orders} đơn${c.orders ? `, ${Math.round(c.spentVnd / c.orders).toLocaleString("vi-VN")} ₫ mỗi đơn` : ""}.`),
    `- Quyết định mở rộng video lên 15 triệu ₫/tháng: ${s.expand}. Chiến lược Hộp quà Tết (+10 triệu ₫/tháng, 15/11 đến 25/1): ${s.tet}.`,
  ].join("\n");
}

/** Chỉ cho môi trường test: ZMKT_AI=claude-code dùng Claude Code đang đăng nhập gói trên máy này. */
export const useClaudeCode = () => process.env.ZMKT_AI === "claude-code";

function viaClaudeCode(state: AppState, history: { role: string; text: string }[]): Promise<string> {
  const transcript = history.map((m) => `${m.role === "user" ? "Người dùng" : "Z.MKT"}: ${m.text}`).join("\n\n");
  const prompt = `${brief(state)}\n\nHội thoại đến giờ:\n\n${transcript}\n\nViết câu trả lời tiếp theo của Z.MKT cho tin nhắn cuối của người dùng. Chỉ in câu trả lời.`;
  const args = ["-p", "--system-prompt", SYSTEM, "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--output-format", "json"];
  if (process.env.ZMKT_CLI_MODEL) args.push("--model", process.env.ZMKT_CLI_MODEL);
  // Bỏ khoá API khỏi môi trường để Claude Code dùng phiên đăng nhập của gói.
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_AUTH_TOKEN;
  return new Promise((resolve) => {
    const child = spawn(process.env.ZMKT_CLAUDE_BIN ?? "claude", args, { cwd: tmpdir(), env, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 120_000);
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    child.on("error", () => { clearTimeout(timer); resolve("Không chạy được Claude Code trên máy này (lệnh `claude` không tìm thấy). Cài Claude Code hoặc bỏ ZMKT_AI=claude-code."); });
    child.on("close", () => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out) as { result?: string; is_error?: boolean };
        if (r.is_error || !r.result) resolve(`Claude Code báo lỗi: ${(r.result ?? err).slice(0, 200) || "không rõ"}. Kiểm tra đã đăng nhập gói chưa (chạy \`claude\` một lần).`);
        else resolve(r.result.trim());
      } catch {
        resolve(`Claude Code không trả lời được: ${(err || out).slice(0, 200) || "hết thời gian chờ"}.`);
      }
    });
    child.stdin.end(prompt);
  });
}

export async function reply(state: AppState, history: { role: string; text: string }[]): Promise<string> {
  if (useClaudeCode()) return viaClaudeCode(state, history);
  const client = new Anthropic();
  // Lịch sử phải bắt đầu bằng lượt của người dùng.
  const first = history.findIndex((m) => m.role === "user");
  const turns: Anthropic.Beta.BetaMessageParam[] = history.slice(first < 0 ? history.length : first)
    .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
  // Trạng thái thay đổi theo từng lượt nên đặt sau phần hệ thống cố định, ở cuối hội thoại.
  turns.push({ role: "system", content: brief(state) } as unknown as Anthropic.Beta.BetaMessageParam);

  try {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: turns,
    });
    if (res.stop_reason === "refusal") return "Câu này mình không trả lời được. Bạn hỏi cách khác giúp mình nhé.";
    const text = res.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    return text || "Mình chưa có câu trả lời cho câu này.";
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return offline("chưa có khoá API hợp lệ");
    if (e instanceof Anthropic.RateLimitError) return "Mình đang bị giới hạn lượt gọi AI. Bạn thử lại sau ít phút nhé.";
    if (e instanceof Anthropic.APIError) return `AI đang lỗi (${e.status ?? "mạng"}). Câu hỏi của bạn vẫn được lưu lại.`;
    if (e instanceof Error && /api key|apiKey|authToken|credentials/i.test(e.message)) return offline("chưa đặt ANTHROPIC_API_KEY");
    throw e;
  }
}

const offline = (why: string) => `Mình chưa nối được AI (${why}). Đặt ANTHROPIC_API_KEY trong file .env.local rồi khởi động lại là mình trả lời được. Câu hỏi của bạn vẫn được lưu lại.`;
