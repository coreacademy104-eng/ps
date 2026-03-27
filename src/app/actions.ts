"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function startSession(deviceId: string, type: 'OPEN' | 'FIXED', durationMinutes?: number, isMulti: boolean = false) {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) throw new Error("No user found");

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) throw new Error("Device not found");

    await prisma.session.create({
      data: {
        deviceId,
        userId: user.id,
        type,
        durationMinutes,
        isMulti,
        isActive: true,
      } as any,
    });

    revalidatePath("/");
  } catch (err) {
    console.error("Error starting session:", err);
    throw err;
  }
}

export async function addDevice(data: { number: string, type: string, hourlyRateSingle: number, hourlyRateMulti: number }) {
  await prisma.device.create({ data });
  revalidatePath("/");
  revalidatePath("/devices");
}

export async function updateDevice(id: string, data: any) {
  await prisma.device.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/devices");
}

export async function deleteDevice(id: string) {
  await prisma.device.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/devices");
}

export async function endSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { device: true }
  });
  if (!session || !session.isActive) return;

  const now = new Date();
  const start = new Date((session as any).lastRateChangeTime);
  const diffHours = (now.getTime() - start.getTime()) / 3600000;
  const rate = session.isMulti ? session.device.hourlyRateMulti : session.device.hourlyRateSingle;
  const latestSegmentCost = diffHours * rate;

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      endTime: now,
      accumulatedTimeCost: (session as any).accumulatedTimeCost + latestSegmentCost,
    } as any,
  });
  revalidatePath("/");
}

export async function toggleSessionMode(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { device: true }
  });
  if (!session || !session.isActive) return;

  const now = new Date();
  const start = new Date((session as any).lastRateChangeTime);
  const diffHours = (now.getTime() - start.getTime()) / 3600000;
  const rate = session.isMulti ? session.device.hourlyRateMulti : session.device.hourlyRateSingle;
  const currentSegmentCost = diffHours * rate;

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      isMulti: !session.isMulti,
      accumulatedTimeCost: (session as any).accumulatedTimeCost + currentSegmentCost,
      lastRateChangeTime: now,
    } as any,
  });
  revalidatePath("/");
}

export async function removeOrderFromSession(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });
  if (!order) return;

  await prisma.inventoryItem.update({
    where: { id: order.inventoryItemId },
    data: { stock: { increment: order.quantity } }
  });

  await prisma.order.delete({
    where: { id: orderId }
  });
  revalidatePath("/");
}

export async function addOrderToSession(sessionId: string, items: { itemId: string, quantity: number }[]) {
  for (const item of items) {
    const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: item.itemId } });
    if (!inventoryItem) continue;

    await prisma.order.create({
      data: {
        sessionId,
        inventoryItemId: item.itemId,
        quantity: item.quantity,
        priceAtTime: inventoryItem.price,
      }
    });

    await prisma.inventoryItem.update({
      where: { id: item.itemId },
      data: { stock: { decrement: item.quantity } }
    });
  }
  revalidatePath("/");
}

export async function transferSession(currentSessionId: string, targetDeviceId: string) {
  const activeTargetSession = await prisma.session.findFirst({
    where: { deviceId: targetDeviceId, isActive: true }
  });
  if (activeTargetSession) throw new Error("Target device is not available");

  await prisma.session.update({
    where: { id: currentSessionId },
    data: { deviceId: targetDeviceId }
  });
  revalidatePath("/");
}

export async function getInventory() {
  return await prisma.inventoryItem.findMany({
    where: { isActive: true }
  });
}

export async function addInventoryItem(data: { name: string, category: string, price: number, stock: number }) {
  await prisma.inventoryItem.create({ data });
  revalidatePath("/inventory");
  revalidatePath("/cafetria");
}

export async function updateInventoryItem(id: string, data: any) {
  await prisma.inventoryItem.update({ where: { id }, data });
  revalidatePath("/inventory");
  revalidatePath("/cafetria");
}

export async function deleteInventoryItem(id: string) {
  await prisma.inventoryItem.update({
    where: { id },
    data: { isActive: false }
  });
  revalidatePath("/inventory");
  revalidatePath("/cafetria");
}

export async function processQuickSale(items: { itemId: string, quantity: number }[]) {
  let totalAmount = 0;
  const saleItems = [];

  for (const item of items) {
    const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: item.itemId } });
    if (!inventoryItem) continue;
    
    const priceAtTime = inventoryItem.price;
    totalAmount += priceAtTime * item.quantity;
    
    saleItems.push({
      inventoryItemId: item.itemId,
      quantity: item.quantity,
      priceAtTime: priceAtTime
    });

    await prisma.inventoryItem.update({
      where: { id: item.itemId },
      data: { stock: { decrement: item.quantity } }
    });
  }

  await (prisma as any).sale.create({
    data: {
      totalAmount,
      items: {
        create: saleItems
      }
    }
  });

  revalidatePath("/inventory");
  revalidatePath("/cafetria");
  revalidatePath("/reports");
}

export async function getReportData(startDate: Date, endDate: Date) {
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const sessions = await prisma.session.findMany({
    where: {
      startTime: { gte: startDate, lte: endOfDay },
      isActive: false
    },
    include: {
      device: true,
      orders: { include: { inventoryItem: true } }
    }
  });

  const sales = await (prisma as any).sale.findMany({
    where: {
      createdAt: { gte: startDate, lte: endOfDay }
    },
    include: {
      items: { include: { inventoryItem: true } }
    }
  });

  return { sessions, sales };
}

export async function getDashboardData() {
  try {
    const now = new Date();
    const startOfToday = new Date(new Date(now).setHours(0,0,0,0));
    const endOfToday = new Date(new Date(now).setHours(23,59,59,999));
    
    const startOfYesterday = new Date(new Date(startOfToday).setDate(startOfToday.getDate() - 1));
    const endOfYesterday = new Date(new Date(endOfToday).setDate(endOfToday.getDate() - 1));

    const [devices, todaySessions, todaySales, yesterdaySessions, yesterdaySales] = await Promise.all([
        prisma.device.findMany({
            include: {
              sessions: {
                where: { isActive: true },
                include: {
                  orders: {
                    include: { inventoryItem: true }
                  }
                }
              }
            }
        }),
        prisma.session.findMany({
            where: { startTime: { gte: startOfToday, lte: endOfToday }, isActive: false },
            include: { orders: true, device: true }
        }),
        (prisma as any).sale.findMany({
            where: { createdAt: { gte: startOfToday, lte: endOfToday } }
        }),
        prisma.session.findMany({
            where: { startTime: { gte: startOfYesterday, lte: endOfYesterday }, isActive: false },
            include: { orders: true, device: true }
        }),
        (prisma as any).sale.findMany({
            where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } }
        })
    ]);

    const calculateRevenue = (sessions: any[], sales: any[]) => {
        let gaming = 0;
        sessions.forEach(s => {
            // For historical/ended sessions, we use the stored accumulatedTimeCost + the last segment
            // But wait, our endSession now stores the total in accumulatedTimeCost when it ends? 
            // Let's check how we want to handle this.
            // If the session is ended, it has an endTime and its accumulatedTimeCost is updated.
            gaming += s.accumulatedTimeCost || 0;
        });

        let cafeteria = sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
        sessions.forEach(s => {
            cafeteria += (s.orders || []).reduce((acc: number, o: any) => acc + (o.priceAtTime * o.quantity), 0);
        });

        return { total: gaming + cafeteria, cafeteria };
    };

    const todayRev = calculateRevenue(todaySessions, todaySales);
    const yesterdayRev = calculateRevenue(yesterdaySessions, yesterdaySales);
    const activeUsers = devices.filter(d => d.sessions.length > 0).length;
    
    // Trend Calculations
    const getTrend = (curr: number, prev: number) => {
        if (prev <= 0) return curr > 0 ? "+100%" : "0%";
        const diff = ((curr - prev) / prev) * 100;
        return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}% from yesterday`;
    };

    const oneHourAgo = new Date(new Date().getTime() - 3600000);
    const newSessionsLastHour = await prisma.session.count({
        where: { startTime: { gte: oneHourAgo } }
    });

    return {
        devices,
        stats: {
            activeDevices: `${activeUsers}/${devices.length}`,
            activeDevicesTrend: "Real-time occupancy",
            totalRevenue: `${todayRev.total.toFixed(0)} LE`,
            totalRevenueTrend: getTrend(todayRev.total, yesterdayRev.total),
            activeUsers: activeUsers.toString(),
            activeUsersTrend: `${newSessionsLastHour} new in last hour`,
            cafeteriaSales: `${todayRev.cafeteria.toFixed(0)} LE`,
            cafeteriaSalesTrend: `Peak time: 8-10 PM`
        }
    };
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    return { devices: [], stats: { 
        activeDevices: "0/0", 
        activeDevicesTrend: "0%",
        totalRevenue: "0 LE", 
        totalRevenueTrend: "0%",
        activeUsers: "0", 
        activeUsersTrend: "0 new",
        cafeteriaSales: "0 LE",
        cafeteriaSalesTrend: "N/A"
    } };
  }
}

export async function login(username: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      throw new Error("Invalid username or password");
    }

    const cookieStore = await cookies();
    cookieStore.set("auth_user", JSON.stringify({ id: user.id, username: user.username, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return user;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_user");
  } catch (err) {
    console.error("Logout error:", err);
  }
  redirect("/login");
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get("auth_user");
    if (!auth) return null;
    return JSON.parse(auth.value);
  } catch (err) {
    return null;
  }
}

// Staff Management
export async function getUsers() {
    return await prisma.user.findMany();
}

export async function addUser(data: any) {
    await prisma.user.create({ data });
    revalidatePath("/staff");
}

export async function updateUser(id: string, data: any) {
    await prisma.user.update({ where: { id }, data });
    revalidatePath("/staff");
}

export async function deleteUser(id: string) {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/staff");
}

// Settings Actions
export async function clearBillingData() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') throw new Error("Unauthorized");

        // Use transaction for safety
        await prisma.$transaction([
            prisma.order.deleteMany(),
            prisma.session.deleteMany(),
            prisma.saleItem.deleteMany(),
            (prisma as any).sale.deleteMany(),
        ]);

        revalidatePath("/");
        revalidatePath("/reports");
        return { success: true };
    } catch (err) {
        console.error("Clear Billing Error:", err);
        throw err;
    }
}

export async function factoryReset() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'ADMIN') throw new Error("Unauthorized");

        await prisma.$transaction([
            // Delete all sessions and orders first (cascades handle some)
            prisma.order.deleteMany(),
            prisma.session.deleteMany(),
            // Delete all sales
            prisma.saleItem.deleteMany(),
            (prisma as any).sale.deleteMany(),
            // Delete all inventory
            prisma.inventoryItem.deleteMany(),
            // Delete all devices
            prisma.device.deleteMany(),
            // Delete all users except current one
            prisma.user.deleteMany({
                where: { id: { not: currentUser.id } }
            }),
        ]);

        revalidatePath("/");
        revalidatePath("/devices");
        revalidatePath("/inventory");
        revalidatePath("/staff");
        revalidatePath("/reports");
        revalidatePath("/settings");
        
        return { success: true };
    } catch (err) {
        console.error("Factory Reset Error:", err);
        throw err;
    }
}
