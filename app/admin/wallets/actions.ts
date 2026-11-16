"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { addWallet, setWalletEnabled } from "@/lib/wallets/service";

export type ActionState = { ok: boolean; message: string } | null;

const addSchema = z.object({
  type: z.enum(["BTC-mainnet", "BTC-testnet", "USDT-TRC20"]),
  value: z.string().min(10).max(200),
  minConfirmations: z.coerce.number().int().min(1).max(100),
});

export async function addWalletAction(_: ActionState, form: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const p = addSchema.parse({ type: form.get("type"), value: form.get("value"), minConfirmations: form.get("minConfirmations") });
    const kind = p.type === "USDT-TRC20" ? ({ coin: "USDT", network: "TRC20" } as const) : ({ coin: "BTC", network: p.type === "BTC-mainnet" ? "mainnet" : "testnet" } as const);
    await addWallet(getCloudflareContext().env, admin.email, kind, p.value, p.minConfirmations);
    revalidatePath("/admin/wallets");
    return { ok: true, message: "Wallet added (disabled). Enable it below; it goes live 24 hours after enabling." };
  } catch (e) {
    return { ok: false, message: e instanceof Error && e.message !== "forbidden" ? e.message : "Not allowed." };
  }
}

export async function toggleWalletAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = z.coerce.number().int().positive().parse(form.get("id"));
  const enabled = form.get("enabled") === "1";
  await setWalletEnabled(getCloudflareContext().env, admin.email, id, enabled);
  revalidatePath("/admin/wallets");
}
