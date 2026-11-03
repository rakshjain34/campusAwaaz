require('dotenv').config();
require('dns').setServers(['1.1.1.1', '1.0.0.1']);

const mongoose = require('mongoose');
const User = require('../models/user.js');
const Shop = require('../models/shop.js');
const RoleAssignment = require('../models/roles.js');
const RoleRequest = require('../models/roleRequest.js');
const Timetable = require('../models/timetable.js');
const data = require('./data.js');

const shouldReset = process.argv.includes('--reset');

async function clearDatabase() {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
    }
    console.log(`Cleared data from ${collections.length} database collections.`);
}

async function seedStudentRoleRequests(user, account) {
    if (account.cr) {
        const classScope = {
            role: 'CR',
            branch: account.branch,
            year: account.year,
            section: account.section.toUpperCase(),
        };
        const [currentCR, pendingRequest] = await Promise.all([
            RoleAssignment.findOne(classScope),
            RoleRequest.findOne({ ...classScope, user: user._id, status: 'Pending' }),
        ]);
        if (!currentCR && !pendingRequest) {
            await RoleRequest.create({ ...classScope, user: user._id });
            console.log(`Created pending CR request for ${account.email}`);
        }
    }

    if (account.gensec) {
        if (!(account.clubs || []).includes(account.gensec)) {
            throw new Error(`${account.email} must belong to ${account.gensec} to be its GenSec.`);
        }
        const [currentGenSec, pendingRequest] = await Promise.all([
            RoleAssignment.findOne({ role: 'GenSec', club: account.gensec }),
            RoleRequest.findOne({ role: 'GenSec', club: account.gensec, user: user._id, status: 'Pending' }),
        ]);
        if (!currentGenSec && !pendingRequest) {
            await RoleRequest.create({ role: 'GenSec', club: account.gensec, user: user._id });
            console.log(`Created pending GenSec request for ${account.email}`);
        }
    }
}

async function createAccount(accountType, account) {
    const email = account.emailEnv ? process.env[account.emailEnv] : account.email;
    const password = account.passwordEnv ? process.env[account.passwordEnv] : account.password;
    if (!email || !password) {
        throw new Error(`Set the email and password for the seeded ${accountType} account in .env.`);
    }

    const { shop, cr, gensec, password: _password, passwordEnv, emailEnv, ...profile } = account;
    profile.email = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: profile.email });
    if (existingUser) {
        if (existingUser.accountType !== accountType) {
            throw new Error(`${profile.email} already belongs to a ${existingUser.accountType} account.`);
        }
        if (accountType === 'Admin') {
            await existingUser.setPassword(password);
            await existingUser.save();
            console.log(`Updated Admin password from seed settings: ${profile.email}`);
        }
        if (accountType === 'Shopkeeper' && shop) {
            await Shop.updateOne(
                { shopkeeper: existingUser._id },
                { $setOnInsert: { ...shop, shopkeeper: existingUser._id } },
                { upsert: true },
            );
        }
        if (accountType === 'Student') await seedStudentRoleRequests(existingUser, account);
        console.log(`Skipped existing ${accountType} account: ${profile.email}`);
        return existingUser;
    }

    const user = new User({
        ...profile,
        username: profile.email,
        accountType,
        ...(accountType === 'Student'
            ? { studentRole: 'Student', verified: false }
            : {}),
    });
    const registeredUser = await User.register(user, password);

    if (accountType === 'Student') await seedStudentRoleRequests(registeredUser, account);
    if (accountType === 'Shopkeeper' && shop) {
        await Shop.create({ ...shop, shopkeeper: registeredUser._id });
    }

    console.log(`Created ${accountType} account: ${profile.email}`);
    return registeredUser;
}

async function seed() {
    if (!process.env.ATLASDB_URL) {
        throw new Error('Set ATLASDB_URL in .env before running the seed script.');
    }
    const accounts = [...data.students, ...data.staff, ...data.shopkeepers];
    const missingPassword = accounts.find((account) => !account.password);
    if (missingPassword) {
        throw new Error(`Add a password to the seed data for ${missingPassword.email}.`);
    }

    if ((data.admins || []).length !== 1) {
        throw new Error('Configure exactly one administrator in init/data.js.');
    }
    const admin = data.admins[0];
    const adminEmail = admin.emailEnv ? process.env[admin.emailEnv] : admin.email;
    const adminPassword = admin.passwordEnv ? process.env[admin.passwordEnv] : admin.password;
    if (!adminEmail || !adminPassword || adminPassword.length < 5) {
        throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 5 characters in .env.');
    }

    await mongoose.connect(process.env.ATLASDB_URL);
    if (shouldReset) await clearDatabase();
    for (const student of data.students) await createAccount('Student', student);
    for (const staffMember of data.staff) await createAccount('Staff', staffMember);
    for (const shopkeeper of data.shopkeepers) await createAccount('Shopkeeper', shopkeeper);
    await createAccount('Admin', admin);

    for (const timetable of data.timetables || []) {
        const uploader = await User.findOne({ email: timetable.uploadedByEmail });
        if (!uploader) {
            throw new Error(`Timetable uploader ${timetable.uploadedByEmail} was not seeded.`);
        }

        const { uploadedByEmail, ...timetableData } = timetable;
        await Timetable.updateOne(
            {
                title: timetable.title,
                scope: timetable.scope,
                branch: timetable.branch,
                year: timetable.year,
                section: timetable.section,
            },
            { $setOnInsert: { ...timetableData, uploadedBy: uploader._id } },
            { upsert: true },
        );
        console.log(`Seeded timetable: ${timetable.title} (uploaded by ${uploader.email})`);
    }
}

seed()
    .catch((error) => {
        console.error('Seeding failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
