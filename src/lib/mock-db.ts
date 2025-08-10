
// This is a mock database to simulate data persistence without a real database.
// In a production environment, this would be replaced with a proper database like Prisma.

import type { Transaction } from '@/components/dashboard-client-provider';

type User = {
    wallet: string;
    balance: number;
    transactions: (Transaction & { balanceAdded?: boolean })[];
}

type Config = {
    [key: string]: any;
}

type MockDb = {
    users: { [wallet: string]: User };
    config: Config;
}

let inMemoryDb: MockDb = {
    users: {},
    config: {
        adminPasscode: process.env.ADMIN_PASSCODE || '203020',
        isPresaleActive: true,
        presaleInfo: { seasonName: "Early Stage", tokenPrice: 0.09 },
        presaleEndDate: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            return d.toISOString();
        })(),
    }
};

// --- User Functions ---

async function getUser(wallet: string): Promise<User | null> {
    return inMemoryDb.users[wallet] || null;
}

async function getAllUsers(): Promise<User[]> {
    return Object.values(inMemoryDb.users);
}

async function createUser(wallet: string): Promise<User> {
    if (inMemoryDb.users[wallet]) {
        return inMemoryDb.users[wallet];
    }
    const newUser: User = {
        wallet,
        balance: 0,
        transactions: [],
    };
    inMemoryDb.users[wallet] = newUser;
    return newUser;
}

async function updateUserBalance(wallet: string, newBalance: number): Promise<boolean> {
    const user = await getUser(wallet);
    if (!user) {
        return false;
    }
    user.balance = newBalance;
    return true;
}

async function updateUserOnPurchase(userKey: string, exnAmount: number, transaction: Transaction) {
    let user = await getUser(userKey);
    if (!user) {
        user = await createUser(userKey);
    }
    
    // Find and update or add the transaction
    const txIndex = user.transactions.findIndex(t => t.id === transaction.id);
    if (txIndex > -1) {
        // preserve balanceAdded status
        const existingBalanceAdded = user.transactions[txIndex].balanceAdded;
        user.transactions[txIndex] = { ...transaction, balanceAdded: existingBalanceAdded };
    } else {
        user.transactions.unshift(transaction); // Add to beginning of array
    }

    let updatedBalance = user.balance;

    if (transaction.status === 'Completed') {
        const txInDb = user.transactions.find(t => t.id === transaction.id);

        if (txInDb && !txInDb.balanceAdded) {
            user.balance += exnAmount;
            txInDb.balanceAdded = true;
            updatedBalance = user.balance;
        }
    }

    const totalExnSold = Object.values(inMemoryDb.users).reduce((sum, u) => sum + u.balance, 0);

    // Sort transactions by date descending
    user.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        message: 'Purchase recorded',
        newBalance: updatedBalance,
        newTotalSold: totalExnSold,
        transactions: user.transactions,
    };
}


// --- Config Functions ---

async function getConfig<T>(key: string, defaultValue: T): Promise<T> {
    if (key in inMemoryDb.config) {
        return inMemoryDb.config[key] as T;
    }
    inMemoryDb.config[key] = defaultValue;
    return defaultValue;
}

async function setConfig<T>(key: string, value: T): Promise<void> {
    inMemoryDb.config[key] = value;
}


// --- Specific Config Getters/Setters ---

async function getAdminPasscode(): Promise<string> {
    return getConfig('adminPasscode', '203020');
}

async function setAdminPasscode(passcode: string): Promise<void> {
    await setConfig('adminPasscode', passcode);
}

async function getPresaleEndDate(): Promise<string> {
    return getConfig('presaleEndDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
}

async function setPresaleEndDate(endDate: string): Promise<void> {
    await setConfig('presaleEndDate', endDate);
}

async function getTotalExnSold(): Promise<number> {
    return Object.values(inMemoryDb.users).reduce((sum, user) => sum + user.balance, 0);
}


export const db = {
    getUser,
    getAllUsers,
    createUser,
    updateUserBalance,
    updateUserOnPurchase,
    getConfig,
    setConfig,
    getAdminPasscode,
    setAdminPasscode,
    getPresaleEndDate,
    setPresaleEndDate,
    getTotalExnSold,
};
