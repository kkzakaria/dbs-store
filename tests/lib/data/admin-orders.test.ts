import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORDER_STATUS_TRANSITIONS, ORDERS_PAGE_SIZE, getAdminOrders, getAdminOrderById } from "@/lib/data/admin-orders";
import type { OrderStatus } from "@/lib/db/schema";

describe("ORDER_STATUS_TRANSITIONS", () => {
  it("pending peut aller vers confirmed et cancelled", () => {
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("confirmed");
    expect(ORDER_STATUS_TRANSITIONS.pending).toContain("cancelled");
  });

  it("delivered est un état final (pas de transitions)", () => {
    expect(ORDER_STATUS_TRANSITIONS.delivered).toHaveLength(0);
  });

  it("cancelled est un état final", () => {
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("confirmed → shipped ou cancelled", () => {
    expect(ORDER_STATUS_TRANSITIONS.confirmed).toContain("shipped");
    expect(ORDER_STATUS_TRANSITIONS.confirmed).toContain("cancelled");
  });

  it("shipped → delivered uniquement", () => {
    expect(ORDER_STATUS_TRANSITIONS.shipped).toEqual(["delivered"]);
  });
});

// Mock db query chain
const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockResolvedValue([]),
};

describe("getAdminOrders", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exporte ORDERS_PAGE_SIZE = 30", () => {
    expect(ORDERS_PAGE_SIZE).toBe(30);
  });

  it("retourne { orders, total } avec des listes vides par défaut", async () => {
    // Promise.all calls: first resolves rows, second resolves count
    mockQueryChain.offset.mockResolvedValueOnce([]);
    mockQueryChain.where.mockReturnValueOnce({
      ...mockQueryChain,
      orderBy: vi.fn().mockReturnValue({
        ...mockQueryChain,
        limit: vi.fn().mockReturnValue({
          ...mockQueryChain,
          offset: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    // Simpler approach: use a db mock that captures Promise.all calls
    const rowsMock = [
      {
        id: "o1",
        user_id: "u1",
        status: "pending" as OrderStatus,
        payment_method: "cod",
        payment_status: "pending",
        shipping_name: "Test",
        shipping_phone: "0600000000",
        shipping_city: "Abidjan",
        shipping_address: "123 rue",
        shipping_notes: null,
        subtotal: 10000,
        shipping_fee: 0,
        total: 10000,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const simpleMock = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValueOnce(rowsMock).mockResolvedValueOnce([{ count: 1 }]),
    };
    // Reset where to return the chain with offset for rows query,
    // and a simple resolved value for count query
    let callCount = 0;
    simpleMock.where.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // rows query chain
        return {
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(rowsMock),
            }),
          }),
        };
      } else {
        // count query
        return {
          then: undefined,
          // simulate a resolved promise
        };
      }
    });

    // Use a fresh simple mock for cleaner test
    const db = {
      select: vi.fn(),
    };

    const rowsResult = rowsMock;
    const countResult = [{ count: 1 }];

    // First call to db.select() chains to rows, second to count
    let selectCallCount = 0;
    db.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(rowsResult),
                }),
              }),
            }),
          }),
        };
      } else {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(countResult),
          }),
        };
      }
    });

    const result = await getAdminOrders(db as never, {});
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.orders)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(result.orders).toEqual(rowsResult);
    expect(result.total).toBe(1);
  });

  it("retourne { orders: [], total: 0 } quand aucun résultat", async () => {
    const db = {
      select: vi.fn(),
    };

    let selectCallCount = 0;
    db.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        };
      } else {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        };
      }
    });

    const result = await getAdminOrders(db as never, {});
    expect(result.orders).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getAdminOrderById", () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => vi.clearAllMocks());

  it("retourne null si la commande n'existe pas", async () => {
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValueOnce([]);

    const result = await getAdminOrderById(mockDb as never, "nonexistent");
    expect(result).toBeNull();
  });

  it("retourne { order, items } si la commande existe", async () => {
    const orderRow = {
      id: "o1",
      user_id: "u1",
      status: "pending" as OrderStatus,
      payment_method: "cod",
      payment_status: "pending",
      shipping_name: "Test User",
      shipping_phone: "0700000000",
      shipping_city: "Abidjan",
      shipping_address: "123 rue Test",
      shipping_notes: null,
      subtotal: 50000,
      shipping_fee: 2000,
      total: 52000,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const itemRows = [
      {
        id: "i1",
        order_id: "o1",
        product_id: "p1",
        product_name: "iPhone 15",
        product_slug: "iphone-15",
        product_image: "https://example.com/img.jpg",
        unit_price: 50000,
        quantity: 1,
        line_total: 50000,
      },
    ];

    // First call: select order by id (returns orderRow)
    // Second call: select items by order_id (returns itemRows)
    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([orderRow]),
            }),
          }),
        };
      } else {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(itemRows),
          }),
        };
      }
    });

    const result = await getAdminOrderById(mockDb as never, "o1");
    expect(result).not.toBeNull();
    expect(result?.order).toEqual(orderRow);
    expect(result?.items).toEqual(itemRows);
  });
});
