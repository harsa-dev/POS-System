"use client";

import { useMemo } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Loader2,
} from "lucide-react";

import {
  formatDateTime,
  formatOrderNumber,
} from "@/lib/utils/format";

type Order = {
  id: string;

  orderNumber: number;

  status: string;

  createdAt: string;

  type:
    | "DINE_IN"
    | "TAKEAWAY";

  table?: {
    id: string;
    name: string;
    capacity: number;
    status: string;
  } | null;

  restaurant?: {
    timezone?: string;

    orderPrefix?: string;
  };

  items: {
    id: string;

    quantity: number;

    menuItem: {
      name: string;
    };
  }[];
};

const KITCHEN_STATUSES =
  ["PAID", "PREPARING"];

export function KDSBoard() {
  const queryClient =
    useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "kitchen-orders",
    ],

    queryFn: async () => {
      const res =
        await fetch(
          "/api/orders",
        );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch kitchen orders",
        );
      }

      return res.json();
    },

    refetchInterval:
      10000,

    staleTime: 5000,

    gcTime:
      1000 *
      60 *
      5,

    refetchOnWindowFocus:
      false,
  });

  const orders: Order[] =
    useMemo(() => {
      return (
        data?.data?.filter(
          (
            order: Order,
          ) =>
            KITCHEN_STATUSES.includes(
              order.status,
            ),
        ) ?? []
      );
    }, [data]);

  const updateMutation =
    useMutation({
      mutationFn: async ({
        id,
        status,
      }: {
        id: string;

        status:
          | "PREPARING"
          | "READY";
      }) => {
        const res =
          await fetch(
            `/api/orders/${id}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  status,
                },
              ),
            },
          );

        const data =
          await res.json();

        if (!data.success) {
          throw new Error(
            data.message ||
              "Failed to update order",
          );
        }

        return data;
      },

      onSuccess: () => {
        queryClient.invalidateQueries(
          {
            queryKey: [
              "kitchen-orders",
            ],
          },
        );
      },
    });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-3xl border bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border bg-white p-6 text-center text-red-500">
        Failed to load kitchen
        orders.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {orders.map(
        (order) => {
          const timezone =
            order
              .restaurant
              ?.timezone ??
            "Asia/Makassar";

          const orderPrefix =
            order
              .restaurant
              ?.orderPrefix ??
            "ORD";

          const isDineIn =
            order.type ===
            "DINE_IN";

          const isPending =
            updateMutation.isPending;

          return (
            <div
              key={order.id}
              className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              {/* HEADER */}
              <div className="border-b border-neutral-100 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">
                    {formatOrderNumber(
                      order.orderNumber,
                      orderPrefix,
                    )}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status ===
                      "PAID"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {
                      order.status
                    }
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                  <span>
                    {formatDateTime(
                      order.createdAt,
                      timezone,
                    )}
                  </span>

                  <span>
                    •{" "}
                    {isDineIn
                      ? "Dine In"
                      : "Takeaway"}
                  </span>

                  {isDineIn &&
                    order.table && (
                      <span className="font-semibold text-neutral-700">
                        • Table{" "}
                        {
                          order
                            .table
                            .name
                        }
                      </span>
                    )}
                </div>
              </div>

              {/* TABLE */}
              {isDineIn &&
                order.table && (
                  <div className="mt-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3 text-sm">
                    <p className="font-semibold">
                      Serve to
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      Table{" "}
                      {
                        order
                          .table
                          .name
                      }
                    </p>

                    <p className="text-xs text-neutral-500">
                      Capacity:{" "}
                      {
                        order
                          .table
                          .capacity
                      }{" "}
                      seats
                    </p>
                  </div>
                )}

              {/* ITEMS */}
              <div className="mt-4 space-y-3">
                {order.items.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="flex justify-between rounded-2xl bg-neutral-50 p-3 text-sm"
                    >
                      <span className="font-medium">
                        {
                          item
                            .menuItem
                            .name
                        }
                      </span>

                      <span className="font-bold">
                        ×{" "}
                        {
                          item.quantity
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>

              {/* ACTION */}
              <div className="mt-4 border-t border-neutral-100 pt-4">
                {order.status ===
                  "PAID" && (
                  <button
                    type="button"
                    disabled={
                      isPending
                    }
                    onClick={() =>
                      updateMutation.mutate(
                        {
                          id:
                            order.id,

                          status:
                            "PREPARING",
                        },
                      )
                    }
                    className="flex w-full items-center justify-center rounded-2xl bg-black py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Start Cooking"
                    )}
                  </button>
                )}

                {order.status ===
                  "PREPARING" && (
                  <button
                    type="button"
                    disabled={
                      isPending
                    }
                    onClick={() =>
                      updateMutation.mutate(
                        {
                          id:
                            order.id,

                          status:
                            "READY",
                        },
                      )
                    }
                    className="flex w-full items-center justify-center rounded-2xl bg-green-600 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Mark as Ready"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        },
      )}

      {orders.length ===
        0 && (
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 text-center text-neutral-500">
          No active kitchen
          orders.
        </div>
      )}
    </div>
  );
}