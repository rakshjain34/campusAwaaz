require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/user.js');
const Shop = require('../models/shop.js');
const RoleAssignment = require('../models/roles.js');
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

async function assignStudentRoles(user, account) {
    if (account.cr) {
        const classScope = {
            role: 'CR',
            branch: account.branch,
            year: account.year,
            section: account.section.toUpperCase(),
        };
        const currentCR = await RoleAssignment.findOne(classScope);
        if (!currentCR) {
            await RoleAssignment.create({ ...classScope, user: user._id });
            console.log(`Assigned CR to ${account.email}`);
        } else if (currentCR.user.toString() !== user._id.toString()) {
            console.log(`Skipped CR for ${account.email}; this class already has a CR.`);
        }
    }

    if (account.gensec) {
        if (!(account.clubs || []).includes(account.gensec)) {
            throw new Error(`${account.email} must belong to ${account.gensec} to be its GenSec.`);
        }
        const currentGenSec = await RoleAssignment.findOne({ role: 'GenSec', club: account.gensec });
        if (!currentGenSec) {
            await RoleAssignment.create({ role: 'GenSec', club: account.gensec, user: user._id });
            console.log(`Assigned GenSec for ${account.gensec} to ${account.email}`);
        } else if (currentGenSec.user.toString() !== user._id.toString()) {
            console.log(`Skipped GenSec for ${account.email}; ${account.gensec} already has a GenSec.`);
        }
    }
}

async function createAccount(accountType, account) {
    const { shop, cr, gensec, password, ...profile } = account;
    const existingUser = await User.findOne({ email: account.email });
    if (existingUser) {
        if (accountType === 'Shopkeeper' && shop) {
            await Shop.updateOne(
                { shopkeeper: existingUser._id },
                { $setOnInsert: { ...shop, shopkeeper: existingUser._id } },
                { upsert: true },
            );
        }
        if (accountType === 'Student') await assignStudentRoles(existingUser, account);
        console.log(`Skipped existing ${accountType} account: ${account.email}`);
        return existingUser;
    }

    const user = new User({
        ...profile,
        username: profile.email,
        accountType,
        ...(accountType === 'Student'
            ? { studentRole: cr ? 'CR' : 'Student', verified: false }
            : {}),
    });
    const registeredUser = await User.register(user, password);

    if (accountType === 'Student') await assignStudentRoles(registeredUser, account);
    if (accountType === 'Shopkeeper' && shop) {
        await Shop.create({ ...shop, shopkeeper: registeredUser._id });
    }

    console.log(`Created ${accountType} account: ${account.email}`);
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

    await mongoose.connect(process.env.ATLASDB_URL);
    if (shouldReset) await clearDatabase();
    for (const student of data.students) await createAccount('Student', student);
    for (const staffMember of data.staff) await createAccount('Staff', staffMember);
    for (const shopkeeper of data.shopkeepers) await createAccount('Shopkeeper', shopkeeper);

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
