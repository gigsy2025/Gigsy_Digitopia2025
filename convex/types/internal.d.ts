import type { FunctionReference } from "convex/server";
import type { DataModel } from "../_generated/dataModel";
import type { Id } from "../_generated/dataModel";

declare module "convex/server" {
  interface RegisteredWrites {
    walletMutations: {
      createTransaction: FunctionReference<
        "mutation",
        "internal",
        {
          walletId: Id<"wallets">;
          amount: number;
          currency: string;
          type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
          description?: string;
          idempotencyKey?: string;
          relatedEntityType?: string;
          relatedEntityId?: string;
        },
        { status: 'ok' | 'already_processed'; transactionId: Id<"transactions"> }
      >;
      updateWalletBalance: FunctionReference<
        "mutation",
        "internal",
        {
          walletId: Id<"wallets">;
          balance: number;
        },
        { success: boolean; newBalance: number }
      >;
    };
  }
}
